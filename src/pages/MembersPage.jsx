import { useState } from 'react'
import Header, { PageContainer } from '../components/layout/Header'
import Button from '../components/common/Button'
import MemberList from '../components/members/MemberList'
import MemberForm from '../components/members/MemberForm'
import DeleteMemberModal from '../components/members/DeleteMemberModal'
import { useApp } from '../context/AppContext'
import { useMembers } from '../hooks/useMembers'
import { db } from '../db/db'

export default function MembersPage() {
  const { members } = useApp()
  const { addMember, updateMember, setStatus, deleteMember } = useMembers()

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null) // member awaiting delete confirmation
  const [deleteCounts, setDeleteCounts] = useState({ meals: 0, contributions: 0 })
  const [deleteBusy, setDeleteBusy] = useState(false)

  const openAdd = () => {
    setEditing(null)
    setFormOpen(true)
  }

  const openEdit = (m) => {
    setEditing(m)
    setFormOpen(true)
  }

  const handleSave = async (data) => {
    if (editing) {
      await updateMember(editing.id, data)
    } else {
      await addMember(data)
    }
  }

  const handleSetStatus = async (m, status) => {
    await setStatus(m.id, status)
  }

  const handleDelete = async (m) => {
    // Count the associated records so the confirmation is explicit.
    const [meals, contributions] = await Promise.all([
      db.mealEntries.where('memberId').equals(m.id).count(),
      db.contributions.where('memberId').equals(m.id).count(),
    ])
    setDeleteCounts({ meals, contributions })
    setDeleting(m)
  }

  const confirmDelete = async () => {
    if (!deleting) return
    setDeleteBusy(true)
    try {
      await deleteMember(deleting.id)
      setDeleting(null)
    } finally {
      setDeleteBusy(false)
    }
  }

  return (
    <>
      <Header
        title="Members"
        subtitle="Roster of people who eat in the mess"
        actions={
          <Button variant="primary" onClick={openAdd}>
            + Add Member
          </Button>
        }
      />
      <PageContainer>
        <MemberList
          members={members}
          onEdit={openEdit}
          onSetStatus={handleSetStatus}
          onDelete={handleDelete}
        />
      </PageContainer>

      <MemberForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSave={handleSave}
        initial={editing}
      />

      <DeleteMemberModal
        member={deleting}
        mealEntryCount={deleteCounts.meals}
        contributionCount={deleteCounts.contributions}
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        busy={deleteBusy}
      />
    </>
  )
}