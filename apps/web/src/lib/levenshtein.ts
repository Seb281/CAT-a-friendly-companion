/**
 * Compute the Levenshtein distance between two strings.
 */
export function levenshteinDistance(a: string, b: string): number {
  const la = a.length;
  const lb = b.length;

  // Early exits
  if (la === 0) return lb;
  if (lb === 0) return la;

  // Use a single-row DP approach for space efficiency
  let prev = Array.from({ length: lb + 1 }, (_, i) => i);
  let curr = new Array<number>(lb + 1);

  for (let i = 1; i <= la; i++) {
    curr[0] = i;
    for (let j = 1; j <= lb; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        prev[j]! + 1, // deletion
        curr[j - 1]! + 1, // insertion
        prev[j - 1]! + cost // substitution
      );
    }
    [prev, curr] = [curr, prev];
  }

  return prev[lb]!;
}

/**
 * Check if the user's input is close enough to the target string,
 * using case-insensitive Levenshtein distance.
 */
export function isCloseEnough(
  input: string,
  target: string,
  maxDistance: number = 2
): boolean {
  const normalizedInput = input.trim().toLowerCase();
  const normalizedTarget = target.trim().toLowerCase();

  if (normalizedInput === normalizedTarget) return true;

  return levenshteinDistance(normalizedInput, normalizedTarget) <= maxDistance;
}
