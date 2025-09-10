"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Package,
  LayoutDashboard,
  ChefHat,
  Store,
  Menu,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";

const navigation = [
  {
    name: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    name: "Items & Inventory",
    href: "/inventory",
    icon: Package,
  },
  {
    name: "Vendors",
    href: "/vendors",
    icon: Store,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false); // desktop collapse
  const [isMobileOpen, setIsMobileOpen] = useState(false); // mobile drawer

  // Disable body scroll when mobile drawer is open
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.body.style.overflow = isMobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileOpen]);

  const sidebarWidthDesktop = isCollapsed ? "md:w-16" : "md:w-64";

  return (
    <>
      {/* Mobile open button */}
      <button
        type="button"
        aria-label="Open menu"
        className={`fixed left-4 top-4 z-30 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-md ring-1 ring-gray-200 md:hidden transition-opacity ${
          isMobileOpen ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
        onClick={() => setIsMobileOpen(true)}
      >
        <Menu className="h-5 w-5 text-gray-700" />
      </button>

      {/* Backdrop for mobile */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={() => setIsMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar container */}
      <div
        className={`relative z-40 flex h-full w-64 flex-col border-r border-gray-200 bg-gray-50 transition-[width,transform] duration-300 md:translate-x-0 ${
          isMobileOpen ? "translate-x-0 fixed left-0 top-0" : "-translate-x-full fixed left-0 top-0"
        } md:static md:h-full ${sidebarWidthDesktop}`}
        role="complementary"
        aria-label="Sidebar navigation"
      >
        {/* Logo/Header */}
        <div className={`flex h-16 items-center border-b border-gray-200 px-6 ${isCollapsed ? "md:justify-center md:px-2" : ""}`}>
          <div className={`flex items-center gap-2 ${isCollapsed ? "md:gap-0" : ""}`}>
            <ChefHat className="h-8 w-8 text-blue-600" />
            <div className={`${isCollapsed ? "md:hidden" : ""}`}>
              <h1 className="text-lg font-semibold text-gray-900">FMB Kitchen</h1>
              <p className="text-xs text-gray-500">Menu & Inventory</p>
            </div>
          </div>

          {/* Close button on mobile inside header */}
          <button
            type="button"
            aria-label="Close menu"
            className="ml-auto inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-gray-100 md:hidden"
            onClick={() => setIsMobileOpen(false)}
          >
            <X className="h-5 w-5 text-gray-700" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-6">
          <ul className="space-y-2">
            {navigation.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/" && pathname.startsWith(item.href));

              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={`
                      flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors
                      ${
                        isActive
                          ? "bg-blue-100 text-blue-700 border border-blue-200"
                          : "text-gray-700 hover:bg-gray-100 hover:text-gray-900 border border-transparent"
                      }
                    `}
                    onClick={() => setIsMobileOpen(false)}
                  >
                    <item.icon className="h-5 w-5 shrink-0" />
                    <span className={`${isCollapsed ? "md:hidden" : ""}`}>{item.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <div className={`text-xs text-gray-500 text-center ${isCollapsed ? "md:hidden" : ""}`}>
            Weekly Menu & Inventory
            <br />
            Ultra-Simple MVP v0.2
          </div>
        </div>

        {/* Desktop collapse/expand toggle button - refined alignment and style */}
        <button
          type="button"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={isCollapsed ? "Expand" : "Collapse"}
          className="absolute right-0 top-4 hidden translate-x-1/2 md:flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-md ring-1 ring-gray-200 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition"
          onClick={() => setIsCollapsed((v) => !v)}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4 text-gray-700" />
          ) : (
            <ChevronLeft className="h-4 w-4 text-gray-700" />
          )}
        </button>
      </div>
    </>
  );
}
