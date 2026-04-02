"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Clock, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/portal/login");
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500">
                <Clock className="h-4 w-4 text-white" />
              </div>
              <span className="font-semibold text-slate-900">ClockWise Portal</span>
            </div>
            <nav className="flex items-center gap-4">
              <Link href="/portal" className="text-sm text-slate-600 hover:text-slate-900">
                Dashboard
              </Link>
              <Link href="/portal/timesheet" className="text-sm text-slate-600 hover:text-slate-900">
                My Timesheet
              </Link>
              <Link href="/portal/absence" className="text-sm text-slate-600 hover:text-slate-900">
                Absence
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" className="gap-2">
              <User className="h-4 w-4" />
              My Profile
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2">
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}
