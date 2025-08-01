import AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

// AWS configuration
const AWS_ACCESS_KEY = process.env.AWS_ACCESS_KEY || '';
const AWS_SECRET_KEY = process.env.AWS_SECRET_KEY || '';
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
const AWS_BUCKET_NAME = process.env.AWS_BUCKET_NAME || '';

// Validate AWS configuration
if (!AWS_ACCESS_KEY || !AWS_SECRET_KEY || !AWS_BUCKET_NAME) {
  console.error('AWS Environment variables are missing:', {
    hasAccessKey: !!AWS_ACCESS_KEY,
    hasSecretKey: !!AWS_SECRET_KEY,
    hasBucketName: !!AWS_BUCKET_NAME,
    region: AWS_REGION
  });
}

console.log('S3 Configuration:', {
  hasAccessKey: !!AWS_ACCESS_KEY,
  hasSecretKey: !!AWS_SECRET_KEY,
  hasBucketName: !!AWS_BUCKET_NAME,
  region: AWS_REGION
});

// Test connection to AWS S3 on startup
async function testS3Connection() {
  try {
    console.log('Testing S3 connection...');
    const s3TestClient = new AWS.S3({
      accessKeyId: AWS_ACCESS_KEY,
      secretAccessKey: AWS_SECRET_KEY,
      region: AWS_REGION,
    });
    
    // List buckets to validate credentials
    const listBuckets = await s3TestClient.listBuckets().promise();
    console.log(`S3 Connection successful. Found ${listBuckets.Buckets?.length || 0} buckets.`);
    
    // Check if our bucket exists
    const bucketExists = listBuckets.Buckets?.some(bucket => bucket.Name === AWS_BUCKET_NAME);
    if (bucketExists) {
      console.log(`Bucket '${AWS_BUCKET_NAME}' exists and is accessible.`);
    } else {
      console.warn(`Bucket '${AWS_BUCKET_NAME}' was not found in the list of accessible buckets.`);
    }
    
    return true;
  } catch (error) {
    console.error('Failed to connect to AWS S3:', error);
    console.error('S3 uploads will likely fail. Please check your AWS credentials and network connection.');
    return false;
  }
}

// Run test on startup
testS3Connection();

// Initialize AWS S3
const s3 = new AWS.S3({
  accessKeyId: AWS_ACCESS_KEY,
  secretAccessKey: AWS_SECRET_KEY,
  region: AWS_REGION,
});

// Set up CORS for the bucket
async function configureBucketCORS() {
  try {
    const corsParams = {
      Bucket: AWS_BUCKET_NAME,
      CORSConfiguration: {
        CORSRules: [
          {
            AllowedHeaders: ['*'],
            AllowedMethods: ['GET', 'PUT', 'POST', 'DELETE', 'HEAD'],
            AllowedOrigins: ['*'], // For development, allow all origins
            ExposeHeaders: ['ETag'],
            MaxAgeSeconds: 3000
          }
        ]
      }
    };
    
    await s3.putBucketCors(corsParams).promise();
    console.log('S3 bucket CORS configured successfully');
  } catch (error) {
    console.error('Error configuring S3 bucket CORS:', error);
  }
}

// Configure CORS on startup
configureBucketCORS();

// Upload file to S3
export async function uploadFile(
  fileBuffer: Buffer,
  fileName: string,
  contentType: string
): Promise<string> {
  const fileKey = `${uuidv4()}-${fileName.replace(/[^\w\s.-]/g, '')}`; // Sanitize filename
  
  console.log(`S3 Upload - Starting upload for: ${fileKey}, Content Type: ${contentType}, Buffer Length: ${fileBuffer.length}`);
  console.log(`S3 Config: Bucket: ${AWS_BUCKET_NAME}, Region: ${AWS_REGION}`);
  
  const params = {
    Bucket: AWS_BUCKET_NAME,
    Key: fileKey,
    Body: fileBuffer,
    ContentType: contentType,
    // ACL removed due to 'AccessControlListNotSupported' error
    // AWS S3 buckets now use bucket policies instead of ACLs
  };

  try {
    console.log('S3 Upload - Initiating upload to S3...');
    const uploadResult = await s3.upload(params).promise();
    console.log(`S3 Upload - Success! URL: ${uploadResult.Location}`);
    
    if (!uploadResult.Location) {
      throw new Error('S3 upload succeeded but no location URL was returned');
    }
    
    return uploadResult.Location; // Return the URL of the uploaded file
  } catch (error) {
    console.error('Error uploading file to S3:', error);
    
    // Log more details about the error for troubleshooting
    if (error instanceof Error) {
      console.error(`Error name: ${error.name}, Message: ${error.message}`);
    }
    
    // Verify AWS credentials are set
    if (!AWS_ACCESS_KEY || !AWS_SECRET_KEY) {
      console.error('AWS credentials are missing. Please check environment variables.');
      throw new Error('AWS credentials are missing');
    }
    
    if (!AWS_BUCKET_NAME) {
      console.error('AWS_BUCKET_NAME is missing. Please check environment variables.');
      throw new Error('AWS bucket name is missing');
    }
    
    throw new Error('Failed to upload file to S3: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
}

// Delete file from S3
export async function deleteFile(fileUrl: string): Promise<void> {
  // Extract the key from the URL
  const fileKey = fileUrl.split('/').pop() || '';
  
  const params = {
    Bucket: AWS_BUCKET_NAME,
    Key: fileKey,
  };

  try {
    await s3.deleteObject(params).promise();
  } catch (error) {
    console.error('Error deleting file from S3:', error);
    throw new Error('Failed to delete file from S3');
  }
}

// Initialize S3 client for AWS SDK v3
const s3Client = new S3Client({
  region: AWS_REGION,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY,
    secretAccessKey: AWS_SECRET_KEY
  }
});

// Helper to check if an object exists in S3
async function checkIfObjectExists(bucket: string, key: string): Promise<boolean> {
  try {
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });
    
    await s3Client.send(command);
    return true;
  } catch (error: any) {
    if (error.name === 'NoSuchKey') {
      return false;
    }
    // For other errors, we'll assume the object might exist
    console.warn(`Error checking if object exists (${key}):`, error);
    return false;
  }
}

// Generate presigned URL for downloading files
export async function getPresignedDownloadUrl(fileUrl: string): Promise<string> {
  try {
    console.log("Generating download URL for file:", fileUrl);
    
    // Possible keys to try (in order of preference)
    const possibleKeys: string[] = [];
    
    if (fileUrl.includes('amazonaws.com')) {
      const urlObj = new URL(fileUrl);
      
      // 1. Full path after the bucket name or domain
      possibleKeys.push(urlObj.pathname.substring(1)); // Remove leading slash
      
      // 2. Extract components with UUID pattern (common in S3 uploads)
      const uuidPattern = /([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}[^\/]*)/i;
      const uuidMatch = fileUrl.match(uuidPattern);
      if (uuidMatch && uuidMatch[1]) {
        possibleKeys.push(uuidMatch[1]);
      }
      
      // 3. Get the last path segment (filename)
      const pathParts = urlObj.pathname.split('/').filter(Boolean);
      if (pathParts.length > 0) {
        possibleKeys.push(pathParts[pathParts.length - 1]);
      }
      
      // 4. Try extracting the key with various methods based on URL format
      if (urlObj.hostname.includes('s3.amazonaws.com')) {
        // Format: https://s3.amazonaws.com/bucket-name/key
        const pathParts = urlObj.pathname.split('/').filter(Boolean);
        if (pathParts.length > 1) {
          // Skip bucket name, use the rest
          possibleKeys.push(pathParts.slice(1).join('/'));
        }
      } else if (urlObj.hostname.includes('.s3.')) {
        // Format: https://bucket-name.s3.region.amazonaws.com/key
        possibleKeys.push(urlObj.pathname.substring(1));
      }
    } else {
      // For direct keys
      possibleKeys.push(fileUrl);
      
      // Also try extracting filename if it appears to be a path
      if (fileUrl.includes('/')) {
        possibleKeys.push(fileUrl.split('/').pop() || '');
      }
    }
    
    // Filter out empty keys and decode URL encoding
    // Use a temporary object to track uniqueness instead of Set to avoid ES2015 compatibility issues
    const uniqueKeysObj: {[key: string]: boolean} = {};
    possibleKeys.forEach(key => {
      if (key.trim() !== '') {
        uniqueKeysObj[key] = true;
      }
    });
    
    const uniqueKeys = Object.keys(uniqueKeysObj)
      .map(key => decodeURIComponent(key));
    
    console.log("Potential S3 keys to try:", uniqueKeys);
    
    // Try each possible key until one works
    let fileKey = '';
    for (const key of uniqueKeys) {
      const exists = await checkIfObjectExists(AWS_BUCKET_NAME, key);
      if (exists) {
        fileKey = key;
        console.log(`Found valid S3 key: ${fileKey}`);
        break;
      }
    }
    
    // If no key worked, use the first one as a fallback
    if (!fileKey && uniqueKeys.length > 0) {
      fileKey = uniqueKeys[0];
      console.log(`No key confirmed to exist. Using best guess: ${fileKey}`);
    }
    
    if (!fileKey) {
      throw new Error("Could not extract file key from URL");
    }
    
    // Create command to get the object
    const command = new GetObjectCommand({
      Bucket: AWS_BUCKET_NAME,
      Key: fileKey,
    });
    
    // Generate presigned URL (valid for 15 minutes)
    const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 900 });
    console.log("Generated presigned URL successfully");
    
    return presignedUrl;
  } catch (error) {
    console.error("Error generating presigned download URL:", error);
    throw new Error("Failed to generate download URL");
  }
}