/**
 * Clamps a DeepSeek-estimated bounding box to valid [0, 1] fractional range.
 * AI output can occasionally exceed bounds due to hallucination or rounding.
 */
export function validateBoundingBox(bb: {
  x: number;
  y: number;
  width: number;
  height: number;
}): { x: number; y: number; width: number; height: number } {
  const clamp = (v: number) => Math.min(1, Math.max(0, v));
  return {
    x: clamp(bb.x),
    y: clamp(bb.y),
    width: clamp(bb.width),
    height: clamp(bb.height),
  };
}

export function matchQuestionRef(
  questionRef: string,
  questions: { _id: any; number: string; subPart?: string | null }[],
) {
  if (!questionRef) return null;
  // strip Q/q prefix, spaces, dots
  const clean = questionRef.replace(/^Q\.?\s*/i, '').trim();
  // try number + subpart match e.g. "11a" or "11 a"
  const match = clean.match(/^(\d+)\s*([a-zA-Z])?/);
  if (!match) return null;
  const num = match[1];
  const sub = match[2]?.toLowerCase() || null;
  return (
    questions.find(
      (q) =>
        String(q.number).trim() === num &&
        (q.subPart ? String(q.subPart).trim().toLowerCase() : null) === sub,
    ) || null
  );
}

