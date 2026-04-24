import { debugLog } from "../../../utils/debug.js";
import { getEmbedding } from "./embedding.service.js";
import { cosineSimilarity } from "./similarity.service.js";

export async function addSemanticScores(candidates, understoodQuery) {
  const queryText =
    understoodQuery?.normalizedQuery ||
    [
      understoodQuery?.intent,
      understoodQuery?.disease,
      understoodQuery?.originalMessage,
    ]
      .filter(Boolean)
      .join(" ")
      .trim();

  if (!queryText) {
    console.warn("❌ Empty queryText — skipping semantic scoring");

    return candidates.map((c) => ({
      ...c,
      semanticScore: 0,
    }));
  }

  const queryEmbedding = await getEmbedding(queryText);

  const updated = [];

  for (const source of candidates) {
    const sourceText = [source.title, source.abstract, source.supportingSnippet]
      .filter(Boolean)
      .join(" ")
      .trim();

    if (!sourceText) {
      updated.push({
        ...source,
        semanticScore: 0,
      });
      continue;
    }

    const sourceEmbedding = await getEmbedding(sourceText);

    if (!sourceEmbedding || sourceEmbedding.lenth === 0) {
      updated.push({
        ...source,
        semanticScore: 0,
      });
      continue;
    }

    const semanticScore = cosineSimilarity(queryEmbedding, sourceEmbedding);

    if (!Number.isFinite(semanticScore)) {
      semanticScore = 0;
    }

    updated.push({
      ...source,
      semanticScore,
    });
  }

  return updated;
}
