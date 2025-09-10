"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Calendar, Clock, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

type WeekPlan = {
  id: number;
  start_date: string;
  status: "Draft" | "Published" | "Closed";
};

export default function Dashboard() {
  const [weeks, setWeeks] = useState<WeekPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchWeeks();
  }, []);

  const fetchWeeks = async () => {
    try {
      const response = await fetch("/api/weeks");
      if (response.ok) {
        const data = await response.json();
        setWeeks(data);
      }
    } catch (error) {
      console.error("Error fetching weeks:", error);
    } finally {
      setLoading(false);
    }
  };

  const createNewWeek = async () => {
    setCreating(true);
    try {
      // Get next Monday
      const today = new Date();
      const nextMonday = new Date(today);
      const daysUntilMonday = (8 - today.getDay()) % 7;
      nextMonday.setDate(today.getDate() + daysUntilMonday);

      const response = await fetch("/api/weeks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          start_date: nextMonday.toISOString().split("T")[0],
        }),
      });

      if (response.ok) {
        const newWeek = await response.json();
        setWeeks([newWeek, ...weeks]);
      }
    } catch (error) {
      console.error("Error creating week:", error);
    } finally {
      setCreating(false);
    }
  };

  const formatWeekRange = (startDate: string) => {
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Draft":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "Published":
        return <Calendar className="h-4 w-4 text-blue-500" />;
      case "Closed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <XCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Draft":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "Published":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "Closed":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">
          Manage your weekly menu plans and inventory
        </p>
      </div>

      {/* New Week Button */}
      <div className="mb-8">
        <Button onClick={createNewWeek} disabled={creating} icon={Plus}>
          {creating ? "Creating..." : "New Week"}
        </Button>
      </div>

      {/* Week Plans List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Recent Week Plans
          </h2>
        </div>

        {loading ? (
          <div className="divide-y divide-gray-200">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={`week-skel-${i}`} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0">
                      <Skeleton className="h-4 w-4 rounded-full" />
                    </div>
                    <div>
                      <Skeleton className="h-5 w-64" />
                      <Skeleton className="mt-2 h-4 w-40" />
                    </div>
                  </div>
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : weeks.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium mb-2">No week plans yet</p>
            <p>Create your first week plan to get started</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {weeks.map((week) => (
              <Link
                key={week.id}
                href={`/weeks/${week.id}`}
                className="block px-6 py-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0">
                      {getStatusIcon(week.status)}
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
                        Week of {formatWeekRange(week.start_date)}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Started {new Date(week.start_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(
                        week.status
                      )}`}
                    >
                      {week.status}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Calendar className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Weeks</p>
              <p className="text-2xl font-semibold text-gray-900">
                {loading ? <Skeleton className="h-7 w-12" /> : weeks.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Draft Plans</p>
              <p className="text-2xl font-semibold text-gray-900">
                {loading ? (
                  <Skeleton className="h-7 w-12" />
                ) : (
                  weeks.filter((w) => w.status === "Draft").length
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Completed</p>
              <p className="text-2xl font-semibold text-gray-900">
                {loading ? (
                  <Skeleton className="h-7 w-12" />
                ) : (
                  weeks.filter((w) => w.status === "Closed").length
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
