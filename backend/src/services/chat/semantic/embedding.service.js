import { pipeline } from "@huggingface/transformers";

let extractor;
const cache = new Map();

export async function getEmbedding(text) {
  if (cache.has(text)) {
    return cache.get(text);
  }

  if (!extractor) {
    extractor = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
  }

  const result = await extractor(text, {
    pooling: "mean",
    normalize: true,
  });

  const embedding = Array.from(result.data);

  cache.set(text, embedding);

  return embedding;
}
