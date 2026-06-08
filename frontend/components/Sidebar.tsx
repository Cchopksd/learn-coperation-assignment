"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";

import { NAV_ITEMS } from "@/config/navigation.config";
import { useAuthStore } from "@/state/auth.store";
import { titleCase } from "@/utils/format";
import { Button } from "./ui";

export function Sidebar() {
  const pathname = usePathname();
  const staff = useAuthStore((s) => s.staff);
  const logout = useAuthStore((s) => s.logout);

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-5 py-4">
        <p className="text-sm font-semibold text-slate-900">Learning Center</p>
        <p className="text-xs text-slate-500">Admin Console</p>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {NAV_ITEMS.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-200 px-4 py-4">
        {staff && (
          <div className="mb-3">
            <p className="truncate text-sm font-medium text-slate-800">
              {staff.name}
            </p>
            <p className="truncate text-xs text-slate-500">
              {titleCase(staff.role)}
            </p>
          </div>
        )}
        <Button
          variant="secondary"
          size="sm"
          className="flex w-full items-center justify-center gap-2"
          onClick={logout}
        >
          <LogOut className="h-4 w-4" aria-hidden />
          Log out
        </Button>
      </div>
    </aside>
  );
}
