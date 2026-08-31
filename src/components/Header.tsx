import { cn } from "@/lib/utils";
import { useScroll } from "@/hooks/use-scroll";
import { Button } from "@/components/ui/button";
import { MobileNav } from "@/components/MobileNav";
import { Link, useRouterState } from "@tanstack/react-router";
import { useSession, signOut } from "#/lib/auth-client.client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState, useRef, useEffect } from "react";
import { LayoutDashboard, LogOut } from "lucide-react";

import logoBlue from "@/assets/images/logo-blue.png";
import logoWhite from "@/assets/images/logo-white.png";

export const navLinks = [
  {
    label: "Peta",
    href: "/livemap",
  },
  // {
  //   label: "Laporan",
  //   href: "/reports",
  // },
  {
    label: "Tentang",
    href: "/about",
  },
];

export function Header() {
  const scrolled = useScroll(10);
  const router = useRouterState();

  const isHome =
    router.location.pathname === "/" ||
    router.location.pathname === "/_public/";

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
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  /*
   * Logo behavior:
   *
   * Home + belum scroll  -> white
   * Home + sudah scroll  -> blue
   * Selain home          -> blue
   */
  const logo = isHome && !scrolled ? logoWhite : logoBlue;

  return (
    <header
      className={cn(
        "sticky top-0 z-50 mx-auto w-full max-w-5xl border-b border-transparent md:top-2 md:rounded-xl md:border md:transition-all md:duration-300 md:ease-out",
        {
          "border-neutral-200/60 bg-white/65 shadow-sm backdrop-blur-xl supports-backdrop-filter:bg-white/50 md:max-w-4xl dark:border-neutral-800/60 dark:bg-neutral-900/65":
            scrolled,

          "bg-transparent": !scrolled,
        },
      )}
    >
      <nav
        className={cn(
          "flex h-14 w-full items-center justify-between px-4 transition-all duration-300 md:h-12 md:ease-out",
          {
            "md:px-2": scrolled,
          },
        )}
      >
        {/* =====================================================
            LOGO
        ====================================================== */}

        <Link
          to="/"
          className={cn({
            "text-foreground": scrolled || !isHome,
            "text-white": !scrolled && isHome,
          })}
        >
          <img src={logo} alt="Prita Logo" className="h-6.5" />
        </Link>

        {/* =====================================================
            DESKTOP NAVIGATION
        ====================================================== */}

        <div className="hidden items-center gap-2 md:flex">
          {/* Navigation Links */}

          <div className="flex items-center">
            {navLinks.map((link) => (
              <Button
                key={link.label}
                size="sm"
                variant="ghost"
                className={cn("transition-colors duration-300", {
                  "text-foreground hover:bg-muted hover:text-foreground":
                    scrolled || !isHome,

                  "text-white hover:bg-white/10 hover:text-white":
                    !scrolled && isHome,
                })}
              >
                <Link to={link.href}>{link.label}</Link>
              </Button>
            ))}
          </div>

          {/* =================================================
              AUTHENTICATED USER
          ================================================== */}

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
                  },
                )}
                aria-label="Menu pengguna"
                aria-expanded={showDropdown}
              >
                <Avatar className="h-7 w-7 rounded-lg">
                  <AvatarImage
                    src={user.image ?? undefined}
                    alt={user.name ?? "User"}
                  />

                  <AvatarFallback className="rounded-lg bg-sky-500 text-[11px] font-semibold text-white">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
              </button>

              {/* User Dropdown */}

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
                    onClick={async () => {
                      setShowDropdown(false);
                      await signOut();
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
              {/* =================================================
                  LOGIN
              ================================================== */}

              <Button
                size="sm"
                variant="outline"
                className={cn("transition-colors duration-300", {
                  "border-border bg-background text-foreground hover:bg-muted":
                    scrolled || !isHome,

                  "border-white/30 bg-transparent text-white hover:bg-white/10":
                    !scrolled && isHome,
                })}
              >
                <Link to="/login">Masuk</Link>
              </Button>

              {/* =================================================
                  REGISTER
              ================================================== */}

              <Button
                size="sm"
                className={cn("transition-colors duration-300", {
                  "border-sky-400/30 bg-sky-500 text-white shadow-lg shadow-sky-500/20 hover:bg-sky-400 hover:shadow-sky-500/30":
                    scrolled || !isHome,

                  "bg-white text-gray-900 hover:bg-white/90":
                    !scrolled && isHome,
                })}
              >
                <Link to="/register">Mulai Sekarang</Link>
              </Button>
            </>
          )}
        </div>

        {/* =====================================================
            MOBILE NAVIGATION
        ====================================================== */}

        <MobileNav isHome={isHome} scrolled={scrolled} user={user} />
      </nav>
    </header>
  );
}
