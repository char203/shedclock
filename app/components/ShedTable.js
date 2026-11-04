"use client";

import { alertTier, monthlyFine, CITYWIDE_AVG_LF } from "../../lib/fines";

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

function fmtDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

function DaysBadge({ site }) {
  const tier = alertTier(site.daysLeft, site.signedOff);
  const text = site.signedOff
    ? "Signed off"
    : site.daysLeft == null
    ? "No date"
    : site.daysLeft < 0
    ? `${Math.abs(site.daysLeft)}d overdue`
    : `${site.daysLeft}d left`;
  return (
    <span className="badge" style={{ color: tier.color }} title={tier.label}>
      {text}
    </span>
  );
}

export default function ShedTable({ sites, lfMap, onLfChange }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Site</th>
            <th>Boro</th>
            <th>Shed age</th>
            <th>Renewals</th>
            <th>Permit expires</th>
            <th>Status</th>
            <th title="Linear feet of shed — edit to match your permit">
              Linear ft
            </th>
            <th title="Estimated LL49 monthly penalty if idle">
              Est. fine /mo
            </th>
          </tr>
        </thead>
        <tbody>
          {sites.map((site) => {
            const lf = lfMap[site.jobNumber] ?? CITYWIDE_AVG_LF;
            const fine = monthlyFine(site.ageYears, lf);
            return (
              <tr key={site.jobNumber} className={site.signedOff ? "closed" : ""}>
                <td>
                  <div>{site.address || site.jobNumber}</div>
                  <div className="muted small">
                    {site.jobNumber} · since {fmtDate(site.firstPermitDate)}
                  </div>
                </td>
                <td>{site.borough.slice(0, 2)}</td>
                <td>
                  {site.ageYears != null ? `${site.ageYears.toFixed(1)} yr` : "—"}
                  {fine.tier && (
                    <div className="muted small">
                      ${fine.tier.ratePerLF}/LF/mo
                    </div>
                  )}
                </td>
                <td>{site.renewals}</td>
                <td>{fmtDate(site.expirationDate)}</td>
                <td>
                  <DaysBadge site={site} />
                </td>
                <td>
                  <input
                    type="number"
                    min="0"
                    className="lf-input"
                    value={lf}
                    disabled={site.signedOff}
                    onChange={(e) =>
                      onLfChange(site.jobNumber, Number(e.target.value))
                    }
                  />
                </td>
                <td>
                  {site.signedOff ? (
                    <span className="muted">—</span>
                  ) : (
                    <>
                      <strong>{money.format(fine.monthly)}</strong>
                      {fine.capped && (
                        <span className="muted small"> (capped)</span>
                      )}
                    </>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
