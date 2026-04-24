import { testQueries } from "./queries.js";
import { handleMockChat } from "../services/chat/chat.service.js";

async function runBenchmark() {
  for (const test of testQueries) {
    console.log("\n==============================");
    console.log("TEST:", test.name);

    const result = await handleMockChat({
      message: test.input.intent,
      structuredContext: test.input,
      conversationId: null,
    });

    console.log("\nTop Sources:");
    result.sources.slice(0, 3).forEach((s, i) => {
      console.log(`${i + 1}. ${s.title}`);
    });
  }
}

runBenchmark();