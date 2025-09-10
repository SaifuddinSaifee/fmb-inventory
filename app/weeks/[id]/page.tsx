"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import WeekHeader from "@/components/vendors/WeekHeader";
import MenuRsvpSection from "@/components/vendors/MenuRsvpSection";
import WeeklyRequirementsSection from "@/components/vendors/WeeklyRequirementsSection";
import ShoppingListSection from "@/components/vendors/ShoppingListSection";
import type {
  WeekPlan,
  DayPlan,
  WeeklyRequirement,
  EditableRequirementKey,
  Item,
  ShoppingListItem,
} from "@/lib/weekTypes";

export default function WeekPlanPage() {
  const params = useParams();
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

  // Removed local shopping list export helpers (now in ShoppingListSection)

  // Section helpers moved into components

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
      <WeekHeader weekId={weekId} weekPlan={weekPlan} />

      <div className="space-y-8">
        <MenuRsvpSection
          dayPlans={dayPlans}
          isEditing={isEditingMenu}
          saving={saving}
          onEdit={handleEditMenuClick}
          onCancel={handleCancelMenuEdit}
          onSave={handleSaveMenu}
          onUpdateDay={updateDayPlan}
        />

        <WeeklyRequirementsSection
          items={items}
          requirements={requirements}
          hasUnsavedChanges={hasUnsavedChanges}
          hasUnselectedRequirement={hasUnselectedRequirement}
          saving={saving}
          onSave={saveRequirements}
          onAdd={addRequirement}
          onRemove={removeRequirement}
          onUpdate={updateRequirement}
          isRowChanged={(index, req) =>
            getChangedRequirements().has(index) ||
            (typeof req.id === "number" && !originalRequirements.some((orig) => orig.id === req.id))
          }
        />

        <ShoppingListSection
          weekPlan={weekPlan}
          shoppingList={shoppingList}
          includeOnHand={includeOnHand}
          includeRequired={includeRequired}
          setIncludeOnHand={setIncludeOnHand}
          setIncludeRequired={setIncludeRequired}
        />
      </div>
    </div>
  );
}
