import { useState } from "react";
import { DollarSign, Vote, Compass, ShieldCheck, Users, Navigation, HelpCircle, Send } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import QuestionForm from "@/components/QuestionForm";
import FundRevenueCalculator from "@/components/FundRevenueCalculator";

interface Benefit {
  id: string;
  icon: typeof DollarSign;
  title: string;
  shortDescription: string;
  fullContent: {
    headline: string;
    paragraphs: string[];
    keyPoints: string[];
  };
}

const benefits: Benefit[] = [
  {
    id: "state-tax-dollars",
    icon: DollarSign,
    title: "Bring State Tax Dollars Home",
    shortDescription:
      "Capture LGDF (Local Government Distributive Fund) money that currently stays with the state to fund Wonder Lake infrastructure and services.",
    fullContent: {
      headline: "Your Tax Dollars Should Work for Wonder Lake",
      paragraphs: [
        "Every year, Illinois residents pay state income taxes. A portion of that money is redistributed back to municipalities through the Local Government Distributive Fund (LGDF). But here's the catch: if you live in an unincorporated area, your share of that money stays with the State—it never comes back to your community.",
        "By annexing into the Village of Wonder Lake, we unlock access to these LGDF funds. This creates an entirely new revenue stream that can be used for road maintenance, infrastructure improvements, park upgrades, and community services—all without raising local property taxes.",
        "This isn't about creating new taxes. It's about redirecting money you're already paying so it benefits Wonder Lake instead of disappearing into the state's general fund.",
      ],
      keyPoints: [
        "LGDF funds are distributed based on population—more residents means more funding",
        "These funds can cover road repairs, snow removal, and infrastructure without property tax increases",
        "Unincorporated residents currently receive $0 of this redistributed income tax money",
        "Annexation immediately qualifies Wonder Lake for increased LGDF allocation",
      ],
    },
  },
  {
    id: "representation",
    icon: Vote,
    title: "Gain a Voice (Representation)",
    shortDescription:
      "Move from 'postal code residents' to voting citizens. Get the right to vote for Village President and Trustees who directly impact your daily life.",
    fullContent: {
      headline: "From Postal Code Residents to Voting Citizens",
      paragraphs: [
        "Right now, if you live in an unincorporated area, you have no vote in the decisions that affect your daily life. The Village of Wonder Lake makes choices about roads, services, and development that impact you—but you have no say in who leads that government.",
        "Annexation changes that immediately. You gain the right to vote for the Village President and Board of Trustees. These are the officials who set budgets, approve developments, establish policies, and shape the future of our community.",
        "This isn't just about voting—it's about accountability. When elected officials know they answer to you, they're more responsive to your concerns. Your voice matters, and annexation ensures it's heard.",
      ],
      keyPoints: [
        "Immediate voting rights for Village President and all Trustee positions",
        "Direct input on local budgets, zoning decisions, and community policies",
        "Elected officials become accountable to you as a constituent",
        "Opportunity to run for local office and shape community leadership",
        "Access to public comment periods and village board meetings as a voting resident",
      ],
    },
  },
  {
    id: "self-determination",
    icon: Compass,
    title: "Define Our Future (Self-Determination)",
    shortDescription:
      "Shift power from County officials to neighbors. Protect Wonder Lake's rural character and invest in our identity as a safe, recreational family community.",
    fullContent: {
      headline: "Our Neighbors, Our Decisions, Our Future",
      paragraphs: [
        "When you live in an unincorporated area, decisions about your community are made by McHenry County officials who oversee a vast territory with competing priorities. Your neighborhood is just one small piece of their responsibility—and rarely their focus.",
        "Annexation shifts that power to people who live here. Village decisions are made by elected officials who are your neighbors, who shop at the same stores, and whose kids attend the same schools. They understand Wonder Lake because they live Wonder Lake.",
        "This is about self-determination. We can protect the rural, recreational character that makes Wonder Lake special. We can invest in what matters to us: safe streets, beautiful parks, family-friendly amenities, and a tight-knit community identity. The County can't do that for us—only we can.",
      ],
      keyPoints: [
        "Local zoning control to protect rural character and prevent unwanted development",
        "Community-focused planning that prioritizes Wonder Lake's unique identity",
        "Faster response to local concerns without County bureaucracy",
        "Ability to establish village-wide standards that reflect our values",
        "Investment decisions made by people who understand and love this community",
      ],
    },
  },
  {
    id: "local-control",
    icon: ShieldCheck,
    title: "Establish Local Control & Protect Rights",
    shortDescription:
      "Use Pre-Annexation Agreements to 'grandfather' existing rural liberties (sheds, fences) while ensuring unified code enforcement protects property values.",
    fullContent: {
      headline: "Protecting What You Have While Gaining What You Need",
      paragraphs: [
        "One of the biggest concerns about annexation is the fear of losing rural freedoms—your shed, your fence line, your property the way you've always used it. We hear you, and that's why Pre-Annexation Agreements exist.",
        "A Pre-Annexation Agreement is a legally binding document that 'grandfathers' your existing property conditions before you join the Village. That means your current structures, setbacks, and uses are protected. You don't have to tear down the barn or move the fence.",
        "At the same time, annexation brings unified code enforcement. This protects everyone's property values by ensuring neighbors maintain their properties, junk doesn't accumulate on vacant lots, and our community standards are upheld consistently.",
      ],
      keyPoints: [
        "Pre-Annexation Agreements legally protect existing structures and property uses",
        "Current sheds, fences, setbacks, and improvements are grandfathered in",
        "Unified code enforcement prevents property neglect that hurts home values",
        "Consistent standards across all Wonder Lake neighborhoods",
        "Negotiate terms before annexation—not after",
      ],
    },
  },
  {
    id: "safety-services",
    icon: Users,
    title: "Improve Safety & Services",
    shortDescription:
      "Replace sporadic County Sheriff coverage with dedicated Village policing and fund local amenities like playgrounds and green spaces.",
    fullContent: {
      headline: "Dedicated Protection and Community Investment",
      paragraphs: [
        "Unincorporated areas rely on the McHenry County Sheriff's Department for law enforcement. While deputies do their best, they're spread thin across a massive county. Response times can be slow, and there's no dedicated patrol for our neighborhoods.",
        "As part of Wonder Lake, we can invest in dedicated community policing. Officers who know our streets, recognize our residents, and prioritize our safety. This isn't about more enforcement—it's about better, more responsive protection.",
        "Beyond safety, annexation opens doors to community investment. Updated playgrounds, maintained green spaces, community events, and recreational facilities. These are the things that make a community thrive, and they require the coordinated funding and planning that only a unified village can provide.",
      ],
      keyPoints: [
        "Dedicated police presence familiar with our neighborhoods",
        "Faster emergency response times",
        "Community-oriented policing focused on safety, not tickets",
        "Collective budget for playground updates and park maintenance",
        "Coordinated planning for trails, green spaces, and recreational facilities",
        "Community events and programs that bring neighbors together",
      ],
    },
  },
  {
    id: "golf-cart",
    icon: Navigation,
    title: "Recreational Freedoms (Golf Cart Ordinance)",
    shortDescription:
      "Enjoy the Village's golf cart ordinance that permits registered golf carts to operate within designated areas, enhancing neighborhood recreation and community character.",
    fullContent: {
      headline: "A Village That Celebrates Recreation and Lifestyle",
      paragraphs: [
        "One of the things that makes Wonder Lake special is our commitment to maintaining a recreational, family-friendly community. The Village has established an ordinance that permits golf cart usage within Village limits—a policy that reflects our values around leisure, neighborhood mobility, and quality of life.",
        "This golf cart ordinance allows registered owners to use their carts for local transportation and recreation throughout designated areas of the Village. It's a way to enjoy our community at a slower pace, connect with neighbors, and maintain the relaxed, recreational character that makes Wonder Lake unique.",
        "When you join the Village, you become part of a community that values these kinds of lifestyle freedoms. Rather than restrictive County rules, Wonder Lake's ordinances are written by and for our neighbors—people who understand what makes this community special and want to preserve it.",
      ],
      keyPoints: [
        "Registered golf carts permitted to operate within Village limits",
        "Use for local recreation and neighborhood transportation",
        "Policy reflects community values around leisure and lifestyle",
        "Written by Village government that understands local priorities",
        "Maintained through Village ordinance (not County oversight)",
        "Part of Wonder Lake's identity as a recreational family community",
      ],
    },
  },
];

export default function BenefitsGrid() {
  const [selectedBenefit, setSelectedBenefit] = useState<Benefit | null>(null);
  const [questionInput, setQuestionInput] = useState("");
  const [showQuestionForm, setShowQuestionForm] = useState(false);

  const handleAskQuestion = () => {
    if (questionInput.trim().length >= 10) {
      setShowQuestionForm(true);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && questionInput.trim().length >= 10) {
      handleAskQuestion();
    }
  };

  return (
    <section id="benefits" className="py-16 md:py-24 bg-muted/30">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground" data-testid="text-benefits-title">
            Why One Wonder Lake?
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Annexation isn't just beneficial—it's strategically necessary to secure our community's future. 
            Click any pillar below to learn more.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <Card 
                key={index} 
                className="hover-elevate cursor-pointer transition-all" 
                onClick={() => setSelectedBenefit(benefit)}
                data-testid={`card-benefit-${index}`}
              >
                <CardHeader className="text-center pb-4">
                  <div className="mx-auto mb-4 w-16 h-16 bg-accent rounded-full flex items-center justify-center">
                    <Icon className="w-8 h-8 text-accent-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground">
                    {benefit.title}
                  </h3>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed text-center text-sm">
                    {benefit.shortDescription}
                  </p>
                  <div className="mt-4 text-center">
                    <span className="text-primary text-sm font-medium hover:underline">
                      Learn more →
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Have More Questions Section */}
        <div className="mt-12">
          <Card className="p-6 md:p-8 border-primary/20 bg-primary/5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                <HelpCircle className="w-5 h-5 text-primary-foreground" />
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-foreground">
                Have More Questions?
              </h3>
            </div>
            <p className="text-muted-foreground mb-6">
              Can't find what you're looking for? Ask us directly and we'll get back to you.
            </p>
            <div className="flex gap-3">
              <Input
                placeholder="Type your question here... (minimum 10 characters)"
                value={questionInput}
                onChange={(e) => setQuestionInput(e.target.value)}
                onKeyDown={handleKeyPress}
                className="flex-1 bg-background"
                data-testid="input-homepage-question"
              />
              <Button
                onClick={handleAskQuestion}
                disabled={questionInput.trim().length < 10}
                data-testid="button-homepage-ask-question"
              >
                <Send className="w-4 h-4 mr-2" />
                Ask
              </Button>
            </div>
            {questionInput.length > 0 && questionInput.trim().length < 10 && (
              <p className="text-xs text-muted-foreground mt-2">
                Please enter at least 10 characters
              </p>
            )}
          </Card>
        </div>
      </div>

      <QuestionForm
        question={questionInput}
        isOpen={showQuestionForm}
        onClose={() => setShowQuestionForm(false)}
        onSuccess={() => {
          setQuestionInput("");
          setShowQuestionForm(false);
        }}
      />

      <Dialog open={!!selectedBenefit} onOpenChange={(open) => !open && setSelectedBenefit(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {selectedBenefit && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-4 mb-2">
                  <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center flex-shrink-0">
                    <selectedBenefit.icon className="w-6 h-6 text-accent-foreground" />
                  </div>
                  <div>
                    <DialogTitle className="text-xl md:text-2xl text-foreground">
                      {selectedBenefit.title}
                    </DialogTitle>
                  </div>
                </div>
                <DialogDescription className="text-base font-medium text-primary mt-2">
                  {selectedBenefit.fullContent.headline}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 mt-4">
                {selectedBenefit.fullContent.paragraphs.map((paragraph, idx) => (
                  <p key={idx} className="text-muted-foreground leading-relaxed">
                    {paragraph}
                  </p>
                ))}

                {selectedBenefit.id === "state-tax-dollars" && (
                  <FundRevenueCalculator />
                )}

                <div className="bg-muted/50 rounded-lg p-4 mt-6">
                  <h4 className="font-semibold text-foreground mb-3">Key Points:</h4>
                  <ul className="space-y-2">
                    {selectedBenefit.fullContent.keyPoints.map((point, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <span className="text-primary mt-1">•</span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex justify-end pt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setSelectedBenefit(null)}
                    data-testid="button-close-benefit-dialog"
                  >
                    Close
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
