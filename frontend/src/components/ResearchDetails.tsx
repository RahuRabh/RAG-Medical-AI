import { useState } from "react";
import type { RetrievalMetadata } from "../types/chat";

type ResearchDetailsProps = {
  metadata: RetrievalMetadata;
};

export function ResearchDetails({ metadata }: ResearchDetailsProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="research-details-accordion">
      <button
        type="button"
        className={`research-details-toggle ${isOpen ? "open" : ""}`}
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <span className="research-details-label">Research details</span>

        <span className="chevron">{isOpen ? "▲" : "▼"}</span>
      </button>

      {isOpen && (
        <div className="research-details-body">
          <div className="research-detail-row">
            <span className="research-detail-label">Candidates</span>

            <div className="research-detail-pills">
              <span className="research-detail-pill">
                Fetched {metadata.retrievalStats.totalBeforeDedup}
              </span>

              <span className="research-detail-pill">
                Unique {metadata.retrievalStats.totalAfterDedup}
              </span>

              <span className="research-detail-pill">
                Selected {metadata.rankingStats.selectedCount}
              </span>
            </div>
          </div>

          <div className="research-detail-row">
            <span className="research-detail-label">Sources</span>

            <div className="research-detail-pills">
              <span className="research-detail-pill">
                PubMed {metadata.retrievalStats.pubMedCount}
              </span>

              <span className="research-detail-pill">
                OpenAlex {metadata.retrievalStats.openAlexCount}
              </span>

              <span className="research-detail-pill">
                ClinicalTrials {metadata.retrievalStats.clinicalTrialsCount}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
