import { useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Sector } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PieChart as PieChartIcon, Info, Building2, GraduationCap, Flame, Trees, BookOpen, Building, MapPin, Landmark, Droplets } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface TaxingBodyData {
  id: string;
  name: string;
  shortName: string;
  rate: number;
  description: string;
  color: string;
  amount: number;
  percentage: number;
}

interface TaxBreakdownProps {
  taxingBodies: TaxingBodyData[];
  villageLevyBody: TaxingBodyData;
  currentTax: number;
  postAnnexationTax: number;
  showPostAnnexation?: boolean;
}

const ICON_MAP: Record<string, typeof Building2> = {
  elem_school: GraduationCap,
  high_school: GraduationCap,
  community_college: GraduationCap,
  county: Building,
  township: MapPin,
  fire: Flame,
  park: Trees,
  library: BookOpen,
  other: Droplets,
  village: Landmark,
};

const renderActiveShape = (props: any) => {
  const {
    cx, cy, innerRadius, outerRadius, startAngle, endAngle,
    fill, payload, percent
  } = props;

  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 8}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        style={{ filter: "drop-shadow(0 4px 6px rgba(0, 0, 0, 0.15))" }}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 10}
        outerRadius={outerRadius + 14}
        fill={fill}
      />
      <text x={cx} y={cy - 10} textAnchor="middle" fill="currentColor" className="text-sm font-medium">
        {payload.shortName}
      </text>
      <text x={cx} y={cy + 10} textAnchor="middle" fill="currentColor" className="text-lg font-bold">
        {(percent * 100).toFixed(1)}%
      </text>
    </g>
  );
};

export default function TaxBreakdownPinwheel({
  taxingBodies,
  villageLevyBody,
  currentTax,
  postAnnexationTax,
  showPostAnnexation = true
}: TaxBreakdownProps) {
  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined);
  const [hoveredBody, setHoveredBody] = useState<TaxingBodyData | null>(null);

  const chartData = showPostAnnexation 
    ? [...taxingBodies, villageLevyBody]
    : taxingBodies;

  const totalTax = showPostAnnexation ? postAnnexationTax : currentTax;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
    setHoveredBody(chartData[index]);
  };

  const onPieLeave = () => {
    setActiveIndex(undefined);
    setHoveredBody(null);
  };

  const schoolTotal = taxingBodies
    .filter(b => ["elem_school", "high_school", "community_college"].includes(b.id))
    .reduce((sum, b) => sum + b.amount, 0);
  
  const schoolPercentage = (schoolTotal / totalTax) * 100;

  return (
    <Card data-testid="card-tax-breakdown-pinwheel">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PieChartIcon className="w-5 h-5" />
          Where Your Tax Dollars Go
        </CardTitle>
        <CardDescription>
          See how your {showPostAnnexation ? "post-annexation " : ""}property taxes are distributed across taxing bodies
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="relative">
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie
                  activeIndex={activeIndex}
                  activeShape={renderActiveShape}
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={120}
                  paddingAngle={2}
                  dataKey="amount"
                  onMouseEnter={onPieEnter}
                  onMouseLeave={onPieLeave}
                >
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.color}
                      stroke="white"
                      strokeWidth={2}
                      style={{ cursor: "pointer" }}
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>

            {activeIndex === undefined && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                  <p className="text-2xl font-bold">{formatCurrency(totalTax)}</p>
                  <p className="text-xs text-muted-foreground">Total Annual Tax</p>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 mb-4">
              <div className="flex items-center gap-2 mb-1">
                <GraduationCap className="w-4 h-4 text-primary" />
                <span className="font-medium text-sm">Education Total</span>
              </div>
              <p className="text-lg font-bold text-primary" data-testid="text-education-total">
                {formatCurrency(schoolTotal)} <span className="text-sm font-normal">({schoolPercentage.toFixed(1)}%)</span>
              </p>
              <p className="text-xs text-muted-foreground">Schools are the largest portion of your property taxes</p>
            </div>

            <div className="space-y-2 max-h-[240px] scrollbar-always-visible pr-2">
              {chartData.map((body) => {
                const Icon = ICON_MAP[body.id] || Building2;
                const isVillage = body.id === "village";
                const isHovered = hoveredBody?.id === body.id;
                
                return (
                  <div 
                    key={body.id}
                    className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
                      isHovered ? "bg-muted" : ""
                    } ${isVillage ? "border-2 border-dashed border-primary/30 bg-primary/5" : ""}`}
                    onMouseEnter={() => setHoveredBody(body)}
                    onMouseLeave={() => setHoveredBody(null)}
                    data-testid={`row-taxing-body-${body.id}`}
                  >
                    <div 
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: body.color }}
                    />
                    <Icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate">{body.shortName}</span>
                        {isVillage && (
                          <Badge variant="secondary" className="text-xs">New</Badge>
                        )}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="w-3 h-3 text-muted-foreground cursor-help flex-shrink-0" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p className="font-medium">{body.name}</p>
                            <p className="text-xs mt-1">{body.description}</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-medium" data-testid={`text-amount-${body.id}`}>
                        {formatCurrency(body.amount)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {body.percentage.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-6 p-3 rounded-lg bg-accent/20 text-sm flex items-start gap-2">
          <Info className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
          <div className="text-muted-foreground">
            <p>
              <strong className="text-foreground">Note:</strong> This breakdown uses average tax rates for the Wonder Lake area 
              based on McHenry County data. Your actual distribution may vary slightly based on your specific taxing districts.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
