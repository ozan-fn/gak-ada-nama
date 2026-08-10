import { cn } from "@/lib/utils";
import { useScroll } from "@/hooks/use-scroll";
import { Button } from "@/components/ui/button";
import { MobileNav } from "@/components/MobileNav";
import { Link, useRouterState } from "@tanstack/react-router";

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
        </div>
        <MobileNav isHome={isHome} scrolled={scrolled} />
      </nav>
    </header>
  );
}
