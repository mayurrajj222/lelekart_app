import { Request, Response } from "express";
import { storage } from "../storage";
import xlsx from "xlsx";

// Export products for sellers
export async function exportProductsToExcel(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const sellerId = req.user.id;
    
    // Get products for this seller only
    const result = await storage.getProducts({ 
      sellerId: sellerId,
      hideDrafts: false
    } as any);
    
    const products = result.products || [];
    console.log(`Exporting ${products.length} products for seller ID: ${sellerId}`);
    
    // Prepare data for Excel
    const productData = await Promise.all(products.map(async (product: any) => {
      // Get variants for the product
      const variants = await storage.getProductVariants(product.id);
      
      // Get subcategory information if exists
      const subcategory = product.subcategory || "";
      
      // Extract dimensions and other physical properties
      const dimensions = {
        length: product.length || "",
        width: product.width || "",
        height: product.height || "",
        weight: product.weight || ""
      };
      
      // If product has variants, create a row for each variant with complete details
      if (variants && variants.length > 0) {
        return variants.map(variant => ({
          // Product Base Info
          Product_ID: product.id,
          Name: product.name,
          Category: product.category,
          Subcategory: subcategory,
          
          // Variant Specific Details
          Variant_ID: variant.id,
          SKU: variant.sku || "",
          Color: variant.color || "",
          Size: variant.size || "",
          Price: variant.price,
          MRP: variant.mrp || "",
          Stock: variant.stock,
          Variant_Images: variant.images || "",
          
          // Physical Attributes
          Length: dimensions.length,
          Width: dimensions.width,
          Height: dimensions.height,
          Weight: dimensions.weight,
          
          // Product Details
          Description: product.description?.replace(/<[^>]*>/g, "") || "",
          Specifications: product.specifications?.replace(/<[^>]*>/g, "") || "",
          GST_Rate: product.gstRate || "",
          HSN_Code: product.hsnCode || "",
          Brand: product.brand || "",
          
          // Status Information
          Approved: product.approved ? "Yes" : "No",
          Rejected: product.rejected ? "Yes" : "No",
          Draft: product.isDraft ? "Yes" : "No",
          
          // Timestamps
          Created_At: product.createdAt ? new Date(product.createdAt).toLocaleDateString() : "",
          Updated_At: product.updatedAt ? new Date(product.updatedAt).toLocaleDateString() : ""
        }));
      } else {
        // Single product with no variants
        return [{
          // Product Base Info
          Product_ID: product.id,
          Name: product.name,
          Category: product.category,
          Subcategory: subcategory,
          
          // Product Specific Details (non-variant)
          Variant_ID: "None",
          SKU: product.sku || "",
          Color: product.color || "",
          Size: product.size || "",
          Price: product.price,
          MRP: product.mrp || "",
          Stock: product.stock,
          Variant_Images: product.images || product.imageUrl || "",
          
          // Physical Attributes
          Length: dimensions.length,
          Width: dimensions.width,
          Height: dimensions.height,
          Weight: dimensions.weight,
          
          // Product Details
          Description: product.description?.replace(/<[^>]*>/g, "") || "",
          Specifications: product.specifications?.replace(/<[^>]*>/g, "") || "",
          GST_Rate: product.gstRate || "",
          HSN_Code: product.hsnCode || "",
          Brand: product.brand || "",
          
          // Status Information
          Approved: product.approved ? "Yes" : "No",
          Rejected: product.rejected ? "Yes" : "No",
          Draft: product.isDraft ? "Yes" : "No",
          
          // Timestamps
          Created_At: product.createdAt ? new Date(product.createdAt).toLocaleDateString() : "",
          Updated_At: product.updatedAt ? new Date(product.updatedAt).toLocaleDateString() : ""
        }];
      }
    }));

    // Flatten the array of arrays
    const flattenedData = productData.flat();
    
    // Create a worksheet
    const worksheet = xlsx.utils.json_to_sheet(flattenedData);
    
    // Create a workbook
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, "Products");
    
    // Generate buffer
    const excelBuffer = xlsx.write(workbook, { type: "buffer", bookType: "xlsx" });
    
    // Set response headers
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename=products_${new Date().toISOString().split('T')[0]}.xlsx`);
    
    // Send the file
    res.send(excelBuffer);
  } catch (error) {
    console.error("Error exporting products:", error);
    res.status(500).json({ message: "Error generating Excel file" });
  }
}

// Export all products for admin
export async function exportAllProductsToExcel(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: "Forbidden. Admin access required." });
    }
    
    // Admin can see ALL products directly - not using the paginated version
    // Get all products directly without pagination filters
    const products = await storage.getAllProductsForExport();
    console.log(`Exporting ${products.length} products with all variants`);
    
    // Prepare data for Excel
    const productData = await Promise.all(products.map(async (product: any) => {
      // Get variants for the product
      const variants = await storage.getProductVariants(product.id);
      
      // Get seller information (username or name)
      const seller = await storage.getUser(product.sellerId);
      const sellerName = seller ? (seller.name || seller.username) : 'Unknown';
      
      // Get subcategory information if exists
      const subcategory = product.subcategory || "";
      
      // Extract dimensions and other physical properties
      const dimensions = {
        length: product.length || "",
        width: product.width || "",
        height: product.height || "",
        weight: product.weight || ""
      };
      
      // If product has variants, create a row for each variant with complete details
      if (variants && variants.length > 0) {
        return variants.map(variant => ({
          // Product Base Info
          Product_ID: product.id,
          Name: product.name,
          Category: product.category,
          Subcategory: subcategory,
          
          // Seller Info
          Seller_ID: product.sellerId,
          Seller: sellerName,
          
          // Variant Specific Details
          Variant_ID: variant.id,
          SKU: variant.sku || "",
          Color: variant.color || "",
          Size: variant.size || "",
          Price: variant.price,
          MRP: variant.mrp || "",
          Stock: variant.stock,
          Variant_Images: variant.images || "",
          
          // Physical Attributes
          Length: dimensions.length,
          Width: dimensions.width,
          Height: dimensions.height,
          Weight: dimensions.weight,
          
          // Product Details
          Description: product.description?.replace(/<[^>]*>/g, "") || "",
          Specifications: product.specifications?.replace(/<[^>]*>/g, "") || "",
          GST_Rate: product.gstRate || "",
          HSN_Code: product.hsnCode || "",
          Brand: product.brand || "",
          
          // Status Information
          Approved: product.approved ? "Yes" : "No",
          Rejected: product.rejected ? "Yes" : "No",
          Draft: product.isDraft ? "Yes" : "No",
          
          // Timestamps
          Created_At: product.createdAt ? new Date(product.createdAt).toLocaleDateString() : "",
          Updated_At: product.updatedAt ? new Date(product.updatedAt).toLocaleDateString() : ""
        }));
      } else {
        // Single product with no variants
        return [{
          // Product Base Info
          Product_ID: product.id,
          Name: product.name,
          Category: product.category,
          Subcategory: subcategory,
          
          // Seller Info
          Seller_ID: product.sellerId,
          Seller: sellerName,
          
          // Product Specific Details (non-variant)
          Variant_ID: "None",
          SKU: product.sku || "",
          Color: product.color || "",
          Size: product.size || "",
          Price: product.price,
          MRP: product.mrp || "",
          Stock: product.stock,
          Variant_Images: product.images || product.imageUrl || "",
          
          // Physical Attributes
          Length: dimensions.length,
          Width: dimensions.width,
          Height: dimensions.height,
          Weight: dimensions.weight,
          
          // Product Details
          Description: product.description?.replace(/<[^>]*>/g, "") || "",
          Specifications: product.specifications?.replace(/<[^>]*>/g, "") || "",
          GST_Rate: product.gstRate || "",
          HSN_Code: product.hsnCode || "",
          Brand: product.brand || "",
          
          // Status Information
          Approved: product.approved ? "Yes" : "No",
          Rejected: product.rejected ? "Yes" : "No",
          Draft: product.isDraft ? "Yes" : "No",
          
          // Timestamps
          Created_At: product.createdAt ? new Date(product.createdAt).toLocaleDateString() : "",
          Updated_At: product.updatedAt ? new Date(product.updatedAt).toLocaleDateString() : ""
        }];
      }
    }));

    // Flatten the array of arrays
    const flattenedData = productData.flat();
    
    // Create a worksheet with column formatting
    const worksheet = xlsx.utils.json_to_sheet(flattenedData);
    
    // Create a workbook
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, "All Products");
    
    // Generate buffer
    const excelBuffer = xlsx.write(workbook, { type: "buffer", bookType: "xlsx" });
    
    // Set response headers
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename=all_products_${new Date().toISOString().split('T')[0]}.xlsx`);
    
    // Send the file
    res.send(excelBuffer);
  } catch (error) {
    console.error("Error exporting all products:", error);
    res.status(500).json({ message: "Error generating Excel file" });
  }
}