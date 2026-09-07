/**
 * Utility bill types.
 *
 * The six defaults below are predefined and can never be removed or renamed
 * by the user. Custom types (created in the "Manage Types" dialog) are stored
 * in the `utilityTypes` table alongside these, sharing the same shape:
 *   { id, name, icon, isDefault }
 *
 * Utility bill *entries* reference a type by its human-readable `name`
 * (stored in `utilities.billType`), so deleting a custom type never touches
 * existing bills — they simply render with a generic icon afterwards.
 */

/** The fixed set of default utility types, in display order. */
export const DEFAULT_UTILITY_TYPES = [
  { name: 'Electricity', icon: '💡' },
  { name: 'Water', icon: '💧' },
  { name: 'Gas', icon: '🔥' },
  { name: 'Internet', icon: '🌐' },
  { name: 'Trash', icon: '🗑️' },
  { name: 'Other', icon: '📄' },
]

/** Fallback icon used for entries whose type no longer exists. */
export const FALLBACK_UTILITY_ICON = '📄'

/**
 * Preset icons offered in the custom-type picker. All are utility-flavoured.
 */
export const PRESET_UTILITY_ICONS = [
  '💡',
  '⚡',
  '🔌',
  '🔋',
  '🔥',
  '♨️',
  '💧',
  '🚿',
  '🚰',
  '🧊',
  '❄️',
  '☀️',
  '🌐',
  '📶',
  '📡',
  '📺',
  '🖥️',
  '📞',
  '🗑️',
  '♻️',
  '🧺',
  '🍳',
  '🧾',
  '📄',
]

/**
 * Resolve the icon for a type name.
 * @param {Map<string, {name, icon}>} byName - name -> type map (from useUtilityTypes)
 * @param {string} name - stored billType
 */
export function utilityTypeIcon(byName, name) {
  return byName?.get(name)?.icon || FALLBACK_UTILITY_ICON
}

/**
 * Resolve the display label for a type name. Falls back to the raw name
 * (e.g. a custom type that was deleted after bills were logged against it).
 */
export function utilityTypeLabel(byName, name) {
  return byName?.get(name)?.name || name || 'Other'
}