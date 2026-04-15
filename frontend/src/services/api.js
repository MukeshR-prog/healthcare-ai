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
}

export default api
