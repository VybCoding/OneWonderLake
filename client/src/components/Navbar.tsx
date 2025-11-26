import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation, Link } from "wouter";

interface NavbarProps {
  onNavClick?: (section: string) => void;
}

export default function Navbar({ onNavClick }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [location] = useLocation();

  const navItems = [
    { label: "Mission", id: "mission", type: "scroll" as const },
    { label: "Benefits", id: "benefits", type: "scroll" as const },
    { label: "Address Checker", id: "address", type: "scroll" as const },
    { label: "Tax Estimator Tool", id: "tax-estimator", type: "link" as const, href: "/tax-estimator" },
    { label: "More Info", id: "more-info", type: "link" as const, href: "/more-info" },
  ];

  const handleNavClick = (item: typeof navItems[0]) => {
    setMobileMenuOpen(false);
    if (item.type === "link") {
      return;
    }
    if (onNavClick) {
      onNavClick(item.id);
    } else {
      document.getElementById(item.id)?.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <nav className="sticky top-0 z-[1000] bg-primary text-primary-foreground shadow-md">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="text-xl font-bold hover:opacity-80 transition-opacity" data-testid="text-logo">
              One Wonder Lake
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:gap-6">
            {navItems.map((item) => (
              item.type === "link" ? (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`text-primary-foreground hover:text-accent transition-colors px-3 py-2 ${location === item.href ? "text-accent" : ""}`}
                  data-testid={`link-nav-${item.id}`}
                >
                  {item.label}
                </Link>
              ) : (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item)}
                  className="text-primary-foreground hover:text-accent transition-colors px-3 py-2"
                  data-testid={`link-nav-${item.id}`}
                >
                  {item.label}
                </button>
              )
            ))}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-primary-foreground"
              data-testid="button-mobile-menu"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-primary border-t border-primary-border">
          <div className="px-4 py-4 space-y-2">
            {navItems.map((item) => (
              item.type === "link" ? (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block w-full text-left px-4 py-3 text-primary-foreground hover:bg-accent hover:text-accent-foreground rounded-md transition-colors ${location === item.href ? "bg-accent/20" : ""}`}
                  data-testid={`link-mobile-${item.id}`}
                >
                  {item.label}
                </Link>
              ) : (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item)}
                  className="block w-full text-left px-4 py-3 text-primary-foreground hover:bg-accent hover:text-accent-foreground rounded-md transition-colors"
                  data-testid={`link-mobile-${item.id}`}
                >
                  {item.label}
                </button>
              )
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
