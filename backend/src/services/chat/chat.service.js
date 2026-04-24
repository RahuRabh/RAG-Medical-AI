import { Types } from "mongoose";

import { Conversation } from "../../models/conversation.model.js";
import { Message } from "../../models/message.model.js";
import { AppError } from "../../utils/app-error.js";
import { expandQuery } from "../query/query-expansion.service.js";
import { understandQuery } from "../query/query-understanding.service.js";
import { rankSources } from "../ranking/ranking.service.js";
import { retrieveSources } from "../retrieval/retrieval.service.js";
import { buildMedicalPrompt } from "../llm/prompt-builder.service.js";
import { generateGroqMedicalAnswer } from "../llm/groq.service.js";
import { parserMedicalAnswer } from "../llm/response-parser.service.js";
import { addSemanticScores } from "./semantic/semantic-rerank.service.js";
import { debugLog } from "../../utils/debug.js";

function getContextValue(nextValue, fallback = "") {
  return nextValue?.trim() || fallback;
}

async function getOrCreateConversation(conversationId, context) {
  if (conversationId) {
    if (!Types.ObjectId.isValid(conversationId)) {
      throw new AppError("Invalid conversationId", 400);
    }

    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      throw new AppError("Conversation not found", 404);
    }

    conversation.patientName = getContextValue(
      context.patientName,
      conversation.patientName,
    );
    conversation.activeDisease = getContextValue(
      context.disease,
      conversation.activeDisease,
    );
    conversation.activeIntent = getContextValue(
      context.intent,
      conversation.activeIntent,
    );
    conversation.activeLocation = getContextValue(
      context.location,
      conversation.activeLocation,
    );

    await conversation.save();
    return conversation;
  }

  return Conversation.create({
    patientName: context.patientName?.trim() ?? "",
    activeDisease: context.disease?.trim() ?? "",
    activeIntent: context.intent?.trim() ?? "",
    activeLocation: context.location?.trim() ?? "",
  });
}

export async function handleMockChat(input) {
  const structuredContext = input.structuredContext ?? {};
  const conversation = await getOrCreateConversation(
    input.conversationId,
    structuredContext,
  );
  const understoodQuery = await understandQuery({
    message: input.message,
    structuredContext,
    conversationContext: {
      patientName: conversation.patientName,
      activeDisease: conversation.activeDisease,
      activeIntent: conversation.activeIntent,
      activeLocation: conversation.activeLocation,
    },
  });

  const expandedQuery = await expandQuery(understoodQuery);

  conversation.patientName = understoodQuery.patientName;
  conversation.activeDisease = understoodQuery.disease;
  conversation.activeIntent = understoodQuery.intent;
  conversation.activeLocation = understoodQuery.location;
  await conversation.save();

  const extractedContext = {
    patientName: understoodQuery.patientName,
    disease: understoodQuery.disease,
    intent: understoodQuery.intent,
    location: understoodQuery.location,
  };

  await Message.create({
    conversationId: conversation._id,
    role: "user",
    content: input.message,
    extractedContext,
    sourcesUsed: [],
  });

  const retrieval = await retrieveSources({
    expandedQuery,
    understoodQuery,
  });

  //v2
  const candidatesWithSemantic = await addSemanticScores(
    retrieval.candidates,
    understoodQuery,
  );

  const ranking = rankSources({
    // candidates: retrieval.candidates, v1
    candidates: candidatesWithSemantic,
    understoodQuery,
  });

  let answer;

  try {
    const prompt = buildMedicalPrompt({
      message: input.message,
      context: understoodQuery,
      sources: ranking.topSources,
    });

    const rawAnswer = await generateGroqMedicalAnswer(prompt);

    answer = parserMedicalAnswer(rawAnswer, ranking.topSources);
  } catch (error) {
    answer = {
      conditionOverview:
        "The language model is temporarily unavailable. Showing the strongest ranked evidence instead.",
      researchInsights: ranking.topSources
        .slice(0, 3)
        .map((source) => source.title),
      clinicalTrials: ranking.topSources
        .filter((source) => source.type === "clinical_trial")
        .map((source) => source.title),
      personalizedTakeaway:
        "You can still review the source cards and continue the session.",
      sourceAttribution: ranking.topSources.map(
        (source) => `${source.platform}: ${source.title}`,
      ),
      medicalDisclaimer:
        "This tool summarizes medical research for educational purposes only.",
    };
  }

  const sources = ranking.topSources.map((source) => ({
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
  }));

  await Message.create({
    conversationId: conversation._id,
    role: "assistant",
    content: answer,
    extractedContext,
    sourcesUsed: sources,
  });

  const recentMessages = await Message.find({
    conversationId: conversation._id,
  })
    .sort({ createdAt: -1 })
    .limit(8)
    .lean();

  return {
    conversationId: conversation._id.toString(),
    answer,
    sources,
    context: extractedContext,
    metadata: {
      retrievalStats: retrieval.stats,
      expandedQuery,
      activeContext: understoodQuery,
      rankingStats: ranking.rankingStats,
    },
    messages: recentMessages.reverse(),
  };
}

export async function listChatSessions() {
  const conversations = await Conversation.find()
    .sort({ updatedAt: -1 })
    .limit(20)
    .lean();

  return conversations.map((conversation) => ({
    id: conversation._id.toString(),
    title:
      conversation.activeDisease || conversation.activeIntent
        ? [conversation.activeDisease, conversation.activeIntent]
            .filter(Boolean)
            .join(" - ")
        : "Untitled research session",
    patientName: conversation.patientName,
    activeDisease: conversation.activeDisease,
    activeIntent: conversation.activeIntent,
    activeLocation: conversation.activeLocation,
    updatedAt: conversation.updatedAt,
  }));
}

export async function getChatSession(conversationId) {
  if (!Types.ObjectId.isValid(conversationId)) {
    throw new AppError("Invalid conversationId", 400);
  }

  const conversation = await Conversation.findById(conversationId).lean();

  if (!conversation) {
    throw new AppError("Conversation not found", 404);
  }

  const messages = await Message.find({ conversationId })
    .sort({ createdAt: 1 })
    .lean();

  return {
    conversation: {
      id: conversation._id.toString(),
      patientName: conversation.patientName,
      activeDisease: conversation.activeDisease,
      activeIntent: conversation.activeIntent,
      activeLocation: conversation.activeLocation,
    },
    messages,
  };
}
