import { fetchWithTimeout } from "./http.js";

function reconstructAbstract(index) {
  if (!index) {
    return "";
  }

  const words = [];

  for (const [word, positions] of Object.entries(index)) {
    for (const position of positions) {
      words.push({ word, position });
    }
  }

  return words
    .sort((left, right) => left.position - right.position)
    .map((item) => item.word)
    .join(" ");
}

export async function fetchOpenAlexSources(queries, limit = 50) {
  const perQuery = Math.max(10, Math.ceil(limit / Math.max(queries.length, 1)));
  const results = [];

  for (const query of queries.slice(0, 3)) {
    const url = new URL("https://api.openalex.org/works");
    url.searchParams.set("search", query);
    url.searchParams.set("per-page", String(Math.min(perQuery, 50)));
    url.searchParams.set("page", "1");
    url.searchParams.set("sort", "relevance_score:desc");
    url.searchParams.set("filter", "from_publication_date:2020-01-01");

    const response = await fetchWithTimeout(url.toString());
    const payload = await response.json();

    for (const work of payload.results ?? []) {
      const abstract = reconstructAbstract(work.abstract_inverted_index);
      const title = work.display_name || work.title || "Untitled OpenAlex work";
      const url = work.doi || work.primary_location?.landing_page_url || work.id || "https://openalex.org/";

      results.push({
        type: "publication",
        title,
        abstract,
        authors:
          work.authorships
            ?.map((authorship) => authorship.author?.display_name)
            .filter(Boolean)
            .slice(0, 8) ?? [],
        year: work.publication_year,
        platform: "OpenAlex",
        url,
        supportingSnippet: abstract.slice(0, 260) || title,
        raw: work,
      });
    }
  }

  return results.slice(0, limit);
}
