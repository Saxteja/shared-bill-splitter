import { useCallback, useEffect, useRef, useState } from 'react'
import { api } from '../api/client'
import type { Home } from '../types'

interface HomesResponse {
  homes: Home[]
}

export function useHomes() {
  const [homes, setHomes] = useState<Home[]>([])
  const [isLoading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const requestNumber = useRef(0)
  const activeController = useRef<AbortController | null>(null)

  const load = useCallback(async () => {
    const request = ++requestNumber.current
    activeController.current?.abort()
    const controller = new AbortController()
    activeController.current = controller
    setLoading(true)
    setError(null)

    try {
      const response = await api.get<HomesResponse>('/api/homes', { signal: controller.signal })
      if (request === requestNumber.current) setHomes(response.homes)
    } catch (caught: unknown) {
      if (!controller.signal.aborted && request === requestNumber.current) {
        setError(caught instanceof Error ? caught.message : 'Unable to load households.')
      }
    } finally {
      if (request === requestNumber.current) {
        activeController.current = null
        setLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    void load()
    return () => {
      requestNumber.current += 1
      activeController.current?.abort()
      activeController.current = null
    }
  }, [load])

  return { homes, isLoading, error, reload: load }
}
