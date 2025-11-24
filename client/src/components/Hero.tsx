import { Button } from "@/components/ui/button";

interface HeroProps {
  onCTAClick?: () => void;
}

export default function Hero({ onCTAClick }: HeroProps) {
  const handleClick = () => {
    if (onCTAClick) {
      onCTAClick();
    } else {
      document.getElementById("address")?.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="bg-primary text-primary-foreground py-24 md:py-32 lg:py-40">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6" data-testid="text-hero-headline">
          One Lake. One Community. One Future.
        </h1>
        <p className="text-xl md:text-2xl mb-10 text-primary-foreground/90 max-w-3xl mx-auto" data-testid="text-hero-subhead">
          Uniting our neighborhoods for a stronger Wonder Lake.
        </p>
        <Button
          size="lg"
          onClick={handleClick}
          className="bg-accent text-accent-foreground hover:bg-primary-foreground hover:text-primary text-lg px-8 py-6 h-auto"
          data-testid="button-hero-cta"
        >
          Check My Address
        </Button>
      </div>
    </section>
  );
}
