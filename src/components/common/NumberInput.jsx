import { useState, useEffect } from 'react'

/**
 * Number input that keeps a local string state so the user can type
 * freely (including empty/partial values) and only commits a number on blur.
 */
export default function NumberInput({
  value,
  onCommit,
  className = '',
  placeholder = '0',
  min = 0,
  step = 'any',
  ...props
}) {
  const [text, setText] = useState('')

  // Sync local text when the external value changes.
  useEffect(() => {
    setText(value === 0 || value == null ? '' : String(value))
  }, [value])

  const commit = () => {
    const n = parseFloat(text)
    onCommit?.(Number.isFinite(n) ? n : 0)
  }

  return (
    <input
      type="number"
      inputMode="decimal"
      min={min}
      step={step}
      value={text}
      onChange={(e) => setText(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.currentTarget.blur()
        }
      }}
      placeholder={placeholder}
      className={`w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-800 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 ${className}`}
      {...props}
    />
  )
}