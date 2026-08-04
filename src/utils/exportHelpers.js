import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import { monthLabel } from './dateHelpers'

/**
 * Capture a DOM element (by ref) as a canvas image using html2canvas.
 * Temporarily adds a class to the element so we can hide interactive-only
 * bits during capture (elements marked with `.export-hide`).
 */
async function captureElement(el) {
  if (!el) throw new Error('No element to capture')

  el.classList.add('exporting')
  try {
    const canvas = await html2canvas(el, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      windowWidth: el.scrollWidth,
      windowHeight: el.scrollHeight,
    })
    return canvas
  } finally {
    el.classList.remove('exporting')
  }
}

/**
 * Export a single section as a PNG screenshot.
 */
export async function exportScreenshot(el, filename) {
  const canvas = await captureElement(el)
  const link = document.createElement('a')
  link.download = filename || 'screenshot.png'
  link.href = canvas.toDataURL('image/png')
  link.click()
}

/**
 * Assemble multiple sections into a multi-page PDF.
 * Each section is captured and placed on its own page (landscape).
 *
 * @param {Array<{el: HTMLElement, title?: string}>} sections
 * @param {string} monthKey - for the filename
 */
export async function exportMonthPdf(sections, monthKey) {
  const label = monthLabel(monthKey) // e.g. "July 2026"
  const [month, year] = label.split(' ')
  const filename = `MealChart_${month}_${year}.pdf`

  const pdf = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' })
  const pageW = pdf.internal.pageSize.getWidth()
  const pageH = pdf.internal.pageSize.getHeight()

  for (let i = 0; i < sections.length; i++) {
    const { el, title } = sections[i]
    if (!el) continue
    const canvas = await captureElement(el)

    if (i > 0) pdf.addPage()

    // Optional title at the top.
    if (title) {
      pdf.setFontSize(14)
      pdf.setTextColor(30, 41, 59)
      pdf.text(title, 24, 28)
    }

    // Fit image to page width, preserve aspect ratio.
    const imgW = pageW - 48
    const imgH = (canvas.height / canvas.width) * imgW
    const top = title ? 40 : 24
    const finalH = Math.min(imgH, pageH - top - 24)
    const finalW = (canvas.width / canvas.height) * finalH
    const x = (pageW - finalW) / 2

    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', x, top, finalW, finalH)
  }

  pdf.save(filename)
}