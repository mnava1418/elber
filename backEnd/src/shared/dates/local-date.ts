// The day as YYYY-MM-DD in the server's timezone: Elber runs on the user's
// machine, so that is the user's day. toISOString() would give the UTC day,
// which is already tomorrow late in the evening.
export const localIsoDate = (date = new Date()): string =>
    [date.getFullYear(), date.getMonth() + 1, date.getDate()].map((n) => String(n).padStart(2, '0')).join('-')
