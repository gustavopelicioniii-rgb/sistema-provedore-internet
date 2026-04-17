import axios from 'axios';

// URL base da API - usa variável de ambiente ou localhost em desenvolvimento
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar token de auth
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para tratar erros
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado ou inválido
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/api/auth/login', { email, password }),
  
  register: (data: {
    email: string;
    password: string;
    fullName: string;
    organizationName: string;
    organizationSlug: string;
  }) => api.post('/api/auth/register', data),
  
  getProfile: () => api.get('/api/auth/profile'),
};

// Dashboard
export const dashboardApi = {
  get: () => api.get('/api/dashboard'),
};

// Clients
export const clientsApi = {
  getAll: (params?: { status?: string; search?: string }) =>
    api.get('/api/clients', { params }),
  
  getById: (id: string) => api.get(`/api/clients/${id}`),
  
  create: (data: any) => api.post('/api/clients', data),
  
  update: (id: string, data: any) => api.put(`/api/clients/${id}`, data),
  
  delete: (id: string) => api.delete(`/api/clients/${id}`),
};

// Plans
export const plansApi = {
  getAll: () => api.get('/api/plans'),
  
  getById: (id: string) => api.get(`/api/plans/${id}`),
  
  create: (data: any) => api.post('/api/plans', data),
  
  update: (id: string, data: any) => api.put(`/api/plans/${id}`, data),
  
  delete: (id: string) => api.delete(`/api/plans/${id}`),
};

// Invoices
export const invoicesApi = {
  getAll: (params?: { status?: string; clientId?: string; month?: string }) =>
    api.get('/api/invoices', { params }),
  
  getById: (id: string) => api.get(`/api/invoices/${id}`),
  
  create: (data: any) => api.post('/api/invoices', data),
  
  update: (id: string, data: any) => api.put(`/api/invoices/${id}`, data),
  
  markPaid: (id: string, data?: { paidAmount?: number; paymentMethod?: string }) =>
    api.post(`/api/invoices/${id}/pay`, data),
  
  generate: (referenceMonth: string) =>
    api.post('/api/invoices/generate', { referenceMonth }),
  
  getStats: (month?: string) => api.get('/api/invoices/stats', { params: { month } }),
};

// Contracts
export const contractsApi = {
  getAll: (params?: { clientId?: string; status?: string }) =>
    api.get('/api/contracts', { params }),
  
  getById: (id: string) => api.get(`/api/contracts/${id}`),
  
  create: (data: any) => api.post('/api/contracts', data),
  
  update: (id: string, data: any) => api.put(`/api/contracts/${id}`, data),
  
  delete: (id: string) => api.delete(`/api/contracts/${id}`),
};

// Tickets
export const ticketsApi = {
  getAll: (params?: { status?: string; priority?: string; clientId?: string }) =>
    api.get('/api/tickets', { params }),
  
  getById: (id: string) => api.get(`/api/tickets/${id}`),
  
  create: (data: any) => api.post('/api/tickets', data),
  
  update: (id: string, data: any) => api.put(`/api/tickets/${id}`, data),
  
  delete: (id: string) => api.delete(`/api/tickets/${id}`),
};

// Service Orders
export const serviceOrdersApi = {
  getAll: (params?: { status?: string; clientId?: string }) =>
    api.get('/api/service-orders', { params }),
  
  getById: (id: string) => api.get(`/api/service-orders/${id}`),
  
  create: (data: any) => api.post('/api/service-orders', data),
  
  update: (id: string, data: any) => api.put(`/api/service-orders/${id}`, data),
  
  delete: (id: string) => api.delete(`/api/service-orders/${id}`),
};

// Leads
export const leadsApi = {
  getAll: (params?: { stage?: string; pipeline?: string }) =>
    api.get('/api/leads', { params }),
  
  getById: (id: string) => api.get(`/api/leads/${id}`),
  
  create: (data: any) => api.post('/api/leads', data),
  
  update: (id: string, data: any) => api.put(`/api/leads/${id}`, data),
  
  delete: (id: string) => api.delete(`/api/leads/${id}`),
};

// Equipment
export const equipmentApi = {
  getAll: (params?: { type?: string; status?: string }) =>
    api.get('/api/equipment', { params }),
  
  getById: (id: string) => api.get(`/api/equipment/${id}`),
  
  create: (data: any) => api.post('/api/equipment', data),
  
  update: (id: string, data: any) => api.put(`/api/equipment/${id}`, data),
  
  delete: (id: string) => api.delete(`/api/equipment/${id}`),
  
  test: (id: string) => api.post(`/api/equipment/${id}/test`),
  
  getStatus: (id: string) => api.get(`/api/equipment/${id}/status`),
};

export default api;
