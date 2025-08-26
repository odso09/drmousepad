import SEO from "@/components/SEO";
import Hero from "@/components/Hero";
import Gallery from "@/components/Gallery";
import Features from "@/components/Features";
import Testimonials from "@/components/Testimonials";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEO title="Mousepad Gamer Personalizable | Dr Mousepad" description="Crea tu propio mousepad gamer con imagen, texto, logo y borde RGB. Compra online con envío en Paraguay." canonical="/" />
      <Hero />
      <Gallery />
      <Features />
      <Testimonials />
      <Footer />
    </div>
  );
};

export default Index;
