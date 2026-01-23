import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import EnhancedCategoryNavigation from "@/components/EnhancedCategoryNavigation";
import FeaturedProducts from "@/components/FeaturedProducts";
import TrustBadges from "@/components/TrustBadges";
import PartnerCTA from "@/components/PartnerCTA";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <HeroSection />
        <TrustBadges />
        
        {/* Enhanced Category Navigation */}
        <section className="section-padding bg-background">
          <div className="container-wide">
            <div className="mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
                Shop by Category
              </h2>
              <p className="text-muted-foreground">
                Find exactly what you need with our detailed vehicle categories
              </p>
            </div>
            <EnhancedCategoryNavigation />
          </div>
        </section>
        
        <FeaturedProducts />
        <PartnerCTA />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
