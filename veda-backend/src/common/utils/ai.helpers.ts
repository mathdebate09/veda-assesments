/**
 * Cleans markdown code fences and extraneous text surrounding a JSON response from an LLM.
 */
export function cleanJsonResponse(raw: string): string {
  let s = (raw || '').trim();
  if (s.startsWith('```')) {
    s = s.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  }
  s = s.trim();
  const match = s.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  return match ? match[0].trim() : s;
}

/**
 * Safely parses LLM JSON output with fallback.
 */
export function parseJsonResponse<T>(raw: string, fallback: T): T {
  try {
    const cleaned = cleanJsonResponse(raw);
    return JSON.parse(cleaned) as T;
  } catch {
    return fallback;
  }
}
