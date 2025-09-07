import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { updateWeekStatusSchema } from "@/lib/validators";

export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id: idStr } = await context.params;
  const id = Number(idStr);
  if (!Number.isFinite(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  const { data, error } = await supabase
    .from("week_plans")
    .select("*, day_plans(*), weekly_requirements(*)")
    .eq("id", id)
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id: idStr } = await context.params;
  const id = Number(idStr);
  if (!Number.isFinite(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const json = await req.json().catch(() => ({}));
  const parse = updateWeekStatusSchema.safeParse(json);
  if (!parse.success) return NextResponse.json({ error: parse.error.flatten() }, { status: 400 });
  const { data, error } = await supabaseAdmin
    .from("week_plans")
    .update({ status: parse.data.status })
    .eq("id", id)
    .select("*")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}


export async function DELETE(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id: idStr } = await context.params;
  const id = Number(idStr);
  if (!Number.isFinite(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  // Delete child rows first to emulate ON DELETE CASCADE behavior
  const { error: reqDelErr } = await supabaseAdmin
    .from("weekly_requirements")
    .delete()
    .eq("week_plan_id", id);
  if (reqDelErr) return NextResponse.json({ error: reqDelErr.message }, { status: 500 });

  const { error: dayDelErr } = await supabaseAdmin
    .from("day_plans")
    .delete()
    .eq("week_plan_id", id);
  if (dayDelErr) return NextResponse.json({ error: dayDelErr.message }, { status: 500 });

  const { error: weekErr } = await supabaseAdmin
    .from("week_plans")
    .delete()
    .eq("id", id);
  if (weekErr) return NextResponse.json({ error: weekErr.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}


