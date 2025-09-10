"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ShoppingCart, Download, FileText } from "lucide-react";
import { ShoppingListItem, WeekPlan } from "@/lib/weekTypes";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";

function groupShoppingByVendor(shoppingList: ShoppingListItem[]) {
  const map = new Map<string, ShoppingListItem[]>();
  for (const row of shoppingList) {
    const vendor = row.vendor_name || "No Vendor";
    const arr = map.get(vendor) || [];
    arr.push(row);
    map.set(vendor, arr);
  }
  return map;
}

function getWeekRange(startDate: string) {
  const start = new Date(startDate);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return `${start.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })} - ${end.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })}`;
}

export default function ShoppingListSection({
  weekPlan,
  shoppingList,
  includeOnHand,
  includeRequired,
  setIncludeOnHand,
  setIncludeRequired,
}: {
  weekPlan: WeekPlan;
  shoppingList: ShoppingListItem[];
  includeOnHand: boolean;
  includeRequired: boolean;
  setIncludeOnHand: (v: boolean) => void;
  setIncludeRequired: (v: boolean) => void;
}) {
  const exportShoppingList = () => {
    const byVendor = groupShoppingByVendor(shoppingList);
    const lines: string[] = [];
    const header: string[] = ["Vendor", "Item"];
    if (includeOnHand) header.push("On Hand");
    if (includeRequired) header.push("Required");
    header.push("To Buy");
    header.push("Notes");
    lines.push(header.join(","));
    const vendors = Array.from(byVendor.keys()).sort((a, b) =>
      a.localeCompare(b)
    );
    for (const vendor of vendors) {
      const rows = byVendor.get(vendor) || [];
      rows.sort((a, b) => a.item_name.localeCompare(b.item_name));
      for (const r of rows) {
        const notes = r.notes ? String(r.notes).replace(/\n/g, " ") : "";
        const row: string[] = [vendor, r.item_name];
        if (includeOnHand) row.push(`${r.on_hand} ${r.unit}`);
        if (includeRequired) row.push(`${r.required_qty} ${r.unit}`);
        row.push(`${r.to_buy} ${r.unit}`);
        row.push(notes);
        lines.push(row.join(","));
      }
    }
    const csv = lines.join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `shopping-list-week-${weekPlan.id}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportShoppingListPdf = () => {
    const byVendor = groupShoppingByVendor(shoppingList);
    const vendors = Array.from(byVendor.keys()).sort((a, b) =>
      a.localeCompare(b)
    );
    if (!weekPlan) return;
    const win = window.open("", "_blank");
    if (!win) return;
    const styles = `
      <style>
        body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, Noto Sans, 'Apple Color Emoji', 'Segoe UI Emoji'; padding: 24px; }
        h1 { font-size: 20px; margin: 0 0 16px; }
        .meta { font-size: 12px; color: #6b7280; margin: 0 0 16px; }
        h2 { font-size: 16px; margin: 24px 0 8px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
        th, td { border: 1px solid #e5e7eb; padding: 6px 8px; font-size: 12px; }
        th { background: #f9fafb; text-align: left; }
      </style>
    `;
    const range = getWeekRange(weekPlan.start_date);
    const title = `FMB Shopping List | Week of ${range}`;
    let html = `<html><head><title>${title}</title>${styles}</head><body>`;
    const generatedAt = new Date().toLocaleString();
    html += `<h1>${title}</h1>`;
    html += `<div class="meta">Generated: ${generatedAt}</div>`;
    for (const vendor of vendors) {
      const rows = (byVendor.get(vendor) || [])
        .slice()
        .sort((a, b) => a.item_name.localeCompare(b.item_name));
      html += `<h2>${vendor}</h2>`;
      html += "<table><thead><tr>";
      html += "<th>Item</th>";
      if (includeOnHand) html += "<th>On Hand</th>";
      if (includeRequired) html += "<th>Required</th>";
      html += "<th>To Buy</th>";
      html += "<th>Notes</th>";
      html += "</tr></thead><tbody>";
      for (const r of rows) {
        html += "<tr>";
        html += `<td>${r.item_name}</td>`;
        if (includeOnHand) html += `<td>${r.on_hand} ${r.unit}</td>`;
        if (includeRequired) html += `<td>${r.required_qty} ${r.unit}</td>`;
        html += `<td>${r.to_buy} ${r.unit}</td>`;
        html += `<td>${r.notes ?? ""}</td>`;
        html += "</tr>";
      }
      html += "</tbody></table>";
    }
    html += "</body></html>";
    win.document.open();
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => {
      win.print();
    }, 250);
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5 text-purple-600" />
          <h2 className="text-lg font-semibold text-gray-900">Shopping List</h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-3 text-sm text-gray-700">
            <Checkbox
              checked={includeOnHand}
              onChange={(e) =>
                setIncludeOnHand((e.target as HTMLInputElement).checked)
              }
              label="Include On Hand"
            />
            <Checkbox
              checked={includeRequired}
              onChange={(e) =>
                setIncludeRequired((e.target as HTMLInputElement).checked)
              }
              label="Include Required"
            />
          </div>
          <Button
            onClick={exportShoppingList}
            variant="purple"
            size="sm"
            icon={Download}
          >
            Export CSV
          </Button>
          <Button
            onClick={exportShoppingListPdf}
            variant="secondary"
            size="sm"
            icon={FileText}
          >
            Export PDF
          </Button>
        </div>
      </div>

      <div className="p-6">
        {shoppingList.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <THead>
                <TR>
                  <TH>Vendor</TH>
                  <TH>Item</TH>
                  <TH>Unit</TH>
                  <TH>On Hand</TH>
                  <TH>Required</TH>
                  <TH>To Buy</TH>
                  <TH>Notes</TH>
                </TR>
              </THead>
              <TBody>
                {shoppingList.map((item, index) => (
                  <TR
                    key={index}
                    className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                  >
                    <TD className="font-medium text-gray-900">
                      {item.vendor_name || "No Vendor"}
                    </TD>
                    <TD className="text-gray-900">{item.item_name}</TD>
                    <TD className="text-gray-500">{item.unit}</TD>
                    <TD className="text-gray-500">{item.on_hand}</TD>
                    <TD className="text-gray-500">{item.required_qty}</TD>
                    <TD className="font-medium text-gray-900">
                      {item.to_buy > 0 ? item.to_buy : "-"}
                    </TD>
                    <TD className="text-gray-500">{item.notes ?? ""}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No shopping list items</p>
            <p className="text-sm">
              Add weekly requirements to generate shopping list
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
