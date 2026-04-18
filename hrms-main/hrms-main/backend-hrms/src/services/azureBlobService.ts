import { BlobServiceClient, StorageSharedKeyCredential, BlobSASPermissions, generateBlobSASQueryParameters } from '@azure/storage-blob';
import path from 'path';

const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING || '';
const containerName = process.env.AZURE_CONTAINER_NAME || process.env.AZURE_STORAGE_CONTAINER_NAME || 'tmsfiles';
const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME || 'tmsstorage';
const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY || '';

let blobServiceClient: BlobServiceClient;
if (connectionString) {
  blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
} else {
  console.warn('Azure Blob Storage connection string is missing in environment variables.');
}

/**
 * Upload a buffer to Azure Blob Storage
 * @param buffer The file buffer
 * @param originalName Original filename
 * @param folderPrefix Folder path (e.g., 'photos/', 'pdfs/')
 * @param mimeType Optional mime type
 * @returns The uploaded blob name (its path within the container)
 */
export const uploadBufferToBlob = async (
  buffer: Buffer,
  originalName: string,
  folderPrefix: string = '',
  mimeType: string = 'application/octet-stream'
): Promise<string> => {
  if (!blobServiceClient) throw new Error('Blob service not initialized. Check credentials.');

  // Clean folder prefix
  let cleanPrefix = folderPrefix.replace(/\\/g, '/');
  if (cleanPrefix && !cleanPrefix.endsWith('/')) cleanPrefix += '/';
  if (cleanPrefix.startsWith('/')) cleanPrefix = cleanPrefix.substring(1);

  const containerClient = blobServiceClient.getContainerClient(containerName);
  // Ensure container exists
  if (connectionString) {
      await containerClient.createIfNotExists();
  }

  const ext = path.extname(originalName);
  const name = path.basename(originalName, ext).replace(/[^a-zA-Z0-9]/g, '-');
  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
  
  const blobName = `${cleanPrefix}${name}-${uniqueSuffix}${ext}`;
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);

  await blockBlobClient.uploadData(buffer, {
    blobHTTPHeaders: { blobContentType: mimeType }
  });

  return blobName;
};

/**
 * Delete a blob from Azure
 */
export const deleteBlob = async (blobName: string): Promise<void> => {
  if (!blobServiceClient || !blobName) return;
  
  // Clean blob name by removing leading slashes if any
  const cleanBlobName = blobName.startsWith('/') ? blobName.substring(1) : blobName;
  
  try {
    const containerClient = blobServiceClient.getContainerClient(containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(cleanBlobName);
    await blockBlobClient.deleteIfExists();
  } catch (error) {
    console.error(`Failed to delete blob ${cleanBlobName}:`, error);
  }
};

/**
 * Generate a Public or SAS URL for a blob.
 * Returns standard URL if public, or SAS string if private.
 */
export const getBlobUrl = (blobName: string, isPrivate: boolean = false): string => {
  if (!blobServiceClient || !blobName) return '';
  
  const cleanBlobName = blobName.startsWith('/') ? blobName.substring(1) : blobName;
  const containerClient = blobServiceClient.getContainerClient(containerName);
  const blockBlobClient = containerClient.getBlockBlobClient(cleanBlobName);
  
  if (!isPrivate) {
    return blockBlobClient.url;
  }
  
  if (!accountName || !accountKey) {
     console.warn("Azure Storage Account Name and Key are required for SAS URL generation, falling back to public URL.");
     return blockBlobClient.url;
  }
  
  const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey);
  const expiresOn = new Date(new Date().valueOf() + 3600000); // 1 hour
  
  const sasToken = generateBlobSASQueryParameters({
      containerName,
      blobName: cleanBlobName,
      permissions: BlobSASPermissions.parse("r"),
      startsOn: new Date(),
      expiresOn,
  }, sharedKeyCredential).toString();
  
  return `${blockBlobClient.url}?${sasToken}`;
};

/**
 * Fetch a blob as a Buffer (for internal backend use)
 */
export const getBlobBuffer = async (blobName: string): Promise<Buffer> => {
  if (!blobServiceClient || !blobName) throw new Error('Blob service not initialized or invalid blob name');
  
  const cleanBlobName = blobName.startsWith('/') ? blobName.substring(1) : blobName;
  const containerClient = blobServiceClient.getContainerClient(containerName);
  const blockBlobClient = containerClient.getBlockBlobClient(cleanBlobName);
  
  const downloadResponse = await blockBlobClient.download(0);
  
  if (!downloadResponse.readableStreamBody) {
    throw new Error(`Failed to download blob ${cleanBlobName}`);
  }
  
  return await streamToBuffer(downloadResponse.readableStreamBody);
};

/**
 * Helper to convert readable stream to buffer
 */
async function streamToBuffer(readableStream: NodeJS.ReadableStream): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    readableStream.on("data", (data) => {
      chunks.push(data instanceof Buffer ? data : Buffer.from(data));
    });
    readableStream.on("end", () => {
      resolve(Buffer.concat(chunks));
    });
    readableStream.on("error", reject);
  });
}
