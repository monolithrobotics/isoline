/**
 * Calendar arithmetic in local time, on whole days.
 *
 * No timezone library and no UTC: a date picker picks a day on the wall
 * calendar in front of the user. Converting to UTC is what puts "1 March" in
 * February for everyone west of Greenwich.
 */

/** Midnight local time on the same day. */
export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days)
}

/**
 * The same day-of-month `months` away, clamped to the month's length.
 *
 * 31 January plus one month is 28 February, not 3 March: `setMonth` overflows
 * into the next month, and a Page Down that skips February entirely is a bug
 * every calendar has shipped at least once.
 */
export function addMonths(date: Date, months: number): Date {
  const target = new Date(date.getFullYear(), date.getMonth() + months, 1)
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate()
  return new Date(
    target.getFullYear(),
    target.getMonth(),
    Math.min(date.getDate(), lastDay),
  )
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

export function isSameDay(a: Date | undefined, b: Date | undefined): boolean {
  if (!a || !b) return false
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

export function isSameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth()
}

/**
 * The grid for a month: whole weeks, including the days either side that fill
 * them out.
 *
 * Always complete weeks, never a ragged first row. A grid whose first cells are
 * empty cannot be navigated with the arrow keys — Up from the 3rd has nowhere
 * to go — and screen readers announce the holes as blank cells.
 *
 * @param weekStartsOn 0 for Sunday through 6 for Saturday.
 */
export function monthGrid(month: Date, weekStartsOn = 1): Date[][] {
  const first = startOfMonth(month)
  const lead = (first.getDay() - weekStartsOn + 7) % 7
  const start = addDays(first, -lead)

  const weeks: Date[][] = []
  let cursor = start

  // Six rows would always be enough, but most months need five and a fixed six
  // leaves a trailing week of another month for no reason. Stop when the month
  // is behind us and the week is complete.
  while (weeks.length < 6) {
    const week = Array.from({ length: 7 }, (_, day) => addDays(cursor, day))
    weeks.push(week)
    cursor = addDays(cursor, 7)
    if (!isSameMonth(cursor, month) && cursor > first) break
  }

  return weeks
}
