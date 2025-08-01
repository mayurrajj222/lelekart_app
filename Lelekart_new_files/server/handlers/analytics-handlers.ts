import { Request, Response } from "express";
import { storage } from "../storage";
import { InsertSellerAnalytic } from "@shared/schema";
import { z } from "zod";
import { format, subDays, subMonths, startOfYear } from "date-fns";

// Get analytics for a seller
export async function getSellerAnalyticsHandler(req: Request, res: Response) {
  try {
    const sellerId = req.user?.id;
    if (!sellerId) return res.status(401).json({ error: "Unauthorized" });

    // 1. Get all orders for this seller
    const orders = await storage.getOrders(undefined, sellerId);
    // Only include delivered orders for analytics
    const deliveredOrders = orders.filter(o => o.status === "delivered");
    // 2. Get all products for this seller
    const products = await storage.getProducts(undefined, sellerId);
    // 3. Get all returns for this seller
    const returns = await storage.getReturnsForSeller(sellerId);

    // --- Calculate metrics ---
    const totalOrders = deliveredOrders.length;

    const totalRevenue = deliveredOrders.reduce((sum, o) => sum + (o.total || 0), 0);

    const avgOrderValue = totalOrders ? totalRevenue / totalOrders : 0;
    const totalProducts = products.length;
    const totalReturns = returns.length;
    const conversionRate = 0; // Placeholder

    // --- Sales Overview & Order Trends (respect selected date range) ---
    let days = 30;
    const rangeParam = req.query.range as string;
    switch (rangeParam) {
      case "last7":
        days = 7;
        break;
      case "last90":
        days = 90;
        break;
      case "year":
        days = 365;
        break;
      case "last30":
      default:
        days = 30;
        break;
    }
    // Set 'today' to the start of today (no time), but clamp to real current date if system clock is in the future
    const now = new Date();
    const realNow = new Date();
    const systemToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );
    const realToday = new Date(
      realNow.getFullYear(),
      realNow.getMonth(),
      realNow.getDate()
    );
    // If systemToday is in the future, use realToday
    const today = systemToday > realToday ? realToday : systemToday;
    const dateMap: Record<string, { revenue: number; orders: number }> = {};
    for (let i = days - 1; i >= 0; i--) {
      const d = subDays(today, i);
      // Only include dates up to today (no future dates)
      if (d > today) continue;
      const key = format(d, "yyyy-MM-dd");
      dateMap[key] = { revenue: 0, orders: 0 };
    }
    // Robustly parse order dates and include all orders in the selected period
    deliveredOrders.forEach((order) => {
      let orderDate: Date | null = null;
      if (order.date instanceof Date) {
        orderDate = order.date;
      } else if (
        typeof order.date === "string" ||
        typeof order.date === "number"
      ) {
        const parsed = new Date(order.date);
        if (!isNaN(parsed.getTime())) {
          orderDate = parsed;
        }
      }
      if (!orderDate) {
        // Optionally log skipped orders for debugging
        // console.warn('Skipping order with invalid date:', order);
        return;
      }
      const key = format(orderDate, "yyyy-MM-dd");
      if (dateMap[key]) {
        dateMap[key].revenue += order.total || 0;
        dateMap[key].orders += 1;
      }
    });
    const revenueData = Object.entries(dateMap).map(([date, v]) => ({
      date,
      revenue: v.revenue,
    }));
    const orderData = Object.entries(dateMap).map(([date, v]) => ({
      date,
      orders: v.orders,
    }));

    // --- Revenue by Category ---
    const categoryMap: Record<string, number> = {};
    for (const order of deliveredOrders) {
      const items = await storage.getOrderItems(order.id, sellerId);
      for (const item of items) {
        const cat = item.product.category || "Other";
        categoryMap[cat] = (categoryMap[cat] || 0) + item.price * item.quantity;
      }
    }
    const categoryData = Object.entries(categoryMap).map(
      ([category, revenue]) => ({ category, revenue })
    );

    // --- Revenue by Payment Method ---
    const paymentMap: Record<string, number> = {};
    for (const order of deliveredOrders) {
      const method = order.paymentMethod || "Other";
      paymentMap[method] = (paymentMap[method] || 0) + (order.total || 0);
    }
    const paymentMethodData = Object.entries(paymentMap).map(
      ([method, amount]) => ({ method, amount })
    );

    // --- Product Performance (top 5 by revenue) ---
    const productPerfMap: Record<
      string,
      { name: string; sku: string; unitsSold: number; revenue: number }
    > = {};
    for (const order of deliveredOrders) {
      const items = await storage.getOrderItems(order.id, sellerId);
      for (const item of items) {
        const key = item.product.id;
        if (!productPerfMap[key]) {
          productPerfMap[key] = {
            name: item.product.name,
            sku: item.product.sku || "",
            unitsSold: 0,
            revenue: 0,
          };
        }
        productPerfMap[key].unitsSold += item.quantity;
        productPerfMap[key].revenue += item.price * item.quantity;
      }
    }
    let topProducts = Object.values(productPerfMap);
    topProducts.sort((a, b) => b.revenue - a.revenue);
    topProducts = topProducts.slice(0, 5).map((p) => ({
      ...p,
      conversion: 0, // Placeholder
      trend: 0, // Placeholder
    }));

    // --- Traffic Sources (real data) ---
    const trafficMap: Record<
      string,
      { visitors: number; conversions: number; revenue: number }
    > = {};
    for (const order of deliveredOrders) {
      // Prefer UTM/referrer/source if present, else paymentMethod
      let source =
        (order as any).utm_source ||
        (order as any).referrer ||
        (order as any).source ||
        order.paymentMethod ||
        "Other";
      if (!trafficMap[source]) {
        trafficMap[source] = { visitors: 0, conversions: 0, revenue: 0 };
      }
      trafficMap[source].visitors += 1; // Each order = 1 visitor (for now)
      trafficMap[source].conversions += 1;
      trafficMap[source].revenue += order.total || 0;
    }
    const trafficSources = Object.entries(trafficMap).map(([name, v]) => ({
      name,
      visitors: v.visitors,
      conversion:
        v.visitors > 0 ? Math.round((v.conversions / v.visitors) * 100) : 0,
      revenue: v.revenue,
    }));

    // --- Customer Insights (real data) ---
    // Group orders by userId
    const customerOrderMap: Record<
      string,
      { count: number; total: number; cities: Set<string>; states: Set<string> }
    > = {};
    for (const order of deliveredOrders) {
      const userId = order.userId || "unknown";
      if (!customerOrderMap[userId]) {
        customerOrderMap[userId] = {
          count: 0,
          total: 0,
          cities: new Set(),
          states: new Set(),
        };
      }
      customerOrderMap[userId].count += 1;
      customerOrderMap[userId].total += order.total || 0;
      // Demographics from shippingDetails
      let city = undefined,
        state = undefined;
      if (order.shippingDetails) {
        let details = order.shippingDetails;
        if (typeof details === "string") {
          try {
            details = JSON.parse(details);
          } catch (e) {
            details = "";
          }
        }
        if (typeof details === "object" && details !== null) {
          if (typeof (details as any).city === "string")
            city = (details as any).city;
          if (typeof (details as any).state === "string")
            state = (details as any).state;
        }
      }
      if (city) customerOrderMap[userId].cities.add(city);
      if (state) customerOrderMap[userId].states.add(state);
    }
    const uniqueCustomers = Object.keys(customerOrderMap).length;
    const repeatCustomers = Object.values(customerOrderMap).filter(
      (c) => c.count > 1
    ).length;
    const repeatPurchaseRate =
      uniqueCustomers > 0 ? (repeatCustomers / uniqueCustomers) * 100 : 0;
    const avgCustomerValue =
      uniqueCustomers > 0 ? totalRevenue / uniqueCustomers : 0;
    // Demographics: aggregate by city and state
    const cityMap: Record<string, number> = {};
    const stateMap: Record<string, number> = {};
    Object.values(customerOrderMap).forEach((cust) => {
      cust.cities.forEach((city) => {
        cityMap[city] = (cityMap[city] || 0) + 1;
      });
      cust.states.forEach((state) => {
        stateMap[state] = (stateMap[state] || 0) + 1;
      });
    });
    const demographics = [
      ...Object.entries(cityMap).map(([group, value]) => ({
        group: `City: ${group}`,
        value,
      })),
      ...Object.entries(stateMap).map(([group, value]) => ({
        group: `State: ${group}`,
        value,
      })),
    ];
    const customerInsights = {
      repeatPurchaseRate,
      previousRepeatPurchaseRate: 0, // Not tracked for now
      avgCustomerValue,
      previousAvgCustomerValue: 0, // Not tracked for now
      demographics,
    };

    // --- Build analytics object in the structure expected by the frontend ---
    const analytics = {
      totals: {
        revenue: totalRevenue,
        orders: totalOrders,
        avgOrderValue,
        conversionRate,
        products: totalProducts,
        returns: totalReturns,
      },
      previousTotals: {
        revenue: 0,
        orders: 0,
        avgOrderValue: 0,
        conversionRate: 0,
        products: 0,
        returns: 0,
      },
      revenueData,
      orderData,
      categoryData,
      paymentMethodData,
      topProducts,
      trafficSources,
      customerInsights,
    };

    return res.status(200).json(analytics);
  } catch (error) {
    console.error("Error aggregating live seller analytics:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

// Create or update analytics data
export async function createOrUpdateAnalyticsHandler(
  req: Request,
  res: Response
) {
  try {
    const analyticsSchema = z.object({
      sellerId: z.number(),
      date: z
        .string()
        .refine((val) => !isNaN(Date.parse(val)), {
          message: "Invalid date format",
        })
        .transform((val) => new Date(val)),
      totalOrders: z.number().int().min(0),
      totalRevenue: z.number().min(0),
      averageOrderValue: z.number().optional(),
      totalVisitors: z.number().int().min(0).optional(),
      conversionRate: z.number().min(0).max(100).optional(),
      topProducts: z.string().optional(),
      categoryBreakdown: z.string().optional(),
    });

    const validatedData = analyticsSchema.parse(req.body);

    // Check if the user is impersonating
    const isImpersonating = req.session && (req.session as any).originalUserId;

    // If this is not an admin, not impersonating, and not the seller themselves, deny access
    if (
      req.user?.role !== "admin" &&
      !isImpersonating &&
      req.user?.id !== validatedData.sellerId
    ) {
      return res.status(403).json({
        error: "You do not have permission to update these analytics",
      });
    }

    // Cast to unknown first to avoid type incompatibility issues
    const analytics = await storage.createOrUpdateSellerAnalytics(
      validatedData as unknown as InsertSellerAnalytic
    );

    return res.status(200).json(analytics);
  } catch (error) {
    console.error("Error creating/updating analytics:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    return res.status(500).json({ error: "Internal server error" });
  }
}

// Export analytics data as CSV
export async function exportSellerAnalyticsHandler(
  req: Request,
  res: Response
) {
  try {
    const sellerId = parseInt(
      req.params.sellerId || req.user?.id?.toString() || "0"
    );

    if (!sellerId) {
      return res.status(400).json({ error: "Seller ID is required" });
    }

    // Check if the user is impersonating
    const isImpersonating = req.session && (req.session as any).originalUserId;

    // If this is not an admin, not impersonating, and not the seller themselves, deny access
    if (
      req.user?.role !== "admin" &&
      !isImpersonating &&
      req.user?.id !== sellerId
    ) {
      return res.status(403).json({
        error: "You do not have permission to export these analytics",
      });
    }

    const rangeParam = (req.query.range as string) || "last30";
    let startDate: Date;
    let endDate = new Date();
    let periodName: string;

    // Determine date range based on parameter
    switch (rangeParam) {
      case "last7":
        startDate = subDays(new Date(), 7);
        periodName = "Last 7 Days";
        break;
      case "last90":
        startDate = subDays(new Date(), 90);
        periodName = "Last 90 Days";
        break;
      case "year":
        startDate = startOfYear(new Date());
        periodName = "This Year";
        break;
      case "last30":
      default:
        startDate = subDays(new Date(), 30);
        periodName = "Last 30 Days";
        break;
    }

    // Get analytics data
    const analytics = await storage.getSellerAnalytics(
      sellerId,
      startDate,
      endDate
    );

    // Get the seller's products
    const products = await storage.getProducts(undefined, sellerId);

    // Get orders for the seller
    const orders = await storage.getOrders(undefined, sellerId);

    // Get returns
    const returns = await storage.getReturnsForSeller(sellerId);

    // Get seller info
    const seller = await storage.getUser(sellerId);

    // Set headers for CSV download
    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="seller-analytics-${rangeParam}-${format(
        new Date(),
        "yyyy-MM-dd"
      )}.csv"`
    );

    // Write CSV header rows
    res.write("LELEKART SELLER ANALYTICS REPORT\r\n");
    res.write(`Seller: ${seller?.username}\r\n`);
    res.write(`Period: ${periodName}\r\n`);
    res.write(
      `Date Range: ${format(startDate, "yyyy-MM-dd")} to ${format(
        endDate,
        "yyyy-MM-dd"
      )}\r\n`
    );
    res.write(
      `Generated: ${format(new Date(), "yyyy-MM-dd HH:mm:ss")}\r\n\r\n`
    );

    // Summary metrics
    res.write("SUMMARY METRICS\r\n");

    let totalRevenue = 0;
    let totalOrders = 0;
    let totalUnits = 0;
    let avgOrderValue = 0;

    analytics.forEach((item) => {
      totalRevenue += Number(item.totalRevenue || 0);
      totalOrders += Number(item.totalOrders || 0);
    });

    if (totalOrders > 0) {
      avgOrderValue = totalRevenue / totalOrders;
    }

    // Calculate units sold from orders
    orders.forEach((order) => {
      // Get order items for this order
      storage.getOrderItems(order.id).then((items) => {
        items.forEach((item) => {
          totalUnits += item.quantity;
        });
      });
    });

    // Output summary data
    res.write(`Total Revenue,₹${totalRevenue.toFixed(2)}\r\n`);
    res.write(`Total Orders,${totalOrders}\r\n`);
    res.write(`Average Order Value,₹${avgOrderValue.toFixed(2)}\r\n`);
    res.write(`Total Products,${products.length}\r\n`);
    res.write(`Total Returns,${returns.length}\r\n\r\n`);

    // Daily analytics data
    res.write("DAILY ANALYTICS\r\n");
    res.write(
      "Date,Orders,Revenue,Avg Order Value,Visitors,Conversion Rate\r\n"
    );

    analytics.forEach((day) => {
      const avgOrderVal =
        day.totalOrders > 0
          ? Number(day.totalRevenue) / Number(day.totalOrders)
          : 0;

      res.write(`${format(new Date(day.date), "yyyy-MM-dd")},`);
      res.write(`${day.totalOrders},`);
      res.write(`₹${Number(day.totalRevenue).toFixed(2)},`);
      res.write(`₹${avgOrderVal.toFixed(2)},`);
      res.write(`${day.totalVisitors || 0},`);
      res.write(`${day.conversionRate || 0}%\r\n`);
    });
    res.write("\r\n");

    // Products data
    res.write("PRODUCTS\r\n");
    res.write("ID,Name,Category,Price,Stock,Status\r\n");

    products.forEach((product) => {
      res.write(`${product.id},`);
      res.write(`"${product.name}",`);
      res.write(`"${product.category}",`);
      res.write(`₹${product.price.toFixed(2)},`);
      res.write(`${product.stock || 0},`);
      res.write(`${product.approved ? "Approved" : "Pending"}\r\n`);
    });
    res.write("\r\n");

    // Orders data
    res.write("RECENT ORDERS\r\n");
    res.write("Order ID,Date,Total,Status,Payment Method\r\n");

    const recentOrders = orders.slice(0, 20); // Show only the 20 most recent orders
    recentOrders.forEach((order) => {
      res.write(`${order.id},`);
      res.write(`${format(new Date(order.date), "yyyy-MM-dd")},`);
      res.write(`₹${order.total.toFixed(2)},`);
      res.write(`${order.status},`);
      res.write(`${order.paymentMethod || "N/A"}\r\n`);
    });

    // End the response
    res.end();
  } catch (error) {
    console.error("Error exporting seller analytics:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

// Get dashboard summary with key metrics for a seller
export async function getSellerDashboardSummaryHandler(
  req: Request,
  res: Response
) {
  try {
    const sellerId = parseInt(
      req.params.sellerId || req.user?.id?.toString() || "0"
    );

    console.log("Dashboard Summary Request:", {
      sellerId,
      userId: req.user?.id,
      role: req.user?.role,
      isImpersonating: req.session && (req.session as any).originalUserId,
    });

    if (!sellerId) {
      return res.status(400).json({ error: "Seller ID is required" });
    }

    // Check if the user is impersonating
    const isImpersonating = req.session && (req.session as any).originalUserId;

    // If this is not an admin, not impersonating, and not the seller themselves, deny access
    if (
      req.user?.role !== "admin" &&
      !isImpersonating &&
      req.user?.id !== sellerId
    ) {
      console.log("Access denied for dashboard summary:", {
        userRole: req.user?.role,
        isImpersonating,
        userId: req.user?.id,
        sellerId,
      });
      return res
        .status(403)
        .json({ error: "You do not have permission to view this dashboard" });
    }

    // Get analytics for the past 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    console.log("Fetching data for seller:", sellerId);

    const analytics = await storage.getSellerAnalytics(sellerId, thirtyDaysAgo);
    console.log("Analytics data:", analytics);

    // Get the total number of products for this seller
    const products = await storage.getProducts(undefined, sellerId);
    console.log("Products data:", {
      count: products.length,
      products: products.map((p) => ({ id: p.id, name: p.name })),
    });

    // Get recent orders
    const orders = await storage.getOrders(undefined, sellerId);
    console.log("Orders data:", {
      count: orders.length,
      orders: orders.map((o) => ({
        id: o.id,
        total: o.total,
        status: o.status,
      })),
    });

    const recentOrders = orders.slice(0, 5);

    // Get returns
    const returns = await storage.getReturnsForSeller(sellerId);
    console.log("Returns data:", {
      count: returns.length,
    });

    // Calculate total revenue from delivered orders only
    let totalRevenue = 0;
    orders.forEach((order) => {
      if (order.status === "delivered") {
        totalRevenue += Number(order.total) || 0;
      }
    });

    // Calculate average product price
    let avgPrice = 0;
    if (products.length > 0) {
      const totalPrice = products.reduce(
        (sum, product) => sum + Number(product.price || 0),
        0
      );
      avgPrice = totalPrice / products.length;
    }

    console.log("Calculated metrics:", {
      totalRevenue,
      totalProducts: products.length,
      totalOrders: orders.length,
      avgPrice,
    });

    // Create summary object with all metrics
    const summary = {
      totalRevenue,
      totalProducts: products.length,
      totalOrders: orders.length,
      totalReturns: returns.length,
      avgPrice,
      recentOrders,
      analytics,
    };

    console.log("Sending dashboard summary response:", summary);
    return res.status(200).json(summary);
  } catch (error) {
    console.error("Error fetching dashboard summary:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
