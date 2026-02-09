export const CITATION_REGEX =
  /(?:^|\s)((?:Ptk|Btk|Mt|Pp|Kp|Ákr|Be)\.?\s*[0-9]+(?::[0-9]+)?(?:[–\-][0-9]+(?::[0-9]+)?)?\.\s*§(?:\s*-\s*ok)?(?:\s*\([0-9]+\)\s*bekezdés)?)/gi;

export function buildJogtarUrl(citation: string): string {
  const query = encodeURIComponent(citation.trim());
  return `https://www.google.com/search?q=site:net.jogtar.hu+${query}`;
}
