import { Client } from 'minio';

const minioEndpoint = process.env.MINIO_ENDPOINT || 'http://localhost:9000';
const endpointParts = minioEndpoint.replace(/^https?:\/\//, '').split(':');
const endPoint = endpointParts[0];
const port = parseInt(endpointParts[1] || '9000');

const minioClient = new Client({
  endPoint,
  port,
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY || 'fuelogistics',
  secretKey: process.env.MINIO_SECRET_KEY || 'fuelogistics123',
});

export const BUCKET_NAME = process.env.MINIO_BUCKET || 'fuelogistics-files';

export async function initializeMinio() {
  try {
    // Check if bucket exists
    const bucketExists = await minioClient.bucketExists(BUCKET_NAME);
    
    if (!bucketExists) {
      // Create bucket
      await minioClient.makeBucket(BUCKET_NAME);
      console.log(`MinIO bucket "${BUCKET_NAME}" created successfully`);
      
      // Set bucket policy to public read
      const policy = {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: { AWS: ['*'] },
            Action: ['s3:GetObject'],
            Resource: [`arn:aws:s3:::${BUCKET_NAME}/*`],
          },
        ],
      };
      
      await minioClient.setBucketPolicy(BUCKET_NAME, JSON.stringify(policy));
      console.log(`MinIO bucket "${BUCKET_NAME}" policy set to public read`);
    } else {
      console.log(`MinIO bucket "${BUCKET_NAME}" already exists`);
    }
    
    return true;
  } catch (error) {
    console.error('Error initializing MinIO:', error);
    return false;
  }
}

export async function uploadFile(fileName: string, fileBuffer: Buffer, contentType: string) {
  try {
    // Add timestamp to filename to avoid conflicts
    const timestamp = Date.now();
    const uniqueFileName = `${timestamp}-${fileName}`;
    
    await minioClient.putObject(BUCKET_NAME, uniqueFileName, fileBuffer, {
      'Content-Type': contentType,
    });
    
    // Return the public URL
    const publicUrl = `${minioEndpoint}/${BUCKET_NAME}/${uniqueFileName}`;
    
    return {
      fileName: uniqueFileName,
      originalName: fileName,
      url: publicUrl,
    };
  } catch (error) {
    console.error('Error uploading file to MinIO:', error);
    throw error;
  }
}

export async function deleteFile(fileName: string) {
  try {
    await minioClient.removeObject(BUCKET_NAME, fileName);
    console.log(`File "${fileName}" deleted from MinIO`);
    return true;
  } catch (error) {
    console.error('Error deleting file from MinIO:', error);
    throw error;
  }
}

export async function getFileUrl(fileName: string) {
  try {
    // For public buckets, we can return the direct URL
    const publicUrl = `${minioEndpoint}/${BUCKET_NAME}/${fileName}`;
    return publicUrl;
  } catch (error) {
    console.error('Error getting file URL:', error);
    throw error;
  }
}

export { minioClient };