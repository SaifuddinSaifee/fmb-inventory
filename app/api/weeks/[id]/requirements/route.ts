import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { upsertRequirementsSchema } from "@/lib/validators";
import type { Tables } from "@/lib/supabaseType";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id: idStr } = await context.params;
  const id = Number(idStr);
  if (!Number.isFinite(id))
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  type RequirementRow = Tables<"weekly_requirements">;
  type ItemRow = Tables<"items">;
  type VendorRow = Tables<"vendors">;
  type RequirementWithItem = RequirementRow & {
    items:
      | (Pick<ItemRow, "name" | "unit" | "vendor_id"> & {
          vendors: Pick<VendorRow, "name"> | null;
        })
      | null;
  };

  const { data, error } = await supabase
    .from("weekly_requirements")
    .select(
      "id, week_plan_id, item_id, required_qty, to_buy_override, notes, items(name, unit, vendor_id, vendors(name))"
    )
    .eq("week_plan_id", id)
    .order("id", { ascending: true })
    .returns<RequirementWithItem[]>();
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  // Normalize nested item info for client convenience
  const normalized = (data ?? []).map((r) => ({
    id: r.id,
    week_plan_id: r.week_plan_id,
    item_id: r.item_id,
    required_qty: r.required_qty,
    to_buy_override: r.to_buy_override,
    notes: r.notes ?? null,
    item: r.items
      ? {
          id: r.item_id,
          name: r.items.name,
          unit: r.items.unit,
          vendor_id: r.items.vendor_id,
          vendor_name: r.items.vendors?.name ?? null,
          on_hand: 0, // client will join from /api/items for on_hand if needed
        }
      : undefined,
  }));

  return NextResponse.json(normalized);
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id: idStr } = await context.params;
  const id = Number(idStr);
  if (!Number.isFinite(id))
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  const json = await req.json().catch(() => ({}));
  const parse = upsertRequirementsSchema.safeParse(json);
  if (!parse.success)
    return NextResponse.json({ error: parse.error.flatten() }, { status: 400 });

  const rows = parse.data.items.map((r) => ({
    week_plan_id: id,
    item_id: r.item_id,
    required_qty: r.required_qty,
    to_buy_override: r.to_buy_override ?? null,
    notes: r.notes ?? null,
  }));

  const { error } = await supabaseAdmin
    .from("weekly_requirements")
    .upsert(rows, { onConflict: "week_plan_id,item_id" });
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
