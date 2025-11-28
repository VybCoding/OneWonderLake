import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import TaxEstimator from "@/components/TaxEstimator";
import Footer from "@/components/Footer";
import { useLocation } from "wouter";

export default function TaxEstimatorPage() {
  const [, setLocation] = useLocation();

  const handleNavClick = (section: string) => {
    setLocation("/");
    setTimeout(() => {
      document.getElementById(section)?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const handleBackToHome = () => {
    setLocation("/");
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 100);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar onNavClick={handleNavClick} />
      <main className="flex-1">
        <TaxEstimator />
        
        <div className="py-8 text-center">
          <Button variant="outline" onClick={handleBackToHome} data-testid="button-back-to-home">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </div>
      </main>
      <Footer />
    </div>
  );
}
