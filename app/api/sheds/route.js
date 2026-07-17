// GET /api/sheds?gc=<business name or license #>
// GET /api/sheds?address=<house number + street>
//
// Proxies NYC Open Data server-side (avoids CORS, hides query mechanics,
// lets Next.js cache responses) and returns per-site shed summaries.

import { NextResponse } from "next/server";
import { fetchShedPermits } from "../../../lib/socrata";
import { groupPermitsIntoSites } from "../../../lib/sites";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const gc = searchParams.get("gc")?.trim() || "";
  const address = searchParams.get("address")?.trim() || "";

  if (!gc && !address) {
    return NextResponse.json(
      { error: "Provide ?gc= (business name or license #) or ?address=" },
      { status: 400 }
    );
  }
  if ((gc || address).length < 3) {
    return NextResponse.json(
      { error: "Search term must be at least 3 characters" },
      { status: 400 }
    );
  }

  try {
    const rows = await fetchShedPermits({ gc, address });
    const sites = groupPermitsIntoSites(rows);
    return NextResponse.json({
      query: { gc: gc || undefined, address: address || undefined },
      permitRows: rows.length,
      siteCount: sites.length,
      activeCount: sites.filter((s) => !s.signedOff).length,
      sites,
    });
  } catch (err) {
    return NextResponse.json(
      { error: `Upstream data error: ${err.message}` },
      { status: 502 }
    );
  }
}
