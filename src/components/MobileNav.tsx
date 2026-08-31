import { cn } from "#/lib/utils";
import React from "react";
import { Button } from "#/components/ui/button";
import { Portal, PortalBackdrop } from "#/components/ui/portal";
import { navLinks } from "#/components/Header";
import { XIcon, MenuIcon, LayoutDashboard, LogOut } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Avatar, AvatarFallback, AvatarImage } from "#/components/ui/avatar";

interface MobileNavProps {
  isHome: boolean;
  scrolled: boolean;
  user?: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
  };
}

export function MobileNav({ isHome, scrolled, user }: MobileNavProps) {
  const [open, setOpen] = React.useState(false);

  const getInitials = (name?: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="md:hidden">
      <Button
        aria-controls="mobile-menu"
        aria-expanded={open}
        aria-label="Toggle menu"
        className={cn(
          "md:hidden transition-colors duration-300",
          {
            "border-border text-foreground hover:bg-muted": scrolled || !isHome,
            "border-white/30 text-white hover:bg-white/10": !scrolled && isHome,
          }
        )}
        onClick={() => setOpen(!open)}
        size="icon"
        variant="outline"
      >
        {open ? <XIcon className="size-4.5" /> : <MenuIcon className="size-4.5" />}
      </Button>
      {open && (
        <Portal className="top-14" id="mobile-menu">
          <PortalBackdrop />
          <div
            className={cn(
              "data-[slot=open]:zoom-in-97 ease-out data-[slot=open]:animate-in",
              "size-full p-4"
            )}
            data-slot={open ? "open" : "closed"}
          >
            <div className="grid gap-y-2">
              {navLinks.map((link) => (
                <Button
                  className="justify-start"
                  key={link.label}
                  variant="ghost"
                  onClick={() => setOpen(false)}
                >
                  <Link to={link.href}>{link.label}</Link>
                </Button>
              ))}
            </div>
            
            {user ? (
              <div className="mt-12 flex flex-col gap-2">
                <div className="mb-3 flex items-center gap-3 rounded-lg border border-neutral-200 bg-neutral-50 p-3">
                  <Avatar className="h-10 w-10 rounded-lg">
                    <AvatarImage src={user.image ?? undefined} alt={user.name} />
                    <AvatarFallback className="rounded-lg bg-sky-500 text-sm font-semibold text-white">
                      {getInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-neutral-900">{user.name}</p>
                    <p className="text-xs text-neutral-500">{user.email}</p>
                  </div>
                </div>
                
                <Button
                  className="w-full justify-start"
                  variant="ghost"
                  onClick={() => setOpen(false)}
                >
                  <Link to="/dashboard" className="flex items-center gap-2">
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                  </Link>
                </Button>
                
                <Button
                  className="w-full justify-start text-red-600 hover:bg-red-50 hover:text-red-600"
                  variant="ghost"
                  onClick={() => {
                    setOpen(false);
                    // TODO: Implement logout
                  }}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
              </div>
            ) : (
              <div className="mt-12 flex flex-col gap-2">
                <Button className="w-full" variant="outline" onClick={() => setOpen(false)}>
                  <Link to="/login">Masuk</Link>
                </Button>
                <Button className="w-full" onClick={() => setOpen(false)}>
                  <Link to="/register">Mulai Sekarang</Link>
                </Button>
              </div>
            )}
          </div>
        </Portal>
      )}
    </div>
  );
}
