import { QuestionOption } from '../types';

/**
 * Deterministic pseudo-random option shuffler based on question_id + session_id hash.
 * Ensures:
 * 1. Same question + same session = exact same permutation.
 * 2. Different sessions = distinct option ordering (content fingerprint).
 * 3. Correct answer ID remains consistent with the option object ID.
 */

// Simple 32-bit FNV-1a hash implementation for client-side deterministic shuffling
function fnv1a(str: string): number {
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function getFingerprintedOptions(
  options: QuestionOption[],
  questionId: string,
  sessionId?: string
): QuestionOption[] {
  if (!options || options.length <= 1 || !sessionId) {
    return [...(options || [])];
  }

  // Generate deterministic score per option
  const scored = options.map(opt => ({
    opt,
    score: fnv1a(`${questionId}:${sessionId}:${opt.id}`)
  }));

  // Sort deterministically by computed score
  scored.sort((a, b) => a.score - b.score);

  return scored.map(s => s.opt);
}
