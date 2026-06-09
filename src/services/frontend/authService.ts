import { apiClient } from '@/api/apiClient'
import type { LoginRequest } from '@/auth/types'
import { useUiStore } from '@/store/uiStore'

export const authService = {
  async login(credentials: LoginRequest) {
    const response = await apiClient.post('/api/auth/login', credentials)
    const { user, token } = response.data

    const { setSession } = useUiStore.getState()
    setSession(user, user.role, token)

    return user
  },

  logout() {
    const { resetSession } = useUiStore.getState()
    resetSession()
  },
}
