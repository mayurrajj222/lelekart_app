import { Request, Response } from "express";
import axios from "axios";
import { storage } from "../storage";
import { db } from "../db";
import { shiprocketSettings, orders } from "@shared/schema";
import { returnRequests } from "@shared/return-schema";
import { eq, inArray, not, and, isNull, desc, sql } from "drizzle-orm";

const SHIPROCKET_API_BASE = "https://apiv2.shiprocket.in/v1/external";
// Resolve a valid Shiprocket pickup_location nickname for the given seller pickup
async function resolveShiprocketPickupLocation(
  token: string,
  sellerPickup: any
): Promise<string> {
  if (!sellerPickup) return "Primary";
  try {
    const resp = await axios.get(
      `${SHIPROCKET_API_BASE}/settings/company/pickup`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    const pickups: any[] = Array.isArray(resp.data?.data)
      ? resp.data.data
      : Array.isArray(resp.data)
        ? resp.data
        : [];

    // Try match by pincode first
    const byPin = pickups.find(
      (p: any) => `${p.pin_code || p.pincode}` === `${sellerPickup.pincode}`
    );
    if (byPin?.pickup_location) return byPin.pickup_location;

    // Try match by name/business
    const candidateName =
      sellerPickup.pickup_location ||
      sellerPickup.businessName ||
      sellerPickup.name ||
      sellerPickup.contactName;
    if (candidateName) {
      const byName = pickups.find(
        (p: any) =>
          `${p.pickup_location}`.toLowerCase() ===
          `${candidateName}`.toLowerCase()
      );
      if (byName?.pickup_location) return byName.pickup_location;
    }

    // Fallback to first available or Primary
    return pickups[0]?.pickup_location || "Primary";
  } catch (e) {
    return "Primary";
  }
}

interface CourierRatesResponse {
  couriers: any[];
  recommended_courier_company_id: string | null;
}

/**
 * Helper function to generate a fresh Shiprocket token for each API request
 * Following the recommendation to always generate a new token for each API call
 */
async function getShiprocketToken(): Promise<string | null> {
  try {
    // Get the settings from the database - order by id to get a consistent record
    const settings = await db
      .select()
      .from(shiprocketSettings)
      .orderBy(shiprocketSettings.id);

    if (
      !settings ||
      settings.length === 0 ||
      !settings[0].email ||
      !settings[0].password
    ) {
      console.error("Shiprocket API credentials not configured");
      return null;
    }

    // Use the first valid setting record consistently
    const setting = settings[0];

    // Always generate a fresh token as recommended
    console.log("Generating new Shiprocket API token...");
    try {
      const response = await axios.post(`${SHIPROCKET_API_BASE}/auth/login`, {
        email: setting.email,
        password: setting.password,
      });

      if (response.data.token) {
        console.log("New Shiprocket API token generated successfully");

        // Store the token for reference, but we will continue to get a fresh one each time
        await db
          .update(shiprocketSettings)
          .set({ token: response.data.token, updatedAt: new Date() })
          .where(eq(shiprocketSettings.id, setting.id));

        return response.data.token;
      } else {
        console.error(
          "Failed to generate Shiprocket API token - no token in response"
        );
        return null;
      }
    } catch (tokenError: any) {
      // Check for specific error responses
      const status = tokenError?.response?.status;
      const errorMessage =
        tokenError?.response?.data?.message || "Unknown error";

      console.log("Shiprocket API token generation failed:", errorMessage);

      // For 403 Forbidden errors, account might lack necessary permissions
      if (status === 403) {
        throw new Error(
          `Unauthorized! You do not have the required API permissions. Please make sure you're using API user credentials.`
        );
      }

      // For authentication errors
      if (
        status === 401 ||
        (errorMessage && errorMessage.toLowerCase().includes("auth"))
      ) {
        throw new Error(
          `Authentication failed! Please check your Shiprocket API credentials.`
        );
      }

      throw tokenError;
    }
  } catch (error: unknown) {
    console.error("Error in getShiprocketToken:", error);
    throw error; // Re-throw to allow proper error handling upstream
  }
}

/**
 * Get Shiprocket settings handler
 */
export async function getShiprocketSettings(req: Request, res: Response) {
  try {
    // Check if user is authenticated and is admin
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Forbidden" });
    }

    // Get settings from the database - order by id to get a consistent record
    const settings = await db
      .select()
      .from(shiprocketSettings)
      .orderBy(shiprocketSettings.id);

    if (!settings || settings.length === 0) {
      // Create default settings if none exist
      const [newSettings] = await db
        .insert(shiprocketSettings)
        .values({
          email: "",
          password: "",
          token: "",
          defaultCourier: "",
          autoShipEnabled: false,
          updatedAt: new Date(),
        })
        .returning();

      return res.status(200).json({
        ...newSettings,
        password: "", // Don't send password to client
      });
    }

    // Use the first record consistently
    const setting = settings[0];

    return res.status(200).json({
      ...setting,
      password: "", // Don't send password to client
    });
  } catch (error) {
    console.error("Error getting Shiprocket settings:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * Save Shiprocket settings handler
 */
export async function saveShiprocketSettings(req: Request, res: Response) {
  try {
    // Check if user is authenticated and is admin
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Forbidden" });
    }

    const { email, password, defaultCourier, autoShipEnabled } = req.body;

    console.log("Saving Shiprocket settings:", {
      email: email ? email : "not provided",
      passwordProvided: password ? "yes" : "no",
      defaultCourier: defaultCourier || "not provided",
      autoShipEnabled: autoShipEnabled === true ? "enabled" : "disabled",
    });

    // Get settings from the database - order by id to get a consistent record
    const settings = await db
      .select()
      .from(shiprocketSettings)
      .orderBy(shiprocketSettings.id);

    if (!settings || settings.length === 0) {
      // Create new settings
      const [newSettings] = await db
        .insert(shiprocketSettings)
        .values({
          email,
          password: password || "",
          token: "",
          defaultCourier: defaultCourier || "",
          autoShipEnabled: autoShipEnabled || false,
          updatedAt: new Date(),
        })
        .returning();

      return res.status(200).json({
        ...newSettings,
        password: "", // Don't send password to client
      });
    }

    // Use the first record consistently
    const setting = settings[0];

    // Update settings
    const updateData: any = {
      email,
      defaultCourier: defaultCourier || "",
      autoShipEnabled: autoShipEnabled || false,
      updatedAt: new Date(),
    };

    // Only update password if provided
    if (password) {
      updateData.password = password;
      // Clear token if password changed
      updateData.token = "";
    }

    const [updatedSettings] = await db
      .update(shiprocketSettings)
      .set(updateData)
      .where(eq(shiprocketSettings.id, setting.id))
      .returning();

    return res.status(200).json({
      ...updatedSettings,
      password: "", // Don't send password to client
    });
  } catch (error) {
    console.error("Error saving Shiprocket settings:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * Generate Shiprocket API token handler
 */
export async function generateShiprocketToken(req: Request, res: Response) {
  try {
    // Check if user is authenticated and is admin
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Forbidden" });
    }

    // Get credentials from request body if provided
    const { email, password } = req.body;

    // Get settings from the database - order by id to get a consistent record
    const settings = await db
      .select()
      .from(shiprocketSettings)
      .orderBy(shiprocketSettings.id);

    // If no settings found, create new settings
    if (!settings || settings.length === 0) {
      if (!email || !password) {
        return res
          .status(400)
          .json({ error: "Email and password are required" });
      }

      try {
        // Generate token with provided credentials
        const response = await axios.post(`${SHIPROCKET_API_BASE}/auth/login`, {
          email,
          password,
        });

        if (response.data.token) {
          // Create new settings with token
          const [newSettings] = await db
            .insert(shiprocketSettings)
            .values({
              email,
              password,
              token: response.data.token,
              updatedAt: new Date(),
            })
            .returning();

          return res.status(200).json({
            ...newSettings,
            password: "", // Don't send password to client
          });
        } else {
          return res.status(400).json({ error: "Failed to generate token" });
        }
      } catch (error) {
        console.error("Error generating Shiprocket token:", error);

        if (
          error &&
          typeof error === "object" &&
          "response" in error &&
          error.response &&
          typeof error.response === "object" &&
          "data" in error.response
        ) {
          return res.status(400).json({
            error: "Authentication failed with Shiprocket API",
            details: error.response.data,
          });
        }

        return res
          .status(500)
          .json({ error: "Failed to authenticate with Shiprocket API" });
      }
    }

    // Use the first record consistently
    const setting = settings[0];

    // Use new credentials if provided, otherwise use existing credentials
    const credentialsToUse = {
      email: email || setting.email,
      password: password || setting.password,
    };

    console.log("Using credentials: ", {
      email: credentialsToUse.email,
      password: credentialsToUse.password ? "******" : "empty",
    });

    if (!credentialsToUse.email || !credentialsToUse.password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    try {
      // Generate token
      const response = await axios.post(`${SHIPROCKET_API_BASE}/auth/login`, {
        email: credentialsToUse.email,
        password: credentialsToUse.password,
      });

      if (response.data.token) {
        // Update settings with new credentials if provided
        const updateData: any = {
          token: response.data.token,
          updatedAt: new Date(),
        };

        // Only update email/password if new ones were provided
        if (email) updateData.email = email;
        if (password) updateData.password = password;

        const [updatedSettings] = await db
          .update(shiprocketSettings)
          .set(updateData)
          .where(eq(shiprocketSettings.id, setting.id))
          .returning();

        return res.status(200).json({
          ...updatedSettings,
          password: "", // Don't send password to client
        });
      } else {
        return res.status(400).json({ error: "Failed to generate token" });
      }
    } catch (error) {
      console.error("Error generating Shiprocket token:", error);

      if (
        error &&
        typeof error === "object" &&
        "response" in error &&
        error.response &&
        typeof error.response === "object" &&
        "data" in error.response
      ) {
        return res.status(400).json({
          error: "Authentication failed with Shiprocket API",
          details: error.response.data,
        });
      }

      return res
        .status(500)
        .json({ error: "Failed to authenticate with Shiprocket API" });
    }
  } catch (error) {
    console.error("Error generating Shiprocket token:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * Get courier rates for an order
 */
async function getCourierRates(
  token: string,
  orderData: any
): Promise<CourierRatesResponse> {
  try {
    // Get seller's pickup pincode from settings
    let pickupPincode = "140601"; // Default fallback pincode

    if (orderData.sellerId) {
      const sellerSettings = await storage.getSellerSettings(
        orderData.sellerId
      );
      if (sellerSettings?.pickupAddress) {
        try {
          const pickupAddress =
            typeof sellerSettings.pickupAddress === "string"
              ? JSON.parse(sellerSettings.pickupAddress)
              : sellerSettings.pickupAddress;

          if (pickupAddress?.pincode) {
            pickupPincode = pickupAddress.pincode;
          }
        } catch (e) {
          console.error("Error parsing pickup address:", e);
        }
      }
    }

    // Ensure weight is in kg and at least 0.5kg
    const weight = Math.max(parseFloat(orderData.weight) || 0.5, 0.5);

    // Ensure COD flag is correctly set
    const isCod = orderData.payment_method?.toLowerCase() === "cod";

    console.log("Checking courier serviceability with params:", {
      pickup_postcode: pickupPincode,
      delivery_postcode: orderData.shipping_pincode,
      order_id: orderData.orderId ? `ORD-${orderData.orderId}` : undefined,
      cod: isCod ? 1 : 0,
      weight: weight,
      length: Math.max(orderData.length || 10, 10),
      breadth: Math.max(orderData.breadth || 10, 10),
      height: Math.max(orderData.height || 10, 10),
      declared_value: orderData.total || 100, // Ensure minimum declared value
      mode: "Surface", // Default to Surface mode
      is_return: 0,
      couriers_type: undefined, // Only set if needed for document couriers
      only_local: undefined, // Only set if needed for hyperlocal couriers
      qc_check: undefined, // Only set if is_return is 1
    });

    // Build query parameters
    const params = new URLSearchParams({
      pickup_postcode: pickupPincode,
      delivery_postcode: orderData.shipping_pincode,
      cod: isCod ? "1" : "0",
      weight: weight.toString(),
      length: Math.max(orderData.length || 10, 10).toString(),
      breadth: Math.max(orderData.breadth || 10, 10).toString(),
      height: Math.max(orderData.height || 10, 10).toString(),
      declared_value: (orderData.total || 100).toString(), // Ensure minimum declared value
      mode: "Surface",
      is_return: "0",
    });

    // Add optional parameters if they exist
    if (orderData.orderId) {
      params.append("order_id", `ORD-${orderData.orderId}`);
    }
    if (orderData.couriers_type) {
      params.append("couriers_type", orderData.couriers_type);
    }
    if (orderData.only_local) {
      params.append("only_local", orderData.only_local);
    }
    if (orderData.is_return === 1) {
      params.append("qc_check", orderData.qc_check);
    }

    console.log(
      "Shiprocket API Request URL:",
      `${SHIPROCKET_API_BASE}/courier/serviceability/?${params.toString()}`
    );
    console.log("Shiprocket API Request Headers:", {
      Authorization: "Bearer [REDACTED]",
      "Content-Type": "application/json",
    });

    const response = await axios.get(
      `${SHIPROCKET_API_BASE}/courier/serviceability/?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("Shiprocket API Response Status:", response.status);
    console.log("Shiprocket API Response Headers:", response.headers);

    // Filter and process the response to ensure valid rates
    if (response.data && response.data.data) {
      console.log(
        "Raw Shiprocket response:",
        JSON.stringify(response.data, null, 2)
      );

      const availableCouriers =
        response.data.data.available_courier_companies || [];
      console.log(
        "Available couriers before filtering:",
        availableCouriers.length
      );

      const processedCouriers = availableCouriers
        .filter((courier: any) => {
          // Only filter out if explicitly blocked or if it's a local courier
          const isValid =
            courier.blocked === 0 && courier.courier_name !== "Local";

          if (!isValid) {
            console.log("Filtered out courier:", {
              name: courier.courier_name,
              blocked: courier.blocked,
              reason: courier.blocked === 1 ? "Blocked" : "Local courier",
            });
          }

          return isValid;
        })
        .map((courier: any) => {
          console.log("Processing courier:", {
            name: courier.courier_name,
            rate: courier.rate,
            weight_limit: courier.surface_max_weight || courier.air_max_weight,
          });

          return {
            ...courier,
            // Ensure rate is a valid number and at least 40 rupees
            rate: Math.max(parseFloat(courier.rate) || 40, 40),
            // Calculate estimated days if not provided
            estimated_days: courier.estimated_delivery_days || "3-5",
            // Ensure weight limit is valid
            weight_limit: Math.max(
              parseFloat(
                courier.surface_max_weight || courier.air_max_weight
              ) || 0,
              0
            ),
          };
        })
        .sort((a: any, b: any) => a.rate - b.rate); // Sort by rate ascending

      console.log(
        "Available couriers after filtering:",
        processedCouriers.length
      );

      // Return only the processed couriers
      return {
        couriers: processedCouriers,
        recommended_courier_company_id:
          response.data.data.recommended_courier_company_id,
      };
    }

    // If no data, return empty array
    return {
      couriers: [],
      recommended_courier_company_id: null,
    };
  } catch (error: any) {
    console.error(
      "Error getting courier rates:",
      error?.response?.data || error?.message || "Unknown error"
    );
    throw error;
  }
}

/**
 * Get Shiprocket couriers handler
 */
export async function getShiprocketCouriers(req: Request, res: Response) {
  try {
    // Check if user is authenticated and is admin
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Forbidden" });
    }

    // Get token (this will automatically refresh if expired)
    let token;
    try {
      token = await getShiprocketToken();

      if (!token) {
        return res.status(400).json({
          error: "Shiprocket token not available",
          message:
            "Please check your Shiprocket credentials or generate a new token.",
          code: "TOKEN_MISSING",
        });
      }
    } catch (tokenError: any) {
      console.error("Shiprocket API token error:", tokenError);
      return res.status(400).json({
        error: "Error getting Shiprocket token",
        message:
          tokenError.message || "Please check your Shiprocket credentials.",
        code: "TOKEN_ERROR",
      });
    }

    // Get order details from request if provided
    const { orderId } = req.query;
    const isReturn =
      String(req.query.return || req.query.is_return || "0") === "1";
    let courierRates = null;

    if (orderId) {
      try {
        // Get order details
        const [order] = await db
          .select()
          .from(orders)
          .where(eq(orders.id, parseInt(orderId as string)));

        if (!order) {
          return res.status(404).json({
            error: "Order not found",
            message: `Order with ID ${orderId} not found`,
            code: "ORDER_NOT_FOUND",
          });
        }

        // Get order items
        const orderItems = await storage.getOrderItems(order.id);
        if (!orderItems || orderItems.length === 0) {
          return res.status(400).json({
            error: "Order has no items",
            message: `Order ${orderId} has no items to ship`,
            code: "NO_ORDER_ITEMS",
          });
        }

        // Get shipping address (customer) and seller pickup address
        const address = order.addressId
          ? await storage.getUserAddress(order.addressId)
          : null;
        let sellerPickup: any = null;
        try {
          const firstItem = orderItems[0];
          const sellerId = firstItem?.product?.sellerId;
          if (sellerId) {
            const sellerSettings = await storage.getSellerSettings(sellerId);

            if (sellerSettings?.pickupAddress) {
              sellerPickup =
                typeof sellerSettings.pickupAddress === "string"
                  ? JSON.parse(sellerSettings.pickupAddress)
                  : sellerSettings.pickupAddress;
            }
          }
        } catch (e) {}

        if (!address) {
          return res.status(400).json({
            error: "Shipping address not found",
            message: `No shipping address found for order ${orderId}`,
            code: "NO_SHIPPING_ADDRESS",
          });
        }

        // Calculate total weight and dimensions
        let totalWeight = 0;
        let maxLength = 0;
        let maxWidth = 0;
        let maxHeight = 0;

        for (const item of orderItems) {
          const product = await storage.getProduct(item.productId);
          if (product) {
            // Add weight for each item (weight is in kg)
            const productWeight = parseFloat(product.weight as any) || 0.5;
            totalWeight += productWeight * item.quantity;

            // Update max dimensions (dimensions are in cm)
            const productLength = parseFloat(product.length as any) || 10;
            const productWidth = parseFloat(product.width as any) || 10;
            const productHeight = parseFloat(product.height as any) || 10;

            maxLength = Math.max(maxLength, productLength);
            maxWidth = Math.max(maxWidth, productWidth);
            maxHeight = Math.max(maxHeight, productHeight);
          }
        }

        // Get courier rates
        try {
          // For returns, pickup is customer's pincode and delivery is seller warehouse.
          // getCourierRates expects shipping_pincode and derives pickup from sellerId; so we pass swapped values by overriding
          const basePayload: any = {
            shipping_pincode: address?.pincode,
            weight: totalWeight / 1000,
            length: maxLength || 10,
            breadth: maxWidth || 10,
            height: maxHeight || 10,
            payment_method: order.paymentMethod,
            sellerId: orderItems[0]?.product?.sellerId,
          };

          if (isReturn) {
            // When return, we want pickup_postcode = customer, delivery_postcode = seller.
            // The helper getCourierRates builds pickup from sellerId and uses shipping_pincode as delivery.
            // So we temporarily swap: pass seller's pincode as shipping to invert inside helper, and carry a flag.
            basePayload.shipping_pincode =
              sellerPickup?.pincode || address?.pincode;
            basePayload.is_return = 1;
            basePayload.qc_check = 0;
            // Also attach a hint couriers_type if needed; keeping default.
          }

          courierRates = await getCourierRates(token, basePayload);

          // Return the processed courier data directly
          return res.status(200).json(courierRates);
        } catch (rateError: any) {
          console.error("Error getting courier rates:", rateError);
          return res.status(500).json({
            error: "Error getting courier rates",
            message: rateError.message || "Failed to get courier rates",
            code: "RATE_ERROR",
          });
        }
      } catch (orderError: any) {
        console.error("Error processing order:", orderError);
        return res.status(500).json({
          error: "Error processing order",
          message: orderError.message || "Failed to process order details",
          code: "ORDER_PROCESSING_ERROR",
        });
      }
    }

    // If no orderId provided, return a safe empty response to avoid frontend error popups
    return res.status(200).json({
      couriers: [],
      recommended_courier_company_id: null,
    });
  } catch (error: any) {
    console.error("Error in getShiprocketCouriers handler:", error);
    return res.status(500).json({
      error: "Internal server error",
      message: error.message || "An unexpected error occurred",
      code: "INTERNAL_ERROR",
    });
  }
}

/**
 * Get pending orders for Shiprocket shipping
 */
export async function getPendingShiprocketOrders(req: Request, res: Response) {
  try {
    // Check if user is authenticated and is admin
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Forbidden" });
    }

    // Get pagination parameters from query
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;

    console.log("Fetching pending Shiprocket orders from database...");

    // Get total count of orders with status 'pending'
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(orders)
      .where(eq(orders.status, "pending"));

    // Get paginated orders with status 'pending'
    const pendingOrders = await db
      .select()
      .from(orders)
      .where(eq(orders.status, "pending"))
      .limit(limit)
      .offset(offset)
      .orderBy(desc(orders.date)); // Order by most recent first using date field

    console.log(`Found ${pendingOrders.length} pending orders in the database`);

    // Get additional data for each order
    const ordersWithDetails = await Promise.all(
      pendingOrders.map(async (order) => {
        try {
          const orderItems = await storage.getOrderItems(order.id);
          const address = order.addressId
            ? await storage.getUserAddress(order.addressId)
            : null;
          const userDetails = await storage.getUser(order.userId);

          return {
            ...order,
            items: orderItems.map((item) => ({
              ...item,
              productDetails: item.product
                ? {
                    name: item.product.name,
                    // Add other product details as needed
                  }
                : null,
            })),
            address: address
              ? {
                  street: address.address, // Use address field instead of street
                  additionalInfo: "", // Add if needed
                  city: address.city,
                  state: address.state,
                  pincode: address.pincode,
                  phone: address.phone,
                }
              : null,
            user: userDetails
              ? {
                  id: userDetails.id,
                  name: userDetails.name || "Customer",
                  email: userDetails.email || "customer@example.com",
                  phone: userDetails.phone || "1234567890",
                }
              : null,
          };
        } catch (error) {
          console.error(`Error fetching details for order ${order.id}:`, error);
          return {
            ...order,
            items: [],
            address: null,
            user: null,
            error: "Failed to fetch order details",
          };
        }
      })
    );

    return res.status(200).json({
      orders: ordersWithDetails,
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
    });
  } catch (error) {
    console.error("Error getting pending Shiprocket orders:", error);
    return res.status(500).json({
      error: "Internal server error",
      message:
        error instanceof Error
          ? error.message
          : "Failed to fetch pending orders",
    });
  }
}

/**
 * Assign AWB to shipment
 */
async function assignAWB(token: string, shipmentId: string, courierId: string) {
  try {
    console.log("Assigning AWB with params:", {
      shipment_id: [shipmentId],
      courier_id: courierId,
    });

    const response = await axios.post(
      `${SHIPROCKET_API_BASE}/courier/assign/awb`,
      {
        shipment_id: [shipmentId],
        courier_id: courierId,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("AWB assignment response:", response.data);
    return response.data;
  } catch (error: any) {
    console.error(
      "Error assigning AWB:",
      error.response?.data || error.message
    );
    throw error;
  }
}

/**
 * Auto-ship orders with Shiprocket
 * This will find all pending orders and ship them with the default courier
 */
export async function autoShipWithShiprocket(req: Request, res: Response) {
  try {
    // Check if user is authenticated and is admin
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Forbidden" });
    }

    // Get settings to check if auto-ship is enabled and get default courier
    const settings = await db
      .select()
      .from(shiprocketSettings)
      .orderBy(shiprocketSettings.id);

    if (!settings || settings.length === 0) {
      return res.status(400).json({
        error: "Shiprocket settings not configured",
        message:
          "Please configure your Shiprocket settings in the Shipping Settings page before using auto-ship.",
      });
    }

    // Use the first record consistently
    const setting = settings[0];

    // Get seller's pickup address or use default
    const pickupAddress = (setting as any).pickupAddress
      ? typeof (setting as any).pickupAddress === "string"
        ? JSON.parse((setting as any).pickupAddress)
        : (setting as any).pickupAddress
      : {
          pincode: "140601", // Default LeleKart pickup pincode
          address: "LeleKart Warehouse",
          city: "Ludhiana",
          state: "Punjab",
          country: "India",
        };

    // Get pending orders
    const pendingOrders = await db
      .select()
      .from(orders)
      .where(
        and(
          eq(orders.status, "confirmed"),
          isNull(orders.shiprocketOrderId),
          not(eq(orders.paymentMethod, "cod"))
        )
      );

    if (pendingOrders.length === 0) {
      return res
        .status(200)
        .json({ message: "No pending orders to ship", shipped: 0 });
    }

    // Ship each order
    const shipResults = [];
    let successCount = 0;

    for (const order of pendingOrders) {
      try {
        // Get token
        let token;
        token = await getShiprocketToken();

        if (!token) {
          return res
            .status(400)
            .json({ error: "Shiprocket token not available" });
        }

        // Get order items
        const orderItems = await storage.getOrderItems(order.id);

        // Get shipping address
        const address = order.addressId
          ? await storage.getUserAddress(order.addressId)
          : null;

        if (!address) {
          shipResults.push({
            orderId: order.id,
            success: false,
            error: "Shipping address not found",
          });
          continue;
        }

        // Get user details
        const user = await storage.getUser(order.userId);

        if (!user) {
          shipResults.push({
            orderId: order.id,
            success: false,
            error: "User not found",
          });
          continue;
        }

        // Calculate total weight and dimensions
        let totalWeight = 0;
        let maxLength = 0;
        let maxWidth = 0;
        let maxHeight = 0;

        for (const item of orderItems) {
          const product = await storage.getProduct(item.productId);
          if (product) {
            // Add weight for each item (weight is in kg)
            const productWeight = parseFloat(product.weight as any) || 0.5;
            totalWeight += productWeight * item.quantity;

            // Update max dimensions (dimensions are in cm)
            const productLength = parseFloat(product.length as any) || 10;
            const productWidth = parseFloat(product.width as any) || 10;
            const productHeight = parseFloat(product.height as any) || 10;

            maxLength = Math.max(maxLength, productLength);
            maxWidth = Math.max(maxWidth, productWidth);
            maxHeight = Math.max(maxHeight, productHeight);
          }
        }

        // Resolve seller pickup settings for pickup location and pincode
        let sellerPickup: any = null;
        try {
          const firstItem = orderItems[0];
          const sellerId = firstItem?.product?.sellerId;
          if (sellerId) {
            const sellerSettings = await storage.getSellerSettings(sellerId);
            if (sellerSettings?.pickupAddress) {
              sellerPickup =
                typeof sellerSettings.pickupAddress === "string"
                  ? JSON.parse(sellerSettings.pickupAddress)
                  : sellerSettings.pickupAddress;
            }
          }
        } catch {}

        // Resolve valid pickup location from Shiprocket account
        const computedPickupLocation = await resolveShiprocketPickupLocation(
          token,
          sellerPickup
        );

        // Transform order data for Shiprocket API
        const shiprocketOrderData = {
          order_id: `ORD-${order.id}`,
          order_date: new Date(order.date).toISOString().split("T")[0],
          pickup_location: computedPickupLocation,
          channel_id: "",
          comment: "Order from LeLeKart (Auto-shipped)",
          billing_customer_name: user.name || user.username,
          billing_last_name: "",
          billing_address: address.address,
          billing_address_2: "",
          billing_city: address.city,
          billing_pincode: address.pincode,
          billing_state: address.state,
          billing_country: "India",
          billing_email: user.email,
          billing_phone: user.phone || address.phone,
          shipping_is_billing: true,
          shipping_customer_name: user.name || user.username,
          shipping_last_name: "",
          shipping_address: address.address,
          shipping_address_2: "",
          shipping_city: address.city,
          shipping_pincode: address.pincode,
          shipping_state: address.state,
          shipping_country: "India",
          shipping_email: user.email,
          shipping_phone: user.phone || address.phone,
          order_items: orderItems.map((item) => ({
            name: item.product?.name || `Product ID: ${item.productId}`,
            sku: `SKU-${item.productId}`,
            units: item.quantity,
            selling_price: item.price, // Price is already in rupees
            discount: "",
            tax: "",
            hsn: "",
          })),
          payment_method: order.paymentMethod === "cod" ? "COD" : "Prepaid",
          shipping_charges: 0,
          giftwrap_charges: 0,
          transaction_charges: 0,
          total_discount: 0,
          sub_total: order.total, // Price is already in rupees
          length: maxLength || 10, // Use calculated max length or default to 10cm
          breadth: maxWidth || 10, // Use calculated max width or default to 10cm
          height: maxHeight || 10, // Use calculated max height or default to 10cm
          weight: totalWeight / 1000 || 0.5, // Use calculated total weight (converted to kg) or default to 0.5kg
        };

        // Shiprocket logging (concise)
        try {
          console.log("[Shiprocket] Preparing order create (auto)", {
            orderId: shiprocketOrderData.order_id,
            pickup_location: shiprocketOrderData.pickup_location,
            pickup_pincode: sellerPickup?.pincode,
            shipping_pincode: address.pincode,
            payment_method: shiprocketOrderData.payment_method,
            weight: shiprocketOrderData.weight,
            dimensions: {
              length: shiprocketOrderData.length,
              breadth: shiprocketOrderData.breadth,
              height: shiprocketOrderData.height,
            },
            itemsCount: orderItems.length,
            sellerId: orderItems[0]?.product?.sellerId,
          });
          if (
            sellerPickup &&
            shiprocketOrderData.pickup_location === "Primary"
          ) {
            console.warn(
              "[Shiprocket] Warning: Seller pickup present but pickup_location fell back to 'Primary'. Ensure the seller's businessName/contactName matches a Shiprocket pickup location nickname."
            );
          }
        } catch {}

        // Create order in Shiprocket
        const response = await axios.post(
          `${SHIPROCKET_API_BASE}/orders/create/adhoc`,
          shiprocketOrderData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        try {
          console.log("[Shiprocket] Created order (auto) response", {
            order_id: response?.data?.order_id,
            shipment_id: response?.data?.shipment_id,
          });
        } catch {}

        if (response.data.order_id) {
          // Get available couriers for this order

          const courierRates = await getCourierRates(token, {
            pickup_postcode:
              (sellerPickup && sellerPickup.pincode) || pickupAddress.pincode,
            delivery_postcode: address.pincode,
            weight: totalWeight / 1000,
            cod: order.paymentMethod === "cod" ? 1 : 0,
            length: maxLength || 10,
            breadth: maxWidth || 10,
            height: maxHeight || 10,
            sellerId: orderItems[0]?.product?.sellerId, // Pass seller ID from first product
          });

          // Find the default courier in available couriers
          const defaultCourier = courierRates.couriers.find(
            (c: any) =>
              c.courier_company_id === parseInt(setting.defaultCourier || "0")
          );

          if (!defaultCourier) {
            shipResults.push({
              orderId: order.id,
              success: false,
              error: "Default courier not available for this order",
            });
            continue;
          }

          // Assign AWB first
          try {
            const awbResponse = await assignAWB(
              token,
              response.data.shipment_id,
              defaultCourier.courier_company_id.toString()
            );

            // Generate pickup request
            try {
              console.log("[Shiprocket] Generating pickup (auto)", {
                shipment_id: response.data.shipment_id,
              });
            } catch {}
            const pickupResponse = await axios.post(
              `${SHIPROCKET_API_BASE}/courier/generate/pickup`,
              {
                shipment_id: [response.data.shipment_id],
              },
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
                },
              }
            );
            try {
              console.log("[Shiprocket] Pickup queued (auto)", {
                shipment_id: response?.data?.shipment_id,
                pickup: pickupResponse?.data?.pickup_scheduled || true,
              });
            } catch {}

            // Update order with Shiprocket details
            const [updatedOrder] = await db
              .update(orders)
              .set({
                shiprocketOrderId: response.data.order_id.toString(),
                shiprocketShipmentId: response.data.shipment_id.toString(),
                shippingStatus: "processing",
                status: "shipped",
                awbCode:
                  awbResponse.data?.awb_code || defaultCourier.awb_code || null,
                courierName: defaultCourier.courier_name,
                estimatedDeliveryDate: defaultCourier.etd
                  ? new Date(defaultCourier.etd)
                  : null,
              })
              .where(eq(orders.id, order.id))
              .returning();

            shipResults.push({
              orderId: order.id,
              success: true,
              shiprocketOrderId: response.data.order_id.toString(),
              shiprocketShipmentId: response.data.shipment_id.toString(),
              awbCode:
                awbResponse.data?.awb_code || defaultCourier.awb_code || null,
            });

            successCount++;
          } catch (error: any) {
            console.error(
              `Error auto-shipping order ${order.id}:`,
              error.response?.data || error.message
            );
            shipResults.push({
              orderId: order.id,
              success: false,
              error:
                error.response?.data?.message ||
                error.message ||
                "Unknown error",
            });
          }
        } else {
          shipResults.push({
            orderId: order.id,
            success: false,
            error: "Failed to create order in Shiprocket",
          });
        }
      } catch (error: any) {
        console.error(
          `Error auto-shipping order ${order.id}:`,
          error.response?.data || error.message
        );
        shipResults.push({
          orderId: order.id,
          success: false,
          error:
            error.response?.data?.message || error.message || "Unknown error",
        });
      }
    }

    return res.status(200).json({
      message: `Auto-shipped ${successCount} of ${pendingOrders.length} orders`,
      shipped: successCount,
      total: pendingOrders.length,
      results: shipResults,
    });
  } catch (error: any) {
    console.error(
      "Error auto-shipping with Shiprocket:",
      error.response?.data || error.message
    );

    // Check for specific errors and provide more helpful messages
    if (error.message && error.message.includes("Unauthorized")) {
      return res.status(403).json({
        error: "Unauthorized! You do not have the required permissions.",
        message:
          "Your Shiprocket account doesn't have the necessary API access permissions. Please upgrade your Shiprocket plan or contact Shiprocket support to enable API access.",
      });
    }

    if (error.response?.data) {
      return res.status(error.response?.status || 500).json({
        error: error.response.data.message || "Shiprocket API Error",
        details: error.response.data,
        message:
          "There was an error communicating with Shiprocket. Please check your credentials and try again.",
      });
    }

    return res.status(500).json({
      error: "Internal server error",
      message:
        error.message ||
        "An unexpected error occurred while processing your request.",
    });
  }
}

/**
 * Get orders shipped with Shiprocket
 */
export async function getShiprocketOrders(req: Request, res: Response) {
  try {
    // Check if user is authenticated and is admin
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Forbidden" });
    }

    // Get orders that have been shipped with Shiprocket
    const shippedOrders = await db
      .select()
      .from(orders)
      .where(not(isNull(orders.shiprocketOrderId)));

    // Get additional data for each order
    const ordersWithDetails = await Promise.all(
      shippedOrders.map(async (order) => {
        const orderItems = await storage.getOrderItems(order.id);

        return {
          ...order,
          items: orderItems,
        };
      })
    );

    return res.status(200).json(ordersWithDetails);
  } catch (error) {
    console.error("Error getting Shiprocket orders:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * Get pending return requests that need Shiprocket courier assignment
 */
export async function getPendingShiprocketReturns(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Forbidden" });
    }

    const page = parseInt((req.query.page as string) || "1");
    const limit = parseInt((req.query.limit as string) || "10");
    const offset = (page - 1) * limit;

    // Consider returns that are marked/pending/approved/processing and not yet shipped back
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(returnRequests)
      .where(
        and(
          inArray(returnRequests.status, [
            "marked_for_return",
            "pending",
            "approved",
            "processing",
          ]),
          isNull(returnRequests.shiprocketReturnShipmentId as any)
        )
      );

    const rows = await db
      .select()
      .from(returnRequests)
      .where(
        and(
          inArray(returnRequests.status, [
            "marked_for_return",
            "pending",
            "approved",
            "processing",
          ]),
          isNull(returnRequests.shiprocketReturnShipmentId as any)
        )
      )
      .limit(limit)
      .offset(offset)
      .orderBy(desc(returnRequests.createdAt));

    // Enrich minimal details for UI (order, item, buyer)
    const enriched = await Promise.all(
      rows.map(async (rr: any) => {
        const order = await storage.getOrder(rr.orderId);
        const items = await storage.getOrderItems(rr.orderId);
        const orderItem = items.find((i: any) => i.id === rr.orderItemId);
        const buyer = await storage.getUser(rr.buyerId);
        const address = order?.addressId
          ? await storage.getUserAddress(order.addressId)
          : null;
        return {
          ...rr,
          orderTotal: order?.total ?? null,
          productName: orderItem?.product?.name ?? null,
          buyerName: buyer?.name ?? buyer?.username ?? null,
          shippingAddress: address
            ? {
                address: address.address,
                city: address.city,
                state: address.state,
                pincode: address.pincode,
                phone: address.phone,
              }
            : null,
        };
      })
    );

    return res.status(200).json({
      returns: enriched,
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
    });
  } catch (error) {
    console.error("Error getting pending Shiprocket returns:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * Create Shiprocket return order and optionally assign courier
 */
export async function shipReturnWithShiprocket(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Forbidden" });
    }

    const { returnRequestId, courierCompany } = req.body as {
      returnRequestId: number;
      courierCompany?: string;
    };
    if (!returnRequestId) {
      return res.status(400).json({ error: "returnRequestId is required" });
    }

    // Load return and order
    const rr = await storage.getReturnRequestById(returnRequestId);
    if (!rr) return res.status(404).json({ error: "Return request not found" });

    const order = await storage.getOrder(rr.orderId);
    if (!order) return res.status(404).json({ error: "Order not found" });

    const items = await storage.getOrderItems(rr.orderId);
    let address = order.addressId
      ? await storage.getUserAddress(order.addressId)
      : null;
    const buyer = await storage.getUser(order.userId);
    if (!buyer) {
      return res.status(400).json({ error: "Missing buyer details" });
    }

    const token = await getShiprocketToken();
    if (!token) return res.status(400).json({ error: "Token unavailable" });

    // Build Shiprocket return shipment payload (reverse pickup)
    const normalizeAddress = (raw: any) => {
      if (!raw) return null as any;
      const primary =
        raw.address ||
        raw.address1 ||
        raw.address_1 ||
        raw.line1 ||
        raw.addressLine1;
      const secondary =
        raw.address_2 || raw.address2 || raw.line2 || raw.addressLine2 || "";
      const city = raw.city || raw.town || raw.district || "";
      const pincode =
        raw.pincode || raw.postcode || raw.zip || raw.zipcode || "";
      const state = raw.state || raw.province || raw.region || "";
      const country = raw.country || "India";
      const phone = raw.phone || raw.phoneNumber || raw.mobile || "";
      return {
        address: primary || "",
        address_2: secondary,
        city,
        pincode,
        state,
        country,
        phone,
      } as any;
    };
    // Product weight is stored in kilograms in our catalog. Do not convert again.
    const totalWeightKg = Math.max(
      (
        await Promise.all(
          items.map(async (it: any) => {
            const p = await storage.getProduct(it.productId);
            const weightKg = parseFloat(p?.weight as any) || 0.5;
            return weightKg * it.quantity;
          })
        )
      ).reduce((a, b) => a + b, 0),
      0.5
    );

    // Determine seller pickup/warehouse address (delivery endpoint for reverse)
    let sellerPickup: any = null;
    try {
      const firstItem = items[0];
      const sellerId = firstItem?.product?.sellerId;
      if (sellerId) {
        const sellerSettings = await storage.getSellerSettings(sellerId);
        if (sellerSettings?.pickupAddress) {
          sellerPickup =
            typeof sellerSettings.pickupAddress === "string"
              ? JSON.parse(sellerSettings.pickupAddress)
              : sellerSettings.pickupAddress;
        }
      }
    } catch {}
    if (!sellerPickup) {
      const settings = await db
        .select()
        .from(shiprocketSettings)
        .orderBy(shiprocketSettings.id);
      const setting = settings[0];
      sellerPickup = (setting as any)?.pickupAddress
        ? typeof (setting as any).pickupAddress === "string"
          ? JSON.parse((setting as any).pickupAddress)
          : (setting as any).pickupAddress
        : {
            address: "LeleKart Warehouse",
            city: "Ludhiana",
            state: "Punjab",
            country: "India",
            pincode: "140601",
            phone: (buyer as any)?.phone || (address as any)?.phone || "",
          };
    }

    // Normalize addresses to ensure required keys exist
    sellerPickup = normalizeAddress(sellerPickup) || {
      address: "",
      address_2: "",
      city: "",
      pincode: "",
      state: "",
      country: "India",
      phone: "",
    };
    address = normalizeAddress(address);

    // Fallback used for pickup_* fields if buyer address not present
    const pickupFrom = address || sellerPickup;

    const payload: any = {
      order_id: `RET-${rr.id}`,
      order_date: new Date().toISOString().split("T")[0],
      comment: `Return for order ${order.id}`,
      pickup_location:
        sellerPickup.pickup_location || sellerPickup.name || "Primary",
      pickup_customer_name: buyer.name || buyer.username,
      pickup_last_name: "",
      pickup_address: pickupFrom.address,
      pickup_address_2: pickupFrom.address_2 || "",
      pickup_city: pickupFrom.city,
      pickup_pincode: pickupFrom.pincode,
      pickup_state: pickupFrom.state,
      pickup_country: "India",
      pickup_email: buyer.email,
      pickup_phone: buyer.phone || pickupFrom.phone,
      // For reverse shipments, shipping_* should reflect the customer's address
      shipping_customer_name: buyer.name || buyer.username,
      shipping_last_name: "",
      shipping_address: pickupFrom.address,
      shipping_address_2: pickupFrom.address_2 || "",
      shipping_city: pickupFrom.city,
      shipping_pincode: pickupFrom.pincode,
      shipping_state: pickupFrom.state,
      shipping_country: pickupFrom.country || "India",
      shipping_email: buyer.email,
      shipping_phone: buyer.phone || pickupFrom.phone,
      delivery_customer_name: "Warehouse",
      delivery_last_name: "",
      delivery_address: sellerPickup.address || pickupFrom.address,
      delivery_address_2: sellerPickup.address_2 || "",
      delivery_city: sellerPickup.city || pickupFrom.city,
      delivery_pincode: sellerPickup.pincode || pickupFrom.pincode,
      delivery_state: sellerPickup.state || pickupFrom.state,
      delivery_country: sellerPickup.country || "India",
      delivery_email: buyer.email,
      delivery_phone: sellerPickup.phone || buyer.phone || pickupFrom.phone,
      order_items: items.map((it: any) => ({
        name: it.product?.name || `Product ID: ${it.productId}`,
        sku: `SKU-${it.productId}`,
        units: it.quantity,
        selling_price: it.price,
      })),
      payment_method: order.paymentMethod === "cod" ? "COD" : "Prepaid",
      sub_total: order.total,
      length: 10,
      breadth: 10,
      height: 10,
      weight: totalWeightKg,
    };

    // Debug log for visibility (sanitized)
    try {
      console.log("Shiprocket Return Payload:", {
        order_id: payload.order_id,
        pickup_pincode: payload.pickup_pincode,
        shipping_pincode: payload.shipping_pincode,
        delivery_pincode: payload.delivery_pincode,
        weight: payload.weight,
        pickup_location: payload.pickup_location,
      });
    } catch {}

    const createResp = await axios.post(
      `${SHIPROCKET_API_BASE}/shipments/create/return-shipment`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    const srRaw = createResp.data || {};
    const sr = srRaw.payload ? srRaw.payload : srRaw;

    if (!sr?.order_id) {
      console.error("Shiprocket return creation failed:", createResp.data);
      return res.status(400).json({
        error: "Failed to create return in Shiprocket",
        details: createResp.data,
        errors:
          (createResp.data &&
            (createResp.data.errors || createResp.data.message)) ||
          undefined,
      });
    }

    let awbCode: string | null = null;
    let courierName: string | null = null;

    if (courierCompany) {
      try {
        const awbResp = await assignAWB(token, sr.shipment_id, courierCompany);
        awbCode = awbResp?.data?.awb_code || null;
      } catch (e: any) {
        const msg: string = e?.response?.data?.message || e?.message || "";
        if (msg && msg.toLowerCase().includes("awb is already assigned")) {
          const match = msg.match(/awb\s*-?\s*([A-Za-z0-9]+)/i);
          if (match && match[1]) awbCode = match[1];
          console.warn("AWB already assigned, proceeding:", msg);
        } else {
          throw e;
        }
      }
      // Try to generate pickup as well
      try {
        await axios.post(
          `${SHIPROCKET_API_BASE}/courier/generate/pickup`,
          { shipment_id: [sr.shipment_id] },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
      } catch (_) {}
    }

    // Persist on return request
    const [updated] = await db
      .update(returnRequests)
      .set({
        shiprocketReturnOrderId: sr.order_id.toString(),
        shiprocketReturnShipmentId: sr.shipment_id.toString(),
        returnAwbCode: awbCode,
        returnCourierName: courierName || undefined,
        status: "processing",
        updatedAt: new Date(),
      } as any)
      .where(eq(returnRequests.id, returnRequestId))
      .returning();

    return res.status(200).json(updated);
  } catch (error: any) {
    console.error(
      "Error shipping return with Shiprocket:",
      error?.response?.data || error
    );
    return res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * Ship order via Shiprocket
 */
export async function shipOrderWithShiprocket(req: Request, res: Response) {
  try {
    // Check if user is authenticated and is admin
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Forbidden" });
    }

    const { orderId, courierCompany } = req.body;

    if (!orderId) {
      return res.status(400).json({ error: "Order ID is required" });
    }

    // Get order
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId));

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    if (order.shiprocketOrderId) {
      return res
        .status(400)
        .json({ error: "Order already shipped with Shiprocket" });
    }

    // Get token
    let token;
    try {
      token = await getShiprocketToken();

      if (!token) {
        return res.status(400).json({
          error: "Shiprocket token not available",
          message: "Please check your Shiprocket credentials in Settings.",
        });
      }
    } catch (tokenError: any) {
      // Handle permission errors specifically
      if (tokenError.message && tokenError.message.includes("Unauthorized")) {
        return res.status(403).json({
          error: "Unauthorized! You do not have the required permissions.",
          message:
            "Your Shiprocket account doesn't have the necessary API access permissions. Please upgrade your Shiprocket plan or contact Shiprocket support to enable API access.",
        });
      }

      // For other token errors
      return res.status(400).json({
        error: "Error getting Shiprocket token",
        message:
          tokenError.message || "Please check your Shiprocket credentials.",
      });
    }

    // Get order items
    const orderItems = await storage.getOrderItems(order.id);

    // Calculate total weight and dimensions
    let totalWeight = 0;
    let maxLength = 0;
    let maxWidth = 0;
    let maxHeight = 0;

    for (const item of orderItems) {
      const product = await storage.getProduct(item.productId);
      if (product) {
        // Add weight for each item (weight is in kg)
        const productWeight = parseFloat(product.weight as any) || 0.5;
        totalWeight += productWeight * item.quantity;

        // Update max dimensions (dimensions are in cm)
        const productLength = parseFloat(product.length as any) || 10;
        const productWidth = parseFloat(product.width as any) || 10;
        const productHeight = parseFloat(product.height as any) || 10;

        maxLength = Math.max(maxLength, productLength);
        maxWidth = Math.max(maxWidth, productWidth);
        maxHeight = Math.max(maxHeight, productHeight);
      }
    }

    // Get shipping address
    const address = order.addressId
      ? await storage.getUserAddress(order.addressId)
      : null;

    if (!address) {
      return res.status(400).json({ error: "Shipping address not found" });
    }

    // Get user details
    const user = await storage.getUser(order.userId);

    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }

    // Resolve seller pickup settings for pickup location
    let sellerPickup: any = null;
    try {
      const firstItem = orderItems[0];
      const sellerId = firstItem?.product?.sellerId;
      if (sellerId) {
        console.log("[Shiprocket][ManualShip] Resolving seller pickup", {
          orderId: order.id,
          sellerId,
        });
        const sellerSettings = await storage.getSellerSettings(sellerId);
        console.log("[Shiprocket][ManualShip] Seller settings fetched", {
          hasPickupAddress: !!sellerSettings?.pickupAddress,
          rawPickupAddress: sellerSettings?.pickupAddress || null,
        });
        if (sellerSettings?.pickupAddress) {
          sellerPickup =
            typeof sellerSettings.pickupAddress === "string"
              ? JSON.parse(sellerSettings.pickupAddress)
              : sellerSettings.pickupAddress;
          console.log(
            "[Shiprocket][ManualShip] Parsed seller pickup",
            sellerPickup
          );
        }
      }
    } catch (e) {
      console.error(
        "[Shiprocket][ManualShip] Error resolving seller pickup",
        e
      );
    }

    // Resolve valid pickup location from Shiprocket account
    const computedPickupLocation = await resolveShiprocketPickupLocation(
      token,
      sellerPickup
    );

    // Transform order data for Shiprocket API
    const shiprocketOrderData = {
      order_id: `ORD-${order.id}`,
      order_date: new Date(order.date).toISOString().split("T")[0],
      pickup_location: computedPickupLocation,
      channel_id: "",
      comment: "Order from LeLeKart",
      billing_customer_name: user.name || user.username,
      billing_last_name: "",
      billing_address: address.address,
      billing_address_2: "",
      billing_city: address.city,
      billing_pincode: address.pincode,
      billing_state: address.state,
      billing_country: "India",
      billing_email: user.email,
      billing_phone: user.phone || address.phone,
      shipping_is_billing: true,
      shipping_customer_name: user.name || user.username,
      shipping_last_name: "",
      shipping_address: address.address,
      shipping_address_2: "",
      shipping_city: address.city,
      shipping_pincode: address.pincode,
      shipping_state: address.state,
      shipping_country: "India",
      shipping_email: user.email,
      shipping_phone: user.phone || address.phone,
      order_items: orderItems.map((item) => ({
        name: item.product?.name || `Product ID: ${item.productId}`,
        sku: `SKU-${item.productId}`,
        units: item.quantity,
        selling_price: item.price, // Price is already in rupees
        discount: "",
        tax: "",
        hsn: "",
      })),
      payment_method: order.paymentMethod === "cod" ? "COD" : "Prepaid",
      shipping_charges: 0,
      giftwrap_charges: 0,
      transaction_charges: 0,
      total_discount: 0,
      sub_total: order.total, // Price is already in rupees
      length: maxLength || 10, // Use calculated max length or default to 10cm
      breadth: maxWidth || 10, // Use calculated max width or default to 10cm
      height: maxHeight || 10, // Use calculated max height or default to 10cm
      weight: totalWeight / 1000 || 0.5, // Use calculated total weight (converted to kg) or default to 0.5kg
    };

    try {
      console.log("[Shiprocket] Preparing order create (manual)", {
        orderId: shiprocketOrderData.order_id,
        pickup_location: shiprocketOrderData.pickup_location,
        pickup_pincode: sellerPickup?.pincode,
        shipping_pincode: address.pincode,
        payment_method: shiprocketOrderData.payment_method,
        weight: shiprocketOrderData.weight,
        dimensions: {
          length: shiprocketOrderData.length,
          breadth: shiprocketOrderData.breadth,
          height: shiprocketOrderData.height,
        },
        itemsCount: orderItems.length,
        sellerId: orderItems[0]?.product?.sellerId,
      });
    } catch {}

    // Create order in Shiprocket
    const response = await axios.post(
      `${SHIPROCKET_API_BASE}/orders/create/adhoc`,
      shiprocketOrderData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (response.data.order_id) {
      // Log response summary
      try {
        console.log("[Shiprocket] Created order (manual) response", {
          order_id: response?.data?.order_id,
          shipment_id: response?.data?.shipment_id,
        });
      } catch {}

      // If courier company provided, assign AWB and generate shipment
      let shipmentResponse = null;
      if (courierCompany) {
        try {
          // First assign AWB
          const awbResponse = await assignAWB(
            token,
            response.data.shipment_id,
            courierCompany
          );

          // Then generate pickup
          try {
            console.log("[Shiprocket] Generating pickup (manual)", {
              shipment_id: response.data.shipment_id,
            });
          } catch {}
          try {
            shipmentResponse = await axios.post(
              `${SHIPROCKET_API_BASE}/courier/generate/pickup`,
              {
                shipment_id: [response.data.shipment_id],
              },
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
                },
              }
            );
            try {
              console.log("[Shiprocket] Pickup queued (manual)", {
                shipment_id: response?.data?.shipment_id,
                pickup: shipmentResponse?.data?.pickup_scheduled || true,
              });
            } catch {}
          } catch (shipmentError: any) {
            console.error(
              "Error generating shipment:",
              shipmentError.response?.data || shipmentError.message
            );

            // If the error is "Already in Pickup Queue", we can proceed as this is not a critical error
            if (
              shipmentError.response?.data?.message ===
              "Already in Pickup Queue."
            ) {
              console.log(
                "Shipment is already in pickup queue, proceeding with order update"
              );
              // Continue with order creation even if pickup is already queued
            } else {
              // For other errors, we should handle them appropriately
              throw shipmentError;
            }
          }
        } catch (error: any) {
          console.error(
            "Error generating shipment:",
            error.response?.data || error.message
          );
          // Continue with order creation even if shipment generation fails
        }
      }

      // Update order with Shiprocket details
      const [updatedOrder] = await db
        .update(orders)
        .set({
          shiprocketOrderId: response.data.order_id.toString(),
          shiprocketShipmentId: response.data.shipment_id.toString(),
          shippingStatus: "processing",
          status: "shipped",
          ...(shipmentResponse?.data
            ? {
                awbCode: shipmentResponse.data.awb_code,
                courierName: shipmentResponse.data.courier_name,
                estimatedDeliveryDate: shipmentResponse.data
                  .expected_delivery_date
                  ? new Date(shipmentResponse.data.expected_delivery_date)
                  : null,
              }
            : {}),
        })
        .where(eq(orders.id, order.id))
        .returning();

      // Get updated order details to return
      const orderDetails = {
        ...updatedOrder,
        items: await storage.getOrderItems(updatedOrder.id),
      };

      return res.status(200).json(orderDetails);
    } else {
      console.error("Invalid response from Shiprocket:", response.data);
      return res.status(400).json({
        error: "Failed to create order in Shiprocket",
        details: response.data,
        message:
          "The Shiprocket API returned an invalid response. Please try again.",
      });
    }
  } catch (error: any) {
    console.error(
      "Error shipping order with Shiprocket:",
      error.response?.data || error.message
    );

    // Check for specific errors and provide more helpful messages
    if (error.response?.status === 404) {
      return res.status(404).json({
        error: "Shiprocket API endpoint not found",
        message:
          "The Shiprocket API endpoint is not available. Please check your Shiprocket account status and try again.",
        details: error.response.data,
      });
    }

    if (error.response?.status === 401 || error.response?.status === 403) {
      return res.status(error.response.status).json({
        error: "Authentication failed",
        message:
          "Your Shiprocket credentials are invalid or expired. Please refresh your token and try again.",
        details: error.response.data,
      });
    }

    if (error.response?.data) {
      return res.status(error.response?.status || 500).json({
        error: error.response.data.message || "Error from Shiprocket API",
        details: error.response.data,
        message:
          "There was an error communicating with Shiprocket. Please check your credentials and try again.",
      });
    }

    return res.status(500).json({
      error: "Internal server error",
      message:
        error.message ||
        "An unexpected error occurred while processing your request.",
    });
  }
}

/**
 * Test Shiprocket connection by retrieving couriers
 */
export async function testShiprocketConnection(req: Request, res: Response) {
  try {
    // Check if user is authenticated and is admin
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Forbidden" });
    }

    // Get token (this will automatically refresh if expired)
    let token;
    try {
      token = await getShiprocketToken();

      if (!token) {
        return res.status(400).json({
          error: "Shiprocket token not available",
          message:
            "Please check your Shiprocket credentials or generate a new token.",
          code: "TOKEN_MISSING",
        });
      }
    } catch (tokenError: any) {
      console.log("Shiprocket API error details:", tokenError.message);

      // Catch permission errors specifically
      if (tokenError.message && tokenError.message.includes("Unauthorized")) {
        return res.status(403).json({
          error: "API Permission Error",
          message:
            "Your Shiprocket account doesn't have the necessary API access permissions. This typically requires a Business plan or higher.",
          details:
            "Please upgrade your Shiprocket plan or contact Shiprocket support to enable API access.",
          code: "PERMISSION_ERROR",
        });
      }

      // For other token errors
      return res.status(400).json({
        error: "Error getting Shiprocket token",
        message:
          tokenError.message || "Please check your Shiprocket credentials.",
        code: "TOKEN_ERROR",
      });
    }

    // Test API access by getting courier companies
    try {
      const response = await axios.get(
        `${SHIPROCKET_API_BASE}/courier/courierListWithCounts`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      return res.status(200).json({
        success: true,
        message: "Successfully connected to Shiprocket API",
      });
    } catch (apiError: any) {
      console.error(
        "Error in Shiprocket API test call:",
        apiError?.response?.data || apiError.message
      );

      if (apiError?.response?.data) {
        return res.status(apiError.response.status || 400).json({
          error: "Error from Shiprocket API",
          message:
            apiError.response.data.message ||
            "An error occurred while communicating with Shiprocket API",
          details: apiError.response.data,
        });
      }

      return res.status(500).json({
        error: "Failed to communicate with Shiprocket API",
        message: apiError.message || "Connection test failed",
      });
    }
  } catch (error: any) {
    console.error("Error in testShiprocketConnection:", error);
    return res.status(500).json({
      error: "Internal server error",
      message:
        error.message ||
        "An unexpected error occurred while processing your request.",
    });
  }
}

/**
 * Check Shiprocket token status
 */
export async function checkShiprocketToken(req: Request, res: Response) {
  try {
    // Check if user is authenticated and is admin
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Forbidden" });
    }

    // Get token (this will automatically refresh if expired)
    let token;
    try {
      token = await getShiprocketToken();

      if (!token) {
        return res.status(400).json({
          error: "Shiprocket token not available",
          message:
            "Please check your Shiprocket credentials or generate a new token.",
          code: "TOKEN_MISSING",
        });
      }

      // Test API access by getting courier companies
      const response = await axios.get(
        `${SHIPROCKET_API_BASE}/courier/courierListWithCounts`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      return res.status(200).json({
        success: true,
        message: "Successfully connected to Shiprocket API",
        data: response.data,
      });
    } catch (tokenError: any) {
      console.error("Shiprocket API token error:", tokenError);
      return res.status(400).json({
        error: "Error getting Shiprocket token",
        message:
          tokenError.message || "Please check your Shiprocket credentials.",
        code: "TOKEN_ERROR",
      });
    }
  } catch (error: any) {
    console.error("Error in checkShiprocketToken:", error);
    return res.status(500).json({
      error: "Internal server error",
      message: error.message || "An unexpected error occurred",
      code: "INTERNAL_ERROR",
    });
  }
}
