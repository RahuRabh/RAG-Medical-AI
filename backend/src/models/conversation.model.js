import { Schema, model } from "mongoose";

const conversationSchema = new Schema(
  {
    patientName: {
      type: String,
      trim: true,
      default: "",
    },
    activeDisease: {
      type: String,
      trim: true,
      default: "",
    },
    activeIntent: {
      type: String,
      trim: true,
      default: "",
    },
    activeLocation: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
  },
);

export const Conversation = model("Conversation", conversationSchema);
