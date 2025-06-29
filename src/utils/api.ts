// API utility functions for future backend integration
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ApiConfig {
  baseUrl: string;
  timeout: number;
  retries: number;
}

class ApiClient {
  private config: ApiConfig;
  private authToken: string | null = null;

  constructor(config: ApiConfig) {
    this.config = config;
  }

  setAuthToken(token: string) {
    this.authToken = token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.config.baseUrl}${endpoint}`;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.authToken) {
      headers.Authorization = `Bearer ${this.authToken}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error) {
        return { success: false, error: error.message };
      }
      
      return { success: false, error: 'Unknown error occurred' };
    }
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  async uploadFile<T>(endpoint: string, file: File): Promise<ApiResponse<T>> {
    const formData = new FormData();
    formData.append('file', file);

    const headers: HeadersInit = {};
    if (this.authToken) {
      headers.Authorization = `Bearer ${this.authToken}`;
    }

    return this.request<T>(endpoint, {
      method: 'POST',
      body: formData,
      headers,
    });
  }
}

// Default API client configuration
export const apiClient = new ApiClient({
  baseUrl: process.env.VITE_API_BASE_URL || 'http://localhost:3001/api',
  timeout: 30000,
  retries: 3,
});

// API endpoints
export const endpoints = {
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    refresh: '/auth/refresh',
    logout: '/auth/logout',
  },
  licenses: {
    list: '/licenses',
    create: '/licenses',
    update: (id: string) => `/licenses/${id}`,
    delete: (id: string) => `/licenses/${id}`,
    upload: '/licenses/upload',
  },
  sharing: {
    create: '/sharing/create',
    access: (token: string) => `/sharing/${token}`,
    revoke: (id: string) => `/sharing/${id}/revoke`,
  },
  ocr: {
    process: '/ocr/process',
  },
  analytics: {
    dashboard: '/analytics/dashboard',
    export: '/analytics/export',
  },
};

// Utility functions for common API operations
export const authApi = {
  login: (credentials: { email: string; password: string }) =>
    apiClient.post(endpoints.auth.login, credentials),
  
  register: (userData: any) =>
    apiClient.post(endpoints.auth.register, userData),
  
  logout: () =>
    apiClient.post(endpoints.auth.logout, {}),
};

export const licenseApi = {
  getAll: () =>
    apiClient.get(endpoints.licenses.list),
  
  create: (licenseData: any) =>
    apiClient.post(endpoints.licenses.create, licenseData),
  
  update: (id: string, licenseData: any) =>
    apiClient.put(endpoints.licenses.update(id), licenseData),
  
  delete: (id: string) =>
    apiClient.delete(endpoints.licenses.delete(id)),
  
  uploadImage: (file: File) =>
    apiClient.uploadFile(endpoints.licenses.upload, file),
};

export const sharingApi = {
  createLink: (licenseId: string, options: any) =>
    apiClient.post(endpoints.sharing.create, { licenseId, ...options }),
  
  accessSharedLicense: (token: string) =>
    apiClient.get(endpoints.sharing.access(token)),
  
  revokeLink: (id: string) =>
    apiClient.delete(endpoints.sharing.revoke(id)),
};

export const ocrApi = {
  processImage: (file: File) =>
    apiClient.uploadFile(endpoints.ocr.process, file),
};