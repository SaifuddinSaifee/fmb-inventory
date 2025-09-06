import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { updateVendorSchema } from "@/lib/validators";

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id: idStr } = await context.params;
  const id = Number(idStr);
  if (!Number.isFinite(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  const json = await req.json().catch(() => ({}));
  const parsed = updateVendorSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const { data, error } = await supabaseAdmin
    .from("vendors")
    .update(parsed.data)
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
  const { error } = await supabaseAdmin.from("vendors").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}


