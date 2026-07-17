// Run: node scripts/test-fines.mjs
import assert from "node:assert";
import { monthlyFine, fineTier, alertTier, MONTHLY_CAP } from "../lib/fines.js";

// Tier boundaries
assert.equal(fineTier(0.5).ratePerLF, 10);
assert.equal(fineTier(2.99).ratePerLF, 10);
assert.equal(fineTier(3).ratePerLF, 100);
assert.equal(fineTier(3.99).ratePerLF, 100);
assert.equal(fineTier(4).ratePerLF, 200);
assert.equal(fineTier(10).ratePerLF, 200);
assert.equal(fineTier(null), null);

// Young shed, 100 LF -> $1,000/mo
assert.deepEqual(monthlyFine(1, 100).monthly, 1000);
assert.equal(monthlyFine(1, 100).capped, false);

// 3.5yr shed, 100 LF -> $10,000 raw, capped at $6,000
const mid = monthlyFine(3.5, 100);
assert.equal(mid.monthly, MONTHLY_CAP);
assert.equal(mid.capped, true);

// 5yr shed, default 230 LF -> 200*230 = $46,000 raw, capped
const old = monthlyFine(5);
assert.equal(old.monthly, MONTHLY_CAP);
assert.equal(old.capped, true);

// Zero/invalid linear feet -> no fine
assert.equal(monthlyFine(5, 0).monthly, 0);

// Alert tiers
assert.equal(alertTier(-1).key, "EXPIRED");
assert.equal(alertTier(0).key, "CRITICAL");
assert.equal(alertTier(14).key, "CRITICAL");
assert.equal(alertTier(15).key, "WARNING");
assert.equal(alertTier(30).key, "WARNING");
assert.equal(alertTier(31).key, "OK");
assert.equal(alertTier(5, true).key, "DONE");
assert.equal(alertTier(null).key, "WARNING");

console.log("✓ all fines.js assertions passed");
