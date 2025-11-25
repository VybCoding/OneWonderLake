import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "How does annexation actually bring money to Wonder Lake?",
    answer:
      "Every Illinois resident pays state income tax. For unincorporated residents, that money stays with the State. For Village residents, a portion returns through the Local Government Distributive Fund (LGDF). Right now, you're paying into a pot you can't access. Once annexed, your share comes home to fund Wonder Lake roads, parks, and services. And here's the multiplier effect: as more neighbors join, our total LGDF allocation grows—creating better services for everyone without raising property taxes.",
  },
  {
    question: "What's this 'force annexation' I've heard about?",
    answer:
      "Illinois law (65 ILCS 5/7-1-13) allows villages to annex unincorporated territory under 60 acres that's wholly surrounded by the village—without resident consent. Three areas in Wonder Lake currently meet these criteria. Voluntary annexation now means you can negotiate protections. Later, you may not have that choice.",
  },
  {
    question: "Will I have to get rid of my shed, chickens, or fence?",
    answer:
      "Pre-Annexation Agreements can explicitly \"grandfather\" existing structures and uses. Your shed stays. Your chickens stay. What changes is that you gain a voice in decisions affecting your neighborhood, plus access to services your tax dollars are already funding elsewhere.",
  },
  {
    question: "Will I lose my freedom to use my property?",
    answer:
      "No. Code enforcement is about preventing negligence that hurts property values. It ensures our streets and yards reflect the pride we feel for our lake.",
  },
  {
    question: "What does annexation mean for my home's value?",
    answer:
      "Consistent code enforcement, dedicated police, and improved infrastructure typically boost property values. Buyers prefer unified communities with clear governance over patchwork unincorporated areas. A stronger Wonder Lake means a stronger investment in your home.",
  },
  {
    question: "I moved out here to get away from government. Why would I invite more?",
    answer:
      "We understand. Many of us moved here for peace and privacy. But here's the reality: you're already governed—by McHenry County, which has little stake in Wonder Lake specifically. Village government means local people making local decisions. Your voice carries more weight in a village of 4,000 than a county of 300,000.",
  },
  {
    question: "Things are fine now. Why change anything?",
    answer:
      "Today's status quo won't last. State law allows villages to annex surrounded properties under 60 acres without consent. Three \"doughnut holes\" in our area already qualify. Voluntary annexation lets you negotiate terms—including Pre-Annexation Agreements that protect your property rights. Waiting means losing that leverage.",
  },
  {
    question: "Will my property taxes increase?",
    answer:
      "The goal is to use LGDF funds from state income taxes to improve infrastructure without raising property taxes. Annexation brings new revenue streams that currently go to the state.",
  },
  {
    question: "Why do we need Village police?",
    answer:
      "The Sheriff covers the whole county. Village police are dedicated solely to us, providing faster response times and true community policing.",
  },
  {
    question: "Is this LGDF money actually significant?",
    answer:
      "Yes. LGDF funds are distributed based on population. For every resident annexed, Wonder Lake receives additional annual funding for village improvements—without touching property taxes. It compounds: more residents means a larger share, which funds better services, making our community more attractive, leading to continued growth.",
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
