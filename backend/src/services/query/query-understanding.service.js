import { getEmbedding } from "../chat/semantic/embedding.service.js";
import { cosineSimilarity } from "../chat/semantic/similarity.service.js";

const followUpPatterns = [
  /^what about\b/i,
  /^can i\b/i,
  /^is it\b/i,
  /^are there\b/i,
  /^any\b/i,
  /^side effects?\b/i,
  /^compare\b/i,
  /\bnear me\b/i,
  /\bthis treatment\b/i,
  /\bthis medication\b/i,
  /\bthese trials\b/i,
];

function clean(value) {
  return value?.trim() ?? "";
}

export async function understandQuery({
  message,
  structuredContext,
  conversationContext,
}) {
  const originalMessage = clean(message);
  const structuredDisease = clean(structuredContext?.disease);
  const structuredIntent = clean(structuredContext?.intent);
  const structuredLocation = clean(structuredContext?.location);
  const hasFreshStructuredContext = Boolean(structuredDisease || structuredIntent);
  // const isFollowUp =
  //   !hasFreshStructuredContext && followUpPatterns.some((pattern) => pattern.test(originalMessage));

  let isFollowUp =
  !hasFreshStructuredContext &&
  followUpPatterns.some((pattern) => pattern.test(originalMessage));

// Semantic fallback
if (!isFollowUp && conversationContext?.activeIntent) {
  try {
    const currentEmbedding = await getEmbedding(originalMessage);
    const previousEmbedding = await getEmbedding(
      `${conversationContext.activeIntent} ${conversationContext.activeDisease}`
    );

    const similarity = cosineSimilarity(currentEmbedding, previousEmbedding);

    if (similarity > 0.45) {
      isFollowUp = true;
    }
  } catch (e) {
    console.log("Embedding could not complete", e);
    
  }
}

  const disease =
    structuredDisease || (isFollowUp ? clean(conversationContext?.activeDisease) : "") || clean(conversationContext?.activeDisease);
  const intent = structuredIntent || originalMessage || clean(conversationContext?.activeIntent);
  const location =
    structuredLocation || (isFollowUp ? clean(conversationContext?.activeLocation) : "") || clean(conversationContext?.activeLocation);
  const patientName = clean(structuredContext?.patientName) || clean(conversationContext?.patientName);

  return {
    patientName,
    disease,
    intent,
    location,
    isFollowUp,
    originalMessage,
    normalizedQuery: [intent, disease].filter(Boolean).join(" ").trim() || originalMessage,
  };
}
