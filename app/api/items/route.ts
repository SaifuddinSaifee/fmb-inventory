import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { upsertItemSchema } from "@/lib/validators";

export async function GET() {
  const { data: items, error } = await supabase
    .from("items")
    .select("id, name, unit, vendor_id, vendors(name)")
    .order("name", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  type ItemRow = {
    id: number;
    name: string;
    unit: "kg" | "g" | "L" | "ml" | "pcs";
    vendor_id: number | null;
    vendors?: { name?: string | null } | null;
  };
  const itemRows = (items ?? []) as ItemRow[];
  const ids = itemRows.map((i) => i.id);
  const { data: inv } = await supabase
    .from("inventory")
    .select("item_id, on_hand")
    .in("item_id", ids.length ? ids : [-1]);
  type InventoryRow = { item_id: number; on_hand: number };
  const invRows = (inv ?? []) as InventoryRow[];
  const map = new Map(invRows.map((r) => [r.item_id, r.on_hand]));
  const rows = itemRows.map((i) => ({
    id: i.id,
    name: i.name,
    unit: i.unit,
    vendor_id: i.vendor_id,
    vendor_name: i.vendors?.name ?? null,
    on_hand: map.get(i.id) ?? 0,
  }));
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const json = await req.json().catch(() => ({}));
  const parsed = upsertItemSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const { data, error } = await supabaseAdmin
    .from("items")
    .insert({ name: parsed.data.name, unit: parsed.data.unit, vendor_id: parsed.data.vendor_id ?? null })
    .select("*")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}


