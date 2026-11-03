import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'
import type { Member } from '../../types'

interface MemberContextValue {
  selectedMemberId: string
  setSelectedMemberId: (id: string) => void
  members: Member[]
}

const MemberContext = createContext<MemberContextValue | undefined>(undefined)

export const MemberProvider = ({ members, children }: { members: Member[]; children: ReactNode }) => {
  const [selectedMemberId, setSelectedMemberId] = useState<string>(members[0]?.id ?? '')
  return (
    <MemberContext.Provider value={{ selectedMemberId, setSelectedMemberId, members }}>
      {children}
    </MemberContext.Provider>
  )
}

export const useMemberContext = () => {
  const ctx = useContext(MemberContext)
  if (!ctx) throw new Error('useMemberContext must be used within MemberProvider')
  return ctx
}
