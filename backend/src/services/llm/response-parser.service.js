function fallbackAnswer(topSources) {
  return {
    conditionOverview:
      "The assistant could not generate a full structured answer,  but the highest-ranked evidence sources are still available below.",
    researchInsights: topSources
      .slice(0, 3)
      .map(
        (source) =>
          `${source.title} (${source.platform}${source.year ? `, ${source.year}` : ""})`,
      ),
    clinicalTrials: topSources
      .filter((source = source.type === "clinical_trial"))
      .slice(0, 2)
      .map(
        (source) =>
          `${source.title}${source.trial?.status ? ` - ${source.trial.status}` : ""}`,
      ),
    personalizedTakeaway:
      "The ranked sources below can still be used to continue the research session.",
    sourceAttribution: topSources
      .slice(0, 5)
      .map((source) => `${source.platform}: ${source.title}`),
    medicalDisclaimer:
      "This information is educational only and is not medical advice.",
  };
}

export function parserMedicalAnswer(raw, topSources) {
  try {
    const parsed = JSON.parse(raw);

    return {
      conditionOverview: parsed.conditionOverview || "",
      researchInsights: Array.isArray(parsed.researchInsights)
        ? parsed.researchInsights
        : [],
      personalizedTakeaway: parsed.personalizedTakeaway || "",
      sourceAttribution: Array.isArray(parsed.sourceAttribution)
        ? parsed.sourceAttribution
        : [],
      medicalDisclaimer:
        parsed.medicalDisclaimer ||
        "This information is educational only and is not medical advice.",
    };
  } catch {
    return fallbackAnswer(topSources);
  }
}
