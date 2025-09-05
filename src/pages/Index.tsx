
import SEO from "@/components/SEO";
import { Hero } from "@/components/sections/Hero";

import { Gallery } from "@/components/sections/Gallery";
import { Features } from "@/components/sections/Features";
import { Testimonials } from "@/components/sections/Testimonials";
import { Footer } from "@/components/sections/Footer";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <>
      <SEO
        title="Mousepads Personalizados Paraguay | Dr Mousepad"
        description="Diseña tu propio mousepad gamer con luces RGB, calidad premium y envío gratis a todo Paraguay. Personaliza tamaño, color, logo y texto. ¡Haz único tu escritorio!"
        canonical="https://drmousepad.com/"
      />
      <main className="min-h-screen bg-background flex flex-col">
      <Hero />
      <Gallery />
      <Features />
  {/* Botón Empieza a Personalizar antes de los comentarios */}
  <div className="flex justify-center py-8 sm:py-12 px-3 sm:px-2">
        <Link to="/personalizar" aria-label="Ir a la página de personalización">
          <Button className="btn-hero-static text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6 focus-visible:ring-2 focus-visible:ring-cyan-400">
            Empieza a Personalizar
          </Button>
        </Link>
      </div>
      <Testimonials />
      <Footer />
    </main>
    </>
  );
};

export default Index;