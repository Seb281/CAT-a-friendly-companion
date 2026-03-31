"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Languages,
  LayoutDashboard,
  BookOpen,
  GraduationCap,
  BarChart3,
  Tags,
  ArrowUpDown,
  Settings,
  LogOut,
  User,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

const NAV_ITEMS = [
  { label: "Home", icon: LayoutDashboard, href: "/dashboard" },
  { label: "Vocabulary", icon: BookOpen, href: "/dashboard/vocabulary" },
  { label: "Review", icon: GraduationCap, href: "/dashboard/review" },
  { label: "Progress", icon: BarChart3, href: "/dashboard/progress" },
  { label: "Tags", icon: Tags, href: "/dashboard/tags" },
];

const SECONDARY_NAV = [
  { label: "Import / Export", icon: ArrowUpDown, href: "/dashboard/import-export" },
  { label: "Settings", icon: Settings, href: "/dashboard/settings" },
];

export default function Sidebar({
  userEmail,
  signOutAction,
}: {
  userEmail?: string;
  signOutAction: () => void;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("sidebar-collapsed");
    if (stored === "true") setCollapsed(true);
  }, []);

  function toggleCollapse() {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem("sidebar-collapsed", String(next));
  }

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  }

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "hidden lg:flex flex-col bg-sidebar h-screen sticky top-0 transition-all duration-200",
          collapsed ? "w-16" : "w-[220px]"
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-2 px-4 h-14 shrink-0 mb-4">
          <Link href="/dashboard" className="flex items-center gap-2 font-bold min-w-0">
            <Languages className="size-5 text-muted-foreground shrink-0" />
            {!collapsed && <span className="truncate text-sidebar-foreground tracking-tight">Context Translator</span>}
          </Link>
        </div>

        {/* Primary nav */}
        <nav className="flex-1 py-1 px-2 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href);
            const link = (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                  collapsed && "justify-center px-2"
                )}
              >
                <item.icon className="size-4 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );

            if (collapsed) {
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>{link}</TooltipTrigger>
                  <TooltipContent side="right">{item.label}</TooltipContent>
                </Tooltip>
              );
            }
            return link;
          })}

          <div className="my-3" />

          {SECONDARY_NAV.map((item) => {
            const active = isActive(item.href);
            const link = (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                  collapsed && "justify-center px-2"
                )}
              >
                <item.icon className="size-4 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );

            if (collapsed) {
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>{link}</TooltipTrigger>
                  <TooltipContent side="right">{item.label}</TooltipContent>
                </Tooltip>
              );
            }
            return link;
          })}
        </nav>

        {/* Footer */}
        <div className="px-2 py-3 space-y-2 shrink-0">
          {/* Collapse toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleCollapse}
            className={cn("w-full text-muted-foreground hover:text-foreground", collapsed ? "justify-center" : "justify-start")}
          >
            {collapsed ? (
              <ChevronRight className="size-4" />
            ) : (
              <>
                <ChevronLeft className="size-4 mr-2" />
                Collapse
              </>
            )}
          </Button>

          {/* Feedback */}
          {(() => {
            const active = isActive("/dashboard/feedback");
            const link = (
              <Link
                href="/dashboard/feedback"
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                  collapsed && "justify-center px-2"
                )}
              >
                <MessageSquare className="size-4 shrink-0" />
                {!collapsed && <span>Feedback</span>}
              </Link>
            );
            return collapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>{link}</TooltipTrigger>
                <TooltipContent side="right">Feedback</TooltipContent>
              </Tooltip>
            ) : link;
          })()}

          {/* User info + sign out */}
          <div className={cn("flex items-center gap-2 px-2", collapsed && "justify-center")}>
            <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center shrink-0">
              <User className="size-3.5 text-muted-foreground" />
            </div>
            {!collapsed && (
              <span className="text-xs text-muted-foreground truncate flex-1">
                {userEmail}
              </span>
            )}
          </div>
          <form action={signOutAction}>
            <Button
              variant="ghost"
              size="sm"
              type="submit"
              className={cn("w-full text-muted-foreground hover:text-foreground", collapsed ? "justify-center" : "justify-start")}
            >
              <LogOut className="size-4 shrink-0" />
              {!collapsed && <span className="ml-2">Sign Out</span>}
            </Button>
          </form>
        </div>
      </aside>
    </TooltipProvider>
  );
}
