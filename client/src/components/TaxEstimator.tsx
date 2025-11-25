import { useState, useEffect } from "react";
import { Calculator, TrendingUp, DollarSign, AlertCircle, ChevronDown, ChevronUp, Info, ExternalLink, HelpCircle, FileText, ThumbsUp, ThumbsDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import InterestForm from "@/components/InterestForm";

interface TaxEstimate {
  currentTax: number;
  estimatedPostAnnexationTax: number;
  villageLevyAmount: number;
  villageLevyRate: number;
  eav: number;
  difference: number;
  percentIncrease: number;
  monthlyIncrease: number;
}

interface VillageTaxInfo {
  villageName: string;
  levyRate: number;
  levyRateDescription: string;
  dataSource: string;
  lastUpdated: string;
  mchenryCountyPortalUrl: string;
  notes: string[];
}

interface TaxEstimatorProps {
  initialEav?: string;
  initialTax?: string;
}

export default function TaxEstimator({ initialEav = "", initialTax = "" }: TaxEstimatorProps) {
  const [eav, setEav] = useState(initialEav);
  const [currentTax, setCurrentTax] = useState(initialTax);
  const [showDetails, setShowDetails] = useState(false);
  const [showLookupGuide, setShowLookupGuide] = useState(true);

  useEffect(() => {
    if (initialEav) setEav(initialEav);
    if (initialTax) setCurrentTax(initialTax);
  }, [initialEav, initialTax]);

  const { data: villageTaxInfo } = useQuery<VillageTaxInfo>({
    queryKey: ["/api/village-tax-info"]
  });

  const estimateMutation = useMutation({
    mutationFn: async (data: { eav: number; currentTax: number }) => {
      const response = await apiRequest("POST", "/api/tax/estimate", data);
      return response.json() as Promise<TaxEstimate>;
    }
  });

  const handleCalculate = () => {
    const eavNum = parseFloat(eav.replace(/,/g, ""));
    const taxNum = parseFloat(currentTax.replace(/,/g, ""));
    
    if (isNaN(eavNum) || eavNum <= 0) {
      return;
    }
    if (isNaN(taxNum) || taxNum < 0) {
      return;
    }

    estimateMutation.mutate({ eav: eavNum, currentTax: taxNum });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("en-US").format(num);
  };

  const handleEavChange = (value: string) => {
    const cleaned = value.replace(/[^0-9.]/g, "");
    setEav(cleaned);
  };

  const handleTaxChange = (value: string) => {
    const cleaned = value.replace(/[^0-9.]/g, "");
    setCurrentTax(cleaned);
  };

  const isFormValid = () => {
    const eavNum = parseFloat(eav.replace(/,/g, ""));
    const taxNum = parseFloat(currentTax.replace(/,/g, ""));
    return !isNaN(eavNum) && eavNum > 0 && !isNaN(taxNum) && taxNum >= 0;
  };

  return (
    <section id="tax-estimator" className="py-16 md:py-24 bg-accent/10">
      <div className="max-w-4xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground" data-testid="text-estimator-title">
            Property Tax Estimator
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Calculate your estimated post-annexation property tax bill with the 
            Village of Wonder Lake levy included.
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="w-5 h-5" />
              Enter Your Property Tax Information
            </CardTitle>
            <CardDescription>
              Find your EAV and current taxes on your tax bill or look them up on the{" "}
              <a 
                href={villageTaxInfo?.mchenryCountyPortalUrl || "https://mchenryil.devnetwedge.com/search"}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline inline-flex items-center gap-1"
                data-testid="link-county-portal"
              >
                McHenry County Property Tax Inquiry
                <ExternalLink className="w-3 h-3" />
              </a>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="eav">Equalized Assessed Value (EAV)</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="w-4 h-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>Your EAV is listed on your tax bill. It's typically about 1/3 of your property's market value. Look for "Net Taxable Value" or "EAV" on your bill.</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input
                    id="eav"
                    type="text"
                    inputMode="decimal"
                    placeholder="e.g., 50000"
                    value={eav}
                    onChange={(e) => handleEavChange(e.target.value)}
                    className="pl-7"
                    data-testid="input-eav"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Found on your property tax bill as "EAV" or "Net Taxable Value"
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="currentTax">Current Annual Tax Bill</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="w-4 h-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>Enter your total annual property tax amount from your tax bill. This is the combined amount from both installments.</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input
                    id="currentTax"
                    type="text"
                    inputMode="decimal"
                    placeholder="e.g., 4500"
                    value={currentTax}
                    onChange={(e) => handleTaxChange(e.target.value)}
                    className="pl-7"
                    data-testid="input-current-tax"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Your total annual property taxes (both installments combined)
                </p>
              </div>
            </div>

            <Button
              onClick={handleCalculate}
              disabled={!isFormValid() || estimateMutation.isPending}
              className="w-full md:w-auto"
              data-testid="button-calculate"
            >
              {estimateMutation.isPending ? (
                "Calculating..."
              ) : (
                <>
                  <Calculator className="w-4 h-4 mr-2" />
                  Calculate Post-Annexation Estimate
                </>
              )}
            </Button>

            {estimateMutation.isError && (
              <div className="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-md flex items-center gap-2 text-destructive" data-testid="text-calc-error">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>Unable to calculate estimate. Please check your inputs and try again.</span>
              </div>
            )}
          </CardContent>
        </Card>

        {estimateMutation.data && (
          <div className="space-y-6">
            <Card data-testid="card-tax-comparison">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Tax Comparison Results
                </CardTitle>
                <CardDescription>
                  Your estimated taxes before and after annexation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="w-5 h-5 text-muted-foreground" />
                      <span className="text-sm font-medium text-muted-foreground">Current Annual Taxes</span>
                    </div>
                    <p className="text-3xl font-bold" data-testid="text-current-tax">
                      {formatCurrency(estimateMutation.data.currentTax)}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Before annexation
                    </p>
                  </div>

                  <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-5 h-5 text-primary" />
                      <span className="text-sm font-medium text-primary">Est. Post-Annexation Taxes</span>
                    </div>
                    <p className="text-3xl font-bold text-primary" data-testid="text-estimated-tax">
                      {formatCurrency(estimateMutation.data.estimatedPostAnnexationTax)}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Including Village of Wonder Lake levy
                    </p>
                  </div>
                </div>

                <div className="mt-6 p-4 rounded-lg border bg-background">
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-medium">Village of Wonder Lake Levy</span>
                    <Badge variant="secondary" data-testid="badge-levy-increase">
                      +{formatCurrency(estimateMutation.data.villageLevyAmount)}/year
                    </Badge>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Village levy rate:</span>
                      <span data-testid="text-levy-rate">
                        ${estimateMutation.data.villageLevyRate.toFixed(4)} per $100 EAV
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Your EAV:</span>
                      <span>{formatCurrency(estimateMutation.data.eav)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Annual increase:</span>
                      <span className="font-medium" data-testid="text-annual-increase">
                        {formatCurrency(estimateMutation.data.difference)} ({estimateMutation.data.percentIncrease.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Monthly increase:</span>
                      <span data-testid="text-monthly-increase">
                        ~{formatCurrency(estimateMutation.data.monthlyIncrease)}
                      </span>
                    </div>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  className="w-full mt-4"
                  onClick={() => setShowDetails(!showDetails)}
                  data-testid="button-toggle-details"
                >
                  {showDetails ? (
                    <>
                      <ChevronUp className="w-4 h-4 mr-2" />
                      Hide Calculation Details
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4 mr-2" />
                      Show Calculation Details
                    </>
                  )}
                </Button>

                {showDetails && (
                  <div className="mt-4 p-4 rounded-lg bg-muted/30 text-sm space-y-3" data-testid="section-calculation-details">
                    <h4 className="font-medium flex items-center gap-2">
                      <Info className="w-4 h-4" />
                      How This is Calculated
                    </h4>
                    <div className="space-y-2 text-muted-foreground">
                      <p>
                        <strong>Village Levy Amount</strong> = (EAV ÷ 100) × Village Rate
                      </p>
                      <p className="font-mono text-xs bg-background p-2 rounded">
                        ({formatNumber(estimateMutation.data.eav)} ÷ 100) × {estimateMutation.data.villageLevyRate.toFixed(4)} = {formatCurrency(estimateMutation.data.villageLevyAmount)}
                      </p>
                      <p className="mt-3">
                        The Village of Wonder Lake levy rate of ${villageTaxInfo?.levyRate.toFixed(4) || estimateMutation.data.villageLevyRate.toFixed(4)} per $100 EAV 
                        is based on {villageTaxInfo?.lastUpdated || "2024"} tax extension data from the McHenry County Clerk's office.
                      </p>
                      <p>
                        This represents only the municipal portion of property taxes. Your actual post-annexation 
                        taxes may vary based on specific taxing districts and any changes to levy rates.
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="p-4 rounded-lg border bg-accent/20 text-sm" data-testid="section-disclaimer">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                <div className="text-muted-foreground">
                  <p className="font-medium text-foreground mb-1">Disclaimer</p>
                  <p>
                    This is an estimate based on the Village of Wonder Lake's current levy rate. 
                    Actual taxes may vary based on exemptions, rate changes, and other factors. 
                    Consult with local officials for official tax information.
                  </p>
                </div>
              </div>
            </div>

            <div className="text-center space-y-4">
              <div className="flex gap-3 justify-center flex-wrap" data-testid="interest-buttons-container">
                <InterestForm 
                  source="tax_estimator"
                  interested={true}
                  buttonSize="lg"
                  buttonClassName="bg-yellow-700 hover:bg-yellow-800 text-white"
                />
                <InterestForm 
                  source="tax_estimator"
                  interested={false}
                  buttonSize="lg"
                  buttonClassName="bg-gray-600 hover:bg-gray-700 text-white"
                />
              </div>
              <div>
                <Button
                  variant="outline"
                  onClick={() => {
                    estimateMutation.reset();
                    setEav("");
                    setCurrentTax("");
                  }}
                  data-testid="button-reset"
                >
                  Calculate for Another Property
                </Button>
              </div>
            </div>
          </div>
        )}

        {!estimateMutation.data && !estimateMutation.isPending && showLookupGuide && (
          <Card className="mt-8" data-testid="card-lookup-guide">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="w-5 h-5" />
                  Step-by-Step: Find Your Tax Information
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowLookupGuide(false)}
                  className="text-muted-foreground"
                  data-testid="button-hide-guide"
                >
                  Hide
                </Button>
              </div>
              <CardDescription>
                Get your EAV and current taxes from McHenry County in about 2 minutes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                    1
                  </div>
                  <div>
                    <p className="font-medium">Open the McHenry County Portal</p>
                    <p className="text-sm text-muted-foreground mb-2">
                      Click the button below to open a new tab
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                    >
                      <a 
                        href={villageTaxInfo?.mchenryCountyPortalUrl || "https://mchenryil.devnetwedge.com/search"}
                        target="_blank"
                        rel="noopener noreferrer"
                        data-testid="link-county-portal-step1"
                      >
                        Open County Portal
                        <ExternalLink className="w-3 h-3 ml-1" />
                      </a>
                    </Button>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                    2
                  </div>
                  <div>
                    <p className="font-medium">Search for Your Property</p>
                    <p className="text-sm text-muted-foreground">
                      Enter your street address or Property Index Number (PIN). Example: "1234 Lakeview Dr"
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                    3
                  </div>
                  <div>
                    <p className="font-medium">Click on Your Property</p>
                    <p className="text-sm text-muted-foreground">
                      Select your property from the search results to view details
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                    4
                  </div>
                  <div>
                    <p className="font-medium">Find Your Tax Values</p>
                    <p className="text-sm text-muted-foreground">
                      Look for <strong>"Net Taxable Value"</strong> (your EAV) and <strong>"Total Tax"</strong> on the property details or tax bill PDF
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                    5
                  </div>
                  <div>
                    <p className="font-medium">Enter Values Above</p>
                    <p className="text-sm text-muted-foreground">
                      Come back to this page and enter both numbers in the form above, then click Calculate
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-3 rounded-lg bg-accent/30 text-sm text-muted-foreground">
                <Info className="w-4 h-4 inline-block mr-1 text-primary" />
                <strong>Why manual entry?</strong> McHenry County's tax portal requires you to access your own records directly 
                for privacy and security reasons. We cannot automatically retrieve your tax data.
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </section>
  );
}
