import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "Will I lose my freedom to use my property?",
    answer:
      "No. Code enforcement is about preventing negligence that hurts property values. It ensures our streets and yards reflect the pride we feel for our lake.",
  },
  {
    question: "Why do we need Village police?",
    answer:
      "The Sheriff covers the whole county. Village police are dedicated solely to us, providing faster response times and true community policing.",
  },
  {
    question: "Will my property taxes increase?",
    answer:
      "The goal is to use LGDF funds from state income taxes to improve infrastructure without raising property taxes. Annexation brings new revenue streams that currently go to the state.",
  },
  {
    question: "What happens to current village residents?",
    answer:
      "Current village residents will benefit from expanded services, improved infrastructure, and a stronger, more unified community voice in local governance.",
  },
];

export default function FAQ() {
  return (
    <section id="faq" className="py-16 md:py-24 bg-background">
      <div className="max-w-4xl mx-auto px-6 lg:px-8">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-foreground" data-testid="text-faq-title">
          Frequently Asked Questions
        </h2>
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`} data-testid={`accordion-item-${index}`}>
              <AccordionTrigger className="text-left text-lg font-semibold">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
