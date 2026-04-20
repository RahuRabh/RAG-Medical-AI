export type StructuredContext = {
  patientName: string;
  disease: string;
  intent: string;
  location: string;
};

export type ResearchAnswer = {
  conditionOverview: string;
  researchInsights: string[];
  clinicalTrials: string[];
  personalizedTakeaway: string;
  sourceAttribution: string[];
  medicalDisclaimer: string;
};

export type ResearchSource = {
  type?: "publication" | "clinical_trial";
  title: string;
  abstract?: string;
  authors: string[];
  year?: number;
  platform: "PubMed" | "OpenAlex" | "ClinicalTrials.gov";
  url: string;
  supportingSnippet: string;
  trial?: {
    nctId?: string;
    status?: string;
    phase?: string;
    conditions?: string[];
    interventions?: string[];
    locations?: string[];
  };
  scores?: {
    relevance: number;
    recency: number;
    credibility: number;
    completeness: number;
    contextBonus: number;
    final: number;
  };
  rankingReason?: string[];
};

export type RetrievalMetadata = {
  retrievalStats: {
    openAlexCount: number;
    pubMedCount: number;
    clinicalTrialsCount: number;
    totalBeforeDedup: number;
    totalAfterDedup: number;
    errors: string[];
  };
  expandedQuery: {
    primaryQuery: string;
    publicationQueries: string[];
    clinicalTrialQueries: string[];
    displayQuery: string;
  };
  activeContext: {
    patientName?: string;
    disease?: string;
    intent?: string;
    location?: string;
    isFollowUp?: boolean;
    normalizedQuery?: string;
  };
  rankingStats: {
    rankedCount: number;
    selectedCount: number;
    highestScore: number;
  };
};

export type ChatResponse = {
  conversationId: string;
  answer: ResearchAnswer;
  sources: ResearchSource[];
  metadata?: RetrievalMetadata;
  context: {
    patientName?: string;
    disease?: string;
    intent?: string;
    location?: string;
  };
};

export type ChatSessionSummary = {
  id: string;
  title: string;
  patientName?: string;
  activeDisease?: string;
  activeIntent?: string;
  activeLocation?: string;
  updatedAt: string;
};

export type StoredMessage = {
  _id: string;
  role: "user" | "assistant";
  content: string | ResearchAnswer;
  sourcesUsed?: ResearchSource[];
};

export type ChatMessage =
  | {
      id: string;
      role: "user";
      content: string;
    }
  | {
      id: string;
      role: "assistant";
      answer: ResearchAnswer;
      sources: ResearchSource[];
      metadata?: RetrievalMetadata;
    };
