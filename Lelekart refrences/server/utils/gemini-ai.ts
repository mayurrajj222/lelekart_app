import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";

// Initialize the Gemini API if key is available
const genAI = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

if (!genAI) {
  console.warn(
    "Warning: GEMINI_API_KEY environment variable is missing. AI features will be disabled."
  );
}

// Use the most advanced model - Gemini 1.5 Pro only if API is available
const model = genAI
  ? genAI.getGenerativeModel({ model: "gemini-2.0-flash" })
  : null;

/**
 * General purpose chat function for the AI assistant
 */
export async function getChatResponse(
  messages: Array<{ role: string; content: string }>,
  systemPrompt: string
): Promise<string> {
  if (!model) {
    throw new Error(
      "Gemini API is not configured. Please add GEMINI_API_KEY to your secrets."
    );
  }
  // Convert messages format for Gemini
  const geminiMessages = messages.map((msg) => ({
    role: msg.role === "user" ? "user" : "model",
    parts: [
      typeof msg.content === "string"
        ? { text: msg.content }
        : { text: String(msg.content) },
    ],
  }));

  // Add system prompt as first message from model
  geminiMessages.unshift({
    role: "model",
    parts: [
      typeof systemPrompt === "string"
        ? { text: systemPrompt }
        : { text: String(systemPrompt) },
    ],
  });

  try {
    if (!model) throw new Error("Gemini model is not initialized");
    const result = await model.generateContent({
      contents: geminiMessages,
      generationConfig: {
        maxOutputTokens: 1000,
        temperature: 0.7,
      },
    });
    const response = result.response;
    return response.text();
  } catch (error) {
    console.error("Error in chat response:", error);
    throw new Error(
      `Failed to generate chat response: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Get a personalized product recommendation based on user preferences and history
 */
export async function getPersonalizedRecommendations(
  userId?: number,
  browsingHistory?: Array<{
    productId: number;
    productName: string;
    category: string;
    viewCount: number;
    lastViewed: Date;
  }>,
  purchaseHistory?: Array<{
    productId: number;
    productName: string;
    category: string;
    purchaseDate: Date;
  }>
): Promise<string> {
  const userContext = userId
    ? `For user ID: ${userId}.`
    : "For an anonymous user.";

  let browsingContext = "No browsing history available.";
  if (browsingHistory && browsingHistory.length > 0) {
    browsingContext = `
      User has recently viewed these products:
      ${browsingHistory
        .map(
          (item) =>
            `- ${item.productName} (Category: ${item.category}, Viewed ${item.viewCount} times, Last viewed: ${item.lastViewed})`
        )
        .join("\n")}
    `;
  }

  let purchaseContext = "No purchase history available.";
  if (purchaseHistory && purchaseHistory.length > 0) {
    purchaseContext = `
      User has purchased these products:
      ${purchaseHistory
        .map(
          (item) =>
            `- ${item.productName} (Category: ${item.category}, Purchased on: ${item.purchaseDate})`
        )
        .join("\n")}
    `;
  }

  const prompt = `
    I need personalized product recommendations for an e-commerce customer.
    ${userContext}
    ${browsingContext}
    ${purchaseContext}
    
    Based on this information, provide recommendations for products that would interest this user.
    Respond with a JSON array of product recommendations, where each object has these fields:
    - productId (number, can be randomly assigned between 1-100)
    - name (string, product name)
    - description (string, product description)
    - price (number, product price)
    - category (string, product category)
    - image_url (string, URL for product image)

    Ensure the recommendations are appropriate for the user's apparent interests.
    Generate at least 5 product recommendations.
    ONLY respond with the JSON array, no explanations or other text.
  `;

  try {
    if (!model) throw new Error("Gemini model is not initialized");
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    // Extract JSON array from the response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return jsonMatch[0];
    }

    // If no JSON array was found, return the whole text
    return text;
  } catch (error) {
    console.error("Error generating personalized recommendations:", error);
    throw new Error(
      `Failed to generate recommendations: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Generate complementary product suggestions for a specific product
 */
export async function getComplementaryProducts(
  productId: number,
  productName: string,
  productCategory: string,
  limit: number = 5
): Promise<string> {
  const prompt = `
    I need complementary product suggestions for an e-commerce product.
    Product ID: ${productId}
    Product Name: ${productName}
    Category: ${productCategory}
    
    Based on this information, provide ${limit} products that would complement this item or are frequently bought together with it.
    Respond with a JSON array of product recommendations, where each object has these fields:
    - id (number, can be randomly assigned between 1-100)
    - name (string, product name)
    - description (string, product description)
    - price (number, product price)
    - category (string, product category)
    - image_url (string, URL for product image)

    Ensure the suggestions are genuinely complementary to the main product.
    ONLY respond with the JSON array, no explanations or other text.
  `;

  try {
    if (!model) throw new Error("Gemini model is not initialized");
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    // Extract JSON array from the response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return jsonMatch[0];
    }

    // If no JSON array was found, return the whole text
    return text;
  } catch (error) {
    console.error("Error generating complementary products:", error);
    throw new Error(
      `Failed to generate complementary products: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Get size recommendations based on product and user measurements
 */
export async function getSizeRecommendation(
  productId: number,
  productCategory: string,
  userMeasurements?: {
    height?: string;
    weight?: string;
    bust?: string;
    waist?: string;
    hips?: string;
    inseam?: string;
    shoeSize?: string;
  },
  previousPurchases?: Array<{
    productId: number;
    productName: string;
    size: string;
    fit: "too small" | "too large" | "just right";
  }>,
  availableSizes: string[] = []
): Promise<string> {
  let measurementsContext = "No user measurements provided.";
  if (userMeasurements && Object.keys(userMeasurements).length > 0) {
    measurementsContext = `
      User measurements:
      ${Object.entries(userMeasurements)
        .map(([key, value]) => `- ${key}: ${value}`)
        .join("\n")}
    `;
  }

  let purchaseContext = "No previous size information available.";
  if (previousPurchases && previousPurchases.length > 0) {
    purchaseContext = `
      User's previous size selections:
      ${previousPurchases
        .map(
          (item) =>
            `- ${item.productName}: Size ${item.size} (Fit was ${item.fit})`
        )
        .join("\n")}
    `;
  }

  const prompt = `
    I need to recommend the best size for a customer shopping for a product.
    Product ID: ${productId}
    Product Category: ${productCategory}
    Available Sizes: ${availableSizes.join(", ")}
    
    ${measurementsContext}
    ${purchaseContext}
    
    Based on this information, please provide:
    1. The recommended size from the available sizes
    2. An explanation of why this size would be best
    3. Any additional sizing advice for this specific product type
    
    Format your response as a JSON object with these fields:
    - recommendedSize (string): The best size for this customer
    - confidence (number between 0-1): How confident you are in this recommendation
    - explanation (string): Explanation for the recommendation
    - additionalAdvice (string): Any extra sizing tips
    
    ONLY respond with the JSON object, no additional text.
  `;

  try {
    if (!model) throw new Error("Gemini model is not initialized");
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    // Extract JSON object from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return jsonMatch[0];
    }

    // If no JSON object was found, return the whole text
    return text;
  } catch (error) {
    console.error("Error generating size recommendation:", error);
    throw new Error(
      `Failed to generate size recommendation: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Answer product-specific questions
 */
export async function answerProductQuestion(
  productId: number,
  productName: string,
  productDescription: string,
  productCategory: string,
  question: string
): Promise<string> {
  const prompt = `
    I need to answer a customer's question about a product.
    Product ID: ${productId}
    Product Name: ${productName}
    Product Description: ${productDescription}
    Product Category: ${productCategory}
    
    Customer Question: "${question}"
    
    Please provide a helpful, informative answer to the customer's question.
    If the answer cannot be directly inferred from the product information provided,
    give a reasonable response based on general knowledge about similar products.
    
    Format your response as a JSON object with these fields:
    - answer (string): Your response to the customer's question
    - confidence (number between 0-1): How confident you are in this answer
    - suggestionsForMoreInfo (array of strings): Additional details the customer might want to know
    
    ONLY respond with the JSON object, no additional text.
  `;

  try {
    if (!model) throw new Error("Gemini model is not initialized");
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    // Extract JSON object from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return jsonMatch[0];
    }

    // If no JSON object was found, return the whole text
    return text;
  } catch (error) {
    console.error("Error answering product question:", error);
    throw new Error(
      `Failed to answer product question: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
