import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
// read client not needed in this file
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { updateInventorySchema } from "@/lib/validators";

export async function PUT(req: NextRequest, context: { params: Promise<{ itemId: string }> }) {
  const { itemId: itemIdStr } = await context.params;
  const itemId = Number(itemIdStr);
  if (!Number.isFinite(itemId)) return NextResponse.json({ error: "Invalid itemId" }, { status: 400 });
  const json = await req.json().catch(() => ({}));
  const parse = updateInventorySchema.safeParse(json);
  if (!parse.success) return NextResponse.json({ error: parse.error.flatten() }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from("inventory")
    .upsert({ item_id: itemId, on_hand: parse.data.on_hand })
    .select("*")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}


