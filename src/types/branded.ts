// ============================================================
// Branded Types for Type Safety
// ============================================================

/**
 * Branded type utility for creating nominal types
 */
declare const __brand: unique symbol;
type Brand<T, TBrand> = T & { [__brand]: TBrand };

/**
 * Branded ID types for compile-time safety
 */
export type EmployeeId = Brand<string, 'EmployeeId'>;
export type ProgramCode = Brand<string, 'ProgramCode'>;
export type SessionId = Brand<string, 'SessionId'>;
export type ResultId = Brand<string, 'ResultId'>;
export type LogId = Brand<string, 'LogId'>;

/**
 * Type guards for ID validation
 * These are flexible to accommodate various ID formats from different sources
 */
export const isEmployeeId = (id: unknown): id is EmployeeId => {
  if (typeof id !== 'string' || !id) return false;
  // Format: starts with E or EMP, followed by numbers or alphanumeric
  return /^E(MP)?[A-Z0-9]+$/i.test(id) && id.length >= 3;
};

export const isProgramCode = (code: unknown): code is ProgramCode => {
  if (typeof code !== 'string' || !code) return false;
  // Format: alphanumeric with optional hyphens, 3+ chars
  return /^[A-Z0-9][A-Z0-9-]*[A-Z0-9]$/i.test(code) && code.length >= 3;
};

export const isSessionId = (id: unknown): id is SessionId => {
  if (typeof id !== 'string' || !id) return false;
  // Format: SESS prefix or UUID or S + numbers
  return /^(SESS[-_]?|S)[A-Z0-9-]+$/i.test(id) ||
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
};

export const isResultId = (id: unknown): id is ResultId => {
  if (typeof id !== 'string' || !id) return false;
  // Format: RES prefix or UUID or R + numbers
  return /^(RES[-_]?|R)[A-Z0-9-]+$/i.test(id) ||
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
};

/**
 * Safe ID constructors - return null for invalid input
 * Use these when validation is preferred over exceptions
 */
export const createEmployeeId = (id: string): EmployeeId | null => {
  if (!isEmployeeId(id)) return null;
  return id;
};

export const createProgramCode = (code: string): ProgramCode | null => {
  if (!isProgramCode(code)) return null;
  return code;
};

export const createSessionId = (id: string): SessionId | null => {
  if (!isSessionId(id)) return null;
  return id;
};

export const createResultId = (id: string): ResultId | null => {
  if (!isResultId(id)) return null;
  return id;
};

/**
 * Strict ID constructors - throw on invalid input
 * Use these when validation failure should halt execution
 */
export const createEmployeeIdStrict = (id: string): EmployeeId => {
  if (!isEmployeeId(id)) {
    throw new Error(`Invalid EmployeeId format: ${id}`);
  }
  return id;
};

export const createProgramCodeStrict = (code: string): ProgramCode => {
  if (!isProgramCode(code)) {
    throw new Error(`Invalid ProgramCode format: ${code}`);
  }
  return code;
};

export const createSessionIdStrict = (id: string): SessionId => {
  if (!isSessionId(id)) {
    throw new Error(`Invalid SessionId format: ${id}`);
  }
  return id;
};

export const createResultIdStrict = (id: string): ResultId => {
  if (!isResultId(id)) {
    throw new Error(`Invalid ResultId format: ${id}`);
  }
  return id;
};

/**
 * Unsafe constructors for data migration/API parsing
 * Use only when IDs come from trusted sources
 */
export const unsafeEmployeeId = (id: string): EmployeeId => id as EmployeeId;
export const unsafeProgramCode = (code: string): ProgramCode => code as ProgramCode;
export const unsafeSessionId = (id: string): SessionId => id as SessionId;
export const unsafeResultId = (id: string): ResultId => id as ResultId;
