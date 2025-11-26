import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Mission from "@/components/Mission";
import BenefitsGrid from "@/components/BenefitsGrid";
import AddressChecker from "@/components/AddressChecker";
import Vision from "@/components/Vision";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Hero />
      <Mission />
      <BenefitsGrid />
      <AddressChecker />
      <Vision />
      <Footer />
    </div>
  );
}
