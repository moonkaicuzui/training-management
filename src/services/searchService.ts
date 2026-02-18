/**
 * Unified Search Service
 *
 * Client-side full-text search across all Q-TRAIN entities.
 * Since Firestore doesn't support native full-text search,
 * this service fetches data and performs scoring-based matching.
 */

import * as employeeService from './employeeService';
import * as programService from './programService';
import * as trainerService from './trainerService';
import * as materialService from './materialService';
import * as capaService from './capaService';
import * as projectService from './projectService';
import type { Trainer, CAPA } from '@/types';
import type { TrainingMaterial } from '@/types/material';
import type { Project } from '@/types/project';

// ============================================================
// Types
// ============================================================

export interface SearchResult {
  id: string;
  type: 'employee' | 'program' | 'session' | 'result' | 'material' | 'trainer' | 'capa' | 'project';
  title: string;
  subtitle?: string;
  description?: string;
  matchedField: string;
  score: number;
  route: string;
}

export interface SearchOptions {
  types?: SearchResult['type'][];
  limit?: number;
  minScore?: number;
}

// ============================================================
// Scoring Utilities
// ============================================================

/**
 * Calculate Levenshtein distance between two strings.
 * Used for fuzzy matching when exact/prefix/contains matching fails.
 */
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b[i - 1] === a[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Score a field against a query string.
 * Returns 0-100 relevance score, or 0 if no match.
 */
function scoreMatch(field: string, query: string): number {
  if (!field || !query) return 0;

  const fieldLower = field.toLowerCase();
  const queryLower = query.toLowerCase();

  // Exact match
  if (fieldLower === queryLower) return 100;

  // Starts with
  if (fieldLower.startsWith(queryLower)) return 80;

  // Contains
  if (fieldLower.includes(queryLower)) return 60;

  // Fuzzy match using Levenshtein distance
  // Only apply for queries >= 3 characters to avoid false positives
  if (queryLower.length >= 3) {
    const distance = levenshteinDistance(fieldLower, queryLower);
    const maxLen = Math.max(fieldLower.length, queryLower.length);
    const similarity = 1 - distance / maxLen;

    // Threshold: at least 60% similarity
    if (similarity >= 0.6) {
      return Math.round(40 * similarity);
    }

    // Also check if any word in the field starts with the query
    const words = fieldLower.split(/\s+/);
    for (const word of words) {
      if (word.startsWith(queryLower)) return 70;
      const wordDistance = levenshteinDistance(word, queryLower);
      const wordMaxLen = Math.max(word.length, queryLower.length);
      const wordSimilarity = 1 - wordDistance / wordMaxLen;
      if (wordSimilarity >= 0.7) {
        return Math.round(35 * wordSimilarity);
      }
    }
  }

  return 0;
}

/**
 * Find the best matching field from a set of field-value pairs.
 * Returns the field name and its score.
 */
function bestMatch(
  fields: Record<string, string | undefined>,
  query: string
): { field: string; score: number } {
  let bestField = '';
  let bestScore = 0;

  for (const [fieldName, fieldValue] of Object.entries(fields)) {
    if (!fieldValue) continue;
    const s = scoreMatch(fieldValue, query);
    if (s > bestScore) {
      bestScore = s;
      bestField = fieldName;
    }
  }

  return { field: bestField, score: bestScore };
}

// ============================================================
// Search Cache
// ============================================================

interface CacheEntry {
  results: SearchResult[];
  timestamp: number;
}

const SEARCH_CACHE_TTL = 30_000; // 30 seconds
const searchCache = new Map<string, CacheEntry>();

function getCacheKey(query: string, options?: SearchOptions): string {
  const types = options?.types?.sort().join(',') || 'all';
  const limit = options?.limit || 20;
  const minScore = options?.minScore || 0;
  return `${query.toLowerCase()}:${types}:${limit}:${minScore}`;
}

function getCachedResults(key: string): SearchResult[] | null {
  const entry = searchCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > SEARCH_CACHE_TTL) {
    searchCache.delete(key);
    return null;
  }
  return entry.results;
}

function setCachedResults(key: string, results: SearchResult[]): void {
  // Keep cache size reasonable
  if (searchCache.size > 50) {
    const oldestKey = searchCache.keys().next().value;
    if (oldestKey !== undefined) {
      searchCache.delete(oldestKey);
    }
  }
  searchCache.set(key, { results, timestamp: Date.now() });
}

/** Clear search cache (e.g., after data mutations) */
export function invalidateSearchCache(): void {
  searchCache.clear();
}

// ============================================================
// Entity Search Functions
// ============================================================

async function searchEmployees(query: string): Promise<SearchResult[]> {
  const employees = await employeeService.getEmployees();
  const results: SearchResult[] = [];

  for (const emp of employees) {
    const match = bestMatch(
      {
        name: emp.employee_name,
        employee_id: emp.employee_id,
        department: emp.department,
      },
      query
    );

    if (match.score > 0) {
      results.push({
        id: emp.employee_id,
        type: 'employee',
        title: emp.employee_name,
        subtitle: `${emp.employee_id} · ${emp.department}`,
        description: `${emp.position} · ${emp.building}`,
        matchedField: match.field,
        score: match.score,
        route: `/employees/${emp.employee_id}`,
      });
    }
  }

  return results;
}

async function searchPrograms(query: string): Promise<SearchResult[]> {
  const programs = await programService.getPrograms();
  const results: SearchResult[] = [];

  for (const prog of programs) {
    const match = bestMatch(
      {
        program_code: prog.program_code,
        program_name: prog.program_name,
        program_name_vn: prog.program_name_vn,
        program_name_kr: prog.program_name_kr,
        category: prog.category,
      },
      query
    );

    if (match.score > 0) {
      results.push({
        id: prog.program_code,
        type: 'program',
        title: prog.program_name,
        subtitle: prog.program_code,
        description: `${prog.category} · ${prog.program_name_vn}`,
        matchedField: match.field,
        score: match.score,
        route: `/programs/${prog.program_code}`,
      });
    }
  }

  return results;
}

async function searchTrainers(query: string): Promise<SearchResult[]> {
  const trainers: Trainer[] = await trainerService.getTrainers();
  const results: SearchResult[] = [];

  for (const trainer of trainers) {
    const match = bestMatch(
      {
        trainer_name: trainer.trainer_name,
        department: trainer.department,
        company: trainer.company,
        specializations: trainer.specializations?.join(', '),
      },
      query
    );

    if (match.score > 0) {
      results.push({
        id: trainer.trainer_id,
        type: 'trainer',
        title: trainer.trainer_name,
        subtitle: trainer.trainer_type === 'INTERNAL'
          ? trainer.department || 'Internal'
          : trainer.company || 'External',
        description: trainer.specializations?.join(', '),
        matchedField: match.field,
        score: match.score,
        route: `/trainers/${trainer.trainer_id}`,
      });
    }
  }

  return results;
}

async function searchMaterials(query: string): Promise<SearchResult[]> {
  const materials: TrainingMaterial[] = await materialService.getMaterials();
  const results: SearchResult[] = [];

  for (const mat of materials) {
    const match = bestMatch(
      {
        name: mat.name,
        description: mat.description,
        tags: mat.tags?.join(', '),
        programName: mat.programName || undefined,
      },
      query
    );

    if (match.score > 0) {
      results.push({
        id: mat.id,
        type: 'material',
        title: mat.name,
        subtitle: mat.type,
        description: mat.description,
        matchedField: match.field,
        score: match.score,
        route: `/materials?id=${mat.id}`,
      });
    }
  }

  return results;
}

async function searchCAPAs(query: string): Promise<SearchResult[]> {
  const capas: CAPA[] = await capaService.getCAPAs();
  const results: SearchResult[] = [];

  for (const capa of capas) {
    const match = bestMatch(
      {
        title: capa.title,
        capaNumber: capa.capaNumber,
        description: capa.description,
        source: capa.source,
      },
      query
    );

    if (match.score > 0) {
      results.push({
        id: capa.id,
        type: 'capa',
        title: capa.title,
        subtitle: `${capa.capaNumber} · ${capa.status}`,
        description: `${capa.type} · ${capa.severity}`,
        matchedField: match.field,
        score: match.score,
        route: `/capa/${capa.id}`,
      });
    }
  }

  return results;
}

async function searchProjects(query: string): Promise<SearchResult[]> {
  try {
    const projects: Project[] = await projectService.getProjects();
    const results: SearchResult[] = [];

    for (const proj of projects) {
      const match = bestMatch(
        {
          name: proj.name,
          description: proj.description,
        },
        query
      );

      if (match.score > 0) {
        results.push({
          id: proj.id,
          type: 'project',
          title: proj.name,
          subtitle: proj.status,
          description: proj.description,
          matchedField: match.field,
          score: match.score,
          route: `/projects/${proj.id}`,
        });
      }
    }

    return results;
  } catch {
    // Projects may not be loaded or available
    return [];
  }
}

// ============================================================
// Main Search Function
// ============================================================

const TYPE_SEARCH_MAP: Record<
  SearchResult['type'],
  (query: string) => Promise<SearchResult[]>
> = {
  employee: searchEmployees,
  program: searchPrograms,
  trainer: searchTrainers,
  material: searchMaterials,
  capa: searchCAPAs,
  project: searchProjects,
  // session and result are not directly searchable (too many records),
  // but the type is kept for extensibility
  session: async () => [],
  result: async () => [],
};

/**
 * Perform a unified search across all Q-TRAIN entities.
 *
 * @param query - Search query string (minimum 2 characters)
 * @param options - Optional search configuration
 * @returns Array of search results sorted by relevance score
 */
export async function search(
  query: string,
  options?: SearchOptions
): Promise<SearchResult[]> {
  const trimmedQuery = query.trim();
  if (trimmedQuery.length < 2) return [];

  // Check cache
  const cacheKey = getCacheKey(trimmedQuery, options);
  const cached = getCachedResults(cacheKey);
  if (cached) return cached;

  const limit = options?.limit || 20;
  const minScore = options?.minScore || 0;
  const types = options?.types || ['employee', 'program', 'trainer', 'material', 'capa', 'project'];

  // Run searches in parallel for selected types
  const searchPromises = types.map((type) => {
    const searchFn = TYPE_SEARCH_MAP[type];
    if (!searchFn) return Promise.resolve([]);
    return searchFn(trimmedQuery).catch(() => [] as SearchResult[]);
  });

  const allResults = await Promise.all(searchPromises);
  const flatResults = allResults.flat();

  // Filter by minimum score, sort by score descending, and limit
  const filtered = flatResults
    .filter((r) => r.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  // Cache results
  setCachedResults(cacheKey, filtered);

  return filtered;
}

/**
 * Create a debounced version of the search function.
 *
 * @param delayMs - Debounce delay in milliseconds (default: 300)
 * @returns Object with search function and cancel method
 */
export function createDebouncedSearch(delayMs = 300) {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return {
    search(
      query: string,
      options?: SearchOptions
    ): Promise<SearchResult[]> {
      return new Promise((resolve) => {
        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = setTimeout(async () => {
          const results = await search(query, options);
          resolve(results);
        }, delayMs);
      });
    },

    cancel() {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    },
  };
}
