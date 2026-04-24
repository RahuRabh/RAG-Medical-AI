export function expandQuery(query) {
  const disease = query.disease || "";
  const intent = query.intent || query.originalMessage || "";

  const primaryQuery =
    [intent, disease].filter(Boolean).join(" ").trim() ||
    query.originalMessage;

  const publicationQueries = [
    primaryQuery,
    `${primaryQuery} treatment`,
    `${primaryQuery} outcomes`,
  ];

  const clinicalTrialQueries = [
    `${disease} ${intent}`,
    `${disease} clinical trial`,
  ];

  return {
    primaryQuery,
    publicationQueries,
    clinicalTrialQueries,
    displayQuery:
      disease && intent ? `${intent} for ${disease}` : primaryQuery,
  };
}