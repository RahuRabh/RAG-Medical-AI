function clean(value) {
  return value?.trim() ?? "";
}

export function buildRetrievalResearchResponse({
  message,
  context,
  sources,
  retrievalStats,
  expandedQuery,
  rankingStats,
}) {
  const disease = clean(context.disease) || "the selected condition";
  const intent = clean(context.intent) || clean(message) || "the research question";
  const publicationCount = sources.filter((source) => source.type === "publication").length;
  const trialCount = sources.filter((source) => source.type === "clinical_trial").length;
  const topPublication = sources.find((source) => source.type === "publication");
  const topTrial = sources.find((source) => source.type === "clinical_trial");

  const answer = {
    conditionOverview: `${disease} is the active research context. CuraLink expanded the request to "${expandedQuery.displayQuery}" and searched across biomedical publications and clinical trials before ranking the strongest sources.`,
    researchInsights: [
      `Retrieved ${retrievalStats.totalAfterDedup} unique candidates from OpenAlex, PubMed, and ClinicalTrials.gov, then ranked ${rankingStats.rankedCount} sources by relevance, recency, credibility, completeness, and context fit.`,
      topPublication
        ? `Top publication signal: "${topPublication.title}" from ${topPublication.platform}${topPublication.year ? ` (${topPublication.year})` : ""}.`
        : `No publication source was strong enough for "${intent}" yet; try a broader treatment or condition query.`,
      `Showing ${publicationCount} publication source${publicationCount === 1 ? "" : "s"} and ${trialCount} clinical trial source${trialCount === 1 ? "" : "s"} from the ranked set.`,
    ],
    clinicalTrials: [
      topTrial
        ? `Most relevant trial signal: "${topTrial.title}"${topTrial.trial?.status ? ` with status ${topTrial.trial.status}` : ""}.`
        : "No matching recruiting clinical trial was selected in the top ranked results.",
    ],
    personalizedTakeaway: context.isFollowUp
      ? `This appears to be a follow-up, so CuraLink reused the active disease context "${disease}" while searching for "${intent}".`
      : `For this session, follow-up questions will reuse "${disease}" so retrieval stays context-aware instead of generic.`,
    medicalDisclaimer:
      "This tool summarizes medical research for educational purposes only. It is not medical advice, diagnosis, or a treatment recommendation.",
  };

  return {
    answer,
    sources: sources.map((source) => ({
      type: source.type,
      title: source.title,
      abstract: source.abstract,
      authors: source.authors,
      year: source.year,
      platform: source.platform,
      url: source.url,
      supportingSnippet: source.supportingSnippet,
      trial: source.trial,
      scores: source.scores,
      rankingReason: source.rankingReason,
    })),
  };
}
