import axios from 'axios'
import toast from 'react-hot-toast'

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000',
  timeout: 20000,
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error?.response?.data?.detail || error?.message || 'Request failed'
    toast.error(String(message))
    return Promise.reject(error)
  },
)

export const healthcareApi = {
  analyzeClaim: (payload) => api.post('/analyze', payload),
  batchAnalyze: (payload) => api.post('/batch-analyze', payload),
  getAnalytics: () => api.get('/analytics'),
}

export default api
