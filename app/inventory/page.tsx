"use client";

import { useState, useEffect } from "react";
import { Package, Plus, Edit3, Save, X, Trash2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import EditableText from "@/components/editableText";
import { getUnitOptions, type UnitAbbreviation } from "@/lib/units";
import { Skeleton } from "@/components/ui/skeleton";

type Vendor = {
  id: number;
  name: string;
  contact_info: string | null;
  address: string | null;
};

type Item = {
  id: number;
  name: string;
  unit: UnitAbbreviation;
  vendor_id: number | null;
  vendor_name: string | null;
  on_hand: number;
};

type NewItem = {
  name: string;
  unit: UnitAbbreviation;
  vendor_id: number | null;
};

export default function InventoryPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItem, setNewItem] = useState<NewItem>({
    name: "",
    unit: "pcs" as UnitAbbreviation,
    vendor_id: null,
  });
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState<{
    id: number | null;
    name: string;
    unit: UnitAbbreviation;
    vendor_id: number | null;
  }>({ id: null, name: "", unit: "pcs" as UnitAbbreviation, vendor_id: null });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [itemsResponse, vendorsResponse] = await Promise.all([
        fetch("/api/items"),
        fetch("/api/vendors"),
      ]);

      if (itemsResponse.ok) {
        const itemsData = await itemsResponse.json();
        setItems(itemsData);
      }

      if (vendorsResponse.ok) {
        const vendorsData = await vendorsResponse.json();
        setVendors(vendorsData);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = items.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.vendor_name &&
        item.vendor_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const saveQuantity = async (itemId: number, nextQuantity: number) => {
    try {
      const response = await fetch(`/api/inventory/${itemId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ on_hand: nextQuantity }),
      });

      if (response.ok) {
        setItems((prev) =>
          prev.map((item) =>
            item.id === itemId ? { ...item, on_hand: nextQuantity } : item
          )
        );
      }
    } catch (error) {
      console.error("Error updating quantity:", error);
    }
  };

  const addNewItem = async () => {
    if (!newItem.name.trim()) return;

    try {
      const response = await fetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newItem),
      });

      if (response.ok) {
        // Fetch updated items list to get the complete data
        fetchData();
        setShowAddForm(false);
        setNewItem({ name: "", unit: "kg", vendor_id: null });
      }
    } catch (error) {
      console.error("Error adding item:", error);
    }
  };

  const openEditModal = (item: Item) => {
    setEditForm({
      id: item.id,
      name: item.name,
      unit: item.unit,
      vendor_id: item.vendor_id,
    });
    setShowEditModal(true);
  };

  const saveItemDetails = async () => {
    if (!editForm.id) return;
    try {
      const response = await fetch(`/api/items/${editForm.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editForm.name,
          unit: editForm.unit,
          vendor_id: editForm.vendor_id,
        }),
      });
      if (response.ok) {
        // Update local state for snappy UX
        setItems((prev) =>
          prev.map((it) =>
            it.id === editForm.id
              ? {
                  ...it,
                  name: editForm.name,
                  unit: editForm.unit,
                  vendor_id: editForm.vendor_id,
                  vendor_name:
                    vendors.find((v) => v.id === editForm.vendor_id)?.name ??
                    null,
                }
              : it
          )
        );
        setShowEditModal(false);
      }
    } catch (error) {
      console.error("Error updating item:", error);
    }
  };

  const deleteItem = async (itemId: number) => {
    if (!confirm("Are you sure you want to delete this item?")) return;

    try {
      const response = await fetch(`/api/items/${itemId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setItems(items.filter((item) => item.id !== itemId));
      }
    } catch (error) {
      console.error("Error deleting item:", error);
    }
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Items & Inventory
        </h1>
        <p className="text-gray-600">
          Manage your inventory items and current stock levels
        </p>
      </div>

      {/* Summary Stats */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Package className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Items</p>
              <p className="text-2xl font-semibold text-gray-900">
                {loading ? <Skeleton className="h-7 w-16" /> : items.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Package className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">
                Items in Stock
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                {loading ? (
                  <Skeleton className="h-7 w-16" />
                ) : (
                  items.filter((item) => item.on_hand > 0).length
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Package className="h-8 w-8 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Out of Stock</p>
              <p className="text-2xl font-semibold text-gray-900">
                {loading ? (
                  <Skeleton className="h-7 w-16" />
                ) : (
                  items.filter((item) => item.on_hand === 0).length
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search items or vendors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 rounded-lg"
          />
        </div>

        {/* Add Item Button */}
        <Button onClick={() => setShowAddForm(true)} icon={Plus}>
          Add Item
        </Button>
      </div>

      {/* Add Item Form */}
      {showAddForm && (
        <div className="mb-6 bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Add New Item
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Item Name
              </label>
              <Input
                type="text"
                value={newItem.name}
                onChange={(e) =>
                  setNewItem({ ...newItem, name: e.target.value })
                }
                placeholder="Enter item name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unit
              </label>
              <Select
                value={newItem.unit}
                onChange={(e) =>
                  setNewItem({
                    ...newItem,
                    unit: (e.target as HTMLSelectElement)
                      .value as UnitAbbreviation,
                  })
                }
              >
                {getUnitOptions().map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vendor
              </label>
              <Select
                value={newItem.vendor_id || ""}
                onChange={(e) =>
                  setNewItem({
                    ...newItem,
                    vendor_id: (e.target as HTMLSelectElement).value
                      ? parseInt((e.target as HTMLSelectElement).value)
                      : null,
                  })
                }
              >
                <option value="">No Vendor</option>
                {vendors.map((vendor) => (
                  <option key={vendor.id} value={vendor.id}>
                    {vendor.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex items-end gap-2">
              <Button variant="success" onClick={addNewItem}>
                Add
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setShowAddForm(false);
                  setNewItem({
                    name: "",
                    unit: "pcs" as UnitAbbreviation,
                    vendor_id: null,
                  });
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Items Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Inventory Items ({filteredItems.length})
          </h2>
        </div>

        {!loading && filteredItems.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium mb-2">
              {searchTerm ? "No items found" : "No items yet"}
            </p>
            <p>
              {searchTerm
                ? "Try adjusting your search terms"
                : "Add your first inventory item to get started"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table className="text-sm">
              <THead>
                <TR>
                  <TH>Item Name</TH>
                  <TH>Unit</TH>
                  <TH>Vendor</TH>
                  <TH>On Hand</TH>
                  <TH>Actions</TH>
                </TR>
              </THead>
              <TBody>
                {loading
                  ? Array.from({ length: 8 }).map((_, index) => (
                      <TR
                        key={`skeleton-${index}`}
                        className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                      >
                        <TD>
                          <Skeleton className="h-4 w-40" />
                        </TD>
                        <TD>
                          <Skeleton className="h-4 w-10" />
                        </TD>
                        <TD>
                          <Skeleton className="h-4 w-24" />
                        </TD>
                        <TD>
                          <Skeleton className="h-4 w-12" />
                        </TD>
                        <TD>
                          <div className="flex items-center gap-2">
                            <Skeleton className="h-5 w-5 rounded-full" />
                            <Skeleton className="h-5 w-5 rounded-full" />
                          </div>
                        </TD>
                      </TR>
                    ))
                  : filteredItems.map((item, index) => (
                      <TR
                        key={item.id}
                        className={
                          (index % 2 === 0 ? "bg-white" : "bg-gray-50") +
                          " hover:bg-gray-50 transition-colors"
                        }
                      >
                        <TD>
                          <div className="text-sm font-medium text-gray-900">
                            {item.name}
                          </div>
                        </TD>
                        <TD>
                          <div className="text-sm text-gray-500">
                            {item.unit}
                          </div>
                        </TD>
                        <TD>
                          <div className="text-sm text-gray-500">
                            {item.vendor_name || "No Vendor"}
                          </div>
                        </TD>
                        <TD>
                          <EditableText
                            value={item.on_hand}
                            type="number"
                            min={0}
                            step={0.1}
                            className="text-sm font-medium text-gray-900"
                            inputClassName="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            displayFormatter={(val) => <span>{val}</span>}
                            onSave={async (val) => {
                              const numeric =
                                typeof val === "number"
                                  ? val
                                  : parseFloat(String(val));
                              const next =
                                Number.isFinite(numeric) && numeric >= 0
                                  ? numeric
                                  : 0;
                              await saveQuantity(item.id, next);
                            }}
                          />
                        </TD>
                        <TD>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => openEditModal(item)}
                              className="p-1 text-slate-700 hover:bg-slate-100 rounded transition-colors"
                              title="Edit item details"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => deleteItem(item.id)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="Delete item"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </TD>
                      </TR>
                    ))}
              </TBody>
            </Table>
          </div>
        )}
      </div>
      {showEditModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
          onClick={() => setShowEditModal(false)}
        >
          <div
            className="w-full max-w-lg bg-white rounded-lg shadow-lg border p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  Edit Item
                </h3>
                <p className="text-sm text-gray-500">
                  Update name, unit, or vendor
                </p>
              </div>
              <button
                className="p-1 text-gray-500 hover:text-gray-700"
                onClick={() => setShowEditModal(false)}
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Item Name
                </label>
                <Input
                  type="text"
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm({ ...editForm, name: e.target.value })
                  }
                  placeholder="Enter item name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Unit
                </label>
                <Select
                  value={editForm.unit}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      unit: (e.target as HTMLSelectElement)
                        .value as UnitAbbreviation,
                    })
                  }
                >
                  {getUnitOptions().map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vendor
                </label>
                <Select
                  value={editForm.vendor_id || ""}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      vendor_id: (e.target as HTMLSelectElement).value
                        ? parseInt((e.target as HTMLSelectElement).value)
                        : null,
                    })
                  }
                >
                  <option value="">No Vendor</option>
                  {vendors.map((vendor) => (
                    <option key={vendor.id} value={vendor.id}>
                      {vendor.name}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button
                variant="secondary"
                onClick={() => setShowEditModal(false)}
              >
                Cancel
              </Button>
              <Button icon={Save} onClick={saveItemDetails}>
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
