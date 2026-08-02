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
      className={cn("sticky top-0 z-50 w-full border-transparent border-b transition-colors duration-300", {
        "border-border bg-background/95 backdrop-blur-sm supports-backdrop-filter:bg-background/50": scrolled,
      })}
    >
      <nav className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4">
        <span className={cn("font-semibold transition-colors duration-300", {
          "text-gray-900": scrolled || !isHome,
          "text-white": !scrolled && isHome,
        })}>
          <Link to="/">
            Prita.
          </Link>
        </span>
        <div className="hidden items-center gap-2 md:flex">
          {navLinks.map((link) => (
            <Button
              key={link.label}
              size="sm"
              variant="ghost"
              className={cn("transition-colors duration-300", {
                "text-gray-900 hover:text-gray-900": scrolled || !isHome,
                "text-white hover:text-white hover:bg-white/10": !scrolled && isHome,
              })}
            >
              <Link to={link.href}>{link.label}</Link>
            </Button>
          ))}
          <Link to="/login">
            <Button
              size="sm"
              variant="outline"
              className={cn("transition-colors duration-300", {
                "border-gray-300 text-gray-900 hover:bg-gray-100": scrolled || !isHome,
                "border-white text-white hover:bg-white/10": !scrolled && isHome,
              })}
            >
              Masuk
            </Button>
          </Link>
          <Link to="/register">
            <Button size="sm">Mulai Sekarang</Button>
          </Link>
        </div>
        <MobileNav />
      </nav>
    </header>
  );
}
