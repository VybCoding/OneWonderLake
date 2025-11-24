import { DollarSign, ShieldCheck, Users } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

const benefits = [
  {
    icon: DollarSign,
    title: "Bringing Our Tax Dollars Home",
    description:
      "Currently, your state income tax dollars stay with the State. By annexing, we capture those 'LGDF' funds for Wonder Lake. This creates a new revenue stream for roads and infrastructure without raising local property tax rates.",
  },
  {
    icon: ShieldCheck,
    title: "Local Control & Standards",
    description:
      "Unified code enforcement protects property values and ensures our neighborhoods stay safe and well-maintained. It's about being good neighbors and preserving the rural, recreational character we love.",
  },
  {
    icon: Users,
    title: "Safety & Community",
    description:
      "Access to dedicated community policing and the collective budget to finally update playgrounds and create green spaces. A unified Village puts families and safety first.",
  },
];

export default function BenefitsGrid() {
  return (
    <section id="benefits" className="py-16 md:py-24 bg-muted/30">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-foreground" data-testid="text-benefits-title">
          Why One Wonder Lake?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <Card key={index} className="hover-elevate" data-testid={`card-benefit-${index}`}>
                <CardHeader className="text-center pb-4">
                  <div className="mx-auto mb-4 w-16 h-16 bg-accent rounded-full flex items-center justify-center">
                    <Icon className="w-8 h-8 text-accent-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground">
                    {benefit.title}
                  </h3>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed text-center">
                    {benefit.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
