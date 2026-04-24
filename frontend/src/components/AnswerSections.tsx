import type {
  ResearchAnswer,
  ResearchSource,
  RetrievalMetadata,
} from "../types/chat";

import { SourceCard } from "./SourceCard";
import { ResearchDetails } from "./ResearchDetails";

interface AnswerSectionsProps {
  answer: ResearchAnswer;
  sources?: ResearchSource[];
  metadata?: RetrievalMetadata;
}

export function AnswerSections({
  answer,
  sources = [],
  metadata,
}: AnswerSectionsProps) {

  const publications = sources.filter((s) => s.type !== "clinical_trial");
  const trials = sources.filter((s) => s.type === "clinical_trial");

  return (
    <div className="answer-sections">
      <div className="answer-card">
        <p className="answer-card-label">Condition overview</p>
        <p>{answer.conditionOverview}</p>
      </div>

      {(answer.researchInsights ?? []).length > 0 && (
        <div className="answer-card">
          <p className="answer-card-label">Research insights</p>
          <ul className="answer-insights">
            {answer.researchInsights.map((insight) => (
              <li key={insight}>{insight}</li>
            ))}
          </ul>
        </div>
      )}

      {answer.personalizedTakeaway && (
        <div className="answer-card">
          <p className="answer-card-label">Personalized takeaway</p>
          <p>{answer.personalizedTakeaway}</p>
        </div>
      )}

      {(publications.length > 0 || trials.length > 0) && (
        <div className="inline-evidence">
          {publications.length > 0 && (
            <div className="inline-evidence-column">
              <p className="inline-evidence-heading">
                Source publications ({publications.length})
              </p>
              <div className="source-card-grid">
                {publications?.map((source, index) => (
                  <SourceCard
                    key={`${source.platform}-${source.title}`}
                    source={source}
                    index={index}
                  />
                ))}
              </div>
            </div>
          )}

          {trials.length > 0 && (
            <div className="inline-evidence-column">
              <p className="inline-evidence-heading">
                Clinical trials ({trials.length})
              </p>
              <div className="source-card-grid">
                {trials.map((source, index) => (
                  <SourceCard
                    key={`${source.platform}-${source.title}`}
                    source={source}
                    index={index}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Medical Disclaimer */}
      {answer.medicalDisclaimer && (
        <p className="medical-disclaimer">{answer.medicalDisclaimer}</p>
      )}

      {metadata ? <ResearchDetails metadata={metadata} /> : null}

    </div>
  );
}
