import { apiRequest } from './queryClient';

export interface MediaItem {
  id: number;
  filename: string;
  originalName: string;
  url: string;
  mimeType: string;
  size: number;
  alt?: string;
  tags?: string;
  createdAt: string;
  uploadedBy: number;
}

export interface MediaLibraryResponse {
  items: MediaItem[];
  total: number;
}

// Get media items with pagination and search
export async function getMediaItems(page: number = 1, limit: number = 20, search?: string) {
  let url = `/api/media?page=${page}&limit=${limit}`;
  
  if (search) {
    url += `&search=${encodeURIComponent(search)}`;
  }
  
  const response = await apiRequest('GET', url);
  const data: MediaLibraryResponse = await response.json();
  return data;
}

// Get a specific media item by ID
export async function getMediaItem(id: number) {
  const response = await apiRequest('GET', `/api/media/${id}`);
  const data: MediaItem = await response.json();
  return data;
}

// Upload a new media item or multiple items
export async function uploadMediaItem(formData: FormData) {
  const response = await apiRequest('POST', '/api/media', formData, {
    headers: {
      // Don't set Content-Type here - it will be set automatically with the boundary
    },
  });
  
  const data = await response.json();
  // Handle both single item and multiple items response formats
  if (data.items) {
    // Multiple files were uploaded
    return data;
  } else {
    // Single file was uploaded
    return data as MediaItem;
  }
}

// Delete a media item
export async function deleteMediaItem(id: number) {
  await apiRequest('DELETE', `/api/media/${id}`);
}

// Format file size for display
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Format date for display
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// Get file icon based on MIME type
export function getFileIcon(mimeType: string): string {
  if (mimeType.startsWith('image/')) {
    return 'image';
  } else if (mimeType.startsWith('video/')) {
    return 'video';
  } else if (mimeType.startsWith('audio/')) {
    return 'audio';
  } else if (mimeType.includes('pdf')) {
    return 'file-pdf';
  } else if (mimeType.includes('word') || mimeType.includes('document')) {
    return 'file-text';
  } else if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) {
    return 'file-spreadsheet';
  } else if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) {
    return 'file-presentation';
  } else {
    return 'file';
  }
}