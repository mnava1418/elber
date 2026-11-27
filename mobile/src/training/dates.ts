// Day helpers from web/src/training/plan.ts (the training page brings the
// rest of that file in phase 10).

// Days are "YYYY-MM-DD" and their math is done in UTC, like the backend, so
// the user's time zone never shifts them.
export function addDays(date: string, days: number) {
  const d = new Date(`${date}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

// The user's today, from the device's clock and time zone.
export function localToday(now = new Date()) {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}
