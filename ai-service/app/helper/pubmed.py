# app/helper/pubmed.py
from __future__ import annotations

import re
from typing import Any
import xmltodict
from app.helper.http import fetch_with_timeout


def to_list(val: Any) -> list:
    if not val:
        return []
    return val if isinstance(val, list) else [val]


def text_value(val: Any) -> str:
    if not val:
        return ""
    if isinstance(val, (str, int, float)):
        return str(val)
    if isinstance(val, dict):
        return str(val.get("#text", ""))
    return ""


def parse_year(article: dict) -> int | None:
    pub_date = article.get("MedlineCitation", {}).get("Article", {}).get("Journal", {}).get("JournalIssue", {}).get("PubDate", {})
    year = text_value(pub_date.get("Year"))
    medline_date = text_value(pub_date.get("MedlineDate"))
    
    match = re.search(r"\d{4}", year or medline_date)
    return int(match.group(0)) if match else None


def parse_authors(article: dict) -> list[str]:
    author_list = article.get("MedlineCitation", {}).get("Article", {}).get("AuthorList", {}).get("Author")
    authors = []
    
    for author in to_list(author_list):
        if author.get("CollectiveName"):
            authors.append(author["CollectiveName"])
            continue

        fore = author.get("ForeName") or author.get("Initials")
        last = author.get("LastName")
        full_name = " ".join(filter(None, [fore, last])).strip()
        if full_name:
            authors.append(full_name)

    return authors[:8]


def parse_abstract(article: dict) -> str:
    abstract_text = article.get("MedlineCitation", {}).get("Article", {}).get("Abstract", {}).get("AbstractText")
    parts = [text_value(item) for item in to_list(abstract_text)]
    return " ".join(filter(None, parts))


async def fetch_pub_med_sources(queries: list[str], limit: int = 50) -> list[dict[str, Any]]:
    # Search using the broadest valid query available
    search_query = next((q for q in reversed(queries) if q), "")
    if not search_query:
        return []

    search_params = {
        "db": "pubmed",
        "term": search_query,
        "retmax": str(limit),
        "sort": "pub date",
        "retmode": "json",
    }

    # Don't wrap in try/except here; let settle_source handle and log any errors
    search_res = await fetch_with_timeout(
        "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi",
        params=search_params
    )
    search_data = search_res.json()
    ids = search_data.get("esearchresult", {}).get("idlist", [])

    if not ids:
        return []

    fetch_params = {
        "db": "pubmed",
        "id": ",".join(ids),
        "retmode": "xml",
    }

    detail_res = await fetch_with_timeout(
        "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi",
        params=fetch_params,
        timeout_seconds=16.0
    )
    xml_text = detail_res.text
    parsed = xmltodict.parse(xml_text)

    articles = to_list(parsed.get("PubmedArticleSet", {}).get("PubmedArticle"))
    results = []

    for article in articles:
        pmid = text_value(article.get("MedlineCitation", {}).get("PMID"))
        title = text_value(article.get("MedlineCitation", {}).get("Article", {}).get("ArticleTitle")) or "Untitled PubMed article"
        abstract = parse_abstract(article)

        results.append({
            "type": "publication",
            "title": title,
            "abstract": abstract,
            "authors": parse_authors(article),
            "year": parse_year(article),
            "platform": "PubMed",
            "url": f"https://pubmed.ncbi.nlm.nih.gov/{pmid}/" if pmid else "https://pubmed.ncbi.nlm.nih.gov/",
            "supportingSnippet": abstract[:260] or title,
            # "raw": article,
        })

    return results