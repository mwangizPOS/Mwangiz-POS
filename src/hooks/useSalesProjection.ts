import { supabase } from '@/api/supabaseClient'
import { useSupabaseQuery } from './useSupabaseQuery'

export function useSalesProjection() {
  const { data, isLoading, error, refetch } = useSupabaseQuery('sales_projection', () =>
    supabase.from('sales_projection').select('sale_id, status, total_amount, created_at, sale_items_projection(sale_item_id, amount)')
  )

  return {
    sales: (data as any[]) || [],
    isLoading,
    error,
    refetch
  }
}
