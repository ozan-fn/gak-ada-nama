import { useEffect, useState } from "react";
import { User, Lock, Bell, Palette } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const navItems = [
  { key: "profile" as const, label: "Profil", icon: User },
  { key: "security" as const, label: "Keamanan", icon: Lock },
  { key: "notification" as const, label: "Notifikasi", icon: Bell },
  { key: "appearance" as const, label: "Tampilan", icon: Palette }
];

type SettingsTab = "profile" | "security" | "notification" | "appearance";

interface SettingsNavProps {
  user: { name?: string | null; email: string };
  activeTab: SettingsTab;
  onTabChange: (tab: SettingsTab) => void;
}

export default function SettingsNav({
  user,
  activeTab,
  onTabChange,
}: SettingsNavProps) {
  const [, forceUpdate] = useState({});

  useEffect(() => {
    // Watch for theme changes and force re-render
    const observer = new MutationObserver(() => {
      forceUpdate({});
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  const getInitials = (name?: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <aside className="flex min-h-0 flex-1 shrink-0 flex-col">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg bg-white p-3 shadow-sm dark:bg-neutral-800">
        <div className="mb-3 flex items-center gap-2.5 border-b border-neutral-200 pb-3 dark:border-neutral-700">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-sky-500 text-xs font-semibold text-white dark:bg-sky-600">
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-neutral-900 dark:text-neutral-100">
              {user.name || "Pengguna"}
            </p>
            <p className="truncate text-[11px] text-neutral-500 dark:text-neutral-400">
              {user.email}
            </p>
          </div>
        </div>

        <nav className="flex flex-row gap-1 md:flex-col">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.key;
            return (
              <Button
                key={item.key}
                variant={isActive ? "secondary" : "ghost"}
                className={cn(
                  "h-8 justify-start gap-2 px-2.5 text-xs",
                  isActive
                    ? "font-semibold text-neutral-900 dark:bg-neutral-700 dark:text-neutral-100"
                    : "font-normal text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
                )}
                onClick={() => onTabChange(item.key)}
              >
                <Icon className="h-3.5 w-3.5" />
                {item.label}
              </Button>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
