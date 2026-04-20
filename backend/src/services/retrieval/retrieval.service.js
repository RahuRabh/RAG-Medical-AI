import { fetchClinicalTrialSources } from "./clinicaltrials.service.js";
import { fetchOpenAlexSources } from "./openalex.service.js";
import { fetchPubMedSources } from "./pubmed.service.js";

function normalizeKey(source) {
  const trialId = source.trial?.nctId;

  if (trialId) {
    return `trial:${trialId.toLowerCase()}`;
  }

  if (source.url) {
    return `url:${source.url.toLowerCase().replace(/\/$/, "")}`;
  }

  return `title:${source.title.toLowerCase().replace(/\W+/g, " ").trim()}`;
}

export function dedupeSources(sources) {
  const seen = new Map();

  for (const source of sources) {
    const key = normalizeKey(source);
    const existing = seen.get(key);

    if (!existing) {
      seen.set(key, source);
      continue;
    }

    const existingAbstractLength = existing.abstract?.length ?? 0;
    const sourceAbstractLength = source.abstract?.length ?? 0;

    if (sourceAbstractLength > existingAbstractLength) {
      seen.set(key, source);
    }
  }

  return [...seen.values()];
}

async function settleSource(name, sourceRequest) {
  try {
    return {
      name,
      sources: await sourceRequest,
      error: "",
    };
  } catch (error) {
    return {
      name,
      sources: [],
      error: error instanceof Error ? `${name}: ${error.message}` : `${name}: failed`,
    };
  }
}

export async function retrieveSources({
  expandedQuery,
  understoodQuery,
}) {
  const [openAlexResult, pubMedResult, clinicalTrialsResult] = await Promise.all([
    settleSource("OpenAlex", fetchOpenAlexSources(expandedQuery.publicationQueries, 50)),
    settleSource("PubMed", fetchPubMedSources(expandedQuery.publicationQueries, 50)),
    settleSource(
      "ClinicalTrials.gov",
      fetchClinicalTrialSources({
        disease: understoodQuery.disease,
        queries: expandedQuery.clinicalTrialQueries,
        limit: 25,
      }),
    ),
  ]);

  const candidates = [
    ...openAlexResult.sources,
    ...pubMedResult.sources,
    ...clinicalTrialsResult.sources,
  ];
  const deduped = dedupeSources(candidates);

  const stats = {
    openAlexCount: openAlexResult.sources.length,
    pubMedCount: pubMedResult.sources.length,
    clinicalTrialsCount: clinicalTrialsResult.sources.length,
    totalBeforeDedup: candidates.length,
    totalAfterDedup: deduped.length,
    errors: [openAlexResult.error, pubMedResult.error, clinicalTrialsResult.error].filter(Boolean),
  };

  return {
    candidates: deduped,
    stats,
  };
}
