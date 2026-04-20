export function buildMedicalPrompt({ message, context, sources }) {
  const sourceSummary = sources
    .map((source, index) => {
      return `
            Source ${index + 1}
            Platform: ${source.title}
            YEAR: ${source.year ?? "Unknown"}
            Authors: ${source.authors?.join(", ") || "Unknown"}
            Snippet: ${source.snippet || source.abstract || "No abstract"}
            Trial Status: ${source.trial?.status || "N/A"}
            URL: ${source.url || "N/A"}
            Ranking Reason: ${(source.rankingReason || []).join(", ")}
            `;
    })
    .join("\n-----------\n");

  return `
        User Question: ${message}

        Active Context: 
        Disease: ${context.disease || "Unknown"}
        Intent: ${context.intent || "Unknown"}
        Location: ${context.location || "Unknown"}
        Follow Up: ${context.isFollowUp ? "Yes" : "No"}

        Evidence Sources:
        ${sourceSummary}

        Return ONLY valid JSON with this exact shape:
        {
        "conditionOverview" : "string",
        "researchInsights": ["string"],
        "clinicalTrials": ["string"],
        "personalizedTakeaway": "string",
        "sourceAttribution": ["string"],
        "medicalDisclaimer": "string"
        }

        RULES:
        - Use only the evidence above
        - Mention uncertaiity if evidence is weak
        - Do not recommend diagnosis or treatment
        - keep researchInsights to 3-5 bullet points
        - Keep sourceAttribution short and reference the provided titles/platforms only
        `;
}
