"use client";

import { useState, useEffect } from "react";
import { Package, Plus, Edit3, Save, X, Trash2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

type Vendor = {
  id: number;
  name: string;
  contact_info: string | null;
  address: string | null;
};

type Item = {
  id: number;
  name: string;
  unit: "kg" | "g" | "L" | "ml" | "pcs";
  vendor_id: number | null;
  vendor_name: string | null;
  on_hand: number;
};

type NewItem = {
  name: string;
  unit: "kg" | "g" | "L" | "ml" | "pcs";
  vendor_id: number | null;
};

export default function InventoryPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingItem, setEditingItem] = useState<number | null>(null);
  const [editingQuantity, setEditingQuantity] = useState<number>(0);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItem, setNewItem] = useState<NewItem>({
    name: "",
    unit: "kg",
    vendor_id: null,
  });

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

  const startEditing = (item: Item) => {
    setEditingItem(item.id);
    setEditingQuantity(item.on_hand);
  };

  const cancelEditing = () => {
    setEditingItem(null);
    setEditingQuantity(0);
  };

  const saveQuantity = async (itemId: number) => {
    try {
      const response = await fetch(`/api/inventory/${itemId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ on_hand: editingQuantity }),
      });

      if (response.ok) {
        setItems(
          items.map((item) =>
            item.id === itemId ? { ...item, on_hand: editingQuantity } : item
          )
        );
        setEditingItem(null);
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

  const getUnitOptions = () => [
    { value: "kg", label: "Kilograms (kg)" },
    { value: "g", label: "Grams (g)" },
    { value: "L", label: "Liters (L)" },
    { value: "ml", label: "Milliliters (ml)" },
    { value: "pcs", label: "Pieces (pcs)" },
  ];

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center">
          <p className="text-gray-500">Loading inventory...</p>
        </div>
      </div>
    );
  }

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
                {items.length}
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
                {items.filter((item) => item.on_hand > 0).length}
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
                {items.filter((item) => item.on_hand === 0).length}
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
          <input
            type="text"
            placeholder="Search items or vendors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              <input
                type="text"
                value={newItem.name}
                onChange={(e) =>
                  setNewItem({ ...newItem, name: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter item name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unit
              </label>
              <select
                value={newItem.unit}
                onChange={(e) =>
                  setNewItem({
                    ...newItem,
                    unit: e.target.value as "kg" | "g" | "L" | "ml" | "pcs",
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {getUnitOptions().map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vendor
              </label>
              <select
                value={newItem.vendor_id || ""}
                onChange={(e) =>
                  setNewItem({
                    ...newItem,
                    vendor_id: e.target.value ? parseInt(e.target.value) : null,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">No Vendor</option>
                {vendors.map((vendor) => (
                  <option key={vendor.id} value={vendor.id}>
                    {vendor.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end gap-2">
              <button
                onClick={addNewItem}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                Add
              </button>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setNewItem({ name: "", unit: "kg", vendor_id: null });
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
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

        {filteredItems.length === 0 ? (
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
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Item Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Unit
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vendor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    On Hand
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredItems.map((item, index) => (
                  <tr
                    key={item.id}
                    className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {item.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{item.unit}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {item.vendor_name || "No Vendor"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingItem === item.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={editingQuantity}
                            onChange={(e) =>
                              setEditingQuantity(
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            min="0"
                            step="0.1"
                          />
                          <button
                            onClick={() => saveQuantity(item.id)}
                            className="p-1 text-green-600 hover:bg-green-50 rounded"
                          >
                            <Save className="h-4 w-4" />
                          </button>
                          <button
                            onClick={cancelEditing}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900">
                            {item.on_hand}
                          </span>
                          <button
                            onClick={() => startEditing(item)}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => deleteItem(item.id)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
