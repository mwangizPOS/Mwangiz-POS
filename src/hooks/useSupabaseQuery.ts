import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/api/supabaseClient'

type QueryStatus = 'idle' | 'loading' | 'success' | 'error' | 'offline-fallback'

export function useSupabaseQuery<T>(
  cacheKey: string,
  queryFn: () => PromiseLike<{ data: T | null; error: any }>,
  dependencies: any[] = []
) {
  const [data, setData] = useState<T | null>(() => {
    // Attempt initial load from cache
    try {
      const cached = localStorage.getItem(`sb_cache_${cacheKey}`)
      return cached ? JSON.parse(cached) : null
    } catch {
      return null
    }
  })
  const [error, setError] = useState<any>(null)
  const [status, setStatus] = useState<QueryStatus>('idle')

  const execute = useCallback(async () => {
    setStatus('loading')
    setError(null)
    try {
      const { data: result, error: fetchError } = await queryFn()
      
      // Treat network errors as offline
      if (fetchError && fetchError.message === 'Failed to fetch') {
        throw fetchError
      } else if (fetchError) {
        throw fetchError
      }
      
      setData(result)
      setStatus('success')
      
      // Update cache
      if (result !== null) {
        try {
          localStorage.setItem(`sb_cache_${cacheKey}`, JSON.stringify(result))
        } catch (e) {
          console.warn('Failed to cache Supabase query', e)
        }
      }
    } catch (err: any) {
      console.warn('Supabase query error, attempting fallback:', err)
      setError(err)
      
      // If we have cached data, we just stay with it but mark as fallback
      const cached = localStorage.getItem(`sb_cache_${cacheKey}`)
      if (cached) {
        try {
          setData(JSON.parse(cached))
          setStatus('offline-fallback')
        } catch {
          setStatus('error')
        }
      } else {
        // Fallback to empty safe state. We just leave data as it was (null)
        setData([] as any) // Safe empty array cast for generic lists
        setStatus('offline-fallback')
      }
    }
  }, [cacheKey, queryFn])

  useEffect(() => {
    execute()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies)

  return { data, error, isLoading: status === 'loading', status, refetch: execute }
}

export function useSupabaseRealtime(
  table: string,
  onUpdate: () => void,
  filter?: string
) {
  useEffect(() => {
    let channel = supabase.channel(`public:${table}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table, filter },
        () => {
          onUpdate()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [table, filter, onUpdate])
}
