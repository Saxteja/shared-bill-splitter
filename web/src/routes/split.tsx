import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import BillList from '../components/bills/BillList'
import EmptyState from '../components/common/EmptyState'
import ErrorState from '../components/common/ErrorState'
import LoadingState from '../components/common/LoadingState'
import Header from '../components/layout/Header'
import SummaryStrip from '../components/layout/SummaryStrip'
import AddMemberDialog from '../components/members/AddMemberDialog'
import { MemberProvider } from '../components/members/MemberContext'
import ShareBreakdown from '../components/shares/ShareBreakdown'
import type { HomeData } from '../hooks/useHomeData'
import { useHomeData } from '../hooks/useHomeData'
import { outstanding, settled, totalBills } from '../utils/bill-calculations'
import './split.css'

function validateSearch(search: Record<string, unknown>) {
  const homeId =
    typeof search.homeId === 'string' && search.homeId.trim() !== ''
      ? search.homeId.trim()
      : undefined
  return { homeId }
}

export const Route = createFileRoute('/split')({
  validateSearch,
  component: SplitPage,
})

function SplitPage() {
  const { homeId } = Route.useSearch()
  const { data, isLoading, error, reload } = useHomeData(homeId)

  if (!homeId) {
    return (
      <main className="app-shell split-app">
        <section className="page-content">
          <EmptyState message="Choose a household to open its Split Ledger." />
          <p className="household-return-link">
            <Link to="/">Return to household selection</Link>
          </p>
        </section>
      </main>
    )
  }

  return (
    <main className="app-shell split-app">
      <MemberProvider key={homeId} members={data?.members ?? []}>
        <Header homeId={homeId} />
        <section className="page-content">
          {!data && isLoading && <LoadingState />}
          {!data && error && (
            <>
              <ErrorState message={error} onRetry={reload} />
              <p className="household-return-link">
                <Link to="/">Return to household selection</Link>
              </p>
            </>
          )}
          {!data && !isLoading && !error && (
            <EmptyState message="No data available for this household." />
          )}
          {data && (
            <HomeWorkspace
              key={homeId}
              homeId={homeId}
              data={data}
              isLoading={isLoading}
              error={error}
              reload={reload}
            />
          )}
        </section>
      </MemberProvider>
    </main>
  )
}

function HomeWorkspace({
  homeId,
  data,
  isLoading,
  error,
  reload,
}: {
  homeId: string
  data: HomeData
  isLoading: boolean
  error: string | null
  reload: () => Promise<HomeData | null>
}) {
  const [selectedBillId, setSelectedBillId] = useState<string | null>(null)
  const selectedBill =
    data.bills.find((bill) => bill.id === selectedBillId) ?? data.bills[0] ?? null
  const activeMemberCount = data.members.filter((member) => member.status === 'active').length
  const total = totalBills(data.bills)
  const out = outstanding(data.balances)
  const setl = settled(data.bills, data.balances)

  return (
    <>
      {(isLoading || error) && (
        <div className="refresh-state" aria-live="polite">
          {isLoading && <LoadingState />}
          {error && <ErrorState message={error} onRetry={reload} />}
        </div>
      )}
      <div className="page-heading">
        <h1>Shared expenses</h1>
        <div className="page-heading-meta">
          <p>{data.members.length} members</p>
          <AddMemberDialog homeId={homeId} onRefresh={reload} />
        </div>
      </div>
      <SummaryStrip total={total} outstanding={out} settled={setl} />
      <section className="dashboard-layout">
        <div className="bills-section">
          <BillList
            bills={data.bills}
            selectedBillId={selectedBill?.id ?? ''}
            onSelect={setSelectedBillId}
            homeId={homeId}
            onRefresh={reload}
            hasActiveMembers={activeMemberCount > 0}
          />
        </div>
        <div className="shares-section">
          {selectedBill ? (
            <ShareBreakdown bill={selectedBill} members={data.members} onPaymentSuccess={reload} />
          ) : (
            <EmptyState message="Add a bill to see its member shares." />
          )}
        </div>
      </section>
    </>
  )
}
