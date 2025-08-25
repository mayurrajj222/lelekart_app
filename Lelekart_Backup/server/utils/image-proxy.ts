import { Request, Response } from 'express';
import axios from 'axios';
import path from 'path';
import fs from 'fs';

export async function handleImageProxy(req: Request, res: Response) {
  const imageUrl = req.query.url as string;
  const category = req.query.category as string;
  
  if (!imageUrl) {
    return res.status(400).send('Missing url parameter');
  }
  
  try {
    // Validate URL
    const url = new URL(imageUrl);
    // Only allow specific domains
    if (!url.hostname.includes('flixcart.com') && 
        !url.hostname.includes('lelekart.com') &&
        !url.hostname.includes('flipkart.com')) {
      return res.status(403).send('Unauthorized domain');
    }
    
    try {
      // Fetch the image
      const response = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Referer': 'https://www.lelekart.com/'
        },
        timeout: 5000 // 5-second timeout
      });
      
      if (response.status === 200) {
        // Set the content type header and send the image data
        res.set('Content-Type', response.headers['content-type']);
        res.set('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
        return res.send(response.data);
      } else {
        // If we didn't get a successful response, use fallback
        throw new Error(`Invalid response status: ${response.status}`);
      }
    } catch (fetchError) {
      console.error('Failed to fetch image, using fallback:', fetchError);
      // Send fallback image based on category
      return sendFallbackImage(res, category);
    }
    
  } catch (error) {
    console.error('Image proxy error:', error);
    return sendFallbackImage(res, category);
  }
}

function sendFallbackImage(res: Response, category?: string) {
  try {
    // Default fallback image
    let imagePath = path.join(process.cwd(), 'client/public/images/placeholder.svg');
    
    // If category is provided, use category-specific fallback
    if (category) {
      const categoryLower = category.toLowerCase();
      const categoryImagePath = path.join(process.cwd(), `client/public/images/${categoryLower}.svg`);
      
      // Check if the category image exists
      if (fs.existsSync(categoryImagePath)) {
        imagePath = categoryImagePath;
      }
    }
    
    // Set appropriate content type
    res.set('Content-Type', 'image/svg+xml');
    res.set('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
    
    // Read and return the fallback image
    const imageData = fs.readFileSync(imagePath);
    return res.send(imageData);
  } catch (fallbackError) {
    console.error('Error sending fallback image:', fallbackError);
    return res.status(500).send('Error fetching image');
  }
}