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
 */
export const isEmployeeId = (id: string): id is EmployeeId => {
  // Format: EMP + 5 digits (e.g., EMP00001)
  return /^EMP\d{5}$/.test(id);
};

export const isProgramCode = (code: string): code is ProgramCode => {
  // Format: Uppercase letters and numbers, 3-10 chars
  return /^[A-Z0-9]{3,10}$/.test(code);
};

export const isSessionId = (id: string): id is SessionId => {
  // Format: UUID v4
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
};

export const isResultId = (id: string): id is ResultId => {
  // Format: UUID v4
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
};

/**
 * ID constructors with validation
 */
export const createEmployeeId = (id: string): EmployeeId => {
  if (!isEmployeeId(id)) {
    throw new Error(`Invalid EmployeeId format: ${id}`);
  }
  return id;
};

export const createProgramCode = (code: string): ProgramCode => {
  if (!isProgramCode(code)) {
    throw new Error(`Invalid ProgramCode format: ${code}`);
  }
  return code;
};

export const createSessionId = (id: string): SessionId => {
  if (!isSessionId(id)) {
    throw new Error(`Invalid SessionId format: ${id}`);
  }
  return id;
};

export const createResultId = (id: string): ResultId => {
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
