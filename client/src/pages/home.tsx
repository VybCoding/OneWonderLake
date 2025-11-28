import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import ActionButtons from "@/components/ActionButtons";
import Mission from "@/components/Mission";
import BenefitsGrid from "@/components/BenefitsGrid";
import AddressChecker from "@/components/AddressChecker";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Hero />
      <ActionButtons />
      <Mission />
      <BenefitsGrid />
      <AddressChecker />
      <Footer />
    </div>
  );
}
