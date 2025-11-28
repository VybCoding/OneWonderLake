import { Link } from "wouter";
import { Calculator, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TaxEstimatorCTA() {
  return (
    <section className="py-12 md:py-16 bg-muted/30">
      <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
        <div className="flex flex-col items-center gap-4">
          <Calculator className="w-10 h-10 text-primary" />
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">
            Curious About Your Taxes?
          </h2>
          <p className="text-muted-foreground max-w-2xl">
            Use our tax estimator to see exactly how annexation would affect your property taxes.
          </p>
          <Button asChild size="lg" className="mt-2 gap-2" data-testid="button-tax-estimator-cta">
            <Link href="/tax-estimator">
              <Calculator className="w-5 h-5" />
              Estimate My Taxes
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
