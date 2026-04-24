import { debugLog } from "../../utils/debug.js";
import { termMatchScore, tokenize } from "./text-scoring.js";

const currentYear = new Date().getFullYear();

// Newer papers get higher score 15%
function scoreRecency(year) {
  if (!year) {
    return 0.25;
  }

  const age = Math.max(0, currentYear - year);

  if (age <= 2) {
    return 1;
  }

  if (age <= 5) {
    return 0.78;
  }

  if (age <= 10) {
    return 0.52;
  }

  return 0.3;
}

// Source trust is weighted 15%
function scoreCredibility(source) {
  if (
    source.platform === "PubMed" ||
    source.platform === "ClinicalTrials.gov"
  ) {
    return 1;
  }

  if (source.platform === "OpenAlex") {
    return source.url.includes("doi.org") ||
      source.url.startsWith("https://doi.org")
      ? 0.86
      : 0.72;
  }

  return 0.5;
}

// Completeness if paper has title, abstract, authors, year, URL 10%
function scoreCompleteness(source) {
  const checks = [
    Boolean(source.title),
    Boolean(source.abstract || source.supportingSnippet),
    source.authors.length > 0 || source.type === "clinical_trial",
    Boolean(source.year),
    Boolean(source.url),
  ];

  return checks.filter(Boolean).length / checks.length;
}

// Context relevance bonus up to 10% only for clicial trails
function scoreContextBonus(source, query) {
  let score = 0;
  const reasons = [];

  if (source.type === "clinical_trial") {
    const status = source.trial?.status?.toLowerCase() ?? "";

    if (
      ["recruiting", "active", "not yet recruiting"].some((value) =>
        status.includes(value),
      )
    ) {
      score += 0.5;
      reasons.push("Active or recruiting trial status");
    }

    if (query.location) {
      const locationText =
        source.trial?.locations?.join(" ").toLowerCase() ?? "";
      const locationTokens = tokenize(query.location);

      if (locationTokens.some((token) => locationText.includes(token))) {
        score += 0.5;
        reasons.push("Matched requested location");
      }
    }
  }

  return {
    score: Math.min(1, score),
    reasons,
  };
}

function scoreRelevance(source, query) {
  const diseaseTerms = tokenize(query.disease);
  const intentTerms = tokenize(query.intent || query.originalMessage);
  const terms = [...diseaseTerms, ...intentTerms];
  const titleScore = termMatchScore(source.title, terms, 1.4);
  const abstractScore = termMatchScore(
    `${source.abstract} ${source.supportingSnippet}`,
    terms,
    1,
  );
  const trialScore = source.trial
    ? termMatchScore(
        [
          ...(source.trial.conditions ?? []),
          ...(source.trial.interventions ?? []),
          ...(source.trial.locations ?? []),
        ].join(" "),
        terms,
        1,
      )
    : 0;

  return Math.min(
    1,
    titleScore * 0.55 + abstractScore * 0.35 + trialScore * 0.1,
  );
}

// creates a structured response for frontend
function buildRankingReasons(source, query, contextReasons) {
  const reasons = [];
  const title = source.title.toLowerCase();
  const diseaseTokens = tokenize(query.disease);
  const intentTokens = tokenize(query.intent || query.originalMessage);

  if (diseaseTokens.some((token) => title.includes(token))) {
    reasons.push("Matched disease in title");
  }

  if (intentTokens.some((token) => title.includes(token))) {
    reasons.push("Matched query intent in title");
  }

  if (source.year && currentYear - source.year <= 5) {
    reasons.push("Recent source");
  }

  if (
    source.platform === "PubMed" ||
    source.platform === "ClinicalTrials.gov"
  ) {
    reasons.push(`${source.platform} source`);
  }

  reasons.push(...contextReasons);

  return reasons.slice(0, 4);
}

// concept gives better ranking
function scoreConceptMatch(source, queryTerms) {
  if (!source.concepts) return 0;

  const conceptText = source.concepts
    .map((c) => c.display_name.toLowerCase())
    .join(" ");

  let score = 0;

  queryTerms.forEach((term) => {
    if (conceptText.includes(term)) {
      score += 0.1;
    }
  });

  return Math.min(score, 0.3);
}

export function rankSources({
  candidates,
  understoodQuery,
  selectedLimit = 8,
}) {
  const queryTerms = [
    understoodQuery.intent,
    understoodQuery.disease,
    understoodQuery.originalMessage,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .split(/\s+/);

  const rankedSources = candidates
    .map((source) => {
      const relevance = scoreRelevance(source, understoodQuery);
      const recency = scoreRecency(source.year);
      const credibility = scoreCredibility(source);
      const completeness = scoreCompleteness(source);
      const contextBonus = scoreContextBonus(source, understoodQuery);
      // v1
      // const final =
      //   relevance * 0.5 +
      //   recency * 0.15 +
      //   credibility * 0.15 +
      //   completeness * 0.1 +
      //   contextBonus.score * 0.1;
      //v2
      const semanticScore =
        typeof source.semanticScore === "number" &&
        !Number.isNaN(source.semanticScore)
          ? source.semanticScore
          : 0;
      const conceptScore = scoreConceptMatch(source, queryTerms);
      const final =
        relevance * 0.3 +
        semanticScore * 0.3 +
        recency * 0.15 +
        credibility * 0.15 +
        completeness * 0.05 +
        conceptScore * 0.1;

      return {
        ...source,
        scores: {
          relevance,
          semantic: semanticScore,
          concept: conceptScore,
          recency,
          credibility,
          completeness,
          contextBonus: contextBonus.score,
          final,
        },
        rankingReason: buildRankingReasons(
          source,
          understoodQuery,
          contextBonus.reasons,
        ),
      };
    })
    .sort(
      (left, right) => (right.scores?.final ?? 0) - (left.scores?.final ?? 0),
    );

  const selectedPublications = rankedSources
    .filter((source) => source.type === "publication")
    .slice(0, 10);
  const selectedTrials = rankedSources
    .filter((source) => source.type === "clinical_trial")
    .slice(0, 5);
  const topSources = [...selectedPublications, ...selectedTrials]
    .sort(
      (left, right) => (right.scores?.final ?? 0) - (left.scores?.final ?? 0),
    )
    .slice(0, selectedLimit);
  const rankingStats = {
    rankedCount: rankedSources.length,
    selectedCount: topSources.length,
    highestScore: Number((rankedSources[0]?.scores?.final ?? 0).toFixed(3)),
  };

  // temporarily
  console.log("\nTOP RESULTS:");
  rankedSources.slice(0, 5).forEach((s, i) => {
    console.log({
      rank: i + 1,
      title: s.title,
      relevance: s.scores.relevance,
      semantic: s.scores.semantic,
      final: s.scores.final,
    });
  });

  return {
    rankedSources,
    topSources,
    rankingStats,
  };
}
