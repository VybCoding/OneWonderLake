import { Link } from "wouter";
import { MessageCircleQuestion, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function QuestionsCTA() {
  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="max-w-4xl mx-auto px-6 lg:px-8">
        <Card className="p-8 md:p-12 border-primary/20 bg-primary/5">
          <div className="flex items-center gap-4 mb-6">
            <MessageCircleQuestion className="w-8 h-8 text-primary flex-shrink-0" />
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">
              Have Questions?
            </h2>
          </div>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl">
            Explore our comprehensive FAQ section to find answers about annexation, property rights, taxes, and village services. Can't find what you're looking for? Ask us directly.
          </p>
          <Button asChild className="gap-2" data-testid="button-questions-cta">
            <Link href="/more-info">
              Explore More Info
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </Card>
      </div>
    </section>
  );
}
