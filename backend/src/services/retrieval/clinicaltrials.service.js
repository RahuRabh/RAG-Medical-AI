import { fetchWithTimeout } from "./http.js";

function parseYear(date) {
  const year = date?.match(/\d{4}/)?.[0];
  return year ? Number(year) : undefined;
}

function formatLocations(study) {
  return (
    study.protocolSection?.contactsLocationsModule?.locations
      ?.map((location) =>
        [location.facility, location.city, location.state, location.country].filter(Boolean).join(", "),
      )
      .filter(Boolean)
      .slice(0, 8) ?? []
  );
}

export async function fetchClinicalTrialSources({
  disease,
  queries,
  limit = 25,
}) {
  const query = disease || queries[0] || "";
  const fetchStudies = async (status) => {
    const url = new URL("https://clinicaltrials.gov/api/v2/studies");
    url.searchParams.set("query.cond", query);
    url.searchParams.set("pageSize", String(limit));
    url.searchParams.set("format", "json");

    if (status) {
      url.searchParams.set("filter.overallStatus", status);
    }

    if (query) {
      url.searchParams.set("query.term", queries[0] ?? query);
    }

    const response = await fetchWithTimeout(url.toString(), 14000);
    const payload = await response.json();
    return payload.studies ?? [];
  };

  let studies = await fetchStudies("RECRUITING");

  if (studies.length === 0) {
    studies = await fetchStudies();
  }

  return studies.map((study) => {
    const protocol = study.protocolSection;
    const nctId = protocol?.identificationModule?.nctId;
    const title =
      protocol?.identificationModule?.briefTitle ||
      protocol?.identificationModule?.officialTitle ||
      "Untitled clinical trial";
    const abstract = protocol?.descriptionModule?.briefSummary || protocol?.descriptionModule?.detailedDescription || "";
    const locations = formatLocations(study);
    const status = protocol?.statusModule?.overallStatus;

    return {
      type: "clinical_trial",
      title,
      abstract,
      authors: [],
      year: parseYear(protocol?.statusModule?.startDateStruct?.date),
      platform: "ClinicalTrials.gov",
      url: nctId ? `https://clinicaltrials.gov/study/${nctId}` : "https://clinicaltrials.gov/",
      supportingSnippet: abstract.slice(0, 260) || [status, ...locations].filter(Boolean).join(" - ") || title,
      trial: {
        nctId,
        status,
        phase: protocol?.designModule?.phases?.join(", "),
        conditions: protocol?.conditionsModule?.conditions ?? [],
        interventions:
          protocol?.armsInterventionsModule?.interventions
            ?.map((intervention) => intervention.name)
            .filter(Boolean) ?? [],
        locations,
      },
      raw: study,
    };
  });
}
