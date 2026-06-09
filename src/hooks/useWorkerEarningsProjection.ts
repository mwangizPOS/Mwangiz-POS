import { supabase } from '@/api/supabaseClient'
import { useSupabaseQuery } from './useSupabaseQuery'

export function useWorkerEarningsProjection() {
  const { data, isLoading, error, refetch } = useSupabaseQuery('worker_earnings_projection', () =>
    supabase.from('worker_earnings_projection').select('*')
  )

  return {
    earnings: (data as any[]) || [],
    isLoading,
    error,
    refetch
  }
}
