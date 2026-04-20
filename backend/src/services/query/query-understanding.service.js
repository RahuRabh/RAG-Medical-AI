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

export function understandQuery({
  message,
  structuredContext,
  conversationContext,
}) {
  const originalMessage = clean(message);
  const structuredDisease = clean(structuredContext?.disease);
  const structuredIntent = clean(structuredContext?.intent);
  const structuredLocation = clean(structuredContext?.location);
  const hasFreshStructuredContext = Boolean(structuredDisease || structuredIntent);
  const isFollowUp =
    !hasFreshStructuredContext && followUpPatterns.some((pattern) => pattern.test(originalMessage));

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
