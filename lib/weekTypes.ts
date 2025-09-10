import type { UnitAbbreviation } from "./units";

export type WeekPlan = {
  id: number;
  start_date: string;
  status: "Draft" | "Published" | "Closed";
};

export type DayPlan = {
  id: number;
  week_plan_id: number;
  date: string;
  menu: string | null;
  rsvp: number;
};

export type Item = {
  id: number;
  name: string;
  unit: UnitAbbreviation;
  vendor_id: number | null;
  vendor_name: string | null;
  on_hand: number;
};

export type WeeklyRequirement = {
  id?: number;
  week_plan_id: number;
  item_id: number | null;
  required_qty: number;
  notes?: string | null;
  item?: Item;
};

export type EditableRequirementKey = "item_id" | "required_qty" | "notes";

export type ShoppingListItem = {
  item_id: number;
  item_name: string;
  unit: UnitAbbreviation;
  vendor_name: string | null;
  on_hand: number;
  required_qty: number;
  to_buy: number;
  notes?: string | null;
};


