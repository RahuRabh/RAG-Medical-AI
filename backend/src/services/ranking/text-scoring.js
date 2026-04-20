const stopwords = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "for",
  "in",
  "is",
  "of",
  "on",
  "or",
  "the",
  "to",
  "what",
  "with",
]);

export function tokenize(text = "") {
  return String(text)
    .toLowerCase()
    .replace(/['’]/g, "")
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 2 && !stopwords.has(token));
}

export function termMatchScore(text = "", terms = [], titleWeight = 1) {
  const normalizedText = String(text).toLowerCase();
  const uniqueTerms = [...new Set(terms)];

  if (uniqueTerms.length === 0) {
    return 0;
  }

  const matches = uniqueTerms.reduce((score, term) => {
    return normalizedText.includes(term.toLowerCase()) ? score + titleWeight : score;
  }, 0);

  return Math.min(1, matches / Math.max(uniqueTerms.length, 1));
}
