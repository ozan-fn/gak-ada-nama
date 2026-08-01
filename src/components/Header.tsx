import { cn } from "@/lib/utils";
import { useScroll } from "@/hooks/use-scroll";
import { Button } from "@/components/ui/button";
import { MobileNav } from "@/components/MobileNav";
import { Link } from "@tanstack/react-router";

export const navLinks = [
  {
    label: "Fitur",
    href: "#",
  },
  {
    label: "Peta",
    href: "#",
  },
  {
    label: "Laporan",
    href: "#",
  },
  {
    label: "Tentang",
    href: "#",
  }
];

export function Header() {
  const scrolled = useScroll(10);

  return (
    <header
      className={cn("sticky top-0 z-50 w-full border-transparent border-b transition-colors duration-300", {
        "border-border bg-background/95 backdrop-blur-sm supports-backdrop-filter:bg-background/50": scrolled,
      })}
    >
      <nav className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4">
        <span className={cn("font-semibold transition-colors duration-300", {
          "text-gray-900": scrolled,
          "text-white": !scrolled,
        })}>
          Prita.
        </span>
        <div className="hidden items-center gap-2 md:flex">
          {navLinks.map((link) => (
            <Button
              key={link.label}
              size="sm"
              variant="ghost"
              className={cn("transition-colors duration-300", {
                "text-gray-900 hover:text-gray-900": scrolled,
                "text-white hover:text-white hover:bg-white/10": !scrolled,
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
                "border-gray-300 text-gray-900 hover:bg-gray-100": scrolled,
                "border-white text-white hover:bg-white/10": !scrolled,
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
