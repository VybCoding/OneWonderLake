import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Search, Send, TrendingUp, Sparkles, MessageCircleQuestion, ArrowRight } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import QuestionForm from "./QuestionForm";
import FundRevenueCalculator from "./FundRevenueCalculator";
import type { DynamicFaq } from "@shared/schema";

interface StaticFaq {
  question: string;
  answer: string;
  category: "general" | "taxes" | "property_rights" | "services";
  hasCalculator?: boolean;
  linkTo?: {
    text: string;
    url: string;
  };
}

const staticFaqs: StaticFaq[] = [
  {
    question: "How does annexation actually bring money to Wonder Lake?",
    answer:
      "Every Illinois resident pays state income tax. For unincorporated residents, that money stays with the State. For Village residents, a portion returns through the Local Government Distributive Fund (LGDF). Right now, you're paying into a pot you can't access. Once annexed, your share comes home to fund Wonder Lake roads, parks, and services. And here's the multiplier effect: as more neighbors join, our total LGDF allocation grows—creating better services for everyone without raising property taxes.",
    category: "taxes",
  },
  {
    question: "What's this 'force annexation' I've heard about?",
    answer:
      "Illinois law (65 ILCS 5/7-1-13) allows villages to annex unincorporated territory under 60 acres that's wholly surrounded by the village—without resident consent. Three areas in Wonder Lake currently meet these criteria. Voluntary annexation now means you can negotiate protections. Later, you may not have that choice.",
    category: "general",
  },
  {
    question: "Will I have to get rid of my shed, chickens, or fence?",
    answer:
      "Pre-Annexation Agreements can explicitly \"grandfather\" existing structures and uses. Your shed stays. Your chickens stay. What changes is that you gain a voice in decisions affecting your neighborhood, plus access to services your tax dollars are already funding elsewhere.",
    category: "property_rights",
  },
  {
    question: "Will I lose my freedom to use my property?",
    answer:
      "No. Code enforcement is about preventing negligence that hurts property values. It ensures our streets and yards reflect the pride we feel for our lake.",
    category: "property_rights",
  },
  {
    question: "What does annexation mean for my home's value?",
    answer:
      "Consistent code enforcement, dedicated police, and improved infrastructure typically boost property values. Buyers prefer unified communities with clear governance over patchwork unincorporated areas. A stronger Wonder Lake means a stronger investment in your home.",
    category: "general",
  },
  {
    question: "I moved out here to get away from government. Why would I invite more?",
    answer:
      "We understand. Many of us moved here for peace and privacy. But here's the reality: you're already governed—by McHenry County, which has little stake in Wonder Lake specifically. Village government means local people making local decisions. Your voice carries more weight in a village of 4,000 than a county of 300,000.",
    category: "general",
  },
  {
    question: "Things are fine now. Why change anything?",
    answer:
      "Today's status quo won't last. State law allows villages to annex surrounded properties under 60 acres without consent. Three \"doughnut holes\" in our area already qualify. Voluntary annexation lets you negotiate terms—including Pre-Annexation Agreements that protect your property rights. Waiting means losing that leverage.",
    category: "general",
  },
  {
    question: "Will my property taxes increase?",
    answer:
      "Annexation does add a small Village levy to your property taxes. However, Wonder Lake's levy rate is one of the lowest in McHenry County. To see exactly how annexation would affect your specific property taxes, we recommend using our Tax Estimator tool.",
    category: "taxes",
    linkTo: {
      text: "Try the Tax Estimator",
      url: "/tax-estimator",
    },
  },
  {
    question: "Why do we need Village police?",
    answer:
      "The Sheriff covers the whole county. Village police are dedicated solely to us, providing faster response times and true community policing.",
    category: "services",
  },
  {
    question: "Is this LGDF money actually significant?",
    answer:
      "Yes. LGDF funds are distributed based on population at $178 per resident per year. Additionally, Motor Fuel Tax (MFT) provides $22.50 per resident per year for transportation infrastructure. For every resident annexed, Wonder Lake receives additional annual funding for village improvements—without touching property taxes. It compounds: more residents means a larger share, which funds better services, making our community more attractive, leading to continued growth. Try the interactive calculator below to see how the revenue grows with population.",
    category: "taxes",
    hasCalculator: true,
  },
  {
    question: "What happens to current village residents?",
    answer:
      "Current village residents will benefit from expanded services, improved infrastructure, and a stronger, more unified community voice in local governance.",
    category: "general",
  },
];

const categoryLabels: Record<string, string> = {
  all: "All Questions",
  general: "General",
  taxes: "Taxes & Finances",
  property_rights: "Property Rights",
  services: "Village Services",
};

const categoryColors: Record<string, string> = {
  general: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  taxes: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  property_rights: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  services: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
};

interface CombinedFaq {
  id: string;
  question: string;
  answer: string;
  category: string;
  isNew?: boolean;
  viewCount?: number;
  isDynamic?: boolean;
  hasCalculator?: boolean;
  linkTo?: {
    text: string;
    url: string;
  };
}

export default function FAQ() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("general");
  const [userQuestion, setUserQuestion] = useState("");
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const { data: dynamicFaqs = [] } = useQuery<DynamicFaq[]>({
    queryKey: ["/api/dynamic-faqs"],
  });

  const allFaqs: CombinedFaq[] = useMemo(() => {
    const staticItems: CombinedFaq[] = staticFaqs.map((faq, index) => ({
      id: `static-${index}`,
      question: faq.question,
      answer: faq.answer,
      category: faq.category,
      isDynamic: false,
      hasCalculator: faq.hasCalculator,
      linkTo: faq.linkTo,
    }));

    const dynamicItems: CombinedFaq[] = dynamicFaqs.map((faq) => ({
      id: faq.id,
      question: faq.question,
      answer: faq.answer,
      category: faq.category,
      isNew: faq.isNew ?? false,
      viewCount: faq.viewCount ?? 0,
      isDynamic: true,
    }));

    return [...dynamicItems, ...staticItems];
  }, [dynamicFaqs]);

  const filteredFaqs = useMemo(() => {
    return allFaqs.filter((faq) => {
      const matchesSearch =
        searchQuery === "" ||
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        selectedCategory === "all" || faq.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [allFaqs, searchQuery, selectedCategory]);

  const groupedFaqs = useMemo(() => {
    const groups: Record<string, CombinedFaq[]> = {
      general: [],
      taxes: [],
      property_rights: [],
      services: [],
    };

    filteredFaqs.forEach((faq) => {
      if (groups[faq.category]) {
        groups[faq.category].push(faq);
      }
    });

    return groups;
  }, [filteredFaqs]);

  const suggestedFaqs = useMemo(() => {
    if (userQuestion.length < 3) return [];

    const words = userQuestion.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
    if (words.length === 0) return [];

    return allFaqs
      .map((faq) => {
        const questionLower = faq.question.toLowerCase();
        const answerLower = faq.answer.toLowerCase();
        let score = 0;

        words.forEach((word) => {
          if (questionLower.includes(word)) score += 2;
          if (answerLower.includes(word)) score += 1;
        });

        return { faq, score };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((item) => item.faq);
  }, [userQuestion, allFaqs]);

  const handleSendQuestion = () => {
    if (userQuestion.trim().length >= 10) {
      setShowQuestionForm(true);
    }
  };

  const handleSuggestionClick = (faqId: string) => {
    setExpandedItems([faqId]);
    const element = document.getElementById(`faq-item-${faqId}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    setUserQuestion("");
  };

  const mostAskedFaqs = useMemo(() => {
    return allFaqs
      .filter((faq) => faq.isDynamic && (faq.viewCount ?? 0) >= 5)
      .sort((a, b) => (b.viewCount ?? 0) - (a.viewCount ?? 0))
      .slice(0, 3);
  }, [allFaqs]);

  const renderFaqItem = (faq: CombinedFaq) => (
    <AccordionItem
      key={faq.id}
      value={faq.id}
      id={`faq-item-${faq.id}`}
      data-testid={`accordion-item-${faq.id}`}
    >
      <AccordionTrigger className="text-left text-lg font-semibold hover:no-underline gap-3">
        <div className="flex flex-col items-start gap-2 flex-1">
          <span>{faq.question}</span>
          <div className="flex flex-wrap gap-2">
            {faq.isNew && (
              <Badge className="text-xs bg-primary/10 text-primary border-primary/20" data-testid={`badge-new-${faq.id}`}>
                <Sparkles className="w-3 h-3 mr-1" />
                New
              </Badge>
            )}
            {(faq.viewCount ?? 0) >= 5 && (
              <Badge variant="outline" className="text-xs" data-testid={`badge-popular-${faq.id}`}>
                <TrendingUp className="w-3 h-3 mr-1" />
                Popular
              </Badge>
            )}
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent className="text-muted-foreground leading-relaxed">
        <p className="mb-4">{faq.answer}</p>
        {faq.linkTo && (
          <Link
            href={faq.linkTo.url}
            className="inline-flex items-center gap-2 text-primary hover:underline font-medium mb-4"
            data-testid={`link-faq-${faq.id}`}
          >
            {faq.linkTo.text}
            <ArrowRight className="w-4 h-4" />
          </Link>
        )}
        {faq.hasCalculator && (
          <div className="mt-4" data-testid="faq-calculator">
            <FundRevenueCalculator />
          </div>
        )}
      </AccordionContent>
    </AccordionItem>
  );

  return (
    <section id="faq" className="py-16 md:py-24 bg-background">
      <div className="max-w-4xl mx-auto px-6 lg:px-8">
        <h2
          className="text-3xl md:text-4xl font-bold text-center mb-4 text-foreground"
          data-testid="text-faq-title"
        >
          Frequently Asked Questions
        </h2>
        <p className="text-center text-muted-foreground mb-8 max-w-2xl mx-auto">
          Find answers to common questions about annexation, property rights, taxes, and village services.
        </p>

        <div className="mb-8 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <Input
              placeholder="Search questions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-faq-search"
            />
          </div>

          <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="all" data-testid="tab-category-all">All</TabsTrigger>
              <TabsTrigger value="general" data-testid="tab-category-general">General</TabsTrigger>
              <TabsTrigger value="taxes" data-testid="tab-category-taxes">Taxes</TabsTrigger>
              <TabsTrigger value="property_rights" data-testid="tab-category-property">Property</TabsTrigger>
              <TabsTrigger value="services" data-testid="tab-category-services">Services</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {selectedCategory === "all" ? (
          <div className="space-y-8">
            {Object.entries(groupedFaqs).map(([category, faqs]) => {
              if (faqs.length === 0) return null;
              return (
                <div key={category}>
                  <h3 className="text-xl font-semibold mb-4 text-foreground flex items-center gap-2">
                    <Badge className={`${categoryColors[category]}`}>
                      {categoryLabels[category]}
                    </Badge>
                    <span className="text-sm text-muted-foreground font-normal">
                      ({faqs.length} {faqs.length === 1 ? "question" : "questions"})
                    </span>
                  </h3>
                  <Accordion
                    type="multiple"
                    value={expandedItems}
                    onValueChange={setExpandedItems}
                    className="w-full"
                  >
                    {faqs.map(renderFaqItem)}
                  </Accordion>
                </div>
              );
            })}
          </div>
        ) : (
          <Accordion
            type="multiple"
            value={expandedItems}
            onValueChange={setExpandedItems}
            className="w-full"
          >
            {filteredFaqs.map(renderFaqItem)}
          </Accordion>
        )}

        {filteredFaqs.length === 0 && (
          <div className="text-center py-12">
            <MessageCircleQuestion className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              No questions found matching your search. Try a different term or ask us below!
            </p>
          </div>
        )}

        <Card className="mt-12 p-6 bg-primary/5 border-primary/20">
          <h3 className="text-xl font-semibold mb-2 text-foreground flex items-center gap-2">
            <MessageCircleQuestion className="w-5 h-5 text-primary" />
            Have More Questions?
          </h3>
          <p className="text-muted-foreground mb-4">
            Can't find what you're looking for? Ask us directly and we'll get back to you!
          </p>

          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Type your question here... (minimum 10 characters)"
                value={userQuestion}
                onChange={(e) => setUserQuestion(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && userQuestion.trim().length >= 10) {
                    handleSendQuestion();
                  }
                }}
                className="flex-1"
                data-testid="input-ask-question"
              />
              <Button
                onClick={handleSendQuestion}
                disabled={userQuestion.trim().length < 10}
                data-testid="button-send-question"
              >
                <Send className="w-4 h-4 mr-2" />
                Send
              </Button>
            </div>

            {userQuestion.length > 0 && userQuestion.length < 10 && (
              <p className="text-sm text-muted-foreground">
                {10 - userQuestion.length} more characters needed
              </p>
            )}

            {suggestedFaqs.length > 0 && (
              <div className="bg-background rounded-lg p-4 border">
                <p className="text-sm font-medium text-muted-foreground mb-3">
                  These existing questions might help:
                </p>
                <div className="space-y-2">
                  {suggestedFaqs.map((faq) => (
                    <button
                      key={faq.id}
                      onClick={() => handleSuggestionClick(faq.id)}
                      className="w-full text-left p-3 rounded-md bg-muted/50 hover-elevate transition-colors text-sm"
                      data-testid={`suggestion-${faq.id}`}
                    >
                      <span className="font-medium text-foreground">{faq.question}</span>
                      <Badge
                        variant="secondary"
                        className={`ml-2 text-xs ${categoryColors[faq.category]}`}
                      >
                        {categoryLabels[faq.category]}
                      </Badge>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>

      <QuestionForm
        question={userQuestion}
        isOpen={showQuestionForm}
        onClose={() => setShowQuestionForm(false)}
        onSuccess={() => setUserQuestion("")}
      />
    </section>
  );
}
