import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id: idStr } = await context.params;
  const id = Number(idStr);
  if (!Number.isFinite(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  // Fetch requirements for this week with item and vendor info
  const { data: reqs, error } = await supabase
    .from("weekly_requirements")
    .select("item_id, required_qty, to_buy_override, notes, items(name, unit, vendor_id, vendors(name))")
    .eq("week_plan_id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  type RequirementRow = {
    item_id: number;
    required_qty: number;
    to_buy_override: number | null;
    notes: string | null;
    items?: { name?: string | null; unit?: string | null; vendors?: { name?: string | null } | null } | null;
  };

  const reqRows = (reqs ?? []) as RequirementRow[];

  const itemIds = reqRows.map((r) => r.item_id);
  // Fetch inventory for these items
  const { data: inv } = await supabase
    .from("inventory")
    .select("item_id, on_hand")
    .in("item_id", itemIds.length ? itemIds : [-1]);

  const onHandMap = new Map((inv ?? []).map((r) => [r.item_id, r.on_hand as number]));

  const rows = reqRows.map((r) => {
    const onHand = onHandMap.get(r.item_id) ?? 0;
    const required = (r.required_qty as number) ?? 0;
    const override = (r.to_buy_override as number | null) ?? null;
    const autoToBuy = Math.max(0, required - onHand);
    const toBuy = override ?? autoToBuy;
    return {
      item_id: r.item_id as number,
      item_name: r.items?.name ?? "",
      unit: r.items?.unit ?? "",
      vendor_name: r.items?.vendors?.name ?? null,
      on_hand: onHand,
      required_qty: required,
      to_buy: toBuy,
      notes: r.notes ?? null,
    };
  });

  // Sort by vendor then item for stable display
  rows.sort((a, b) => {
    const va = (a.vendor_name ?? "").localeCompare(b.vendor_name ?? "");
    if (va !== 0) return va;
    return a.item_name.localeCompare(b.item_name);
  });

  return NextResponse.json(rows);
}