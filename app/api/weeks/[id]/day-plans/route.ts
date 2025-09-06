import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { upsertDayPlansSchema } from "@/lib/validators";

export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id: idStr } = await context.params;
  const id = Number(idStr);
  if (!Number.isFinite(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const { data, error } = await supabase
    .from("day_plans")
    .select("id, week_plan_id, date, menu, rsvp")
    .eq("week_plan_id", id)
    .order("date", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id: idStr } = await context.params;
  const id = Number(idStr);
  if (!Number.isFinite(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  const json = await req.json().catch(() => ({}));
  const parse = upsertDayPlansSchema.safeParse(json);
  if (!parse.success) return NextResponse.json({ error: parse.error.flatten() }, { status: 400 });

  const rows = parse.data.days.map((d) => ({
    week_plan_id: id,
    date: d.date,
    menu: d.menu ?? null,
    rsvp: d.rsvp,
  }));

  const { error } = await supabaseAdmin
    .from("day_plans")
    .upsert(rows, { onConflict: "week_plan_id,date" });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}


