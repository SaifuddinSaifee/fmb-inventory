"use client";

import { ArrowLeft, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { WeekPlan } from "@/lib/weekTypes";

export function getWeekRange(startDate: string) {
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

export default function WeekHeader({
  weekId,
  weekPlan,
}: {
  weekId: number;
  weekPlan: WeekPlan;
}) {
  const router = useRouter();

  const handleDelete = async () => {
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
  };

  return (
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
            onClick={handleDelete}
          >
            Delete Week
          </Button>
        </div>
      </div>
    </div>
  );
}
