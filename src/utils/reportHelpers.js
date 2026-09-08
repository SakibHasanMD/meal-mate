import { jsPDF } from 'jspdf'
import { format, isValid } from 'date-fns'
import { monthLabel, monthKeyToDate } from './dateHelpers.js'
import { round2 } from './calculations.js'
import { captureElement } from './exportHelpers.js'
import { utilityTypeLabel } from './utilityTypes.js'

/**
 * Monthly Meal & Finance Report — clean report-style PDF.
 *
 * What it draws (single A4 portrait page when everything fits):
 *   Page 1 (A4 portrait, hand-drawn + image)
 *     1. Summary  — active members, total meals, avg meal rate,
 *                    avg utility cost per member (single row, no heading)
 *     2. Monthly Utilities  — bill type, amount, per member
 *     3. Meal Chart  — captured image, scaled to fit the remaining page
 *                      height (aspect ratio preserved, never cropped) and
 *                      centered horizontally if narrower than the column
 *     4. Meal Calculation + Bazaar Due  — single merged per-member table
 *                                         (Member | Meals | Food Cost |
 *                                          Contributions | Balance |
 *                                          Starting | To Pay)
 *     If the calc+due table doesn't fit after the chart, it overflows to a
 *     second portrait page. Page size is always A4 portrait.
 *
 *   Footer on every page: "MealMate Generated · {date}" + "Page N of M".
 *
 * Calculations are NOT recomputed here. The dashboard already exposes the
 * exact values the app shows on screen (totals, summary[], due[]); we just
 * format them into a clean layout. The meal chart reuses the working
 * captureElement path from exportHelpers.
 */

const PALETTE = {
  ink: [30, 41, 59], // slate-800
  muted: [100, 116, 139], // slate-500
  border: [203, 213, 225], // slate-300
  soft: [241, 245, 249], // slate-100
  brand: [22, 163, 74], // brand-600
  due: [220, 38, 38], // red-600
  credit: [5, 150, 105], // emerald-600
}

const TITLE = 'Monthly Meal & Finance Report'
const FOOTER = 'MealMate Generated'
const M = 48 // page margin (pt)

/**
 * Format a number for the PDF — plain locale string, no currency symbol.
 * The ৳ (U+09F3) character is not in jsPDF's built-in Helvetica font and
 * renders as a garbage glyph.  Using a plain number keeps the PDF clean.
 */
function fmtMoney(n) {
  const num = Number(n) || 0
  return num.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

/** Month name without year, e.g. "August" — used in section headings. */
function monthName(monthKey) {
  const d = monthKeyToDate(monthKey)
  return isValid(d) ? format(d, 'MMMM') : monthKey
}

export function fileNameForReport(monthKey) {
  return `MealMate_Report_${monthKey}.pdf`
}

/**
 * Build the PDF and trigger a download.
 *
 * @param {{
 *   monthKey: string,
 *   activeMembers: Array,                // for the active-member count
 *   totalMeals: number,                  // derived from totals.totalMeals
 *   mealRate: number,                    // derived from totals.mealRate
 *   perMemberUtility: number,            // monthTotal / activeMembers.length
 *   utilities: { entries, monthTotal },
 *   byName: Map<string, {name, icon}>,  // for utility labels
 *   mealChartEl: HTMLElement | null,     // rendered chart for capture
 *   summary: Array,                      // per-member summary rows (from hook)
 *   due: Array,                          // per-member bazaar due rows (from hook)
 *   nextMonth: string,                   // YYYY-MM for "Next Month Bazaar Due"
 *   nextMonthSettings: Object,           // { initialBazarTaka }
 *   includedMembers: Array,              // active, non-excluded members
 *   reportDate?: Date,                   // for footer "Generated on" stamp
 * }} input
 */
export async function exportMonthlyReport(input) {
  const {
    monthKey,
    activeMembers,
    totalMeals,
    mealRate,
    perMemberUtility,
    utilities,
    byName,
    mealChartEl,
    summary,
    due,
    nextMonth,
    nextMonthSettings,
    includedMembers,
    reportDate = new Date(),
    skipNextMonth = new Set(),
  } = input

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' })
  const pageW = pdf.internal.pageSize.getWidth()
  const pageH = pdf.internal.pageSize.getHeight()
  const contentW = pageW - M * 2

  // Capture the chart once at the top so we can use its canvas for sizing
  // decisions below. The capture itself is browser-only and depends on the
  // hidden off-screen MealChartGrid rendered by OverviewPage.
  const chartCanvas = mealChartEl ? await captureElement(mealChartEl) : null
  const hasChart = !!chartCanvas

  // ---- Header (page 1) ----
  // Small metadata line: just the month, top-left.
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(8)
  pdf.setTextColor(...PALETTE.muted)
  pdf.text(monthLabel(monthKey), M, M + 8)
  // House address, right-aligned on the same header line (opposite the month).
  pdf.text('House 194', pageW - M, M + 8, { align: 'right' })

  // Title — centered horizontally.
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(15)
  pdf.setTextColor(...PALETTE.ink)
  pdf.text(TITLE, pageW / 2, M + 26, { align: 'center' })

  // Title underline
  pdf.setDrawColor(...PALETTE.border)
  pdf.setLineWidth(0.6)
  pdf.line(M, M + 32, pageW - M, M + 32)

  // ---- Content layout: fixed-height blocks evenly spaced down the page ----
  // Instead of hard-coded gaps, we measure the total height of every block
  // (summary, utilities, optional chart, calc+due) and then spread the
  // leftover page space evenly between them. This keeps sections readable
  // and fills the page instead of leaving a large blank area above the
  // footer, while still fitting everything on one page whenever possible.
  //
  // The content region spans [contentStart, pageH - M]; the bottom page
  // margin (M) already keeps the last table clear of the footer, which is
  // drawn lower still (at pageH - 18).
  const contentStart = M + 48
  const availH = pageH - M - contentStart

  const initialBazarTaka = nextMonthSettings?.initialBazarTaka ?? 2000
  const estCalcDueHeight = estimateCalcDueHeight(summary, includedMembers)

  // Natural heights of each section.
  // The summary is a single 10pt line: keep its band compact (~5pt of
  // whitespace each side) so it doesn't hog vertical space.
  const summaryH = 22
  const utilHeadH = 26
  const utilBodyH =
    ((utilities.entries?.length ?? 0) + 2) * 18 + 4 // header + rows + total
  const calcHeadH = 26
  const calcBodyH = estCalcDueHeight

  // The meal chart image is width-constrained (aspect preserved, never
  // cropped): its natural height is contentW / (canvas width ÷ height). A
  // wide chart (the real MealChartGrid, ~4:1) is short; a square or tall
  // chart would need more height than the page allows, so we cap it to the
  // room left after the other blocks so everything still fits on one page.
  const chartRatio = hasChart ? chartCanvas.width / chartCanvas.height : null
  const chartHeadH = 26
  const chartBodyNatural = hasChart ? contentW / chartRatio : 0
  const otherFixedH =
    summaryH + (utilHeadH + utilBodyH) + (calcHeadH + calcBodyH)
  // Maximum chart image height that still leaves the other blocks room to
  // fit on the page (accounting for the chart's own heading). This is also
  // the cap used when the chart is drawn, so estimate and draw always agree.
  const chartBodyH = hasChart
    ? Math.max(8, Math.min(chartBodyNatural, availH - otherFixedH - chartHeadH))
    : 0

  // Ordered blocks: summary, utilities, [chart], calc+due.
  const blockHeights = [
    summaryH,
    utilHeadH + utilBodyH,
    ...(hasChart ? [chartHeadH + chartBodyH] : []),
    calcHeadH + calcBodyH,
  ]

  const sumFixed = blockHeights.reduce((a, b) => a + b, 0)
  // Per-gap spacing. We keep the summary→Monthly Utilities gap modest so the
  // summary reads as a tight header line, and give most of the leftover space
  // to the two gaps that surround the meal chart (Monthly Utilities → Meal
  // Chart, and Meal Chart → Meal Calculation + Bazaar Due). Gaps scale to
  // fill the page by their weights and are capped so a sparse report (e.g.
  // no chart) doesn't balloon into enormous blank stretches. When content is
  // tall the gaps shrink naturally so everything still fits on one page.
  const leftover = Math.max(0, availH - sumFixed)
  const weights = hasChart ? [1, 3, 3] : [1, 2]
  const wSum = weights.reduce((a, b) => a + b, 0)
  const gaps = weights.map((w) =>
    Math.min(90, Math.max(0, (leftover * w) / wSum)),
  )
  const gapAfterSummary = gaps[0]
  const gapAfterUtil = gaps[1]
  const gapAfterChart = gaps[2] ?? 0

  const drawCalcDue = (X, Y) => {
    Y = drawCalcDueHeading(
      pdf,
      monthKey,
      nextMonth,
      initialBazarTaka,
      X,
      Y,
      contentW,
    )
    return drawCalcAndDueTable(
      pdf,
      X,
      Y,
      contentW,
      summary,
      due,
      includedMembers,
      initialBazarTaka,
      skipNextMonth,
    )
  }

  let y = contentStart

  // ---- Section 1: Summary (single row) ----
  y = drawSummaryBox(pdf, M, y, contentW, {
    activeMembers: activeMembers.length,
    totalMeals,
    mealRate: round2(mealRate),
    perMemberUtility: round2(perMemberUtility),
  })
  y += gapAfterSummary

  // ---- Section 2: Monthly Utilities ----
  y = drawSectionHeading(pdf, 'Monthly Utilities', M, y, contentW)
  y = drawUtilitiesTable(
    pdf,
    M,
    y,
    contentW,
    utilities.entries,
    utilities.monthTotal,
    activeMembers.length,
    byName,
  )
  y += gapAfterUtil

  // ---- Section 3: Meal Chart (aspect preserved, centered) ----
  if (hasChart) {
    y = drawSectionHeading(pdf, 'Meal Chart', M, y, contentW)
    // Use the same chart body height computed for the layout estimate so the
    // drawing always matches what the spacing budget assumed. Width follows
    // from the preserved aspect ratio and is clamped to the column.
    let imgH = chartBodyH
    let imgW = imgH * chartRatio
    if (imgW > contentW) {
      imgW = contentW
      imgH = imgW / chartRatio
    }
    // Center horizontally within the column.
    const cx = M + (contentW - imgW) / 2
    pdf.addImage(
      chartCanvas.toDataURL('image/png'),
      'PNG',
      cx,
      y,
      imgW,
      imgH,
    )
    y += imgH + gapAfterChart
  }

  // ---- Section 4: Combined Meal Calculation + Bazaar Due ----
  // It fits on page 1 when the even spacing already left room for it; if the
  // content is too big, it flows onto a second (portrait A4) page.
  const calcDueBlockH = calcHeadH + calcBodyH
  const remainingPageSpace = pageH - M - y
  const calcDueFits = remainingPageSpace >= calcDueBlockH
  const totalPages = calcDueFits ? 1 : 2

  if (calcDueFits) {
    y = drawCalcDue(M, y)
  }

  // ---- Footer on page 1 ----
  drawFooter(pdf, pageW, pageH, reportDate, 1, totalPages)

  // ---- Page 2 (portrait, same A4): Calc + Due overflow ----
  if (!calcDueFits) {
    pdf.addPage()
    drawCalcDue(M, M)
    drawFooter(pdf, pageW, pageH, reportDate, 2, totalPages)
  }

  pdf.save(fileNameForReport(monthKey))
}

// ---------------- drawing helpers ----------------

// Divider weights:
//  - SECTION_DIV_W is used under all three main section titles
//    (Monthly Utilities, Meal Chart, {current} Meal Calculation + {next}
//    Bazaar Due) so they match the style under Monthly Utilities.
//  - TABLE_DIV_W is used for every horizontal divider inside the tables
//    (header underline + row separators) so all tables look uniform.
const SECTION_DIV_W = 0.4
const TABLE_DIV_W = 0.3

function drawSectionHeading(pdf, text, x, y, w) {
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(12)
  pdf.setTextColor(...PALETTE.ink)
  pdf.text(text, x, y + 4)
  // Separator under the section title.
  pdf.setDrawColor(...PALETTE.border)
  pdf.setLineWidth(SECTION_DIV_W)
  pdf.line(x, y + 10, x + w, y + 10)
  // Advance past the heading + a comfortable gap before the body so the
  // sections sit evenly spaced down the page.
  return y + 26
}

/**
 * One-line summary: each stat is "LABEL: value" at the same font size.
 *
 *   Members: 7   ·   Total Meals: 203   ·   Avg Meal Rate: 64.16   ·   Avg Utility / Member: 1,745.71
 *
 * Keeping the whole summary on a single row drops it from a 40pt-tall box
 * to a compact single line with equal white space above and below it.
 * Important so the chart, utilities and calc+due table all fit on page 1.
 */
function drawSummaryBox(pdf, x, y, w, data) {
  // Try "Members" first; fall back to "Active Members" if the value pushes
  // the line over the page width. The 10pt label is kept short on purpose
  // (matches the user's preference for compact summary).
  const stats = [
    { label: 'Members', value: String(data.activeMembers) },
    { label: 'Total Meals', value: String(data.totalMeals) },
    { label: 'Avg Meal Rate', value: fmtMoney(data.mealRate) },
    { label: 'Avg Utility / Member', value: fmtMoney(data.perMemberUtility) },
  ]
  // If "Active Members" was requested and "Members" won't overflow, prefer
  // the short label so the line fits comfortably. Otherwise swap to the
  // longer label as a last resort.
  const FONT_SIZE = 10
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(FONT_SIZE)

  // Build segments: [bold value, plain label, ...] with " · " between them.
  // jsPDF's text is drawn individually; we measure widths to position each
  // segment and keep the whole line horizontally centered within the page.
  const segments = []
  for (let i = 0; i < stats.length; i++) {
    const s = stats[i]
    segments.push({ kind: 'label', text: `${s.label}: ` })
    segments.push({ kind: 'value', text: s.value })
    if (i < stats.length - 1) {
      segments.push({ kind: 'sep', text: '   ·   ' })
    }
  }

  // Measure total width to center the line.
  let totalW = 0
  for (const seg of segments) totalW += pdf.getTextWidth(seg.text)

  // Center the line within the column (x to x+w); fall back to x if it
  // would overflow (long values shouldn't happen — "Members" is short).
  let startX = x + (w - totalW) / 2
  if (startX < x) startX = x

  // Vertical balance: the single line sits in a band with EQUAL whitespace
  // above the text cap and below the text baseline. For a ~10pt line the
  // cap height above the baseline is roughly 6pt, so the baseline is nudged
  // up by half of that to center the visible text in the band.
  const BOX_H = 22
  const CAP = 6 // approximate font cap height above the baseline
  const baselineY = y + BOX_H / 2 + CAP / 2
  let cx = startX
  for (const seg of segments) {
    const w = pdf.getTextWidth(seg.text)
    if (seg.kind === 'value') {
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(...PALETTE.ink)
    } else if (seg.kind === 'label') {
      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(...PALETTE.muted)
    } else {
      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(...PALETTE.border)
    }
    pdf.text(seg.text, cx, baselineY)
    cx += w
  }
  return y + BOX_H
}

function drawTableHeader(pdf, x, y, w, headers, widths) {
  const rowH = 18
  pdf.setFillColor(...PALETTE.soft)
  pdf.rect(x, y, w, rowH, 'F')
  pdf.setDrawColor(...PALETTE.border)
  pdf.setLineWidth(TABLE_DIV_W)
  pdf.line(x, y + rowH, x + w, y + rowH)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(8.5)
  pdf.setTextColor(...PALETTE.muted)
  let cx = x
  for (let i = 0; i < headers.length; i++) {
    const colW = widths[i]
    const isRight = i > 0
    const text = headers[i]
    const tx = isRight ? cx + colW - 6 - pdf.getTextWidth(text) : cx + 6
    pdf.text(text, tx, y + 12)
    cx += colW
  }
  return y + rowH
}

function drawTableRow(pdf, x, y, w, cells, widths, opts = {}) {
  const rowH = opts.rowH || 18
  pdf.setDrawColor(...PALETTE.border)
  pdf.setLineWidth(TABLE_DIV_W)
  pdf.line(x, y + rowH, x + w, y + rowH)
  pdf.setFont('helvetica', opts.bold ? 'bold' : 'normal')
  pdf.setFontSize(9)
  // Which column carries the due/credit tone. Defaults to the last column
  // (e.g. Balance in the meal-calc table); override with `toneColumn` for
  // tables where the balance isn't the final column (e.g. Bazaar Due).
  const toneCol =
    opts.toneColumn ?? (opts.tone ? cells.length - 1 : -1)
  let cx = x
  for (let i = 0; i < cells.length; i++) {
    const colW = widths[i]
    const isRight = i > 0
    const raw = String(cells[i] ?? '')
    const text = pdf.splitTextToSize(raw, colW - 10)[0] || ''
    let color = PALETTE.ink
    if (opts.tone === 'due' && i === toneCol) color = PALETTE.due
    if (opts.tone === 'credit' && i === toneCol) color = PALETTE.credit
    pdf.setTextColor(...color)
    const tx = isRight ? cx + colW - 6 - pdf.getTextWidth(text) : cx + 6
    pdf.text(text, tx, y + 12)
    cx += colW
  }
  return y + rowH
}

function drawUtilitiesTable(pdf, x, y, w, entries, monthTotal, memberCount, byName) {
  const headers = ['Bill', 'Amount', 'Per Member']
  const widths = [w * 0.40, w * 0.30, w * 0.30]

  if (!entries || entries.length === 0) {
    y = drawTableHeader(pdf, x, y, w, headers, widths)
    y = drawTableRow(
      pdf,
      x,
      y,
      w,
      ['No utility bills for this month', '', ''],
      widths,
    )
    return y + 4
  }

  y = drawTableHeader(pdf, x, y, w, headers, widths)
  for (const e of entries) {
    const label = utilityTypeLabel(byName, e.billType)
    const perMem = memberCount > 0 ? (Number(e.amount) || 0) / memberCount : 0
    y = drawTableRow(
      pdf,
      x,
      y,
      w,
      [
        label,
        fmtMoney(e.amount),
        memberCount > 0 ? fmtMoney(perMem) : '—',
      ],
      widths,
    )
  }
  // Totals row
  y = drawTableRow(
    pdf,
    x,
    y,
    w,
    [
      'Total',
      fmtMoney(monthTotal),
      memberCount > 0 ? fmtMoney(monthTotal / memberCount) : '—',
    ],
    widths,
    { bold: true },
  )
  return y + 4
}

/**
 * Combined heading for the merged meal calculation + bazaar due table.
 *
 *   <currentMonth> Meal Calculation + <nextMonth> Bazaar Due
 *
 * The "Starting: <amount>" note is drawn right-aligned on the same line, so
 * users can see the bazaar base amount without scanning the table.
 */
function drawCalcDueHeading(pdf, monthKey, nextMonth, initialBazarTaka, x, y, w) {
  const title = `${monthName(monthKey)} Meal Calculation + ${monthName(nextMonth)} Bazaar Due`
  const note = `Starting: ${fmtMoney(initialBazarTaka)}`
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(12)
  pdf.setTextColor(...PALETTE.ink)
  pdf.text(title, x, y + 4)
  // Right-align the starting amount on the same row.
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(9)
  pdf.setTextColor(...PALETTE.muted)
  const noteW = pdf.getTextWidth(note)
  pdf.text(note, x + w - noteW, y + 4)
  // Underline — same weight as the other two section titles.
  pdf.setDrawColor(...PALETTE.border)
  pdf.setLineWidth(SECTION_DIV_W)
  pdf.line(x, y + 10, x + w, y + 10)
  return y + 26
}

/**
 * One merged table per member:
 *   Member | Meals | Food Cost | Contributions | Balance | Starting | Amount to Pay
 *
 * The Balance column is the same value used in the previous Meal Calc table
 * (this-month's due/credit), and is colored red/green for due/credit just
 * like before.  The Starting column shows next month's initial bazar
 * amount; the Amount to Pay column shows what each member owes next month.
 */
function drawCalcAndDueTable(
  pdf,
  x,
  y,
  w,
  summaryRows,
  dueRows,
  includedMembers,
  initialBazarTaka,
  skipNextMonth = new Set(),
) {
  const headers = [
    'Member',
    'Meals',
    'Food Cost',
    'Contributions',
    'Balance',
    'Starting',
    'To Pay',
  ]
  // Tight column widths: 7 columns summing to 1.0. The Member column was
  // previously 24% which left an obvious gap before Meals; 18% comfortably
  // fits the longest expected name (e.g. "Manadir") plus padding. To Pay
  // (renamed from "Amount to Pay") fits its widest value in 14%.
  const widths = [
    w * 0.18, // Member
    w * 0.08, // Meals
    w * 0.16, // Food Cost
    w * 0.16, // Contributions
    w * 0.16, // Balance
    w * 0.12, // Starting
    w * 0.14, // To Pay
  ]
  y = drawTableHeader(pdf, x, y, w, headers, widths)

  // Look up each due row by memberId so we can render both data sets in one row.
  const dueByMember = new Map((dueRows || []).map((d) => [d.member.id, d]))

  const list = (summaryRows || []).filter((r) =>
    includedMembers.some((m) => m.id === r.member.id),
  )
  if (list.length === 0) {
    y = drawTableRow(
      pdf,
      x,
      y,
      w,
      ['No members to summarize', '', '', '', '', '', ''],
      widths,
    )
    return y + 4
  }

  let totalMeals = 0
  let totalFood = 0
  let totalContrib = 0
  for (const r of list) {
    totalMeals += r.meals.total
    totalFood += r.foodCost
    totalContrib += r.contribution
    const balanceText = r.isDue
      ? `${fmtMoney(Math.abs(r.balance))} due`
      : r.isCredit
        ? `${fmtMoney(Math.abs(r.balance))} credit`
        : `${fmtMoney(0)} settled`
    const dueRow = dueByMember.get(r.member.id)
    const isSkipped = skipNextMonth.has(r.member.id)
    const actualStarting = isSkipped ? 0 : initialBazarTaka
    const amountToPay = dueRow ? fmtMoney(actualStarting - r.balance) : '—'
    y = drawTableRow(
      pdf,
      x,
      y,
      w,
      [
        r.member.name,
        String(r.meals.total),
        fmtMoney(r.foodCost),
        fmtMoney(r.contribution),
        balanceText,
        fmtMoney(actualStarting),
        amountToPay,
      ],
      widths,
      // Balance is the 5th column (index 4).
      { tone: r.isDue ? 'due' : r.isCredit ? 'credit' : null, toneColumn: 4 },
    )
  }
  // Totals row
  const totalBalance = totalContrib - totalFood
  const balanceText =
    Math.abs(totalBalance) < 0.01
      ? `${fmtMoney(0)} balanced`
      : `${fmtMoney(Math.abs(totalBalance))} check`
  const totalStarting = list.reduce((sum, r) => {
    return sum + (skipNextMonth.has(r.member.id) ? 0 : initialBazarTaka)
  }, 0)
  const totalAmountToPay = list.reduce(
    (sum, r) => sum + (skipNextMonth.has(r.member.id) ? 0 : initialBazarTaka) - r.balance,
    0,
  )
  y = drawTableRow(
    pdf,
    x,
    y,
    w,
    [
      'Total',
      String(totalMeals),
      fmtMoney(totalFood),
      fmtMoney(totalContrib),
      balanceText,
      fmtMoney(totalStarting),
      fmtMoney(totalAmountToPay),
    ],
    widths,
    { bold: true },
  )
  return y + 4
}

function drawFooter(pdf, pageW, pageH, date, pageNo, total) {
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(8)
  pdf.setTextColor(...PALETTE.muted)
  const stamp = format(date, 'dd MMM yyyy')
  const left = `${FOOTER} · ${stamp}`
  const right = `Page ${pageNo} of ${total}`
  pdf.text(left, M, pageH - 18)
  const rw = pdf.getTextWidth(right)
  pdf.text(right, pageW - M - rw, pageH - 18)
}

function estimateCalcDueHeight(summaryRows, includedMembers) {
  const list = (summaryRows || []).filter((r) =>
    includedMembers.some((m) => m.id === r.member.id),
  )
  // header + N rows + total row
  return 18 + (list.length + 1) * 18
}
