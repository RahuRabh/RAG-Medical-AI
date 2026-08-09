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
import { callAiPipeline } from "../ai/ai.client.js";

function getContextValue(nextValue, fallback = "") {
  return nextValue?.trim() || fallback;
}

async function getOrCreateConversation(conversationId, context, userId) {
  if (conversationId) {
    if (!Types.ObjectId.isValid(conversationId)) {
      throw new AppError("Invalid conversationId", 400);
    }

    const conversation = await Conversation.findOne({
      _id: conversationId,
      userId,
    });

    if (!conversation) {
      throw new AppError("Conversation not found", 404);
    }

    // Only auto-update the title if the current title is completely blank or matches the initial placeholder.
    if (!conversation.title || conversation.title === "New research session") {
      const derivedTitle = context.disease?.trim() || context.intent?.trim();
      if (derivedTitle) {
        conversation.title = derivedTitle;
      }
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

  // 3. INITIAL CREATION BLOCK (With fixed typo references)
  const initialDisease = context.disease?.trim();
  const initialIntent = context.intent?.trim();
  const initialTitle = initialDisease || initialIntent;

  return Conversation.create({
    userId,
    title: initialTitle,
    patientName: context.patientName?.trim() ?? "",
    activeDisease: context.disease?.trim() ?? "",
    activeIntent: context.intent?.trim() ?? "",
    activeLocation: context.location?.trim() ?? "",
  });
}

// export async function processChatRequest(input) {
//   const structuredContext = input.structuredContext ?? {};
//   const conversation = await getOrCreateConversation(
//     input.conversationId,
//     structuredContext,
//     input.userId,
//   );

//   const understoodQuery = await understandQuery({
//     message: input.message,
//     structuredContext,
//     conversationContext: {
//       patientName: conversation.patientName,
//       activeDisease: conversation.activeDisease,
//       activeIntent: conversation.activeIntent,
//       activeLocation: conversation.activeLocation,
//     },
//   });

//   const expandedQuery = await expandQuery(understoodQuery);

//   conversation.patientName = understoodQuery.patientName;
//   conversation.activeDisease = understoodQuery.disease;
//   conversation.activeIntent = understoodQuery.intent;
//   conversation.activeLocation = understoodQuery.location;
//   await conversation.save();

//   const extractedContext = {
//     patientName: understoodQuery.patientName,
//     disease: understoodQuery.disease,
//     intent: understoodQuery.intent,
//     location: understoodQuery.location,
//   };

//   await Message.create({
//     conversationId: conversation._id,
//     role: "user",
//     content: input.message,
//     extractedContext,
//     sourcesUsed: [],
//   });

//   const retrieval = await retrieveSources({
//     expandedQuery,
//     understoodQuery,
//   });

//   //v2
//   const candidatesWithSemantic = await addSemanticScores(
//     retrieval.candidates,
//     understoodQuery,
//   );

//   const ranking = rankSources({
//     // candidates: retrieval.candidates, v1
//     candidates: candidatesWithSemantic,
//     understoodQuery,
//   });

//   let answer;

//   try {
//     const prompt = buildMedicalPrompt({
//       message: input.message,
//       context: understoodQuery,
//       sources: ranking.topSources,
//     });

//     const rawAnswer = await generateGroqMedicalAnswer(prompt);
//     answer = parserMedicalAnswer(rawAnswer, ranking.topSources);
//   } catch (error) {
//     console.error("========== LLM ERROR ==========", error);

//     answer = {
//       conditionOverview:
//         "The language model is temporarily unavailable. Showing the strongest ranked evidence instead.",
//       researchInsights: ranking.topSources
//         .slice(0, 8)
//         .map((source) => source.title),
//       clinicalTrials: ranking.topSources
//         .filter((source) => source.type === "clinical_trial")
//         .map((source) => source.title),
//       personalizedTakeaway:
//         "You can still review the source cards and continue the session.",
//       sourceAttribution: ranking.topSources.map(
//         (source) => `${source.platform}: ${source.title}`,
//       ),
//       medicalDisclaimer:
//         "This tool summarizes medical research for educational purposes only.",
//     };
//   }

//   const sources = ranking.topSources.map((source) => ({
//     type: source.type,
//     title: source.title,
//     abstract: source.abstract,
//     authors: source.authors,
//     year: source.year,
//     platform: source.platform,
//     url: source.url,
//     supportingSnippet: source.supportingSnippet,
//     trial: source.trial,
//     scores: source.scores,
//     rankingReason: source.rankingReason,
//   }));

//   await Message.create({
//     conversationId: conversation._id,
//     role: "assistant",
//     content: answer,
//     extractedContext,
//     sourcesUsed: sources,
//   });

//   const recentMessages = await Message.find({
//     conversationId: conversation._id,
//   })
//     .sort({ createdAt: -1 })
//     .limit(8)
//     .lean();

//   return {
//     conversationId: conversation._id.toString(),
//     answer,
//     sources,
//     context: extractedContext,
//     metadata: {
//       retrievalStats: retrieval.stats,
//       expandedQuery,
//       activeContext: understoodQuery,
//       rankingStats: ranking.rankingStats,
//     },
//     messages: recentMessages.reverse(),
//   };
// }

export async function processChatRequest(input) {
  const structuredContext = input.structuredContext ?? {};

  // Get or create conversation in MongoDB
  const conversation = await getOrCreateConversation(
    input.conversationId,
    structuredContext,
    input.userId,
  );

  // Calling Python AI MicroServices
  const aiResult = await callAiPipeline({
    message: input.message,
    structuredContext,
    conversationContext: {
      patientName: conversation.patientName || "",
      activeDisease: conversation.activeDisease || "",
      activeIntent: conversation.activeIntent || "",
      activeLocation: conversation.activeLocation || "",
    },
  });

  const { answer, sources, context, metadata } = aiResult;

  // Update conversation fields from Python extracted context
  if (context.patientName) conversation.patientName = context.patientName;
  if (context.disease) conversation.activeDisease = context.disease;
  if (context.intent) conversation.activeIntent = context.intent;
  if (context.location) conversation.activeLocation = context.location;

  await conversation.save();

  // save user message in db
  await Message.create({
    conversationId: conversation._id,
    role: "user",
    content: input.message,
    extractedContext: context,
    sourcesUsed: [],
  });

  // save assistant message in db
  await Message.create({
    conversationId: conversation._id,
    role: "assistant",
    content: answer,
    extractedContext: context,
    sourcesUsed: sources,
  });

  // fetch recent messages
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
    context,
    metadata: {
      retrievalStats: metadata.retrievalStats,
      expandQuery: metadata.expandQuery,
      activeContext: metadata.activeContext,
      rankingStats: metadata.rankingStats,
    },
    messages: recentMessages.reverse(),
  };
}

export async function listChatSessions(userId) {
  const conversations = await Conversation.find({ userId })
    .sort({ updatedAt: -1 })
    .limit(20)
    .lean();

  return conversations.map((conversation) => ({
    id: conversation._id.toString(),
    title: conversation.title?.trim() || "research session",
    patientName: conversation.patientName,
    activeDisease: conversation.activeDisease,
    activeIntent: conversation.activeIntent,
    activeLocation: conversation.activeLocation,
    updatedAt: conversation.updatedAt,
  }));
}

export async function getChatSession(conversationId, userId) {
  if (!Types.ObjectId.isValid(conversationId)) {
    throw new AppError("Invalid conversationId", 400);
  }

  const conversation = await Conversation.findOne({
    _id: conversationId,
    userId,
  }).lean();

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

export async function deleteChatMessage(conversationId, userId) {
  if (!Types.ObjectId.isValid(conversationId)) {
    throw new AppError("Invalid conversation ID", 400);
  }

  const conversation = await Conversation.findOne({
    _id: conversationId,
    userId: userId,
  }).lean();

  if (!conversation) {
    throw new AppError("Unauthorized: You do not own this conversation", 403);
  }

  await Conversation.findByIdAndDelete(conversationId);
  await Message.deleteMany({ conversationId: conversationId });

  return {
    success: true,
    conversationId: conversationId,
  };
}

export async function renameChatSessions(conversationId, userId, newTitle) {
  if (!Types.ObjectId.isValid(conversationId)) {
    throw new AppError("Invalid conversation ID", 400);
  }

  const trimmedTitle = newTitle?.trim();
  if (!trimmedTitle) {
    throw new AppError("Title content cannot be blank", 400);
  }

  const updatedConversation = await Conversation.findOneAndUpdate(
    {
      _id: conversationId,
      userId: userId,
    },
    {
      $set: { title: trimmedTitle },
    },
    {
      returnDocument: "after",
      timestamps: false,
    },
    { returnDocument: "after" },
  ).lean();

  if (!updatedConversation) {
    throw new AppError("Unauthorized: You do not own this conversation", 403);
  }

  return {
    success: true,
    message: "Title updated successfuly",
    conversation: updatedConversation,
  };
}
