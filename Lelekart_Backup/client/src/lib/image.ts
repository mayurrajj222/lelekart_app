/**
 * Downloads an image from a URL and returns it as a Blob
 */
async function downloadImage(url: string): Promise<Blob> {
  console.log(`[Image Download] Starting download from URL: ${url}`);
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(
        `[Image Download] Failed with status: ${response.status} ${response.statusText}`
      );
      throw new Error(`Failed to download image: ${response.statusText}`);
    }
    const blob = await response.blob();
    console.log(
      `[Image Download] Successfully downloaded image. Size: ${blob.size} bytes, Type: ${blob.type}`
    );
    return blob;
  } catch (error) {
    console.error("[Image Download] Error downloading image:", error);
    throw new Error("Failed to download image");
  }
}

/**
 * Uploads a blob to AWS S3 via our API
 */
async function uploadToAWS(blob: Blob, originalUrl: string): Promise<string> {
  console.log(`[AWS Upload] Starting upload for image from: ${originalUrl}`);
  try {
    // Get filename from original URL
    const filename = originalUrl.split("/").pop() || "image.jpg";
    console.log(`[AWS Upload] Using filename: ${filename}`);

    // Create a File object from the Blob
    const file = new File([blob], filename, { type: blob.type });
    console.log(
      `[AWS Upload] Created File object. Size: ${file.size} bytes, Type: ${file.type}`
    );

    // Create FormData and append file
    const formData = new FormData();
    formData.append("file", file);
    console.log("[AWS Upload] Created FormData with file");

    // Upload to our API endpoint which handles S3 upload
    console.log("[AWS Upload] Sending request to /api/upload");
    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
      credentials: "include",
    });

    if (!response.ok) {
      console.error(
        `[AWS Upload] Failed with status: ${response.status} ${response.statusText}`
      );
      throw new Error(`Failed to upload to AWS: ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`[AWS Upload] Success! Received AWS URL: ${data.url}`);
    return data.url;
  } catch (error) {
    console.error("[AWS Upload] Error uploading to AWS:", error);
    throw new Error("Failed to upload image to AWS");
  }
}

/**
 * Processes an image URL by downloading it and uploading to AWS
 * Returns the AWS URL
 */
export async function processImageUrl(url: string): Promise<string> {
  console.log(`[Image Processing] Starting process for URL: ${url}`);
  try {
    // Download the image
    console.log("[Image Processing] Step 1: Downloading image");
    const blob = await downloadImage(url);

    // Upload to AWS
    console.log("[Image Processing] Step 2: Uploading to AWS");
    const awsUrl = await uploadToAWS(blob, url);

    console.log(
      `[Image Processing] Successfully processed image. AWS URL: ${awsUrl}`
    );
    return awsUrl;
  } catch (error) {
    console.error("[Image Processing] Error processing image URL:", error);
    throw error;
  }
}

/**
 * Processes multiple image URLs in parallel
 * Returns array of AWS URLs
 */
export async function processImageUrls(urls: string[]): Promise<string[]> {
  console.log(
    `[Batch Processing] Starting batch process for ${urls.length} URLs`
  );
  try {
    // Process all URLs in parallel
    console.log("[Batch Processing] Processing URLs in parallel");
    const awsUrls = await Promise.all(urls.map((url) => processImageUrl(url)));
    console.log(
      `[Batch Processing] Successfully processed ${awsUrls.length} images`
    );
    return awsUrls;
  } catch (error) {
    console.error(
      "[Batch Processing] Error processing multiple image URLs:",
      error
    );
    throw error;
  }
}
