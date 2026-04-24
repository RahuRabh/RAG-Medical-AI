export const testQueries = [
  {
    name: "Direct query",
    input: {
      disease: "male pattern baldness",
      intent: "finasteride treatment",
    },
  },
  {
    name: "Layman query",
    input: {
      disease: "",
      intent: "medicine for thinning hair",
    },
  },
  {
    name: "Synonym variation",
    input: {
      disease: "hair loss",
      intent: "best treatment",
    },
  },
  {
    name: "Follow-up",
    input: {
      disease: "",
      intent: "what about side effects",
    },
    context: {
      activeDisease: "male pattern baldness",
      activeIntent: "finasteride",
    },
  },
  {
    name: "Clinical trial intent",
    input: {
      disease: "parkinson disease",
      intent: "deep brain stimulation trials",
      location: "Canada",
    },
  },
];