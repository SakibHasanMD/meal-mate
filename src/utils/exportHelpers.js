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
 * Assemble multiple sections into a PDF.
 * All sections are stacked on a single landscape page when they fit;
 * otherwise it falls back to one section per page.
 *
 * @param {Array<{el: HTMLElement, title?: string}>} sections
 * @param {string} monthKey - for the filename
 */
export async function exportMonthPdf(sections, monthKey) {
  const label = monthLabel(monthKey) // e.g. "July 2026"
  const [month, year] = label.split(' ')
  const filename = `MealChart_${month}_${year}.pdf`

  // Capture all sections as canvases first.
  const captured = []
  for (const { el, title } of sections) {
    if (!el) continue
    const canvas = await captureElement(el)
    captured.push({ canvas, title })
  }
  if (captured.length === 0) return

  const pdf = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' })
  const pageW = pdf.internal.pageSize.getWidth()
  const pageH = pdf.internal.pageSize.getHeight()

  // Size each image to fit page width; compute its height + title space.
  const imgW = pageW - 48
  const images = captured.map(({ canvas, title }) => ({
    canvas,
    title,
    imgW,
    imgH: (canvas.height / canvas.width) * imgW,
    titleH: title ? 24 : 0,
  }))

  // Total vertical space if all stacked on one page.
  const totalH = images.reduce((sum, im) => sum + im.titleH + im.imgH + 12, 24)

  if (totalH <= pageH) {
    // Single page — stack sections vertically, centered horizontally.
    let y = 24
    for (const im of images) {
      if (im.title) {
        pdf.setFontSize(13)
        pdf.setTextColor(30, 41, 59)
        pdf.text(im.title, 24, y + 10)
      }
      const top = y + im.titleH + 4
      const x = (pageW - im.imgW) / 2
      pdf.addImage(im.canvas.toDataURL('image/png'), 'PNG', x, top, im.imgW, im.imgH)
      y = top + im.imgH + 12
    }
  } else {
    // Fallback — one section per page.
    for (let i = 0; i < images.length; i++) {
      const im = images[i]
      if (i > 0) pdf.addPage()

      if (im.title) {
        pdf.setFontSize(14)
        pdf.setTextColor(30, 41, 59)
        pdf.text(im.title, 24, 28)
      }

      const top = im.title ? 40 : 24
      const finalH = Math.min(im.imgH, pageH - top - 24)
      const finalW = (im.canvas.width / im.canvas.height) * finalH
      const x = (pageW - finalW) / 2
      pdf.addImage(im.canvas.toDataURL('image/png'), 'PNG', x, top, finalW, finalH)
    }
  }

  pdf.save(filename)
}