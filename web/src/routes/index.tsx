import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import './styles.css'

type Member = {
  id: string
  name: string
  initials: string
}

type Share = {
  id: string
  memberId: string
  amount: number
  paid: boolean
}

type Bill = {
  id: string
  number: string
  title: string
  date: string
  total: number
  shares: Share[]
}

const members: Member[] = [
  { id: 'asha', name: 'Asha', initials: 'AS' },
  { id: 'rahul', name: 'Rahul', initials: 'RA' },
  { id: 'priya', name: 'Priya', initials: 'PR' },
  { id: 'sai', name: 'Sai', initials: 'SA' },
]

const initialBills: Bill[] = [
  {
    id: '1',
    number: 'B001',
    title: 'Groceries',
    date: '12 Jan 2025',
    total: 1000,
    shares: [
      { id: 's1', memberId: 'asha', amount: 250, paid: true },
      { id: 's2', memberId: 'rahul', amount: 250, paid: false },
      { id: 's3', memberId: 'priya', amount: 250, paid: true },
      { id: 's4', memberId: 'sai', amount: 250, paid: false },
    ],
  },
  {
    id: '2',
    number: 'B002',
    title: 'Electricity',
    date: '10 Jan 2025',
    total: 2000,
    shares: [
      { id: 's5', memberId: 'asha', amount: 500, paid: true },
      { id: 's6', memberId: 'rahul', amount: 500, paid: true },
      { id: 's7', memberId: 'priya', amount: 500, paid: true },
      { id: 's8', memberId: 'sai', amount: 500, paid: true },
    ],
  },
  {
    id: '3',
    number: 'B003',
    title: 'Internet',
    date: '05 Jan 2025',
    total: 1500,
    shares: [
      { id: 's9', memberId: 'asha', amount: 375, paid: false },
      { id: 's10', memberId: 'rahul', amount: 375, paid: false },
      { id: 's11', memberId: 'priya', amount: 375, paid: false },
      { id: 's12', memberId: 'sai', amount: 375, paid: false },
    ],
  },
]

function formatMoney(amount: number) {
  return `₹${amount.toLocaleString('en-IN')}`
}

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  const [currentMember, setCurrentMember] = useState('sai')
  const [selectedBillId, setSelectedBillId] = useState('1')
  const [bills, setBills] = useState(initialBills)

  const selectedBill = bills.find((bill) => bill.id === selectedBillId) ?? bills[0]
  const currentMemberDetails = members.find((member) => member.id === currentMember)

  if (!selectedBill || !currentMemberDetails) {
    return (
      <main className="app-shell">
        <section className="page-content">
          <p>No prototype data is available.</p>
        </section>
      </main>
    )
  }

  const totalBills = bills.reduce((sum, bill) => sum + bill.total, 0)
  const outstanding = bills.reduce(
    (sum, bill) =>
      sum +
      bill.shares
        .filter((share) => !share.paid)
        .reduce((shareSum, share) => shareSum + share.amount, 0),
    0,
  )
  const settled = totalBills - outstanding

  const paidCount = selectedBill.shares.filter((share) => share.paid).length
  const currentShare = selectedBill.shares.find((share) => share.memberId === currentMember)
  const currentMemberHasUnpaidShare = currentShare && !currentShare.paid
  const selectedBillIdForPayment = selectedBill.id

  function payCurrentShare() {
    if (!currentShare || currentShare.paid) return

    setBills((previousBills) =>
      previousBills.map((bill) =>
        bill.id === selectedBillIdForPayment
          ? {
              ...bill,
              shares: bill.shares.map((share) =>
                share.id === currentShare.id ? { ...share, paid: true } : share,
              ),
            }
          : bill,
      ),
    )
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="/">
          SPLIT LEDGER
        </a>

        <div className="header-actions">
          <button className="home-selector" type="button">
            Apartment 204 <span className="chevron">⌄</span>
          </button>

          <span className="header-divider" />

          <label className="member-selector" title="Select demo member">
            <span className="member-avatar">{currentMemberDetails.initials}</span>
            <select
              aria-label="Current demo member"
              value={currentMember}
              onChange={(event) => setCurrentMember(event.target.value)}
            >
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </header>

      <section className="page-content">
        <div className="page-heading">
          <h1>Shared expenses</h1>
          <p>Apartment 204 / {members.length} members</p>
        </div>

        <section className="summary-strip" aria-label="Expense summary">
          <div className="summary-item">
            <span className="summary-label">TOTAL BILLS</span>
            <strong>{formatMoney(totalBills)}</strong>
          </div>

          <div className="summary-item">
            <span className="summary-label">OUTSTANDING</span>
            <strong>{formatMoney(outstanding)}</strong>
          </div>

          <div className="summary-item">
            <span className="summary-label">SETTLED</span>
            <strong>{formatMoney(settled)}</strong>
          </div>
        </section>

        <section className="dashboard-layout">
          <div className="bills-section">
            <div className="section-heading">
              <div className="section-title-group">
                <h2>Bills</h2>
                <span className="item-count">{bills.length} items</span>
              </div>

              <button className="primary-button add-bill-button" type="button">
                <span>＋</span> Add bill
              </button>
            </div>

            <div className="bill-list">
              {bills.map((bill) => {
                const paid = bill.shares.filter((share) => share.paid).length
                const isSelected = selectedBillId === bill.id

                return (
                  <button
                    key={bill.id}
                    type="button"
                    className={`bill-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => setSelectedBillId(bill.id)}
                    aria-pressed={isSelected}
                  >
                    <div className="bill-information">
                      <span className="bill-reference">#{bill.number}</span>
                      <h3>{bill.title}</h3>
                      <span className="bill-date">{bill.date}</span>
                    </div>

                    <div className="bill-amount">
                      <strong>{formatMoney(bill.total)}</strong>
                      <span>
                        {formatMoney(Math.floor(bill.total / bill.shares.length))} per member
                      </span>
                    </div>

                    <div className="bill-progress">
                      <span
                        className={`progress-badge ${
                          paid === bill.shares.length ? 'all-paid' : paid === 0 ? 'none-paid' : ''
                        }`}
                      >
                        {paid} / {bill.shares.length} PAID
                      </span>
                    </div>

                    <span className="view-shares">
                      View shares <span>→</span>
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          <aside className="shares-section">
            <div className="selected-bill-heading">
              <span className="bill-reference">#{selectedBill.number}</span>
              <h2>{selectedBill.title}</h2>
              <p>
                {selectedBill.date} <span>·</span> Total: {formatMoney(selectedBill.total)}
              </p>
            </div>

            <div className="shares-heading">
              <h3>Your shares</h3>
              <span>
                {paidCount} / {selectedBill.shares.length} paid
              </span>
            </div>

            <div className="share-list">
              {selectedBill.shares.map((share) => {
                const member = members.find((item) => item.id === share.memberId)

                return (
                  <div className="share-row" key={share.id}>
                    <span className="share-avatar">{member?.initials ?? '??'}</span>
                    <strong className="share-member-name">
                      {member?.name ?? 'Unknown member'}
                      {member?.id === currentMember ? ' (You)' : ''}
                    </strong>
                    <span className="share-amount">{formatMoney(share.amount)}</span>
                    <span className={`payment-status ${share.paid ? 'paid' : 'unpaid'}`}>
                      {share.paid ? 'PAID' : 'UNPAID'}
                    </span>
                  </div>
                )
              })}
            </div>

            {currentMemberHasUnpaidShare ? (
              <button className="primary-button pay-button" type="button" onClick={payCurrentShare}>
                Pay {formatMoney(currentShare.amount)}
              </button>
            ) : (
              <div className="payment-complete">
                {currentShare?.paid
                  ? 'Your share is already paid.'
                  : 'Your share is not available for this bill.'}
              </div>
            )}

            <p className="demo-note">Demonstration only · No real payment is processed.</p>
          </aside>
        </section>
      </section>
    </main>
  )
}
