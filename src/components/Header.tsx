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
    label: "Harga",
    href: "#",
  },
  {
    label: "Tentang",
    href: "#",
  },
];

export function Header() {
  const scrolled = useScroll(10);

  return (
    <header
      className={cn("sticky top-0 z-50 w-full border-transparent border-b", {
        "border-border bg-background/95 backdrop-blur-sm supports-backdrop-filter:bg-background/50": scrolled,
      })}
    >
      <nav className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4">
        Prita.
        <div className="hidden items-center gap-2 md:flex">
          {navLinks.map((link) => (
            <Button key={link.label} size="sm" variant="ghost">
              <Link to={link.href}>{link.label}</Link>
            </Button>
          ))}
          <Button size="sm" variant="outline">
            Masuk
          </Button>
          <Button size="sm">Mulai Sekarang</Button>
        </div>
        <MobileNav />
      </nav>
    </header>
  );
}
