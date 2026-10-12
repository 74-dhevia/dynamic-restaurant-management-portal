/**
 * Time Slot and Concurrency Utilities for ZESTRO Table Reservations
 */

/**
 * Converts a 12-hour time string like "7:30 PM" or "12:00 PM" into minutes from midnight.
 */
export function parseSlotToMinutes(timeStr) {
  if (!timeStr) return 0;
  const match = String(timeStr).trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) return 0;
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const modifier = match[3] ? match[3].toUpperCase() : null;
  if (modifier === 'PM' && hours < 12) hours += 12;
  if (modifier === 'AM' && hours === 12) hours = 0;
  return hours * 60 + minutes;
}

/**
 * Converts minutes from midnight back to "7:30 PM" format.
 */
export function formatMinutesToSlot(mins) {
  let hours = Math.floor(mins / 60) % 24;
  const minutes = mins % 60;
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  const minStr = minutes < 10 ? `0${minutes}` : minutes;
  return `${hours}:${minStr} ${ampm}`;
}

/**
 * Checks whether two time slots overlap given a dining duration and cleaning buffer.
 * Standard restaurant seating duration: 90 mins, buffer: 15 mins.
 */
export function isTimeSlotOverlapping(slotA, slotB, durationMinutes = 90, bufferMinutes = 15) {
  const startA = parseSlotToMinutes(slotA);
  const endA = startA + durationMinutes + bufferMinutes;
  const startB = parseSlotToMinutes(slotB);
  const endB = startB + durationMinutes + bufferMinutes;

  return startA < endB && startB < endA;
}

/**
 * Normalizes any date to YYYY-MM-DD string for exact calendar day comparison.
 */
export function normalizeDateString(dateInput) {
  if (!dateInput) return new Date().toISOString().slice(0, 10);
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return String(dateInput).slice(0, 10);
  return d.toISOString().slice(0, 10);
}

/**
 * Generates start and end Date objects covering the full 24-hour window of the specified date.
 */
export function getDayBounds(dateInput) {
  const dateStr = normalizeDateString(dateInput);
  const start = new Date(`${dateStr}T00:00:00.000Z`);
  const end = new Date(`${dateStr}T23:59:59.999Z`);
  return { start, end, dateStr };
}
