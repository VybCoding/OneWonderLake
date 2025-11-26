import { Link } from "wouter";
import { Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import FAQ from "@/components/FAQ";
import Navbar from "@/components/Navbar";

export default function MoreInfoPage() {
  return (
    <div className="min-h-screen bg-background" id="top">
      <Navbar />
      
      <FAQ />
      
      <div className="py-8 text-center">
        <Button asChild variant="outline">
          <Link href="/">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
        </Button>
      </div>
    </div>
  );
}
