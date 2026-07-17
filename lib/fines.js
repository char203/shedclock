// lib/fines.js
// Local Law 49 of 2025 ("Get Sheds Down" package, effective Jan 12, 2026)
// introduced escalating monthly penalties for long-standing sidewalk sheds,
// assessed per linear foot of shed, tiered by the age of the shed:
//
//   < 3 years   $10 / linear ft / month
//   3–4 years   $100 / linear ft / month
//   4+ years    $200 / linear ft / month
//   Cap         $6,000 / month
//
// The dataset does not publish linear footage, so callers pass it in
// (editable in the UI). CITYWIDE_AVG_LF is the default: DOB reports
// ~1.76M linear feet across ~7,625 active sheds ≈ 230 LF per shed.
//
// These figures are planning estimates, not legal advice: DOB applies
// penalties to sheds left standing without active permitted work, and
// waivers/cure periods exist.

export const CITYWIDE_AVG_LF = 230;
export const MONTHLY_CAP = 6000;

export const TIERS = [
  { maxYears: 3, ratePerLF: 10, label: "Under 3 years" },
  { maxYears: 4, ratePerLF: 100, label: "3–4 years" },
  { maxYears: Infinity, ratePerLF: 200, label: "Over 4 years" },
];

export function fineTier(ageYears) {
  if (ageYears == null || ageYears < 0) return null;
  return TIERS.find((t) => ageYears < t.maxYears);
}

/**
 * Estimated monthly penalty exposure for a shed of a given age and length.
 * Returns { tier, monthly, capped }.
 */
export function monthlyFine(ageYears, linearFeet = CITYWIDE_AVG_LF) {
  const tier = fineTier(ageYears);
  if (!tier || !linearFeet || linearFeet <= 0) {
    return { tier: tier || null, monthly: 0, capped: false };
  }
  const raw = tier.ratePerLF * linearFeet;
  return {
    tier,
    monthly: Math.min(raw, MONTHLY_CAP),
    capped: raw > MONTHLY_CAP,
  };
}

// ---- Permit-renewal alert tiers (Local Law 48: 90-day permits) ----

export const ALERT = {
  EXPIRED: { key: "EXPIRED", label: "Permit expired", color: "var(--expired)" },
  CRITICAL: { key: "CRITICAL", label: "Renew now", color: "var(--critical)" },
  WARNING: { key: "WARNING", label: "Renew soon", color: "var(--warn)" },
  OK: { key: "OK", label: "On track", color: "var(--ok)" },
  DONE: { key: "DONE", label: "Signed off", color: "var(--muted)" },
};

export function alertTier(daysLeft, signedOff = false) {
  if (signedOff) return ALERT.DONE;
  if (daysLeft == null) return ALERT.WARNING;
  if (daysLeft < 0) return ALERT.EXPIRED;
  if (daysLeft <= 14) return ALERT.CRITICAL;
  if (daysLeft <= 30) return ALERT.WARNING;
  return ALERT.OK;
}
