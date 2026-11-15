/**
 * GET /api/cron/evaluate — evaluates pending / failed / stuck submissions.
 * Call from any scheduler (Railway cron, Vercel Cron, GitHub Actions,
 * cron-job.org...) every few minutes with:  Authorization: Bearer <CRON_SECRET>
 */
import { timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";

import { evaluatePending } from "@/lib/ai/evaluate";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

function authorised(header: string | null): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret || !header) return false;
  const a = Buffer.from(header);
  const b = Buffer.from(`Bearer ${secret}`);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function GET(request: Request) {
  if (!authorised(request.headers.get("authorization"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const result = await evaluatePending(20);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[cron/evaluate]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
