// src/routes/split.tsx
import { createFileRoute } from '@tanstack/react-router'
import Header from '../components/layout/Header'
import SummaryStrip from '../components/layout/SummaryStrip'
import BillList from '../components/bills/BillList'
import ShareBreakdown from '../components/shares/ShareBreakdown'
import LoadingState from '../components/common/LoadingState'
import ErrorState from '../components/common/ErrorState'
import EmptyState from '../components/common/EmptyState'
import '../routes/split.css'
import { useHomeData } from '../hooks/useHomeData'
import { totalBills, outstanding, settled } from '../utils/bill-calculations'
import { useState } from 'react'

/** Simple validator for the required homeId query param */
function validateSearch(search: Record<string, unknown>) {
  const homeId = typeof search.homeId === 'string' && search.homeId.trim() !== '' ? search.homeId : undefined
  if (!homeId) {
    throw new Error('homeId query parameter is required')
  }
  return { homeId }
}

export const Route = createFileRoute('/split')({
  validateSearch,
  component: SplitPage,
})

function SplitPage() {
  const { homeId } = Route.useSearch()
  const { data, isLoading, error, reload } = useHomeData(homeId)
  const [selectedBillId, setSelectedBillId] = useState<string | null>(null)
  const [selectedMemberId, setSelectedMemberId] = useState<string>('')

  // When data loads, initialise selected member to first active member
  React.useEffect(() => {
    if (data?.members?.length && !selectedMemberId) {
      const first = data.members.find((m) => m.status === 'active')
      if (first) setSelectedMemberId(first.id)
    }
  }, [data, selectedMemberId])

  // When no bill is selected, default to first one if available
  const selectedBill = data?.bills?.find((b) => b.id === selectedBillId) ?? data?.bills?.[0] ?? null

  // Summary values (fallback to 0 when data missing)
  const total = data ? totalBills(data.bills) : 0
  const out = data ? outstanding(data.balances) : 0
  const setl = data ? settled(data.bills, data.balances) : 0

  const { homeId } = Route.useSearch()
  const { data, isLoading, error, reload } = useHomeData(homeId)
  const [selectedBillId, setSelectedBillId] = useState<string | null>(null)

  // When no bill is selected, default to first one if available
  const selectedBill = data?.bills?.find((b) => b.id === selectedBillId) ?? data?.bills?.[0] ?? null

  // Summary values (fallback to 0 when data missing)
  const total = data ? totalBills(data.bills) : 0
  const out = data ? outstanding(data.balances) : 0
  const setl = data ? settled(data.bills, data.balances) : 0

  if (!homeId) {
    return <EmptyState message="Add ?homeId=... to the URL to view a household." />
  }
  if (isLoading) return <LoadingState />
  if (error) return <ErrorState message={error} onRetry={reload} />
  if (!data) return <EmptyState message="No data available for this household." />

  return (
    <main className="app-shell">
      <Header homeName="Shared household" />
      <section className="page-content">
        <div className="page-heading">
          <h1>Shared expenses</h1>
          <p>{data.members.length} members</p>
        </div>
        <SummaryStrip total={total} outstanding={out} settled={setl} />
        <section className="dashboard-layout">
          <div className="bills-section">
            <BillList
              bills={data.bills}
              selectedBillId={selectedBill?.id ?? ''}
              onSelect={setSelectedBillId}
            />
          </div>
          <div className="shares-section">
            {selectedBill && (
              <ShareBreakdown bill={selectedBill} members={data.members} onPaymentSuccess={reload} />
            )}
          </div>
        </section>
      </section>
    </main>
  )
}
