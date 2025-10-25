import { useMutation } from '@tanstack/react-query'
import { checkIdDuplicate, loginApi, signup } from '@/api/auth'
import { useAuthStore } from '@/stores/authStore'

export function useCheckIdDuplicate(options = {}) {
  return useMutation({
    mutationFn: checkIdDuplicate,
    ...options,
  })
}

export function useSignup(options = {}) {
  return useMutation({
    mutationFn: signup,
    ...options,
  })
}

export function useLogin(options = {}) {
  const { setTokens } = useAuthStore()

  return useMutation({
    mutationFn: loginApi,
    onSuccess: (data, variables, context) => {
      const { accessToken, refreshToken } = data
      setTokens({ accessToken, refreshToken })

      if (options.onSuccess) {
        options.onSuccess(data, variables, context)
      }
    },
    onError: (error, variables, context) => {
      if (options.onError) {
        options.onError(error, variables, context)
      }
    },
  })
}
