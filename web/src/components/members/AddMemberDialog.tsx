import { useRef, useState } from 'react'
import { api } from '../../api/client'
import type { HomeData } from '../../hooks/useHomeData'
import type { AddMemberRequest, AddMemberResponse } from '../../types'
import { useMemberContext } from './MemberContext'

interface Props {
  homeId: string
  onRefresh: () => Promise<HomeData | null>
}

export default function AddMemberDialog({ homeId, onRefresh }: Props) {
  const { setSelectedMemberId } = useMemberContext()
  const [isOpen, setIsOpen] = useState(false)
  const [name, setName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [createdMember, setCreatedMember] = useState<AddMemberResponse | null>(null)
  const submitting = useRef(false)

  const close = () => {
    if (isLoading) return
    setIsOpen(false)
    setName('')
    setError(null)
    setCreatedMember(null)
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (submitting.current) return

    const trimmedName = name.trim()
    if (!createdMember && !trimmedName) {
      setError('Enter a member name to continue.')
      return
    }

    submitting.current = true
    setIsLoading(true)
    setError(null)
    try {
      let member = createdMember
      if (!member) {
        const request: AddMemberRequest = { name: trimmedName }
        member = await api.post<AddMemberResponse>(
          `/api/homes/${encodeURIComponent(homeId)}/members`,
          request,
        )
        setCreatedMember(member)
      }

      const refreshed = await onRefresh()
      const refreshedMember = refreshed?.members.find((item) => item.id === member?.id)
      if (!refreshedMember) {
        setError(
          'Member was created, but the refreshed member list does not include them. Retry to refresh safely.',
        )
        return
      }

      if (refreshedMember.status === 'active') setSelectedMemberId(refreshedMember.id)
      setIsOpen(false)
      setName('')
      setCreatedMember(null)
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : 'Member could not be added.')
    } finally {
      submitting.current = false
      setIsLoading(false)
    }
  }

  return (
    <>
      <button
        className="primary-button add-member-button"
        type="button"
        onClick={() => setIsOpen(true)}
      >
        + Add member
      </button>
      {isOpen && (
        <div className="modal-overlay">
          <section
            className="modal add-member-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-member-dialog-title"
            aria-busy={isLoading}
            onKeyDown={(event) => {
              if (event.key === 'Escape') close()
            }}
          >
            <h2 id="add-member-dialog-title">Add member</h2>
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <form onSubmit={handleSubmit}>
              <label htmlFor="new-member-name">Member name</label>
              <input
                id="new-member-name"
                type="text"
                autoComplete="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                disabled={isLoading || createdMember !== null}
              />
              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={close}
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button type="submit" className="primary-button" disabled={isLoading}>
                  {isLoading ? 'Adding…' : createdMember ? 'Retry refresh' : 'Add member'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </>
  )
}
