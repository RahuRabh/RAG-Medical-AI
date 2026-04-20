import { XMLParser } from "fast-xml-parser";

import { fetchWithTimeout } from "./http.js";

function toArray(value) {
  if (!value) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
}

function textValue(value) {
  if (!value) {
    return "";
  }

  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }

  if (typeof value === "object" && "#text" in value) {
    return String(value["#text"] ?? "");
  }

  return "";
}

function parseYear(article) {
  const pubDate = article.MedlineCitation?.Article?.Journal?.JournalIssue?.PubDate;
  const year = textValue(pubDate?.Year);
  const medlineYear = pubDate?.MedlineDate?.match(/\d{4}/)?.[0];
  const parsed = Number(year || medlineYear);

  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseAuthors(article) {
  return toArray(article.MedlineCitation?.Article?.AuthorList?.Author)
    .map((author) => {
      if (author.CollectiveName) {
        return author.CollectiveName;
      }

      return [author.ForeName || author.Initials, author.LastName].filter(Boolean).join(" ");
    })
    .filter(Boolean)
    .slice(0, 8);
}

function parseAbstract(article) {
  const abstractText = article.MedlineCitation?.Article?.Abstract?.AbstractText;
  return toArray(abstractText).map(textValue).filter(Boolean).join(" ");
}

function parsePmid(article) {
  return textValue(article.MedlineCitation?.PMID);
}

export async function fetchPubMedSources(queries, limit = 50) {
  const searchQuery = queries[0] ?? "";
  const searchUrl = new URL("https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi");
  searchUrl.searchParams.set("db", "pubmed");
  searchUrl.searchParams.set("term", searchQuery);
  searchUrl.searchParams.set("retmax", String(limit));
  searchUrl.searchParams.set("sort", "pub date");
  searchUrl.searchParams.set("retmode", "json");

  const searchResponse = await fetchWithTimeout(searchUrl.toString());
  const searchPayload = await searchResponse.json();
  const ids = searchPayload.esearchresult?.idlist ?? [];

  if (ids.length === 0) {
    return [];
  }

  const fetchUrl = new URL("https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi");
  fetchUrl.searchParams.set("db", "pubmed");
  fetchUrl.searchParams.set("id", ids.join(","));
  fetchUrl.searchParams.set("retmode", "xml");

  const detailResponse = await fetchWithTimeout(fetchUrl.toString(), 16000);
  const xml = await detailResponse.text();
  const parser = new XMLParser({
    ignoreAttributes: false,
    removeNSPrefix: true,
  });
  const parsed = parser.parse(xml);

  return toArray(parsed.PubmedArticleSet?.PubmedArticle).map((article) => {
    const pmid = parsePmid(article);
    const title = textValue(article.MedlineCitation?.Article?.ArticleTitle) || "Untitled PubMed article";
    const abstract = parseAbstract(article);

    return {
      type: "publication",
      title,
      abstract,
      authors: parseAuthors(article),
      year: parseYear(article),
      platform: "PubMed",
      url: pmid ? `https://pubmed.ncbi.nlm.nih.gov/${pmid}/` : "https://pubmed.ncbi.nlm.nih.gov/",
      supportingSnippet: abstract.slice(0, 260) || title,
      raw: article,
    };
  });
}
