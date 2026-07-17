// lib/sites.js
// Turns raw permit rows into per-site summaries.
//
// One shed = one DOB job filing, but each job accumulates multiple permit
// rows over time: the initial permit ("-I1") plus a renewal every 90 days
// ("-S1", "-S2", ...) under Local Law 48 of 2025. We group rows by the job
// number base (e.g. "M00219985" from "M00219985-I1") so each shed appears
// once, with its full permit history condensed into the facts a GC needs.

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function jobBase(jobFilingNumber) {
  return String(jobFilingNumber || "").split("-")[0];
}

function toDate(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function groupPermitsIntoSites(rows, now = new Date()) {
  const groups = new Map();

  for (const row of rows) {
    const key = jobBase(row.job_filing_number);
    if (!key) continue;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  }

  const sites = [];

  for (const [jobNumber, permits] of groups) {
    // Newest permit (rows arrive sorted issued_date DESC, but nulls can
    // lead, so sort defensively).
    const dated = permits
      .map((p) => ({ ...p, _issued: toDate(p.issued_date) }))
      .sort((a, b) => (b._issued?.getTime() || 0) - (a._issued?.getTime() || 0));

    const latest = dated[0];
    const firstPermit =
      dated
        .filter((p) => p._issued)
        .sort((a, b) => a._issued - b._issued)[0]?._issued ||
      toDate(latest.approved_date);

    const expires = toDate(latest.expired_date);
    const daysLeft = expires
      ? Math.ceil((expires.getTime() - now.getTime()) / MS_PER_DAY)
      : null;

    // "Signed-off" means DOB closed the job — the shed should be down.
    const signedOff = latest.permit_status === "Signed-off";

    const ageDays = firstPermit
      ? Math.floor((now.getTime() - firstPermit.getTime()) / MS_PER_DAY)
      : null;

    const renewals = permits.filter((p) =>
      /renewal/i.test(p.filing_reason || "")
    ).length;

    sites.push({
      jobNumber,
      address: [latest.house_no, latest.street_name]
        .filter(Boolean)
        .join(" ")
        .trim(),
      borough: latest.borough || "",
      bin: latest.bin || "",
      gcName: latest.applicant_business_name || "",
      gcLicense: latest.applicant_license || "",
      permitStatus: latest.permit_status || "",
      signedOff,
      firstPermitDate: firstPermit ? firstPermit.toISOString() : null,
      latestIssuedDate: latest._issued ? latest._issued.toISOString() : null,
      expirationDate: expires ? expires.toISOString() : null,
      daysLeft,
      ageDays,
      ageYears: ageDays != null ? +(ageDays / 365.25).toFixed(2) : null,
      renewals,
      permitCount: permits.length,
      latitude: latest.latitude ? Number(latest.latitude) : null,
      longitude: latest.longitude ? Number(latest.longitude) : null,
    });
  }

  // Active sheds first, most urgent deadline on top; signed-off jobs last.
  sites.sort((a, b) => {
    if (a.signedOff !== b.signedOff) return a.signedOff ? 1 : -1;
    return (a.daysLeft ?? Infinity) - (b.daysLeft ?? Infinity);
  });

  return sites;
}
