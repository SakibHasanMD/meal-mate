/**
 * Minimal table wrapper with consistent Tailwind styling.
 * Pass children as <thead>/<tbody> content.
 */
export default function Table({ children, className = '' }) {
  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="min-w-full border-collapse text-sm">
        {children}
      </table>
    </div>
  )
}

/** Standard table header cell. */
export function Th({ children, className = '' }) {
  return (
    <th
      className={`border-b border-slate-200 bg-slate-50 px-3 py-2 text-left font-semibold text-slate-600 ${className}`}
    >
      {children}
    </th>
  )
}

/** Standard table data cell. */
export function Td({ children, className = '' }) {
  return (
    <td className={`border-b border-slate-100 px-3 py-2 text-slate-700 ${className}`}>
      {children}
    </td>
  )
}

/** Standard table row. */
export function Tr({ children, className = '' }) {
  return (
    <tr className={`hover:bg-slate-50 ${className}`}>{children}</tr>
  )
}