"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  GraduationCap,
  BarChart3,
  Menu,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Tags, ArrowUpDown, Settings, LogOut } from "lucide-react";

const TABS = [
  { label: "Home", icon: LayoutDashboard, href: "/dashboard" },
  { label: "Words", icon: BookOpen, href: "/dashboard/vocabulary" },
  { label: "Review", icon: GraduationCap, href: "/dashboard/review" },
  { label: "Progress", icon: BarChart3, href: "/dashboard/progress" },
];

const MORE_ITEMS = [
  { label: "Tags", icon: Tags, href: "/dashboard/tags" },
  { label: "Import / Export", icon: ArrowUpDown, href: "/dashboard/import-export" },
  { label: "Settings", icon: Settings, href: "/dashboard/settings" },
];

export default function MobileNav({
  signOutAction,
}: {
  signOutAction: () => void;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Hide mobile nav during review session
  if (pathname.startsWith("/dashboard/review/session")) return null;

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  }

  const moreActive = MORE_ITEMS.some((item) => isActive(item.href));

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center justify-around h-14">
        {TABS.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "flex flex-col items-center gap-0.5 px-3 py-1.5 text-[10px] font-medium transition-colors",
              isActive(tab.href)
                ? "text-primary"
                : "text-muted-foreground"
            )}
          >
            <tab.icon className="size-5" />
            {tab.label}
          </Link>
        ))}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-1.5 text-[10px] font-medium transition-colors",
                moreActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Menu className="size-5" />
              More
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="pb-safe">
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <div className="space-y-1 py-2">
              {MORE_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-3 text-sm font-medium",
                    isActive(item.href)
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground"
                  )}
                >
                  <item.icon className="size-5" />
                  {item.label}
                </Link>
              ))}
              <div className="border-t my-2" />
              <form action={signOutAction}>
                <button
                  type="submit"
                  className="flex items-center gap-3 rounded-md px-3 py-3 text-sm font-medium text-muted-foreground w-full"
                  onClick={() => setOpen(false)}
                >
                  <LogOut className="size-5" />
                  Sign Out
                </button>
              </form>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}
