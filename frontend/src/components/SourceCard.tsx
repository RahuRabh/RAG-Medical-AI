import type { ResearchSource } from "../types/chat";

interface SourceCardProps {
  source: ResearchSource;
  index: number;
}

export function SourceCard({ source }: SourceCardProps) {
  const authorLine =
    source.authors.length > 0
      ? source.authors.slice(0, 2).join(", ") +
        (source.authors.length > 2 ? " et al." : "")
      : source.type === "clinical_trial"
        ? "Clinical trial record"
        : "Unknown authors";

  return (
    <article
      className={`source-card ${
        source.type === "clinical_trial" ? "trial-card" : "publication-card"
      }`}
    >
      <div className="source-card-top">
        <span className="source-platform-badge">{source.platform}</span>
        <span className="source-author-date">
          {(authorLine ?? "Unknown").split(" ")[0]}
          {source.year ? ` • ${source.year}` : ""}
        </span>
      </div>

      <h3>{source.title}</h3>

      {source.supportingSnippet && (
        <p className="source-snippet">{source.supportingSnippet}</p>
      )}

      <div className="source-card-footer">
        <span className="source-score">
          {source.scores ? (
  <span>
    Score{" "}
    {Number.isFinite(source.scores.final)
      ? source.scores.final.toFixed(2)
      : "0.00"}
  </span>
) : null}
        </span>

        <a
          href={source.url}
          className="source-link"
          target="_blank"
          rel="noreferrer"
        >
          Open source ↗
        </a>
      </div>
    </article>
  );
}
