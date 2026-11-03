// src/components/shares/ShareBreakdown.tsx
import { useState } from 'react'
import type { Bill, Member } from '../../types'
import { formatCents, memberInitials } from '../../utils/format'
import { useMemberContext } from '../members/MemberContext'
import PaymentDialog from './PaymentDialog'

interface Props {
  bill: Bill
  members: Member[]
  onPaymentSuccess: () => Promise<{ bills: Bill[] } | null>
}

export default function ShareBreakdown({ bill, members, onPaymentSuccess }: Props) {
  const { selectedMemberId } = useMemberContext()
  const [payingShare, setPayingShare] = useState<null | (typeof bill.shares)[0]>(null)

  const getMember = (memberId: string) => members.find((m) => m.id === memberId)

  return (
    <div className="share-breakdown">
      <div className="selected-bill-heading">
        <h2>{bill.title}</h2>
        <p>{formatCents(bill.totalCents)}</p>
      </div>
      <div className="shares-heading">
        <h3>Shares</h3>
        <span>{bill.shares.length} members</span>
      </div>
      <div className="share-list">
        {bill.shares.map((share) => {
          const member = getMember(share.memberId)
          const isCurrentMember = share.memberId === selectedMemberId
          const paid = share.paidAt !== null
          return (
            <div key={share.id} className="share-row">
              <span className="member-avatar" aria-hidden="true">
                {member ? memberInitials(member.name) : '?'}
              </span>
              <div>
                {member
                  ? `${member.name}${member.status === 'departed' ? ' (departed)' : ''}`
                  : 'Unknown member'}
              </div>
              <div>{formatCents(share.amountCents)}</div>
              <div className={paid ? 'paid-status' : 'unpaid-status'}>
                {paid ? 'Paid' : 'Unpaid'}
              </div>
              {isCurrentMember && !paid && (
                <button
                  className="primary-button"
                  type="button"
                  onClick={() => setPayingShare(share)}
                >
                  Pay
                </button>
              )}
            </div>
          )
        })}
      </div>
      {payingShare && (
        <PaymentDialog
          billId={bill.id}
          share={payingShare}
          onClose={() => setPayingShare(null)}
          onSuccess={onPaymentSuccess}
        />
      )}
    </div>
  )
}
