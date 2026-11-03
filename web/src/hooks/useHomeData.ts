// src/hooks/useHomeData.ts
/**
 * React hook that loads members, bills and balances for a given homeId.
 * It returns loading / error states and a reload function.
 */
import { useEffect, useState, useCallback } from 'react'
import { api } from '../api/client'
import type { Member, Bill, Balance } from '../types'

export interface HomeData {
  members: Member[]
  bills: Bill[]
  balances: Balance[]
}

export const useHomeData = (homeId: string | undefined) => {
  const [data, setData] = useState<HomeData | null>(null)
  const [isLoading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!homeId) {
      setData(null)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const [membersRes, billsRes, balancesRes] = await Promise.all([
        api.get<{ members: Member[] }>(`/api/homes/${homeId}/members`),
        api.get<{ bills: Bill[] }>(`/api/homes/${homeId}/bills`),
        api.get<{ balances: Balance[] }>(`/api/homes/${homeId}/balances`),
      ])
      setData({ members: membersRes.members, bills: billsRes.bills, balances: balancesRes.balances })
    } catch (e) {
      setError((e as Error).message)
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [homeId])

  useEffect(() => {
    load()
  }, [load])

  const reload = useCallback(() => load(), [load])

  return { data, isLoading, error, reload }
}
