"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import ShedTable from "../components/ShedTable";
import { monthlyFine, CITYWIDE_AVG_LF } from "../../lib/fines";

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export default function Dashboard() {
  const router = useRouter();

  const [mode, setMode] = useState("gc"); // 'gc' | 'address'
  const [query, setQuery] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showClosed, setShowClosed] = useState(false);
  const [lfMap, setLfMap] = useState({}); // jobNumber -> linear feet
  const [savedSearch, setSavedSearch] = useState(null);

  const runSearch = useCallback(async (searchMode, searchQuery) => {
    if (!searchQuery || searchQuery.trim().length < 3) {
      setError("Enter at least 3 characters.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ [searchMode]: searchQuery.trim() });
      const res = await fetch(`/api/sheds?${params}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      setData(json);
    } catch (err) {
      setError(err.message);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Auth gate + restore saved portfolio & linear-feet overrides.
  useEffect(() => {
    if (localStorage.getItem("shedclock_auth") !== "1") {
      router.replace("/");
      return;
    }
    try {
      const lf = JSON.parse(localStorage.getItem("shedclock_lf") || "{}");
      setLfMap(lf);
      const saved = JSON.parse(localStorage.getItem("shedclock_search") || "null");
      if (saved) {
        setSavedSearch(saved);
        setMode(saved.mode);
        setQuery(saved.query);
        runSearch(saved.mode, saved.query);
      }
    } catch {
      /* corrupted storage — start fresh */
    }
  }, [router, runSearch]);

  function onLfChange(jobNumber, value) {
    const next = { ...lfMap, [jobNumber]: value };
    setLfMap(next);
    localStorage.setItem("shedclock_lf", JSON.stringify(next));
  }

  function saveAsPortfolio() {
    const saved = { mode, query: query.trim() };
    localStorage.setItem("shedclock_search", JSON.stringify(saved));
    setSavedSearch(saved);
  }

  function logout() {
    localStorage.removeItem("shedclock_auth");
    router.replace("/");
  }

  const sites = data?.sites || [];
  const active = sites.filter((s) => !s.signedOff);
  const visible = showClosed ? sites : active;

  const expired = active.filter((s) => s.daysLeft != null && s.daysLeft < 0);
  const expiring30 = active.filter(
    (s) => s.daysLeft != null && s.daysLeft >= 0 && s.daysLeft <= 30
  );
  const totalExposure = active.reduce(
    (sum, s) =>
      sum + monthlyFine(s.ageYears, lfMap[s.jobNumber] ?? CITYWIDE_AVG_LF).monthly,
    0
  );

  const isSavedCurrent =
    savedSearch && savedSearch.mode === mode && savedSearch.query === query.trim();

  return (
    <>
      <header className="topbar">
        <div className="brand">
          🏗️ Shed<span>Clock</span>
        </div>
        <button className="btn-ghost btn" onClick={logout}>
          Log out
        </button>
      </header>

      <main className="container">
        <form
          className="search-row"
          onSubmit={(e) => {
            e.preventDefault();
            runSearch(mode, query);
          }}
        >
          <div className="seg">
            <button
              type="button"
              className={mode === "gc" ? "active" : ""}
              onClick={() => setMode("gc")}
            >
              GC name / license #
            </button>
            <button
              type="button"
              className={mode === "address" ? "active" : ""}
              onClick={() => setMode("address")}
            >
              Address
            </button>
          </div>
          <input
            className="input"
            placeholder={
              mode === "gc"
                ? "e.g. SPRING SCAFFOLDING or 607447"
                : "e.g. 344 3 AVENUE"
            }
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button className="btn" type="submit" disabled={loading}>
            {loading ? "Searching…" : "Search"}
          </button>
          {data && !isSavedCurrent && (
            <button type="button" className="btn btn-ghost" onClick={saveAsPortfolio}>
              ★ Save as my portfolio
            </button>
          )}
        </form>

        {error && <p className="error">{error}</p>}

        {data && (
          <>
            <div className="cards">
              <div className="card">
                <div className="num">{active.length}</div>
                <div className="lbl">Active shed sites</div>
              </div>
              <div className="card danger">
                <div className="num">{expired.length}</div>
                <div className="lbl">Permits already expired</div>
              </div>
              <div className="card warn">
                <div className="num">{expiring30.length}</div>
                <div className="lbl">Expiring within 30 days</div>
              </div>
              <div className="card money">
                <div className="num">{money.format(totalExposure)}</div>
                <div className="lbl">Est. monthly fine exposure</div>
              </div>
            </div>

            {visible.length === 0 ? (
              <p className="muted">
                No {showClosed ? "" : "active "}shed permits found for this search.
              </p>
            ) : (
              <ShedTable sites={visible} lfMap={lfMap} onLfChange={onLfChange} />
            )}

            {sites.length > active.length && (
              <p style={{ marginTop: "0.8rem" }}>
                <button
                  className="btn btn-ghost small"
                  onClick={() => setShowClosed(!showClosed)}
                >
                  {showClosed
                    ? "Hide signed-off jobs"
                    : `Show ${sites.length - active.length} signed-off job(s)`}
                </button>
              </p>
            )}

            <p className="footnote">
              Data: NYC DOB NOW Approved Permits (updated daily by DOB). Shed age
              is measured from the site&apos;s first permit — renewals don&apos;t
              reset it. Fine estimates use Local Law 49 of 2025 rates ($10 / $100
              / $200 per linear foot per month by shed age, capped at $6,000/mo)
              and assume the shed would be deemed idle; DOB waivers and cure
              periods may apply. Linear footage defaults to the citywide average
              of {CITYWIDE_AVG_LF} LF — edit per site to match your permit.
              Estimates for planning, not legal advice.
            </p>
          </>
        )}

        {!data && !error && (
          <p className="muted" style={{ marginTop: "2rem" }}>
            Search your company name or DOB license number to see every active
            sidewalk shed in your portfolio, when each 90-day permit expires,
            and what an idle shed would cost per month under the 2026 rules.
          </p>
        )}
      </main>
    </>
  );
}
