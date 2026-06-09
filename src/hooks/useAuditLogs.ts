import { supabase } from '@/api/supabaseClient'
import { useSupabaseQuery } from './useSupabaseQuery'

export function useAuditLogs() {
  const { data, isLoading, error, refetch } = useSupabaseQuery('audit_logs', () =>
    supabase.from('audit_logs').select(`
      *,
      performed_by_user:users!performed_by (
        email
      ),
      branch:branches!branch_id (
        name
      )
    `).order('timestamp', { ascending: false })
  )

  return {
    logs: (data as any[]) || [],
    isLoading,
    error,
    refetch
  }
}
