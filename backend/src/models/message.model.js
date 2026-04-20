import { Schema, model, Types } from "mongoose";

const sourceSnapshotSchema = new Schema(
  {
    type: String,
    title: String,
    abstract: String,
    authors: [String],
    year: Number,
    platform: String,
    url: String,
    supportingSnippet: String,
    trial: Schema.Types.Mixed,
    scores: Schema.Types.Mixed,
    rankingReason: [String],
  },
  {
    _id: false,
  },
);

const messageSchema = new Schema(
  {
    conversationId: {
      type: Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: ["user", "assistant"],
      required: true,
    },
    content: {
      type: Schema.Types.Mixed,
      required: true,
    },
    extractedContext: {
      patientName: String,
      disease: String,
      intent: String,
      location: String,
    },
    sourcesUsed: [sourceSnapshotSchema],
  },
  {
    timestamps: true,
  },
);

export const Message = model("Message", messageSchema);
