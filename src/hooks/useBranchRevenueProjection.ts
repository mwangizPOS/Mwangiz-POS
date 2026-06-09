import { supabase } from '@/api/supabaseClient'
import { useSupabaseQuery } from './useSupabaseQuery'

export function useBranchRevenueProjection() {
  const { data, isLoading, error, refetch } = useSupabaseQuery('branch_revenue_projection', () =>
    supabase.from('branch_revenue_projection').select('*')
  )

  return {
    branchRevenues: (data as any[]) || [],
    isLoading,
    error,
    refetch
  }
}
