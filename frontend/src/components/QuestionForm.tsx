import type { FormEvent } from "react";
import type { StructuredContext } from "../types/chat";

type QuestionFormProps = {
  structuredContext: StructuredContext;
  message: string;
  isLoading: boolean;
  error: string;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onContextChange: (field: keyof StructuredContext, value: string) => void;
  onMessageChange: (value: string) => void;
};

export function QuestionForm({
  structuredContext,
  message,
  isLoading,
  error,
  onSubmit,
  onContextChange,
  onMessageChange,
}: QuestionFormProps) {
  return (
    <form className="question-palette" onSubmit={onSubmit}>
      <div className="question-palette-inner">
        <div className="context-fields">
          <label className="field">
            <span>Patient optional</span>
            <input
              value={structuredContext.patientName}
              onChange={(event) =>
                onContextChange("patientName", event.target.value)
              }
              placeholder="John Smith"
            />
          </label>

          <label className="field">
            <span>Disease</span>
            <input
              value={structuredContext.disease}
              onChange={(event) =>
                onContextChange("disease", event.target.value)
              }
              placeholder="Parkinson's disease"
            />
          </label>

          <label className="field">
            <span>Intent</span>
            <input
              value={structuredContext.intent}
              onChange={(event) =>
                onContextChange("intent", event.target.value)
              }
              placeholder="Deep Brain Stimulation"
            />
          </label>

          <label className="field">
            <span>Location optional</span>
            <input
              value={structuredContext.location}
              onChange={(event) =>
                onContextChange("location", event.target.value)
              }
              placeholder="Toronto, Canada"
            />
          </label>
        </div>

        <div className="message-row">
          <textarea
            id="message-input"
            value={message}
            onChange={(event) => onMessageChange(event.target.value)}
            placeholder="Ask a follow-up or describe the research question..."
            rows={1}
            disabled={isLoading}
          />

          <button className="primary-button" type="submit" disabled={isLoading}>
            {isLoading ? "Asking..." : "Ask"}
          </button>
        </div>

        {error ? <p className="form-error">{error}</p> : null}
      </div>
    </form>
  );
}
