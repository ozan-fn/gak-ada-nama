import { cn } from "@/lib/utils";
import { useScroll } from "@/hooks/use-scroll";
import { Button } from "@/components/ui/button";
import { MobileNav } from "@/components/MobileNav";
import { Link, useRouterState } from "@tanstack/react-router";
import { useSession } from "#/lib/auth-client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState, useRef, useEffect } from "react";
import { LayoutDashboard, LogOut } from "lucide-react";

export const navLinks = [
  {
    label: "Fitur",
    href: "/features",
  },
  {
    label: "Peta",
    href: "/livemap",
  },
  {
    label: "Laporan",
    href: "/reports",
  },
  {
    label: "Tentang",
    href: "/about",
  }
];

export function Header() {
  const scrolled = useScroll(10);
  const router = useRouterState();
  const isHome = router.location.pathname === '/' || router.location.pathname === '/_public/';
  const { data: session } = useSession();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const user = session?.user;

  const getInitials = (name?: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 mx-auto w-full max-w-5xl border-transparent border-b md:rounded-md md:border md:transition-all md:ease-out",
        {
          "border-border bg-background/95 backdrop-blur-sm supports-backdrop-filter:bg-background/50 md:top-2 md:max-w-4xl md:shadow": scrolled,
        }
      )}
    >
      <nav
        className={cn(
          "flex h-14 w-full items-center justify-between px-4 md:h-12 md:transition-all md:ease-out",
          {
            "md:px-2": scrolled,
          }
        )}
      >
        <Link
          to="/"
          className={cn(
            "rounded-md p-2 font-semibold transition-colors duration-300",
            {
              "text-foreground hover:bg-muted": scrolled || !isHome,
              "text-white hover:bg-white/10": !scrolled && isHome,
            }
          )}
        >
          Prita.
        </Link>
        <div className="hidden items-center gap-2 md:flex">
          <div>
            {navLinks.map((link) => (
              <Button
                key={link.label}
                size="sm"
                variant="ghost"
                className={cn("transition-colors duration-300", {
                  "text-foreground hover:text-foreground hover:bg-muted": scrolled || !isHome,
                  "text-white hover:text-white hover:bg-white/10": !scrolled && isHome,
                })}
              >
                <Link to={link.href}>{link.label}</Link>
              </Button>
            ))}
          </div>

          {user ? (
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setShowDropdown(!showDropdown)}
                className={cn(
                  "flex items-center rounded-lg p-1 transition-colors",
                  {
                    "hover:bg-muted": scrolled || !isHome,
                    "hover:bg-white/10": !scrolled && isHome,
                  }
                )}
              >
                <Avatar className="h-7 w-7 rounded-lg">
                  <AvatarImage src={user.image ?? undefined} alt={user.name ?? "User"} />
                  <AvatarFallback className="rounded-lg bg-sky-500 text-[11px] font-semibold text-white">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
              </button>

              {showDropdown && (
                <div className="absolute right-0 top-full mt-2 w-48 overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-lg">
                  <Link
                    to="/dashboard"
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-neutral-700 transition-colors hover:bg-neutral-50"
                    onClick={() => setShowDropdown(false)}
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setShowDropdown(false);
                      // TODO: Implement logout
                    }}
                    className="flex w-full items-center gap-3 border-t border-neutral-100 px-4 py-2.5 text-left text-sm text-red-600 transition-colors hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Button
                size="sm"
                variant="outline"
                className={cn("transition-colors duration-300", {
                  "border-border text-foreground hover:bg-muted bg-background": scrolled || !isHome,
                  "border-white/30 text-white hover:bg-white/10 bg-transparent": !scrolled && isHome,
                })}
              >
                <Link to="/login">Masuk</Link>
              </Button>
              <Button 
                size="sm"
                className={cn("transition-colors duration-300", {
                  "": scrolled || !isHome,
                  "bg-white text-gray-900 hover:bg-white/90": !scrolled && isHome,
                })}
              >
                <Link to="/register">Mulai Sekarang</Link>
              </Button>
            </>
          )}
        </div>
        <MobileNav isHome={isHome} scrolled={scrolled} user={user} />
      </nav>
    </header>
  );
}
