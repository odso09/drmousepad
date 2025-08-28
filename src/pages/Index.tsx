import { Hero } from "@/components/sections/Hero";

import { Gallery } from "@/components/sections/Gallery";
import { Features } from "@/components/sections/Features";
import { Testimonials } from "@/components/sections/Testimonials";
import { Footer } from "@/components/sections/Footer";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <main className="min-h-screen bg-background flex flex-col">
      <Hero />
      <Gallery />
      <Features />
      {/* Botón Empieza a Personalizar antes de los comentarios */}
      <div className="flex justify-center py-8 sm:py-12 px-2">
        <Link to="/personalizar" aria-label="Ir a la página de personalización">
          <Button className="btn-hero text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6 focus-visible:ring-2 focus-visible:ring-cyan-400" aria-label="Empieza a Personalizar">
            Empieza a Personalizar
          </Button>
        </Link>
      </div>
      <Testimonials />
      <Footer />
    </main>
  );
};

export default Index;