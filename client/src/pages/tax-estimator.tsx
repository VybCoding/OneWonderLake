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

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar onNavClick={handleNavClick} />
      <main className="flex-1">
        <TaxEstimator />
      </main>
      <Footer />
    </div>
  );
}
