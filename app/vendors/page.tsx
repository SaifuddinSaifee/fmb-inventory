'use client';

import { useEffect, useMemo, useState } from 'react';
import { Plus, Store, User, MapPin, X, PackageSearch, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { UnitAbbreviation } from '@/lib/units';

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

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVendorId, setSelectedVendorId] = useState<number | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const [newVendor, setNewVendor] = useState<{ name: string; contact_info: string; address: string }>({
    name: '',
    contact_info: '',
    address: '',
  });
  const [itemSearch, setItemSearch] = useState('');
  const [selectedItemIds, setSelectedItemIds] = useState<number[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [vResp, iResp] = await Promise.all([
        fetch('/api/vendors'),
        fetch('/api/items'),
      ]);
      if (vResp.ok) setVendors(await vResp.json());
      if (iResp.ok) setItems(await iResp.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const selectedVendor = useMemo(() => vendors.find(v => v.id === selectedVendorId) ?? null, [vendors, selectedVendorId]);
  const vendorItems = useMemo(() => items.filter(i => i.vendor_id === selectedVendorId), [items, selectedVendorId]);
  const filteredModalItems = useMemo(() => {
    const term = itemSearch.toLowerCase();
    if (!term) return items;
    return items.filter(i => i.name.toLowerCase().includes(term));
  }, [items, itemSearch]);

  const openAddVendor = () => {
    setNewVendor({ name: '', contact_info: '', address: '' });
    setItemSearch('');
    setSelectedItemIds([]);
    setShowAddModal(true);
  };

  const submitAddVendor = async () => {
    if (!newVendor.name.trim()) return;
    try {
      setIsSaving(true);
      const resp = await fetch('/api/vendors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newVendor.name.trim(),
          contact_info: newVendor.contact_info.trim() || null,
          address: newVendor.address.trim() || null,
        }),
      });
      if (!resp.ok) return;
      const created: Vendor = await resp.json();
      if (selectedItemIds.length > 0) {
        await Promise.all(
          selectedItemIds.map((id) =>
            fetch(`/api/items/${id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ vendor_id: created.id }),
            })
          )
        );
      }
      await fetchAll();
      setSelectedVendorId(created.id);
      setShowAddModal(false);
    } catch (e) {
      console.error('Failed to add vendor', e);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <p className="text-gray-500">Loading vendors...</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Vendors</h1>
          <p className="text-gray-600">Manage vendors and view their catalog</p>
        </div>
        <Button onClick={openAddVendor} icon={Plus}>Add Vendor</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Vendors list */}
        <div className="bg-white rounded-lg shadow border">
          <div className="px-4 py-3 border-b">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2"><Store className="h-5 w-5" /> All Vendors ({vendors.length})</h2>
          </div>
          <ul className="divide-y">
            {vendors.map((v) => (
              <li key={v.id}>
                <button
                  className={`w-full text-left px-4 py-3 hover:bg-gray-50 ${selectedVendorId === v.id ? 'bg-blue-50' : ''}`}
                  onClick={() => setSelectedVendorId(v.id)}
                >
                  <div className="font-medium text-gray-900">{v.name}</div>
                  {(v.contact_info || v.address) && (
                    <div className="text-sm text-gray-500 truncate">{v.contact_info || v.address}</div>
                  )}
                </button>
              </li>
            ))}
            {vendors.length === 0 && (
              <li className="px-4 py-6 text-sm text-gray-500">No vendors yet. Click &quot;Add Vendor&quot;.</li>
            )}
          </ul>
        </div>

        {/* Vendor details */}
        <div className="md:col-span-2 bg-white rounded-lg shadow border min-h-[360px]">
          {!selectedVendor ? (
            <div className="h-full p-8 flex items-center justify-center text-gray-500">
              <div className="flex items-center gap-2"><PackageSearch className="h-5 w-5" /> Select a vendor to view details</div>
            </div>
          ) : (
            <div className="p-6">
              <div className="mb-4">
                <h2 className="text-2xl font-semibold text-gray-900">{selectedVendor.name}</h2>
                <div className="mt-2 space-y-1 text-sm text-gray-600">
                  {selectedVendor.contact_info && (
                    <div className="flex items-center gap-2"><User className="h-4 w-4" /> {selectedVendor.contact_info}</div>
                  )}
                  {selectedVendor.address && (
                    <div className="flex items-center gap-2"><MapPin className="h-4 w-4" /> {selectedVendor.address}</div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Items from this vendor ({vendorItems.length})</h3>
                {vendorItems.length === 0 ? (
                  <div className="text-sm text-gray-500">No items associated with this vendor.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">On Hand</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {vendorItems.map((it, idx) => (
                          <tr key={it.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{it.name}</td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{it.unit}</td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{it.on_hand}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Vendor Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowAddModal(false)} />
          <div className="relative bg-white rounded-lg shadow-lg w-full max-w-2xl border">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Add Vendor</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-500 hover:text-gray-700"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={newVendor.name}
                  onChange={(e) => setNewVendor({ ...newVendor, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Vendor name"
                />
                </div>
                <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Info</label>
                <input
                  type="text"
                  value={newVendor.contact_info}
                  onChange={(e) => setNewVendor({ ...newVendor, contact_info: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Phone / email"
                />
                </div>
                <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <input
                  type="text"
                  value={newVendor.address}
                  onChange={(e) => setNewVendor({ ...newVendor, address: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Street, City"
                />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">Items this vendor sells</label>
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      value={itemSearch}
                      onChange={(e) => setItemSearch(e.target.value)}
                      placeholder="Search items..."
                      className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                </div>
                <div className="max-h-64 overflow-auto border rounded-md">
                  <table className="min-w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Select</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Vendor</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {filteredModalItems.map((it) => {
                        const checked = selectedItemIds.includes(it.id);
                        return (
                          <tr key={it.id} className="hover:bg-gray-50">
                            <td className="px-3 py-2">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={(e) => {
                                  setSelectedItemIds((prev) => {
                                    if (e.target.checked) return [...prev, it.id];
                                    return prev.filter((x) => x !== it.id);
                                  });
                                }}
                              />
                            </td>
                            <td className="px-3 py-2 text-sm font-medium text-gray-900">{it.name}</td>
                            <td className="px-3 py-2 text-sm text-gray-500">{it.unit}</td>
                            <td className="px-3 py-2 text-sm text-gray-500">{it.vendor_name || '—'}</td>
                          </tr>
                        );
                      })}
                      {filteredModalItems.length === 0 && (
                        <tr>
                          <td className="px-3 py-6 text-sm text-gray-500" colSpan={4}>No items match your search.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t flex items-center justify-end gap-2">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >Cancel</button>
              <button
                onClick={submitAddVendor}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                disabled={!newVendor.name.trim() || isSaving}
              >Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


