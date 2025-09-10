"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Package, Plus, Save, Trash2 } from "lucide-react";
import { EditableRequirementKey, Item, WeeklyRequirement } from "@/lib/weekTypes";

export default function WeeklyRequirementsSection({
  items,
  requirements,
  hasUnsavedChanges,
  hasUnselectedRequirement,
  saving,
  onSave,
  onAdd,
  onRemove,
  onUpdate,
  isRowChanged,
}: {
  items: Item[];
  requirements: WeeklyRequirement[];
  hasUnsavedChanges: boolean;
  hasUnselectedRequirement: boolean;
  saving: boolean;
  onSave: () => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
  onUpdate: <K extends EditableRequirementKey>(
    index: number,
    key: K,
    value: WeeklyRequirement[K]
  ) => void;
  isRowChanged: (index: number, req: WeeklyRequirement) => boolean;
}) {
  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="h-5 w-5 text-green-600" />
          <h2 className="text-lg font-semibold text-gray-900">Weekly Requirements</h2>
        </div>
        <div className="flex gap-2">
          {hasUnsavedChanges && (
            <Button onClick={onSave} disabled={saving || hasUnselectedRequirement} size="sm" icon={Save}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          )}
          <Button onClick={onAdd} variant="success" size="sm" icon={Plus} disabled={hasUnselectedRequirement}>
            Add Item
          </Button>
        </div>
      </div>

      <div className="p-6">
        <div className="space-y-4">
          {requirements.map((req, index) => (
            <div
              key={req.id || index}
              className={`grid grid-cols-1 md:grid-cols-6 gap-4 p-4 border rounded-lg ${
                isRowChanged(index, req) ? "border-blue-300 bg-blue-50/50" : "border-gray-200"
              }`}
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Item</label>
                <Select
                  value={req.item_id ?? ""}
                  onChange={(e) =>
                    onUpdate(index, "item_id", e.target.value ? parseInt(e.target.value) : null)
                  }
                >
                  <option value="" disabled>
                    Select an item
                  </option>
                  {items.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                <Input
                  type="text"
                  value={req.item_id ? items.find((i) => i.id === req.item_id)?.unit || "" : ""}
                  disabled
                  className="bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Required Qty</label>
                <Input
                  type="number"
                  value={req.required_qty}
                  onChange={(e) => onUpdate(index, "required_qty", parseFloat(e.target.value) || 0)}
                  min={0}
                  step={0.1}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <Input
                  type="text"
                  value={req.notes || ""}
                  onChange={(e) => onUpdate(index, "notes", e.target.value)}
                  placeholder="Optional notes"
                />
              </div>
              <div className="flex items-end">
                <button onClick={() => onRemove(index)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}

          {requirements.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No requirements added yet</p>
              <p className="text-sm">Click &ldquo;Add Item&ldquo; to get started</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


