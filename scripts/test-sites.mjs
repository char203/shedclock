// Unit test for lib/sites.js grouping logic, using real rows pulled from
// the rbx6-tga4 dataset on 2026-07-14. Run: node scripts/test-sites.mjs
import { groupPermitsIntoSites, jobBase } from "../lib/sites.js";
import assert from "node:assert";

const NOW = new Date("2026-07-14T12:00:00Z");

const fixture = [
  // Site A: initial permit + one renewal, currently active, expires 2027
  {
    job_filing_number: "B00755883-I1",
    filing_reason: "Renewal Permit Without Changes",
    house_no: "545",
    street_name: "WILLOUGHBY AVENUE",
    borough: "BROOKLYN",
    bin: "3048818",
    issued_date: "2026-03-10T00:00:00.000",
    expired_date: "2027-03-10T05:00:00.000",
    approved_date: "2022-06-21T00:00:00.000",
    permit_status: "Permit Issued",
    applicant_business_name: "CENTRAL MECHANICAL SYSTEM",
    applicant_license: "000593",
  },
  {
    job_filing_number: "B00755883-I1",
    filing_reason: "Initial Permit",
    house_no: "545",
    street_name: "WILLOUGHBY AVENUE",
    borough: "BROOKLYN",
    bin: "3048818",
    issued_date: "2022-06-21T00:00:00.000",
    expired_date: "2023-06-21T04:00:00.000",
    approved_date: "2022-06-21T00:00:00.000",
    permit_status: "Signed-off",
    applicant_business_name: "CENTRAL MECHANICAL SYSTEM",
    applicant_license: "000593",
  },
  // Site B: permit lapsed 2026-06-10 but job NOT signed off -> EXPIRED alert
  {
    job_filing_number: "B01371104-I1",
    filing_reason: "Initial Permit",
    house_no: "1456",
    street_name: "BEDFORD AVENUE",
    borough: "BROOKLYN",
    bin: "3805771",
    issued_date: "2026-03-12T00:00:00.000",
    expired_date: "2026-06-10T04:00:00.000",
    approved_date: "2026-03-12T00:00:00.000",
    permit_status: "Permit Issued",
    applicant_business_name: "CLASSIC CONSULTING GROUP",
    applicant_license: "023337",
  },
  // Site C: signed off -> shed presumed down, sorts last
  {
    job_filing_number: "B00965051-I1",
    filing_reason: "Initial Permit",
    house_no: "2058",
    street_name: "UNION STREET",
    borough: "BROOKLYN",
    bin: "3080818",
    issued_date: "2023-11-22T00:00:00.000",
    expired_date: "2024-11-22T05:00:00.000",
    approved_date: "2023-11-22T00:00:00.000",
    permit_status: "Signed-off",
    applicant_business_name: "ARSENAL SCAFFOLD INC",
    applicant_license: "018914",
  },
];

// jobBase strips the filing suffix
assert.equal(jobBase("B00755883-I1"), "B00755883");
assert.equal(jobBase("M01112269-S3"), "M01112269");

const sites = groupPermitsIntoSites(fixture, NOW);

// 4 rows -> 3 sites (two B00755883 rows merged)
assert.equal(sites.length, 3);

const a = sites.find((s) => s.jobNumber === "B00755883");
const b = sites.find((s) => s.jobNumber === "B01371104");
const c = sites.find((s) => s.jobNumber === "B00965051");

// Site A: age counted from FIRST permit (2022), not the renewal
assert.equal(a.firstPermitDate.slice(0, 10), "2022-06-21");
assert.ok(a.ageYears > 4, `age should exceed 4 yrs, got ${a.ageYears}`);
assert.equal(a.renewals, 1);
assert.equal(a.permitCount, 2);
assert.ok(a.daysLeft > 200, `expires Mar 2027, got ${a.daysLeft} days`);
assert.equal(a.signedOff, false);

// Floating Socrata timestamps keep their calendar date regardless of the
// host time zone (CI runs this file under several TZ values).
assert.equal(a.latestIssuedDate.slice(0, 10), "2026-03-10");
assert.equal(a.expirationDate.slice(0, 10), "2027-03-10");

// Site B: expired 34 days ago, still open -> negative daysLeft
assert.ok(b.daysLeft < 0, `should be negative, got ${b.daysLeft}`);
assert.equal(b.signedOff, false);

// Site C: signed off
assert.equal(c.signedOff, true);

// Sort order: active sheds by urgency first, signed-off last
assert.deepEqual(
  sites.map((s) => s.jobNumber),
  ["B01371104", "B00755883", "B00965051"]
);

console.log("✓ all sites.js assertions passed");
console.log(
  sites.map((s) => ({
    job: s.jobNumber,
    addr: s.address,
    daysLeft: s.daysLeft,
    ageYears: s.ageYears,
    signedOff: s.signedOff,
  }))
);
