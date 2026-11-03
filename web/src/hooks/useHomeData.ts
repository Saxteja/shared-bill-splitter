import { useCallback, useEffect, useRef, useState } from 'react'
import { api } from '../api/client'
import type { Balance, Bill, Member } from '../types'

export interface HomeData {
  members: Member[]
  bills: Bill[]
  balances: Balance[]
}

interface HomeDataSnapshot {
  homeId: string
  data: HomeData
}

export const useHomeData = (homeId: string | undefined) => {
  const [snapshot, setSnapshot] = useState<HomeDataSnapshot | null>(null)
  const [isLoading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const requestNumber = useRef(0)
  const activeController = useRef<AbortController | null>(null)
  const requestedHomeId = useRef<string | undefined>(undefined)

  const load = useCallback(async (): Promise<HomeData | null> => {
    const currentRequest = ++requestNumber.current
    activeController.current?.abort()

    if (!homeId) {
      requestedHomeId.current = undefined
      setSnapshot(null)
      setError(null)
      setLoading(false)
      return null
    }

    const controller = new AbortController()
    activeController.current = controller
    if (requestedHomeId.current !== homeId) setSnapshot(null)
    requestedHomeId.current = homeId
    setLoading(true)
    setError(null)

    try {
      const [membersRes, billsRes, balancesRes] = await Promise.all([
        api.get<{ members: Member[] }>(`/api/homes/${encodeURIComponent(homeId)}/members`, {
          signal: controller.signal,
        }),
        api.get<{ bills: Bill[] }>(`/api/homes/${encodeURIComponent(homeId)}/bills`, {
          signal: controller.signal,
        }),
        api.get<{ balances: Balance[] }>(`/api/homes/${encodeURIComponent(homeId)}/balances`, {
          signal: controller.signal,
        }),
      ])
      const nextData = {
        members: membersRes.members,
        bills: billsRes.bills,
        balances: balancesRes.balances,
      }
      if (currentRequest === requestNumber.current) setSnapshot({ homeId, data: nextData })
      return currentRequest === requestNumber.current ? nextData : null
    } catch (caught: unknown) {
      if (!controller.signal.aborted && currentRequest === requestNumber.current) {
        setError(caught instanceof Error ? caught.message : 'Unable to load household data.')
      }
      return null
    } finally {
      if (currentRequest === requestNumber.current) {
        activeController.current = null
        setLoading(false)
      }
    }
  }, [homeId])

  useEffect(() => {
    void load()
    return () => {
      requestNumber.current += 1
      activeController.current?.abort()
      activeController.current = null
    }
  }, [load])

  const data = snapshot && snapshot.homeId === homeId ? snapshot.data : null
  const isCurrentRequest = requestedHomeId.current === homeId

  return {
    data,
    isLoading: isLoading || (homeId !== undefined && !isCurrentRequest),
    error: isCurrentRequest ? error : null,
    reload: load,
  }
}
