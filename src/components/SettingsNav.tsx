import { User, Lock, Bell } from "lucide-react";
import { cn } from "#/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const navItems = [
  { key: "profile" as const, label: "Profil", icon: User },
  { key: "security" as const, label: "Keamanan", icon: Lock },
  { key: "notification" as const, label: "Notifikasi", icon: Bell }
];

type SettingsTab = "profile" | "security" | "notification";

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
    <aside className="md:w-56 md:shrink-0">
      <div className="rounded-lg border border-neutral-200 bg-white p-3">
        <div className="mb-3 flex items-center gap-2.5 border-b border-border pb-3">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">
              {user.name || "Pengguna"}
            </p>
            <p className="truncate text-xs text-muted-foreground">
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
                  "justify-start gap-2 h-9 text-xs px-2.5",
                  isActive ? "font-medium" : "font-normal text-muted-foreground"
                )}
                onClick={() => onTabChange(item.key)}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Button>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
