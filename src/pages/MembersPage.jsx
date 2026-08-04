import { useState } from 'react'
import Header, { PageContainer } from '../components/layout/Header'
import Button from '../components/common/Button'
import MemberList from '../components/members/MemberList'
import MemberForm from '../components/members/MemberForm'
import { useApp } from '../context/AppContext'
import { useMembers } from '../hooks/useMembers'

export default function MembersPage() {
  const { members } = useApp()
  const { addMember, updateMember, setActive, deleteMember } = useMembers()

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)

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

  const handleToggle = async (m) => {
    await setActive(m.id, !m.active)
  }

  const handleDelete = async (m) => {
    if (
      confirm(
        `Delete "${m.name}"? This removes their roster entry (historical meal/finance data stays). Consider deactivating instead.`,
      )
    ) {
      await deleteMember(m.id)
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
          onToggleActive={handleToggle}
          onDelete={handleDelete}
        />
      </PageContainer>

      <MemberForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSave={handleSave}
        initial={editing}
      />
    </>
  )
}