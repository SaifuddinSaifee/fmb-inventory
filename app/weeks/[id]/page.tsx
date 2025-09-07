"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Calendar,
  ShoppingCart,
  Package,
  Save,
  Download,
  ArrowLeft,
  Plus,
  Trash2,
  FileText,
  Pencil,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import type { UnitAbbreviation } from "@/lib/units";

type WeekPlan = {
  id: number;
  start_date: string;
  status: "Draft" | "Published" | "Closed";
};

type DayPlan = {
  id: number;
  week_plan_id: number;
  date: string;
  menu: string | null;
  rsvp: number;
};

type Item = {
  id: number;
  name: string;
  unit: UnitAbbreviation;
  vendor_id: number | null;
  vendor_name: string | null;
  on_hand: number;
};

type WeeklyRequirement = {
  id?: number;
  week_plan_id: number;
  item_id: number | null;
  required_qty: number;
  notes?: string | null;
  item?: Item;
};

type EditableRequirementKey = "item_id" | "required_qty" | "notes";

type ShoppingListItem = {
  item_id: number;
  item_name: string;
  unit: UnitAbbreviation;
  vendor_name: string | null;
  on_hand: number;
  required_qty: number;
  to_buy: number;
  notes?: string | null;
};

export default function WeekPlanPage() {
  const params = useParams();
  const router = useRouter();
  const weekId = parseInt(params.id as string);

  const [weekPlan, setWeekPlan] = useState<WeekPlan | null>(null);
  const [dayPlans, setDayPlans] = useState<DayPlan[]>([]);
  const [requirements, setRequirements] = useState<WeeklyRequirement[]>([]);
  const [originalRequirements, setOriginalRequirements] = useState<
    WeeklyRequirement[]
  >([]);
  const [shoppingList, setShoppingList] = useState<ShoppingListItem[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [includeOnHand, setIncludeOnHand] = useState(true);
  const [includeRequired, setIncludeRequired] = useState(true);
  const [isEditingMenu, setIsEditingMenu] = useState(false);
  const [originalDayPlans, setOriginalDayPlans] = useState<DayPlan[]>([]);

  const fetchWeekData = useCallback(async () => {
    try {
      const [
        weekResponse,
        dayPlansResponse,
        requirementsResponse,
        shoppingResponse,
      ] = await Promise.all([
        fetch(`/api/weeks/${weekId}`),
        fetch(`/api/weeks/${weekId}/day-plans`),
        fetch(`/api/weeks/${weekId}/requirements`),
        fetch(`/api/weeks/${weekId}/shopping-list`),
      ]);

      if (weekResponse.ok) {
        const weekData = await weekResponse.json();
        setWeekPlan(weekData);
      }

      if (dayPlansResponse.ok) {
        const dayPlansData = await dayPlansResponse.json();
        setDayPlans(dayPlansData);
        setOriginalDayPlans(dayPlansData);
      }

      if (requirementsResponse.ok) {
        const requirementsData: WeeklyRequirement[] =
          await requirementsResponse.json();
        const sortedByNewest = requirementsData.slice().sort((a, b) => {
          const aId = typeof a.id === "number" ? a.id : -Infinity;
          const bId = typeof b.id === "number" ? b.id : -Infinity;
          return bId - aId;
        });
        setRequirements(sortedByNewest);
        setOriginalRequirements(sortedByNewest);
      }

      if (shoppingResponse.ok) {
        const shoppingData = await shoppingResponse.json();
        setShoppingList(shoppingData);
      }
    } catch (error) {
      console.error("Error fetching week data:", error);
    } finally {
      setLoading(false);
    }
  }, [weekId]);

  useEffect(() => {
    if (weekId) {
      fetchWeekData();
      fetchItems();
    }
  }, [weekId, fetchWeekData]);

  const fetchItems = async () => {
    try {
      const response = await fetch("/api/items");
      if (response.ok) {
        const data = await response.json();
        setItems(data);
      }
    } catch (error) {
      console.error("Error fetching items:", error);
    }
  };

  const saveDayPlans = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/weeks/${weekId}/day-plans`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          days: dayPlans.map((d) => ({
            date: d.date,
            menu: d.menu ?? null,
            rsvp: d.rsvp,
          })),
        }),
      });

      if (response.ok) {
        // Success feedback could be added here
      }
    } catch (error) {
      console.error("Error saving day plans:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleEditMenuClick = () => {
    setOriginalDayPlans(dayPlans);
    setIsEditingMenu(true);
  };

  const handleCancelMenuEdit = () => {
    setDayPlans(originalDayPlans);
    setIsEditingMenu(false);
  };

  const handleSaveMenu = async () => {
    await saveDayPlans();
    setOriginalDayPlans(dayPlans);
    setIsEditingMenu(false);
  };

  const saveRequirements = async () => {
    if (hasUnselectedRequirement) return;
    setSaving(true);
    try {
      const response = await fetch(`/api/weeks/${weekId}/requirements`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: requirements.map((r) => ({
            item_id: r.item_id,
            required_qty: r.required_qty,
            notes: r.notes ?? null,
          })),
        }),
      });

      if (response.ok) {
        // Update original state to match current state
        setOriginalRequirements([...requirements]);

        // Re-fetch requirements to ensure client state matches server (including deletions)
        const requirementsResponse = await fetch(`/api/weeks/${weekId}/requirements`);
        if (requirementsResponse.ok) {
          const reqData: WeeklyRequirement[] = await requirementsResponse.json();
          const sortedByNewest = reqData.slice().sort((a, b) => {
            const aId = typeof a.id === 'number' ? a.id : -Infinity;
            const bId = typeof b.id === 'number' ? b.id : -Infinity;
            return bId - aId;
          });
          setRequirements(sortedByNewest);
          setOriginalRequirements(sortedByNewest);
        }
        
        // Refresh shopping list
        const shoppingResponse = await fetch(
          `/api/weeks/${weekId}/shopping-list`
        );
        if (shoppingResponse.ok) {
          const shoppingData = await shoppingResponse.json();
          setShoppingList(shoppingData);
        }
      }
    } catch (error) {
      console.error("Error saving requirements:", error);
    } finally {
      setSaving(false);
    }
  };

  const updateDayPlan = (
    index: number,
    field: "menu" | "rsvp",
    value: string | number
  ) => {
    const updated = [...dayPlans];
    updated[index] = { ...updated[index], [field]: value };
    setDayPlans(updated);
  };

  const addRequirement = () => {
    if (items.length === 0) {
      window.alert("No items found. Please add items in Inventory first.");
      return;
    }
    const newReq: WeeklyRequirement = {
      week_plan_id: weekId,
      item_id: null,
      required_qty: 0,
      notes: "",
    };
    setRequirements([newReq, ...requirements]);
  };

  const updateRequirement = <K extends EditableRequirementKey>(
    index: number,
    field: K,
    value: WeeklyRequirement[K]
  ) => {
    const updated = [...requirements];
    updated[index] = { ...updated[index], [field]: value };
    setRequirements(updated);
  };

  const hasUnselectedRequirement = useMemo(() => {
    return requirements.some((r) => r.item_id == null);
  }, [requirements]);

  const getChangedRequirements = useCallback(() => {
    const changed = new Set<number>();

    // Build a lookup of originals by id for stable comparisons
    const originalById = new Map<number, WeeklyRequirement>();
    for (const orig of originalRequirements) {
      if (typeof orig.id === 'number') originalById.set(orig.id, orig);
    }

    requirements.forEach((req, index) => {
      if (typeof req.id === 'number') {
        const original = originalById.get(req.id);
        if (!original) {
          // Should not normally happen, but treat as changed if mismatch
          changed.add(index);
          return;
        }
        if (
          req.item_id !== original.item_id ||
          req.required_qty !== original.required_qty ||
          req.notes !== original.notes
        ) {
          changed.add(index);
        }
      } else {
        // New, unsaved row (no id). If there is an original at the same index
        // that also has no id and matches by value, do not mark as changed.
        const originalAtIndex = originalRequirements[index];
        if (
          !originalAtIndex ||
          typeof originalAtIndex.id === 'number' ||
          originalAtIndex.item_id !== req.item_id ||
          originalAtIndex.required_qty !== req.required_qty ||
          originalAtIndex.notes !== req.notes
        ) {
          changed.add(index);
        }
      }
    });

    return changed;
  }, [requirements, originalRequirements]);

  const hasDeletions = useMemo(() => {
    // Any original id that no longer exists in current implies a deletion
    const remaining = new Set<number>();
    for (const orig of originalRequirements) {
      if (typeof orig.id === 'number') remaining.add(orig.id);
    }
    for (const req of requirements) {
      if (typeof req.id === 'number') remaining.delete(req.id);
    }
    return remaining.size > 0;
  }, [requirements, originalRequirements]);

  const hasUnsavedChanges = useMemo(() => {
    return getChangedRequirements().size > 0 || hasDeletions;
  }, [getChangedRequirements, hasDeletions]);

  const removeRequirement = (index: number) => {
    const updated = requirements.filter((_, i) => i !== index);
    setRequirements(updated);
  };

  const groupShoppingByVendor = () => {
    const map = new Map<string, typeof shoppingList>();
    for (const row of shoppingList) {
      const vendor = row.vendor_name || "No Vendor";
      const arr = map.get(vendor) || [];
      arr.push(row);
      map.set(vendor, arr);
    }
    return map;
  };

  const exportShoppingList = () => {
    const byVendor = groupShoppingByVendor();
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
    a.download = `shopping-list-week-${weekId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportShoppingListPdf = () => {
    const byVendor = groupShoppingByVendor();
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
    });
  };

  const dayPlanColumns = useMemo<ColumnDef<DayPlan>[]>(
    () => [
      {
        header: "Date",
        accessorFn: (row) => formatDate(row.date),
      },
      {
        header: "Menu",
        accessorKey: "menu",
        cell: ({ getValue }) => {
          const value = getValue<string | null>();
          return value ? value : "";
        },
      },
      {
        header: "RSVP",
        accessorKey: "rsvp",
      },
    ],
    []
  );

  const dayPlanTable = useReactTable({
    data: dayPlans,
    columns: dayPlanColumns,
    getCoreRowModel: getCoreRowModel(),
  });

  const getWeekRange = (startDate: string) => {
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
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center">
          <p className="text-gray-500">Loading week plan...</p>
        </div>
      </div>
    );
  }

  if (!weekPlan) {
    return (
      <div className="p-8">
        <div className="text-center">
          <p className="text-red-500">Week plan not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => router.push("/")}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Week of {getWeekRange(weekPlan.start_date)}
            </h1>
            <p className="text-gray-600">Status: {weekPlan.status}</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="danger"
              size="sm"
              icon={Trash2}
              onClick={async () => {
                const confirmed = window.confirm(
                  "Delete this week? This will remove its days and requirements."
                );
                if (!confirmed) return;
                try {
                  const res = await fetch(`/api/weeks/${weekId}`, { method: "DELETE" });
                  if (res.ok) {
                    router.push("/");
                  } else {
                    const body = await res.json().catch(() => ({}));
                    window.alert(body.error || "Failed to delete week");
                  }
                } catch (e) {
                  console.error(e);
                  window.alert("Failed to delete week");
                }
              }}
            >
              Delete Week
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        {/* Menu & RSVP Section */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">
                Menu & RSVP
              </h2>
            </div>
            {!isEditingMenu ? (
              <Button onClick={handleEditMenuClick} size="sm" icon={Pencil}>
                Edit
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  onClick={handleSaveMenu}
                  disabled={saving}
                  icon={Save}
                  size="sm"
                >
                  {saving ? "Saving..." : "Save"}
                </Button>
                <Button
                  onClick={handleCancelMenuEdit}
                  variant="secondary"
                  size="sm"
                  icon={X}
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>

          <div className="p-6">
            {!isEditingMenu ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    {dayPlanTable.getHeaderGroups().map((headerGroup) => (
                      <tr key={headerGroup.id}>
                        {headerGroup.headers.map((header) => (
                          <th
                            key={header.id}
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            {header.isPlaceholder
                              ? null
                              : flexRender(
                                  header.column.columnDef.header,
                                  header.getContext()
                                )}
                          </th>
                        ))}
                      </tr>
                    ))}
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {dayPlanTable.getRowModel().rows.map((row, rIdx) => (
                      <tr
                        key={row.id}
                        className={rIdx % 2 === 0 ? "bg-white" : "bg-gray-50"}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <td
                            key={cell.id}
                            className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                          >
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="grid gap-4">
                {dayPlans.map((day, index) => (
                  <div
                    key={day.id}
                    className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border border-gray-200 rounded-lg"
                  >
                    <div className="font-medium text-gray-900">
                      {formatDate(day.date)}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Menu
                      </label>
                      <textarea
                        value={day.menu || ""}
                        onChange={(e) =>
                          updateDayPlan(index, "menu", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={2}
                        placeholder="Enter menu for this day..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        RSVP Count
                      </label>
                      <input
                        type="number"
                        value={day.rsvp}
                        onChange={(e) =>
                          updateDayPlan(
                            index,
                            "rsvp",
                            parseInt(e.target.value) || 0
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        min="0"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Weekly Requirements Section */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-green-600" />
              <h2 className="text-lg font-semibold text-gray-900">
                Weekly Requirements
              </h2>
            </div>
            <div className="flex gap-2">
              {hasUnsavedChanges && (
                <Button
                  onClick={saveRequirements}
                  disabled={saving || hasUnselectedRequirement}
                  size="sm"
                  icon={Save}
                >
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              )}
              <Button
                onClick={addRequirement}
                variant="success"
                size="sm"
                icon={Plus}
                disabled={hasUnselectedRequirement}
              >
                Add Item
              </Button>
            </div>
          </div>

          <div className="p-6">
            <div className="space-y-4">
              {requirements.map((req, index) => (
                <div
                  key={req.id || index} // Use id if available, otherwise index
                  className={`grid grid-cols-1 md:grid-cols-6 gap-4 p-4 border rounded-lg ${
                    getChangedRequirements().has(index) ||
                    (typeof req.id === 'number' && !originalRequirements.some(orig => orig.id === req.id))
                      ? "border-blue-300 bg-blue-50/50"
                      : "border-gray-200"
                  }`}
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Item
                    </label>
                    <select
                      value={req.item_id ?? ""}
                      onChange={(e) =>
                        updateRequirement(
                          index,
                          "item_id",
                          e.target.value ? parseInt(e.target.value) : null
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="" disabled>
                        Select an item
                      </option>
                      {items.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Unit
                    </label>
                    <input
                      type="text"
                      value={
                        req.item_id
                          ? items.find((i) => i.id === req.item_id)?.unit || ""
                          : ""
                      }
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Required Qty
                    </label>
                    <input
                      type="number"
                      value={req.required_qty}
                      onChange={(e) =>
                        updateRequirement(
                          index,
                          "required_qty",
                          parseFloat(e.target.value) || 0
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="0"
                      step="0.1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes
                    </label>
                    <input
                      type="text"
                      value={req.notes || ""}
                      onChange={(e) =>
                        updateRequirement(index, "notes", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Optional notes"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={() => removeRequirement(index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}

              {requirements.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No requirements added yet</p>
                  <p className="text-sm">
                    Click &ldquo;Add Item&ldquo; to get started
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Shopping List Section */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-purple-600" />
              <h2 className="text-lg font-semibold text-gray-900">
                Shopping List
              </h2>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-3 text-sm text-gray-700">
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={includeOnHand}
                    onChange={(e) => setIncludeOnHand(e.target.checked)}
                  />
                  Include On Hand
                </label>
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={includeRequired}
                    onChange={(e) => setIncludeRequired(e.target.checked)}
                  />
                  Include Required
                </label>
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
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Vendor
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Item
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Unit
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        On Hand
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Required
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        To Buy
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Notes
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {shoppingList.map((item, index) => (
                      <tr
                        key={index}
                        className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {item.vendor_name || "No Vendor"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.item_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.unit}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.on_hand}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.required_qty}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {item.to_buy > 0 ? item.to_buy : "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.notes ?? ""}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
      </div>
    </div>
  );
}
