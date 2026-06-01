import axios from 'axios'
import toast from 'react-hot-toast'
import { useStore } from '@/store/useStore'

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000',
  timeout: 20000,
})

api.interceptors.request.use((config) => {
  const token = useStore.getState().auth?.accessToken
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error?.response?.data?.detail || error?.message || 'Request failed'
    if (error?.response?.status === 401) {
      useStore.getState().clearAuth()
    }
    toast.error(String(message))
    return Promise.reject(error)
  },
)

export const healthcareApi = {
  register: (payload) => api.post('/register', payload),
  login: (payload) => api.post('/login', payload),
  forgotPassword: (payload) => api.post('/forgot-password', payload),
  resetPassword: (payload) => api.post('/reset-password', payload),
  analyzeClaim: (payload) => api.post('/analyze', payload),
  predictClaim: (payload) => api.post('/predict', payload),
  batchAnalyze: (payload) => api.post('/batch-analyze', payload),
  uploadCsv: (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/upload-csv', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  },
  getAnalytics: () => api.get('/analytics'),
  getHistory: () => api.get('/history'),
  getModelMetrics: () => api.get('/model-metrics'),
  getAlerts: (params) => api.get('/api/alerts', { params }),
  getAlert: (id) => api.get(`/api/alerts/${id}`),
  updateAlertStatus: (id, status) => api.patch(`/api/alerts/${id}/status`, { status }),
  addAlertNote: (id, text) => api.post(`/api/alerts/${id}/notes`, { text }),
  createAlert: (payload) => api.post('/api/alerts', payload),
  deleteAlert: (id) => api.delete(`/api/alerts/${id}`),
  getCases: (params) => api.get('/api/cases', { params }),
  getCase: (id) => api.get(`/api/cases/${id}`),
  createCase: (payload) => api.post('/api/cases', payload),
  updateCaseStatus: (id, status, description) => api.patch(`/api/cases/${id}/status`, { status, description }),
  updateCaseAssignment: (id, assigned_to, priority) => api.patch(`/api/cases/${id}/assignment`, { assigned_to, priority }),
  addCaseNote: (id, text) => api.post(`/api/cases/${id}/notes`, { text }),
  getCaseTimeline: (id) => api.get(`/api/cases/${id}/timeline`),
  deleteCase: (id) => api.delete(`/api/cases/${id}`),
  getProviders: (params) => api.get('/api/providers', { params }),
  getProviderDetail: (id) => api.get(`/api/providers/${id}`),
  getProviderMetrics: () => api.get('/api/providers/metrics'),
  getProviderTrends: () => api.get('/api/providers/trends'),
  updateProviderWatchlist: (id, watchlist) => api.patch(`/api/providers/${id}/watchlist`, { watchlist }),
  updateProviderFlag: (id, flag) => api.patch(`/api/providers/${id}/flag`, { flag }),
  compareProviders: (names) => api.post('/api/providers/compare', { names }),
}

export default api
