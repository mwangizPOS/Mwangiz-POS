import { supabase } from '@/api/supabaseClient'
import { useSupabaseQuery } from './useSupabaseQuery'

export function useReferenceData() {
  const { data: services, isLoading: loadingServices, error: servicesError } = useSupabaseQuery('services', () =>
    supabase.from('services').select('*').order('name')
  )

  const { data: workers, isLoading: loadingWorkers, error: workersError } = useSupabaseQuery('workers', () =>
    supabase.from('workers').select('*').order('full_name')
  )

  const { data: branches, isLoading: loadingBranches, error: branchesError } = useSupabaseQuery('branches', () =>
    supabase.from('branches').select('*').order('name')
  )

  return {
    services: (services as any[]) || [],
    workers: (workers as any[]) || [],
    branches: (branches as any[]) || [],
    isLoading: loadingServices || loadingWorkers || loadingBranches,
    error: servicesError || workersError || branchesError
  }
}
