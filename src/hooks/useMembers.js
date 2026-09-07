import { db } from '../db/db'

/** Member status values. */
export const MEMBER_STATUS = {
  ACTIVE: 'active', // currently living in the flat, participates in calculations
  LEAVE: 'leave', // still a resident, temporarily away — excluded from calculations
  LEFT: 'left', // permanently moved out — history preserved, excluded from calculations
}

/** Member type values. */
export const MEMBER_TYPE = {
  MEMBER: 'member', // regular resident
  GUEST: 'guest', // temporary resident (still participates like any member)
}

const VALID_STATUS = new Set(Object.values(MEMBER_STATUS))
const VALID_TYPE = new Set(Object.values(MEMBER_TYPE))

function normalizeStatus(status) {
  return VALID_STATUS.has(status) ? status : MEMBER_STATUS.ACTIVE
}

function normalizeType(type) {
  return VALID_TYPE.has(type) ? type : MEMBER_TYPE.MEMBER
}

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
      status: normalizeStatus(data.status),
      type: normalizeType(data.type),
      notes: data.notes?.trim() || '',
    })
  }

  const updateMember = async (id, changes) => {
    const patch = { ...changes }
    if (patch.status !== undefined) patch.status = normalizeStatus(patch.status)
    if (patch.type !== undefined) patch.type = normalizeType(patch.type)
    if (patch.name !== undefined) patch.name = patch.name.trim()
    return db.members.update(id, patch)
  }

  /** Move a member between statuses (active / leave / left). */
  const setStatus = async (id, status) => {
    return db.members.update(id, { status: normalizeStatus(status) })
  }

  /** Shortcut: mark a member as permanently left (history preserved). */
  const markLeft = async (id) => setStatus(id, MEMBER_STATUS.LEFT)

  /**
   * PERMANENT deletion of a member AND all of their associated records:
   * meal entries, contributions, and any per-month exclusion lists that
   * reference them. Historical data is intentionally NOT preserved when
   * deleting — that's what "Left" is for.
   */
  const deleteMember = async (id) => {
    await db.transaction(
      'rw',
      [db.members, db.mealEntries, db.contributions, db.monthSettings],
      async () => {
        // Remove every meal entry for this member (all months).
        await db.mealEntries.where('memberId').equals(id).delete()
        // Remove every contribution for this member (all months).
        await db.contributions.where('memberId').equals(id).delete()
        // Scrub the member id from every month's exclusion list.
        const settings = await db.monthSettings.toArray()
        for (const s of settings) {
          if (Array.isArray(s.excludedMembers) && s.excludedMembers.includes(id)) {
            await db.monthSettings.update(s.month, {
              excludedMembers: s.excludedMembers.filter((x) => x !== id),
            })
          }
        }
        // Finally remove the member row itself.
        await db.members.delete(id)
      },
    )
  }

  return { addMember, updateMember, setStatus, markLeft, deleteMember }
}

export default useMembers