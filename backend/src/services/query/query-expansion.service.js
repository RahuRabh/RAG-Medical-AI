const synonymMap = [
  [/deep brain stimulation/i, ["DBS"]],
  [/parkinson'?s disease|parkinson disease/i, ["Parkinson disease"]],
  [/lung cancer/i, ["lung neoplasm", "NSCLC", "SCLC"]],
  [/alzheimer'?s disease|alzheimer disease/i, ["Alzheimer disease"]],
];

function unique(values) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

export function expandQuery(query) {
  const disease = query.disease;
  const intent = query.intent || query.originalMessage;
  const primaryQuery = [intent, disease].filter(Boolean).join(" ").trim() || query.originalMessage;
  const synonyms = synonymMap.flatMap(([pattern, values]) =>
    pattern.test(primaryQuery) || pattern.test(disease) || pattern.test(intent) ? values : [],
  );

  const publicationQueries = unique([
    primaryQuery,
    [intent, disease, "treatment outcomes"].filter(Boolean).join(" "),
    [disease, intent, "clinical outcomes"].filter(Boolean).join(" "),
    ...synonyms.map((synonym) => [synonym, disease || intent].filter(Boolean).join(" ")),
  ]);

  const clinicalTrialQueries = unique([
    [disease, intent].filter(Boolean).join(" "),
    [disease, intent, "clinical trial"].filter(Boolean).join(" "),
    ...synonyms.map((synonym) => [synonym, disease, "clinical trial"].filter(Boolean).join(" ")),
  ]);

  return {
    primaryQuery,
    publicationQueries,
    clinicalTrialQueries,
    displayQuery: disease && intent ? `${intent} for ${disease}` : primaryQuery,
  };
}
