import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import { getSession } from 'next-auth/react';

// Define the base API URL from environment variables
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

// Create a custom axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Define interfaces for API types
interface LoginResponse {
  access_token: string;
  token_type: string;
  user_id: string;
}

interface UserProfile {
  id: number;
  email: string;
  is_active: boolean;
  is_admin: boolean;
  quota_minutes: number;
  created_at: string;
}

interface UserUpdateData {
  email?: string;
  password?: string;
}

interface FileMetadata {
  id: string;
  filename: string;
  size: number;
  duration_seconds: number;
  upload_date: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

interface TranscriptionData {
  id: string;
  file_id: string;
  text: string;
  timestamps: Record<string, string>;
  created_at: string;
  updated_at: string;
}

// Add a request interceptor to include authentication token
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // Get the session to access the token
    const session = await getSession();
    
    // If session exists and has a token, add it to the request headers
    if (session?.accessToken) {
      config.headers.set('Authorization', `Bearer ${session.accessToken}`);
    }
    
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Error handling utility
const handleApiError = (error: unknown): never => {
  if (axios.isAxiosError(error) && error.response) {
    // Extract detailed error message from API response
    const errorMessage = error.response.data.detail || 'An error occurred with the API request';
    throw new Error(errorMessage);
  }
  
  // For network errors or other issues
  if (error instanceof Error) {
    throw error;
  }
  
  throw new Error('Network error or server unavailable');
};

// Generic API request function with error handling
export const apiRequest = async <T>(
  method: string,
  url: string,
  data?: unknown,
  options?: AxiosRequestConfig
): Promise<T> => {
  try {
    const response = await apiClient({
      method,
      url,
      data,
      ...options,
    });
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

// API functions for specific endpoints
export const api = {
  // Auth endpoints
  auth: {
    login: (email: string, password: string): Promise<LoginResponse> =>
      apiRequest('post', '/auth/login', { username: email, password }),
    register: (email: string, password: string): Promise<UserProfile> =>
      apiRequest('post', '/auth/register', { email, password }),
    me: (): Promise<UserProfile> => apiRequest('get', '/auth/me'),
  },
  
  // User endpoints
  users: {
    getProfile: (): Promise<UserProfile> => apiRequest('get', '/users/me'),
    updateProfile: (data: UserUpdateData): Promise<UserProfile> =>
      apiRequest('put', '/users/me', data),
  },
  
  // File endpoints
  files: {
    getAll: (): Promise<FileMetadata[]> => apiRequest('get', '/files'),
    getById: (id: string): Promise<FileMetadata> => apiRequest('get', `/files/${id}`),
    upload: (formData: FormData): Promise<FileMetadata> =>
      apiRequest('post', '/files', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }),
    delete: (id: string): Promise<void> => apiRequest('delete', `/files/${id}`),
  },
  
  // Transcription endpoints
  transcriptions: {
    create: (fileId: string): Promise<TranscriptionData> => 
      apiRequest('post', '/transcriptions', { file_id: fileId }),
    getById: (id: string): Promise<TranscriptionData> => 
      apiRequest('get', `/transcriptions/${id}`),
    getAll: (): Promise<TranscriptionData[]> => 
      apiRequest('get', '/transcriptions'),
    updateText: (id: string, text: string): Promise<TranscriptionData> =>
      apiRequest('put', `/transcriptions/${id}/text`, { transcript_text: text }),
    export: (id: string, format: string): Promise<Blob> =>
      apiRequest('get', `/transcriptions/${id}/export?format=${format}`, null, {
        responseType: 'blob',
      }),
  },
};

export default api;
