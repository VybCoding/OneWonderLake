import { Link } from "wouter";
import { Calculator, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ActionButtons() {
  const handleAddressClick = () => {
    document.getElementById("address")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="py-8 md:py-10 bg-muted/30">
      <div className="max-w-4xl mx-auto px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button
            size="lg"
            onClick={handleAddressClick}
            className="w-full sm:w-auto gap-2 text-lg px-8 py-6 h-auto"
            data-testid="button-check-address-cta"
          >
            <MapPin className="w-5 h-5" />
            Check My Address
          </Button>
          <Button
            size="lg"
            variant="outline"
            asChild
            className="w-full sm:w-auto gap-2 text-lg px-8 py-6 h-auto"
            data-testid="button-tax-estimator-cta"
          >
            <Link href="/tax-estimator">
              <Calculator className="w-5 h-5" />
              Estimate My Taxes
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
