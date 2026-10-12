/**
 * Timezone and Date Boundary Utility for ZESTRO Restaurant Operations.
 * 
 * Ensures accurate calculation of business-local calendar day boundaries
 * (midnight to midnight) in the configured business timezone (default: Asia/Kolkata, UTC+5:30).
 */

export const getBusinessDayBoundaries = (
  date = new Date(),
  timeZone = process.env.BUSINESS_TIMEZONE || 'Asia/Kolkata'
) => {
  // Format the given date into YYYY-MM-DD in the business timezone
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  const localDateStr = formatter.format(date);
  const [year, month, day] = localDateStr.split('-').map(Number);

  /**
   * Given a local year, month, day in target timeZone,
   * calculates the exact UTC Date object corresponding to 00:00:00 local time.
   */
  const getUtcForLocalMidnight = (yr, mo, da) => {
    // Start with a UTC date representing that date
    const baseUtc = new Date(Date.UTC(yr, mo - 1, da, 0, 0, 0));
    
    // Check what local time this UTC instant corresponds to in the target timeZone
    const timeFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hour12: false,
    });
    
    const timeParts = timeFormatter.format(baseUtc);
    const [hh, mm, ss] = timeParts.split(':').map(Number);
    const offsetMs = ((hh % 24) * 3600 + mm * 60 + (ss || 0)) * 1000;
    
    // If baseUtc at 00:00:00 UTC is hh:mm:ss in local timezone,
    // then local midnight occurred offsetMs earlier.
    return new Date(baseUtc.getTime() - offsetMs);
  };

  const startOfToday = getUtcForLocalMidnight(year, month, day);
  const startOfTomorrow = getUtcForLocalMidnight(year, month, day + 1);
  const startOfYesterday = getUtcForLocalMidnight(year, month, day - 1);

  return {
    startOfToday,
    startOfTomorrow,
    startOfYesterday,
    localDateStr,
    year,
    month,
    day,
    timeZone,
  };
};

/**
 * Checks whether a given timestamp falls within today's business day boundaries
 */
export const isTodayInBusinessTimezone = (
  timestamp,
  timeZone = process.env.BUSINESS_TIMEZONE || 'Asia/Kolkata'
) => {
  if (!timestamp) return false;
  const targetDate = new Date(timestamp);
  if (isNaN(targetDate.getTime())) return false;

  const { startOfToday, startOfTomorrow } = getBusinessDayBoundaries(new Date(), timeZone);
  return targetDate >= startOfToday && targetDate < startOfTomorrow;
};

export default {
  getBusinessDayBoundaries,
  isTodayInBusinessTimezone,
};
