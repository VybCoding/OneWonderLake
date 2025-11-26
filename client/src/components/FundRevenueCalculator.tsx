import { useState } from "react";
import { Slider } from "@/components/ui/slider";
import { DollarSign, Users } from "lucide-react";

const LGDF_RATE = 178;
const MFT_RATE = 22.5;
const MAX_POPULATION = 6000;

export default function FundRevenueCalculator() {
  const [population, setPopulation] = useState(1000);

  const lgdfRevenue = population * LGDF_RATE;
  const mftRevenue = population * MFT_RATE;
  const totalRevenue = lgdfRevenue + mftRevenue;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("en-US").format(num);
  };

  const lgdfPercentage = (lgdfRevenue / (MAX_POPULATION * LGDF_RATE)) * 100;
  const mftPercentage = (mftRevenue / (MAX_POPULATION * MFT_RATE)) * 100;

  return (
    <div className="bg-background border rounded-lg p-4 mt-6" data-testid="fund-revenue-calculator">
      <div className="flex items-center gap-2 mb-4">
        <DollarSign className="w-5 h-5 text-primary" />
        <h4 className="font-semibold text-foreground">Revenue Calculator</h4>
      </div>

      <div className="space-y-6">
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Population</span>
            </div>
            <span className="text-lg font-bold text-foreground" data-testid="text-population-value">
              {formatNumber(population)} residents
            </span>
          </div>
          <Slider
            value={[population]}
            onValueChange={(value) => setPopulation(value[0])}
            min={1}
            max={MAX_POPULATION}
            step={1}
            className="w-full"
            data-testid="slider-population"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>1</span>
            <span>{formatNumber(MAX_POPULATION)}</span>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-foreground">LGDF Revenue</span>
              <span className="text-sm font-bold text-primary" data-testid="text-lgdf-value">
                {formatCurrency(lgdfRevenue)}
              </span>
            </div>
            <div className="text-xs text-muted-foreground mb-2">
              ${LGDF_RATE} per resident/year
            </div>
            <div className="h-3 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300 ease-out rounded-full"
                style={{ width: `${lgdfPercentage}%` }}
                data-testid="bar-lgdf"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-foreground">MFT Revenue</span>
              <span className="text-sm font-bold text-accent-foreground" data-testid="text-mft-value">
                {formatCurrency(mftRevenue)}
              </span>
            </div>
            <div className="text-xs text-muted-foreground mb-2">
              ${MFT_RATE} per resident/year
            </div>
            <div className="h-3 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-accent transition-all duration-300 ease-out rounded-full"
                style={{ width: `${mftPercentage}%` }}
                data-testid="bar-mft"
              />
            </div>
          </div>
        </div>

        <div className="pt-4 border-t">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-foreground">Total Annual Revenue</span>
            <span className="text-xl font-bold text-primary" data-testid="text-total-revenue">
              {formatCurrency(totalRevenue)}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Slide to see potential revenue at different population levels
          </p>
        </div>
      </div>
    </div>
  );
}
