import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { createWeekSchema } from "@/lib/validators";

export async function GET() {
  const { data, error } = await supabase
    .from("week_plans")
    .select("*")
    .order("id", { ascending: false })
    .limit(25);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const json = await req.json().catch(() => ({}));
  const parse = createWeekSchema.safeParse(json);
  if (!parse.success) {
    return NextResponse.json({ error: parse.error.flatten() }, { status: 400 });
  }
  const { data, error } = await supabaseAdmin
    .from("week_plans")
    .insert({ start_date: parse.data.start_date, status: "Draft" })
    .select("*")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Create 7 day placeholders (Mon-Sun) if not present
  const start = new Date(parse.data.start_date);
  const days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return {
      week_plan_id: data.id,
      date: d.toISOString().slice(0, 10),
      menu: null,
      rsvp: 0,
    };
  });
  await supabaseAdmin.from("day_plans").upsert(days, { onConflict: "week_plan_id,date" });

  return NextResponse.json(data, { status: 201 });
}


