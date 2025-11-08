import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  organizationId?: string;
  role: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Organization {
  id: string;
  name: string;
  subdomain: string;
  planTier: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  organizationName: string;
}

export interface AuthResponse {
  message: string;
  user: User;
  organization?: Organization;
}

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: process.env.REACT_APP_API_URL || 'http://localhost:4000/api',
      timeout: 30000,
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    this.api.interceptors.request.use(
      (config) => {
        // Token is handled via cookies, no need for Authorization header
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            await this.refreshAccessToken();
            return this.api(originalRequest);
          } catch (refreshError) {
            this.logout();
            window.location.href = '/login';
            return Promise.reject(refreshError);
          }
        }

        // Handle standardized error responses
        if (error.response?.data) {
          const errorData = error.response.data;
          if (errorData.success === false) {
            // Create a more descriptive error
            const apiError = new Error(errorData.message || errorData.error || 'API request failed');
            (apiError as any).response = error.response;
            return Promise.reject(apiError);
          }
        }

        return Promise.reject(error);
      }
    );
  }



  private clearStorageData() {
    localStorage.removeItem('user');
    localStorage.removeItem('organization');
  }

  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await this.post<AuthResponse>('/auth/login', credentials);
    // Tokens are handled via httpOnly cookies automatically
    // Just store user data for local state management
    localStorage.setItem('user', JSON.stringify(response.user));
    if (response.organization) {
      localStorage.setItem('organization', JSON.stringify(response.organization));
    }
    return response;
  }

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    const response = await this.post<AuthResponse>('/auth/signup', userData);
    // Tokens are handled via httpOnly cookies automatically
    // Just store user data for local state management
    localStorage.setItem('user', JSON.stringify(response.user));
    if (response.organization) {
      localStorage.setItem('organization', JSON.stringify(response.organization));
    }
    return response;
  }

  async refreshAccessToken(): Promise<void> {
    await this.post('/auth/refresh');
    // The backend uses cookies, so no need to handle tokens manually
  }

  async logout() {
    try {
      await this.post('/auth/logout');
    } catch (error) {
      console.warn('Logout request failed:', error);
    }
    this.clearStorageData();
  }

  async getCurrentUser(): Promise<{ user: User; organization?: any }> {
    const response = await this.get<{ user: User; organization?: any }>('/auth/me');
    return response;
  }

  isAuthenticated(): boolean {
    return !!this.getStoredUser();
  }

  getStoredUser(): User | null {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  getStoredOrganization(): Organization | null {
    const orgStr = localStorage.getItem('organization');
    return orgStr ? JSON.parse(orgStr) : null;
  }

  private async request<T>(config: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<ApiResponse<T>> = await this.api.request(config);
    
    // Handle standardized response format
    if (response.data.success) {
      return response.data.data as T;
    } else {
      // This shouldn't happen for successful HTTP status codes
      // but just in case the API returns success: false
      throw new Error(response.data.error || response.data.message || 'API request failed');
    }
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'GET', url });
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'POST', url, data });
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'PUT', url, data });
  }

  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'PATCH', url, data });
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'DELETE', url });
  }
}

export const apiService = new ApiService();
export default apiService;