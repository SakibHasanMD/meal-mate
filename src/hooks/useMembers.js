import { db } from '../db/db'

/**
 * CRUD operations for members.
 * Reads come from the live query in AppContext; this hook exposes mutations.
 */
export function useMembers() {
  const addMember = async (data) => {
    return db.members.add({
      name: data.name?.trim() || '',
      phone: data.phone?.trim() || '',
      joinDate: data.joinDate || new Date().toISOString().slice(0, 10),
      active: data.active ?? true,
      notes: data.notes?.trim() || '',
    })
  }

  const updateMember = async (id, changes) => {
    return db.members.update(id, changes)
  }

  const setActive = async (id, active) => {
    return db.members.update(id, { active })
  }

  // Soft delete: just deactivate so historical months stay intact.
  const deactivate = async (id) => setActive(id, false)

  // Hard delete is intentionally not exposed by default.
  const deleteMember = async (id) => {
    return db.members.delete(id)
  }

  return { addMember, updateMember, setActive, deactivate, deleteMember }
}

export default useMembers