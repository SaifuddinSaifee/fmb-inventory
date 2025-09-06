import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
// read client not needed in this file
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { updateItemSchema } from "@/lib/validators";

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id: idStr } = await context.params;
  const id = Number(idStr);
  if (!Number.isFinite(id))
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  const json = await req.json().catch(() => ({}));
  const parsed = updateItemSchema.safeParse(json);
  if (!parsed.success)
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  const { data, error } = await supabaseAdmin
    .from("items")
    .update(parsed.data)
    .eq("id", id)
    .select("*")
    .single();
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id: idStr } = await context.params;
  const id = Number(idStr);
  if (!Number.isFinite(id))
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  // Delete dependent rows first to satisfy FK constraints
  const { error: reqError } = await supabaseAdmin
    .from("weekly_requirements")
    .delete()
    .eq("item_id", id);
  if (reqError)
    return NextResponse.json({ error: reqError.message }, { status: 500 });

  const { error: invError } = await supabaseAdmin
    .from("inventory")
    .delete()
    .eq("item_id", id);
  if (invError)
    return NextResponse.json({ error: invError.message }, { status: 500 });

  const { error } = await supabaseAdmin.from("items").delete().eq("id", id);
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
