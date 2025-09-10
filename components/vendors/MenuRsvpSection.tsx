"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Calendar, Pencil, Save, X } from "lucide-react";
import { DayPlan } from "@/lib/weekTypes";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

export default function MenuRsvpSection({
  dayPlans,
  isEditing,
  saving,
  onEdit,
  onCancel,
  onSave,
  onUpdateDay,
}: {
  dayPlans: DayPlan[];
  isEditing: boolean;
  saving: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
  onUpdateDay: (
    index: number,
    field: "menu" | "rsvp",
    value: string | number
  ) => void;
}) {
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

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">Menu & RSVP</h2>
        </div>
        {!isEditing ? (
          <Button onClick={onEdit} size="sm" icon={Pencil}>
            Edit
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button onClick={onSave} disabled={saving} icon={Save} size="sm">
              {saving ? "Saving..." : "Save"}
            </Button>
            <Button onClick={onCancel} variant="secondary" size="sm" icon={X}>
              Cancel
            </Button>
          </div>
        )}
      </div>

      <div className="p-6">
        {!isEditing ? (
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
                  <tr key={row.id} className={rIdx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
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
                <div className="font-medium text-gray-900">{formatDate(day.date)}</div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Menu</label>
                  <Textarea
                    value={day.menu || ""}
                    onChange={(e) => onUpdateDay(index, "menu", e.target.value)}
                    rows={2}
                    placeholder="Enter menu for this day..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">RSVP Count</label>
                  <Input
                    type="number"
                    value={day.rsvp}
                    onChange={(e) => onUpdateDay(index, "rsvp", parseInt(e.target.value) || 0)}
                    min={0}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


