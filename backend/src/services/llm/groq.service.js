import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function generateGroqMedicalAnswer(prompt) {
  const completion = await groq.chat.completions.create({
    model: process.env.GROQ_MODEL || "llama-3.1-8b-instant",
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You are a medical research assistant. Use only the provided evidence. Never invent studies, URLs, authors, citations, or statistics. If evidence is limited, clearly say so. Do not diagnose or prescribe. Return valid JSON only.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  return completion.choices[0]?.message?.content ?? "";
}