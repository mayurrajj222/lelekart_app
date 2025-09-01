import { Request, Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { db } from '../db';
import { products } from '@shared/schema';
import { eq, sql } from 'drizzle-orm';

// Initialize Google Generative AI client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);

/**
 * Process a natural language search query and extract structured search parameters
 */
export async function handleAISearch(req: Request, res: Response) {
  try {
    console.log('AI Search handler received request:', req.body);
    
    const { query } = req.body;
    
    if (!query || typeof query !== 'string' || query.trim() === '') {
      console.error('Missing or invalid query parameter:', req.body);
      return res.status(400).json({ 
        success: false, 
        error: 'Missing or invalid query parameter' 
      });
    }
    
    // Sanitize the query to remove any problematic characters
    const sanitizedQuery = query.trim();
    
    console.log('Processing AI search query:', sanitizedQuery);
    
    // Get all available categories from the database for context
    const categories = await db.select({ name: products.category })
      .from(products)
      .groupBy(products.category);
    const availableCategories = categories.map(c => c.name);
    
    // Prompt for the AI model
    const prompt = `
You are a shopping assistant for an e-commerce platform called Lelekart. 
A user has provided a search query in natural language.
Your task is to extract structured search parameters from this query.

Available product categories: ${availableCategories.join(', ')}

User query: "${sanitizedQuery}"

Analyze this query and extract the following information:
1. The main product category they're looking for
2. Any price constraints (minimum and maximum price)
3. Color preferences
4. Size preferences
5. Brand preferences
6. Any sorting preferences (price low to high, high to low, newest, popularity)
7. Other relevant keywords for the search

Return your analysis as a valid JSON object with the following structure:
{
  "category": "string or null if not specified",
  "priceMin": number or null if not specified,
  "priceMax": number or null if not specified,
  "color": "string or null if not specified",
  "size": "string or null if not specified",
  "brand": "string or null if not specified",
  "sortBy": "price_asc", "price_desc", "newest", "popularity" or null if not specified,
  "keywords": ["array", "of", "relevant", "keywords"],
  "enhancedQuery": "An improved search query based on the user's intent"
}

IMPORTANT RULES:
- For single-word queries (e.g., "padded", "dress", "iphone"), use the exact word as the enhancedQuery value without adding additional terms.
- For queries with 1-2 words, keep the enhancedQuery the same as the original query.
- Only add additional terms to more complex, multi-word queries where clarification is helpful.
- Always include the original search term as the first keyword.

Only include fields that you can confidently extract from the query. If a field is not mentioned, set it to null.
Make sure the response is valid JSON.
`;
    
    // Get response from Gemini API
    // Store the response text from either primary or fallback model
    let text = '';
    
    // Try primary model first - gemini-1.5-pro
    try {
      const primaryModelName = "gemini-1.5-pro";
      const model = genAI.getGenerativeModel({ model: primaryModelName });
      console.log('Using primary Gemini model:', primaryModelName);
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      text = response.text();
      console.log('Successfully got response from primary model');
    } catch (modelError) {
      console.error('Error with primary model, trying fallback model:', modelError);
      
      try {
        // Fallback to alternative model if primary fails
        const fallbackModelName = "gemini-pro";
        const fallbackModel = genAI.getGenerativeModel({ model: fallbackModelName });
        console.log('Using fallback Gemini model:', fallbackModelName);
        
        const fallbackResult = await fallbackModel.generateContent(prompt);
        const fallbackResponse = await fallbackResult.response;
        text = fallbackResponse.text();
        console.log('Successfully got response from fallback model');
      } catch (fallbackError) {
        console.error('Both models failed:', fallbackError);
        throw new Error('Failed to get response from any AI model');
      }
    }
    
    // If we reach here without text, something went wrong
    if (!text) {
      throw new Error('No response received from AI models');
    }
    
    // Parse the JSON response
    let parsedResponse;
    try {
      console.log('Raw AI response text:', text);
      
      // Extract JSON if it's wrapped in markdown code blocks
      let jsonString;
      const jsonBlockMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/```\n([\s\S]*?)\n```/);
      
      if (jsonBlockMatch && jsonBlockMatch[1]) {
        // Extract content between code blocks
        jsonString = jsonBlockMatch[1];
      } else {
        // Try to find JSON object pattern
        const jsonObjectMatch = text.match(/{[\s\S]*?}/);
        jsonString = jsonObjectMatch ? jsonObjectMatch[0] : text;
      }
      
      console.log('Extracted JSON string:', jsonString);
      
      try {
        parsedResponse = JSON.parse(jsonString);
      } catch (parseError) {
        // If parsing fails, provide default values
        console.error('JSON parse error, using fallback:', parseError);
        parsedResponse = {
          category: null,
          priceMin: null,
          priceMax: null,
          color: null,
          size: null,
          brand: null,
          sortBy: null,
          keywords: sanitizedQuery.split(' ')
        };
      }
    } catch (error) {
      console.error('Error parsing AI response as JSON:', error);
      console.log('Raw AI response:', text);
      // Instead of failing, provide a default response
      parsedResponse = {
        category: null,
        priceMin: null,
        priceMax: null,
        color: null,
        size: null,
        brand: null,
        sortBy: null,
        keywords: sanitizedQuery.split(' ')
      };
    }
    
    // For single-word or two-word queries, force the enhancedQuery to be exactly the same as input
    const words = sanitizedQuery.trim().split(/\s+/);
    const enhancedQuery = words.length <= 2 
      ? sanitizedQuery 
      : (parsedResponse.enhancedQuery || sanitizedQuery);
    
    // Return the processed search parameters
    return res.json({
      success: true,
      query: sanitizedQuery,
      filters: {
        category: parsedResponse.category,
        priceMin: parsedResponse.priceMin,
        priceMax: parsedResponse.priceMax,
        color: parsedResponse.color,
        size: parsedResponse.size,
        brand: parsedResponse.brand,
        sortBy: parsedResponse.sortBy,
        keywords: parsedResponse.keywords || []
      },
      enhancedQuery: enhancedQuery,
    });
  } catch (error) {
    console.error('Error processing AI search:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to process search query' 
    });
  }
}