import { useMutation } from '@tanstack/react-query'
import { checkIdDuplicate, checkEmailDuplicate } from '@/api/auth'

export function useCheckIdDuplicate(options = {}) {
  return useMutation({
    mutationFn: checkIdDuplicate,
    ...options,
  })
}

export function useCheckEmailDuplicate(options = {}) {
  return useMutation({
    mutationFn: checkEmailDuplicate,
    ...options,
  })
}
