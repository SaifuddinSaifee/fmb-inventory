# Weekly Menu & Inventory App — **Ultra-Simple MVP** (v0.2)

You asked to make it easier and more straightforward. This version removes advanced tables, transactions, and audits. It keeps only what’s necessary to get your weekly flow done quickly.

---

## 0) What this MVP does

1. **Plan week** (Mon–Sun): write menu text per day.
2. **Enter headcount**: type daily RSVP totals.
3. **Enter cook’s weekly requirements**: total quantity per item for the whole week.
4. **See what to buy**: app subtracts current inventory and shows a vendor‑grouped shopping list.
5. **End of week**: add leftover quantities back into inventory.

**No RBAC. No stock movements. No complex audits.** Just numbers in, numbers out.

---

## 1) Minimal Data Model (SQL)

Exactly **five** tables. That’s it.

```sql
-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.day_plans (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  week_plan_id bigint NOT NULL,
  date date NOT NULL,
  menu text,
  rsvp integer NOT NULL DEFAULT 0,
  CONSTRAINT day_plans_pkey PRIMARY KEY (id),
  CONSTRAINT day_plans_week_plan_id_fkey FOREIGN KEY (week_plan_id) REFERENCES public.week_plans(id)
);
CREATE TABLE public.inventory (
  item_id bigint NOT NULL,
  on_hand numeric NOT NULL DEFAULT 0,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT inventory_pkey PRIMARY KEY (item_id),
  CONSTRAINT inventory_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.items(id)
);
CREATE TABLE public.items (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  name text NOT NULL UNIQUE,
  unit text NOT NULL CHECK (unit = ANY (ARRAY['kg'::text, 'g'::text, 'L'::text, 'ml'::text, 'pcs'::text])),
  vendor_id bigint,
  CONSTRAINT items_pkey PRIMARY KEY (id),
  CONSTRAINT items_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.vendors(id)
);
CREATE TABLE public.vendors (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  name text NOT NULL UNIQUE,
  contact_info text,
  address text,
  CONSTRAINT vendors_pkey PRIMARY KEY (id)
);
CREATE TABLE public.week_plans (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  start_date date NOT NULL,
  status text NOT NULL CHECK (status = ANY (ARRAY['Draft'::text, 'Published'::text, 'Closed'::text])),
  CONSTRAINT week_plans_pkey PRIMARY KEY (id)
);
CREATE TABLE public.weekly_requirements (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  week_plan_id bigint NOT NULL,
  item_id bigint NOT NULL,
  required_qty numeric NOT NULL,
  to_buy_override numeric,
  notes text,
  CONSTRAINT weekly_requirements_pkey PRIMARY KEY (id),
  CONSTRAINT weekly_requirements_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.items(id),
  CONSTRAINT weekly_requirements_week_plan_id_fkey FOREIGN KEY (week_plan_id) REFERENCES public.week_plans(id)
);
```


---

## 2) Core Calculations

* **Computed to\_buy** per item (read‑only list):
  `to_buy = COALESCE(to_buy_override, MAX(0, required_qty - on_hand))`

* Group by vendor using `items.vendor` (plain text).

* Export to CSV.

**Note:** If you want to edit the shopping list, change either `to_buy_override` (on the requirement row) or adjust `on_hand`/`required_qty`.

---

## 3) Minimal Screens

1. **Dashboard**

   * Button: **New Week**
   * List recent weeks with status

2. **Week Plan** (single page with sections)

   * **Menu & RSVP (Mon–Sun)**: 7 rows, fields: *Menu (text)*, *RSVP (number)*.
   * **Requirements (Weekly)**: table with *Item* (typeahead), *Unit* (read-only), *Required Qty*, *To Buy Override* (optional).
   * **Shopping List (Computed)**: vendor‑grouped table (Item, Unit, On Hand, Required, To Buy). Button: **Export CSV**.
   * **Leftovers**: quick form to bump inventory numbers (Item, +Qty). Button: **Close Week** (sets status Closed).

3. **Items & Inventory**

   * One combined screen: list items with columns *Name | Unit | Vendor | On Hand* and inline edit for *On Hand*.

---

## 4) Flow (Step‑by‑Step)

1. **Create Week** → status **Draft**.
2. Fill **Menu & RSVP** → **Publish** when ready (optional lock).
3. Get cook’s list → enter **Weekly Requirements**.
4. Open **Shopping List** → app computes `to_buy`. If needed, set **To Buy Override**. Export CSV and shop.
5. End of week → **Leftovers**: add what remains to inventory. **Close Week**.

---

## 5) Super‑Light API (optional)

Keep it tiny; or just do server actions.

```
POST  /weeks {start_date}
GET   /weeks/:id
PUT   /weeks/:id {status}
PUT   /weeks/:id/day-plans [...]
PUT   /weeks/:id/requirements [...]
GET   /weeks/:id/shopping-list   -- returns computed rows (no table)
PUT   /inventory/:itemId {on_hand}
```

---

## 6) Tech Notes

* **Stack**: Next.js + SQLite (Prisma).
* **No migrations pain**: only 5 tables.
* **Typeahead** for items (client-side).
* **CSV export** for shopping list.
* **Single-user access** (basic password or IP allowlist).

---

## 7) Acceptance Criteria (Short & Clear)

* Create a week; enter menu and RSVP.
* Enter weekly requirements by item.
* See a computed, vendor‑grouped shopping list (CSV export).
* Adjust on‑hand or use to‑buy override to tweak quantities.
* Add leftovers to inventory and close the week.
* All data persists; reopening the week shows previous inputs.

---

## 8) Example

* **Items**: Rice (kg, Indian Market), Chicken (kg, Costco), Milk (L, Walmart).
* **Inventory**: Rice 5, Chicken 0, Milk 3.
* **Requirements**: Rice 8, Chicken 6, Milk 4.
* **Shopping List** (computed):

  * Indian Market: Rice → To Buy = 3
  * Costco: Chicken → To Buy = 6
  * Walmart: Milk → To Buy = 1

That’s the whole MVP—simple, fast to build, and easy to use.
