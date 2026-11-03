import type { ReactNode } from 'react'
import { createContext, useContext, useEffect, useState } from 'react'
import type { Member } from '../../types'

interface MemberContextValue {
  selectedMemberId: string
  setSelectedMemberId: (id: string) => void
  members: Member[]
}

const MemberContext = createContext<MemberContextValue | undefined>(undefined)

export const MemberProvider = ({
  members,
  children,
}: {
  members: Member[]
  children: ReactNode
}) => {
  const [selectedMemberId, setSelectedMemberId] = useState<string>(
    members.find((member) => member.status === 'active')?.id ?? members[0]?.id ?? '',
  )

  useEffect(() => {
    if (!members.some((member) => member.id === selectedMemberId)) {
      setSelectedMemberId(
        members.find((member) => member.status === 'active')?.id ?? members[0]?.id ?? '',
      )
    }
  }, [members, selectedMemberId])

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
