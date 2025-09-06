import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { upsertVendorSchema } from "@/lib/validators";

export async function GET() {
  const { data, error } = await supabase
    .from("vendors")
    .select("*")
    .order("name", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const json = await req.json().catch(() => ({}));
  const parsed = upsertVendorSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const { data, error } = await supabaseAdmin
    .from("vendors")
    .insert(parsed.data)
    .select("*")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}


