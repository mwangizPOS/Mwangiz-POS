import axios from 'axios'

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000',
  headers: {
    'Content-Type': 'application/json',
  },
})

export function setApiAuthToken(token: string | null) {
  if (token) {
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`
  } else {
    delete apiClient.defaults.headers.common['Authorization']
  }
}

// Add an interceptor to handle 401s if needed later
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Future: handle token refresh or redirect to login
      console.warn('Unauthorized access, token might be expired')
    }
    return Promise.reject(error)
  }
)
