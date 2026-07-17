// lib/socrata.js
// Thin client for the NYC Open Data (Socrata) API.
// Dataset: DOB NOW: Build – Approved Permits (rbx6-tga4), updated daily.
// https://data.cityofnewyork.us/Housing-Development/DOB-NOW-Build-Approved-Permits/rbx6-tga4

const BASE = "https://data.cityofnewyork.us/resource/rbx6-tga4.json";

const FIELDS = [
  "job_filing_number",
  "work_permit",
  "filing_reason",
  "house_no",
  "street_name",
  "borough",
  "bin",
  "issued_date",
  "expired_date",
  "approved_date",
  "permit_status",
  "applicant_business_name",
  "applicant_license",
  "estimated_job_costs",
  "latitude",
  "longitude",
].join(",");

// Escape single quotes for SoQL string literals (prevents query injection).
function soqlString(value) {
  return `'${String(value).replace(/'/g, "''")}'`;
}

/**
 * Fetch sidewalk shed permits matching a GC (business name or license #)
 * or an address. Returns raw Socrata rows, newest first.
 */
export async function fetchShedPermits({ gc, address }) {
  const conditions = [`work_type = 'Sidewalk Shed'`];

  if (gc) {
    const q = gc.trim().toUpperCase();
    // License numbers are all digits; otherwise treat as a business-name search.
    if (/^\d+$/.test(q)) {
      conditions.push(`applicant_license = ${soqlString(q)}`);
    } else {
      conditions.push(
        `upper(applicant_business_name) like ${soqlString(`%${q}%`)}`
      );
    }
  }

  if (address) {
    const parts = address.trim().toUpperCase().split(/\s+/);
    // Leading token that contains a digit = house number, rest = street.
    if (parts.length > 1 && /\d/.test(parts[0])) {
      const houseNo = parts[0];
      const street = parts.slice(1).join(" ");
      conditions.push(`house_no = ${soqlString(houseNo)}`);
      conditions.push(`upper(street_name) like ${soqlString(`%${street}%`)}`);
    } else {
      conditions.push(
        `upper(street_name) like ${soqlString(`%${parts.join(" ")}%`)}`
      );
    }
  }

  const params = new URLSearchParams({
    $select: FIELDS,
    $where: conditions.join(" AND "),
    $order: "issued_date DESC",
    // Sized to the data: the largest shed applicant citywide (Spring
    // Scaffolding) has ~4,300 permit rows, so 5,000 captures any firm's
    // full history — truncation would silently understate shed ages —
    // without payloads big enough to risk serverless timeouts.
    $limit: "5000",
  });

  const res = await fetch(`${BASE}?${params}`, {
    // Revalidate at most hourly — the dataset only updates daily.
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    throw new Error(`NYC Open Data returned ${res.status}`);
  }
  return res.json();
}
