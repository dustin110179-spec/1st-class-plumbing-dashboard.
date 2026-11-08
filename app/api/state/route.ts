import { sql } from "@/lib/db";
import { getIdentity } from "../../../cursor/identity";
import type { AppState } from "@/lib/types";

export const dynamic = "force-dynamic";

function unauthorized() {
  return Response.json(
    { error: "unauthorized" },
    { status: 401, headers: { "cache-control": "private, no-store" } },
  );
}

function ownerKey(identity: { sub: string; stage: string }): string {
  return `${identity.sub}:${identity.stage}`;
}

export async function GET(request: Request) {
  const identity = await getIdentity(request);
  if (!identity.verified) return unauthorized();
  const rows = await sql<{ payload: AppState; updated_at: string }>(
    "select payload, updated_at from app_state where owner_id = $1",
    [ownerKey(identity)],
  );
  return Response.json(
    { payload: rows[0]?.payload ?? null, updatedAt: rows[0]?.updated_at ?? null },
    { headers: { "cache-control": "private, no-store" } },
  );
}

export async function PUT(request: Request) {
  const identity = await getIdentity(request);
  if (!identity.verified) return unauthorized();
  const body = (await request.json()) as AppState;
  if (!body || body.version !== 1) {
    return Response.json({ error: "invalid payload" }, { status: 400 });
  }
  const encoded = JSON.stringify(body);
  if (encoded.length > 2_000_000) {
    return Response.json({ error: "payload too large" }, { status: 413 });
  }
  await sql(
    `insert into app_state (owner_id, payload, updated_at)
     values ($1, $2::jsonb, now())
     on conflict (owner_id) do update set payload = excluded.payload, updated_at = now()`,
    [ownerKey(identity), encoded],
  );
  return Response.json({ ok: true }, { headers: { "cache-control": "private, no-store" } });
}
