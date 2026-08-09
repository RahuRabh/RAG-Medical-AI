import axios from "axios";

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://127.0.0.1:8000";

export async function callAiPipeline(payload) {
  try {
    const response = await axios.post(`${AI_SERVICE_URL}/api/chat`, payload, {
      headers: { "Content-Type": "application/json" },
      timeout: 30000,
    });

    return response.data;
  } catch (error) {
    console.log(
      "Error calling Python AI Service:",
      error.response?.data || error.message,
    );
    throw new Error(
      error.response?.data?.detail || "Failed to process request in AI Service",
    );
  }
}
