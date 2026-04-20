import { SourceCard } from "./SourceCard";
import type { ResearchSource } from "../types/chat";

type SourceGridProps = {
  title: string;
  sources: ResearchSource[];
  emptyText: string;
};

export function SourceGrid({ title, sources, emptyText }: SourceGridProps) {
  return (
    <div className="source-grid-wrapper">
      <div className="section-row-heading">
        <h3>{title}</h3>
        <span>{sources.length}</span>
      </div>

      {sources.length > 0 ? (
        <div className="source-grid">
          {sources.map((source, index) => (
            <SourceCard
              key={`${source.platform}-${source.title}-${index}`}
              source={source}
              index={index}
            />
          ))}
        </div>
      ) : (
        <p className="muted-text">{emptyText}</p>
      )}
    </div>
  );
}