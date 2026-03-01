import axios from 'axios';
import type {
  Property,
  Inquiry,
  User,
  CalendarEvent,
  ActivityLog,
  LoginCredentials,
  LoginResponse,
  NewAgent,
  DatabaseOverview,
  FileMetadata
} from '../types';
import { getToken, clearSession } from '../utils/session';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add JWT token
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Note: Removed automatic session clearing and redirect on 401 errors
    // to prevent premature "session expired" messages
    // Components will handle authentication errors as needed
    return Promise.reject(error);
  }
);

// Pagination response type
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalRecords: number;
    hasNext: boolean;
    hasPrev: boolean;
    limit: number;
  };
}

// Properties API
export const propertiesAPI = {
  // Backward compatible - returns all items
  getAll: () => api.get<Property[]>('/properties', { params: { limit: 1000 } }).then(res => {
    // Handle both paginated and non-paginated responses
    if (res.data && typeof res.data === 'object' && 'data' in res.data) {
      const paginatedData = res.data as unknown as PaginatedResponse<Property>;
      return { ...res, data: paginatedData.data };
    }
    return res;
  }),
  // Paginated version
  getAllPaginated: (page?: number, limit?: number) => 
    api.get<PaginatedResponse<Property>>('/properties', { params: { page, limit } }),
  getById: (id: string) => api.get<Property>(`/properties/${id}`),
  create: (property: Partial<Property>) => api.post<Property>('/properties', property),
  createDraft: (property: Partial<Property>) => api.post<Property>('/properties/draft', property),
  update: (id: string, property: Partial<Property>) => api.put<Property>(`/properties/${id}`, property),
  delete: (id: string) => api.delete(`/properties/${id}`),
  uploadImages: (formData: FormData) => 
    api.post<{ imageUrls: string[] }>('/properties/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
};

// Inquiries API
export const inquiriesAPI = {
  // Backward compatible - returns all items
  getAll: () => api.get<Inquiry[]>('/inquiries', { params: { limit: 1000 } }).then(res => {
    if (res.data && typeof res.data === 'object' && 'data' in res.data) {
      return { ...res, data: (res.data as any).data };
    }
    return res;
  }),
  // Paginated version
  getAllPaginated: (page?: number, limit?: number) => 
    api.get<PaginatedResponse<Inquiry>>('/inquiries', { params: { page, limit } }),
  getById: (id: string) => api.get<Inquiry>(`/inquiries/${id}`),
  create: (inquiry: Partial<Inquiry>) => api.post<Inquiry>('/inquiries', inquiry),
  update: (id: string, inquiry: Partial<Inquiry>) => api.put<Inquiry>(`/inquiries/${id}`, inquiry),
  delete: (id: string) => api.delete(`/inquiries/${id}`),
  claim: (id: string) => api.post<Inquiry>(`/inquiries/${id}/claim`, {}),
  assign: (id: string, agentId: string, agentName: string) =>
    api.post<Inquiry>(`/inquiries/${id}/assign`, { agentId, agentName }),
  getAgentWorkload: () =>
    api.get<Array<{
      agentId: string;
      agentName: string;
      activeInquiries: number;
      totalInquiries: number;
      successfulInquiries: number;
    }>>('/inquiries/agents/workload'),
};

// Users API
export const usersAPI = {
  // Backward compatible - returns all items
  getAll: () => api.get<User[]>('/users', { params: { limit: 1000 } }).then(res => {
    if (res.data && typeof res.data === 'object' && 'data' in res.data) {
      return { ...res, data: (res.data as any).data };
    }
    return res;
  }),
  // Paginated version
  getAllPaginated: (page?: number, limit?: number) => 
    api.get<PaginatedResponse<User>>('/users', { params: { page, limit } }),
  getAgents: () => api.get<User[]>('/users/agents', { params: { limit: 1000 } }).then(res => {
    if (res.data && typeof res.data === 'object' && 'data' in res.data) {
      const paginatedData = res.data as unknown as PaginatedResponse<User>;
      return { ...res, data: paginatedData.data };
    }
    return res;
  }),
  // Paginated version
  getAgentsPaginated: (page?: number, limit?: number) => 
    api.get<PaginatedResponse<User>>('/users/agents', { params: { page, limit } }),
  create: (agent: NewAgent) => api.post<User>('/users', agent),
  delete: (id: string) => api.delete(`/users/${id}`),
};

// Calendar API
export const calendarAPI = {
  // Backward compatible - returns all items
  getAll: (params?: Record<string, string | number | boolean>) => api.get<CalendarEvent[]>('/calendar', { params: { limit: 1000, ...(params || {}) } }).then(res => {
    if (res.data && typeof res.data === 'object' && 'data' in res.data) {
      const paginatedData = res.data as unknown as PaginatedResponse<CalendarEvent>;
      return { ...res, data: paginatedData.data };
    }
    return res;
  }),
  // Paginated version
  getAllPaginated: (page?: number, limit?: number) => 
    api.get<PaginatedResponse<CalendarEvent>>('/calendar', { params: { page, limit } }),
  getByAgent: (agentId: string) => api.get<CalendarEvent[]>(`/calendar/agent/${agentId}`),
  create: (event: Partial<CalendarEvent>) => api.post<CalendarEvent>('/calendar', event),
  update: (id: string, event: Partial<CalendarEvent>) => api.put<CalendarEvent>(`/calendar/${id}`, event),
  delete: (id: string) => api.delete(`/calendar/${id}`),
};

// Auth API
export const authAPI = {
  login: (credentials: LoginCredentials) => api.post<LoginResponse>('/login', credentials),
};

// Activity Log API
export const activityLogAPI = {
  // Backward compatible
  getAll: (page?: number, limit?: number) => 
    api.get<{ logs: ActivityLog[]; total: number; page: number; totalPages: number }>(
      '/activity-log',
      { params: { page, limit } }
    ).then(res => {
      // Handle paginated response format
      if (res.data && typeof res.data === 'object' && 'data' in res.data) {
        const paginatedData = res.data as unknown as PaginatedResponse<ActivityLog>;
        return {
          ...res,
          data: {
            logs: paginatedData.data,
            total: paginatedData.pagination.totalRecords,
            page: paginatedData.pagination.currentPage,
            totalPages: paginatedData.pagination.totalPages
          }
        };
      }
      return res;
    }),
  // Paginated version
  getAllPaginated: (page?: number, limit?: number) => 
    api.get<PaginatedResponse<ActivityLog>>('/activity-log', { params: { page, limit } }),
};

// Database API
export const databaseAPI = {
  getOverview: () => api.get<DatabaseOverview>('/database/overview'),
  getFileMetadata: (filename: string) => api.get<FileMetadata>(`/database/file-metadata/${filename}`),
  getFile: (filename: string) => api.get<Property[] | Inquiry[] | User[] | CalendarEvent[] | ActivityLog[]>(`/database/file/${filename}`),
  getRecent: (type: 'properties' | 'inquiries' | 'agents') => api.get<Property[] | Inquiry[] | User[]>(`/database/recent/${type}`),
  clearNew: (type: 'properties' | 'inquiries' | 'agents', clearedBy: string) => 
    api.post(`/database/clear-new/${type}`, { clearedBy }),
  exportCSV: (filename: string) => api.get(`/database/export/${filename}/csv`, { responseType: 'blob' }),
  exportJSON: (filename: string) => api.get(`/database/export/${filename}/json`, { responseType: 'blob' }),
};

export default api;
