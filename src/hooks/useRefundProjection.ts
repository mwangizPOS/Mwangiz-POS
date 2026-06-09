import { supabase } from '@/api/supabaseClient'
import { useSupabaseQuery } from './useSupabaseQuery'

export function useRefundProjection() {
  const { data, isLoading, error, refetch } = useSupabaseQuery('refund_projection', () =>
    supabase.from('refund_projection').select('*, sales_projection(sale_id)')
  )

  return {
    refunds: data || [],
    isLoading,
    error,
    refetch
  }
}
