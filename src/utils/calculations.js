/**
 * Pure calculation functions for the MealMate app.
 *
 * Inputs are plain arrays/objects (meal entries, bazar expenses,
 * contributions, month settings). Outputs are computed numbers.
 * Nothing here touches the database — these are easy to test and reuse.
 *
 * Money is kept as full-precision numbers internally; only formatted for
 * display via `formatMoney`.
 */

/** Round to 2 decimals for display. */
export function round2(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100
}

/** Format a number as BDT currency, e.g. "৳ 1,149.00". */
export function formatMoney(n) {
  const num = Number(n) || 0
  return `৳ ${num.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

/** Format a plain number with thousands separators, 2 decimals. */
export function formatNumber(n) {
  const num = Number(n) || 0
  return num.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

/**
 * Total meals in the month = sum of every member's (breakfast + dinner).
 * @param {Array} mealEntries - [{breakfast, dinner, ...}]
 */
export function totalMeals(mealEntries = []) {
  return mealEntries.reduce(
    (sum, e) => sum + (Number(e.breakfast) || 0) + (Number(e.dinner) || 0),
    0,
  )
}

/**
 * Total bazar expense for the month = sum of all bazarExpenses amounts.
 */
export function totalBazar(bazarExpenses = []) {
  return bazarExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0)
}

/**
 * Meal rate = total bazar / total meals.
 * Returns 0 when there are no meals (avoids NaN/Infinity).
 * Full precision is kept; round for display only.
 */
export function mealRate(bazarExpenses = [], mealEntries = []) {
  const meals = totalMeals(mealEntries)
  if (meals === 0) return 0
  return totalBazar(bazarExpenses) / meals
}

/**
 * Per-member meal totals for the month.
 * @param {Array} members - [{id, ...}]
 * @param {Array} mealEntries - [{memberId, breakfast, dinner, ...}]
 * @returns {Map} memberId -> { breakfast, dinner, total }
 */
export function memberMealTotals(members = [], mealEntries = []) {
  const map = new Map()
  for (const m of members) {
    map.set(m.id, { breakfast: 0, dinner: 0, total: 0 })
  }
  for (const e of mealEntries) {
    const row = map.get(e.memberId)
    if (!row) continue
    const b = Number(e.breakfast) || 0
    const d = Number(e.dinner) || 0
    row.breakfast += b
    row.dinner += d
    row.total += b + d
  }
  return map
}

/**
 * Per-member contribution for the month = sum of their contributions entries.
 * @param {Array} members
 * @param {Array} contributions - [{memberId, amount, ...}]
 * @returns {Map} memberId -> amount
 */
export function memberContributions(members = [], contributions = []) {
  const map = new Map()
  for (const m of members) map.set(m.id, 0)
  for (const c of contributions) {
    if (!map.has(c.memberId)) map.set(c.memberId, 0)
    map.set(c.memberId, (map.get(c.memberId) || 0) + (Number(c.amount) || 0))
  }
  return map
}

/**
 * Build the full monthly summary per member.
 *
 * For each member returns:
 *  - meals: { breakfast, dinner, total }
 *  - foodCost: mealRate * total meals
 *  - contribution: deposited amount
 *  - balance: contribution - foodCost  (negative => due, positive => credit)
 *
 * @param {Array} members
 * @param {Array} mealEntries
 * @param {Array} bazarExpenses
 * @param {Array} contributions
 * @returns {Array} of { member, meals, foodCost, contribution, balance }
 */
export function monthlySummary(members = [], mealEntries = [], bazarExpenses = [], contributions = []) {
  const rate = mealRate(bazarExpenses, mealEntries)
  const mealMap = memberMealTotals(members, mealEntries)
  const contribMap = memberContributions(members, contributions)

  return members.map((member) => {
    const meals = mealMap.get(member.id) || { breakfast: 0, dinner: 0, total: 0 }
    const foodCost = rate * meals.total
    const contribution = contribMap.get(member.id) || 0
    const balance = contribution - foodCost
    return {
      member,
      meals,
      foodCost,
      contribution,
      balance,
      isDue: balance < 0,
      isCredit: balance > 0,
    }
  })
}

/**
 * Next month's payment required per member =
 *   next month's initialBazarTaka + this month's due (or - this month's credit).
 *
 * @param {Array} summaryRows - output of monthlySummary()
 * @param {number} nextInitialBazarTaka
 * @returns {Array} of { member, balance, amountToPay, isDue, isCredit }
 */
export function nextMonthDue(summaryRows = [], nextInitialBazarTaka = 0) {
  return summaryRows.map((row) => {
    const balance = row.balance // negative => due, positive => credit
    // Starting contributions + this month's due (or - this month's credit).
    // Since due is negative and credit is positive, subtract the balance:
    //   2000 - (-132.71 due) = 2132.71   (pay more)
    //   2000 - (+800 credit) = 1200      (pay less)
    const amountToPay = Number(nextInitialBazarTaka) - balance
    return {
      member: row.member,
      balance,
      amountToPay,
      isDue: balance < 0,
      isCredit: balance > 0,
    }
  })
}

/**
 * Quick dashboard totals for a month.
 */
export function dashboardTotals(members = [], mealEntries = [], bazarExpenses = []) {
  return {
    totalMeals: totalMeals(mealEntries),
    totalBazar: totalBazar(bazarExpenses),
    mealRate: mealRate(bazarExpenses, mealEntries),
    activeMembers: members.filter((m) => m.active).length,
  }
}