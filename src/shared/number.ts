/**
 * Rounds `value` to the nearest `step` above `min`, then clamps to the range.
 *
 * Snapping is relative to `min`, not to zero: a range starting at 0.5 with a
 * step of 1 has valid values 0.5, 1.5, 2.5 — snapping to zero would produce
 * 1 and 2, which the range does not contain. An unbounded `min` has no
 * position to count from, so zero stands in; counting from `-Infinity` yields
 * `NaN` and quietly destroys the value.
 */
export function snap(value: number, min: number, max: number, step: number): number {
  const origin = Number.isFinite(min) ? min : 0
  const stepped = step > 0 ? origin + Math.round((value - origin) / step) * step : value
  const clamped = Math.min(Math.max(stepped, min), max)
  return round(clamped, step)
}

/**
 * The value `steps` steps away from `value`, staying on the step grid.
 *
 * Not `value + steps * step`: a value already off the grid — typed in, or left
 * over from a smaller step — would stay off it forever, and every later value
 * would be invalid too. Stepping up from an off-grid value lands on the next
 * valid one above it, which is what a native number input does.
 */
export function stepFrom(
  value: number,
  min: number,
  max: number,
  step: number,
  steps: number,
): number {
  if (step <= 0) return snap(value, min, max, step)

  const origin = Number.isFinite(min) ? min : 0
  // Rounded before flooring: `(0.3 - 0) / 0.1` is `2.9999999999999996`, and
  // flooring that would step to 0.3 again instead of moving on.
  const position = Number(((value - origin) / step).toFixed(10))
  const target = steps > 0 ? Math.floor(position) + steps : Math.ceil(position) + steps

  return snap(origin + target * step, min, max, step)
}

/**
 * Trims the float error a step introduces.
 *
 * `0.1 + 0.2` is `0.30000000000000004`, and a field that showed that after two
 * presses of the up arrow would be reported as a bug — correctly. The step's
 * own precision is the right number of decimals to keep, since no arithmetic
 * here can produce a value finer than the step that generated it.
 */
export function round(value: number, step: number): number {
  const decimals = decimalsOf(step)
  return decimals === 0 ? value : Number(value.toFixed(decimals))
}

function decimalsOf(step: number): number {
  if (!Number.isFinite(step)) return 0
  const text = String(step)
  // Exponent form (`1e-7`) has no visible decimals to count, so read the
  // exponent instead of returning zero and rounding the value to an integer.
  const exponent = text.match(/e-(\d+)$/)
  if (exponent) return Number(exponent[1])
  return text.split('.')[1]?.length ?? 0
}
