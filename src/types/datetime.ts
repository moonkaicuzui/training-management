// ============================================================
// DateTime Type Definitions
// ============================================================

/**
 * ISO 8601 Date format: YYYY-MM-DD
 * Example: "2024-01-15"
 */
export type ISODate = string & { __brand: 'ISODate' };

/**
 * ISO 8601 DateTime format: YYYY-MM-DDTHH:mm:ss.sssZ
 * Example: "2024-01-15T09:30:00.000Z"
 */
export type ISODateTime = string & { __brand: 'ISODateTime' };

/**
 * Time format: HH:mm (24-hour)
 * Example: "09:30", "14:45"
 */
export type TimeString = string & { __brand: 'TimeString' };

/**
 * Year-Month format: YYYY-MM
 * Example: "2024-01"
 */
export type YearMonth = string & { __brand: 'YearMonth' };

/**
 * Type guards for date/time validation
 */
export const isISODate = (value: string): value is ISODate => {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
};

export const isISODateTime = (value: string): value is ISODateTime => {
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/.test(value);
};

export const isTimeString = (value: string): value is TimeString => {
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(value);
};

export const isYearMonth = (value: string): value is YearMonth => {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
};

/**
 * Safe constructors - return null for invalid input
 */
export const createISODate = (date: Date | string): ISODate | null => {
  const dateStr = date instanceof Date ? date.toISOString().split('T')[0] : date;
  if (!isISODate(dateStr)) return null;
  return dateStr;
};

export const createISODateTime = (date: Date | string): ISODateTime | null => {
  const dateStr = date instanceof Date ? date.toISOString() : date;
  if (!isISODateTime(dateStr)) return null;
  return dateStr;
};

export const createTimeString = (hours: number, minutes: number): TimeString | null => {
  const timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  if (!isTimeString(timeStr)) return null;
  return timeStr;
};

export const createYearMonth = (year: number, month: number): YearMonth | null => {
  const ymStr = `${year}-${month.toString().padStart(2, '0')}`;
  if (!isYearMonth(ymStr)) return null;
  return ymStr;
};

/**
 * Strict constructors - throw on invalid input
 */
export const createISODateStrict = (date: Date | string): ISODate => {
  const dateStr = date instanceof Date ? date.toISOString().split('T')[0] : date;
  if (!isISODate(dateStr)) {
    throw new Error(`Invalid ISO Date format: ${dateStr}`);
  }
  return dateStr;
};

export const createISODateTimeStrict = (date: Date | string): ISODateTime => {
  const dateStr = date instanceof Date ? date.toISOString() : date;
  if (!isISODateTime(dateStr)) {
    throw new Error(`Invalid ISO DateTime format: ${dateStr}`);
  }
  return dateStr;
};

export const createTimeStringStrict = (hours: number, minutes: number): TimeString => {
  const timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  if (!isTimeString(timeStr)) {
    throw new Error(`Invalid Time format: ${timeStr}`);
  }
  return timeStr;
};

export const createYearMonthStrict = (year: number, month: number): YearMonth => {
  const ymStr = `${year}-${month.toString().padStart(2, '0')}`;
  if (!isYearMonth(ymStr)) {
    throw new Error(`Invalid YearMonth format: ${ymStr}`);
  }
  return ymStr;
};

/**
 * Parse helpers
 */
export const parseISODate = (isoDate: ISODate): Date => {
  return new Date(isoDate + 'T00:00:00.000Z');
};

export const parseISODateTime = (isoDateTime: ISODateTime): Date => {
  return new Date(isoDateTime);
};

export const parseTimeString = (time: TimeString): { hours: number; minutes: number } => {
  const [hours, minutes] = time.split(':').map(Number);
  return { hours, minutes };
};

/**
 * Calculate expiration date
 */
export const addMonths = (date: ISODate, months: number): ISODate => {
  const d = parseISODate(date);
  d.setMonth(d.getMonth() + months);
  return createISODateStrict(d);
};

/**
 * Get days until expiry (positive = future, negative = past)
 */
export const getDaysUntilExpiry = (expirationDate: ISODate): number => {
  // Use UTC dates for consistent comparison
  const now = new Date();
  const todayUTC = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const expiry = parseISODate(expirationDate);
  const expiryUTC = Date.UTC(expiry.getUTCFullYear(), expiry.getUTCMonth(), expiry.getUTCDate());
  const diffTime = expiryUTC - todayUTC;
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Check if date is expiring within days
 */
export const isExpiring = (expirationDate: ISODate, withinDays: number): boolean => {
  const diffDays = getDaysUntilExpiry(expirationDate);
  return diffDays >= 0 && diffDays <= withinDays;
};

/**
 * Check if date is expired
 */
export const isExpired = (expirationDate: ISODate): boolean => {
  return getDaysUntilExpiry(expirationDate) < 0;
};

/**
 * Unsafe constructors for data migration
 */
export const unsafeISODate = (value: string): ISODate => value as ISODate;
export const unsafeISODateTime = (value: string): ISODateTime => value as ISODateTime;
export const unsafeTimeString = (value: string): TimeString => value as TimeString;
export const unsafeYearMonth = (value: string): YearMonth => value as YearMonth;
