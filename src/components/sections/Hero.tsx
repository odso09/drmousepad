import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-mousepad.jpg";

export const Hero = () => {
  return (
    <section className="hero-bg min-h-screen flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-background/90 to-transparent z-10" />
      
      <div className="absolute inset-0">
        <img src={heroImage} alt="" aria-hidden="true" className="w-full h-full object-cover" />
      </div>
      
      <div className="container mx-auto px-4 sm:px-6 relative z-20">
      <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 items-center">
        <div className="space-y-8 -mt-8 sm:-mt-12">
      <div className="space-y-4">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-cyber leading-tight capitalize break-words">
                  Tu Mousepad
                  <span className="block text-muted-foreground">como nunca antes</span>
                </h1>

                <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-2xl">
                  Haz que tu escritorio hable de ti: Diseña tu propio Mousepad,
                  enciende las luces RGB y transforma tu espacio.   
                </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Link to="/personalizar">
                <Button className="btn-hero-static text-lg px-8 py-6">
                  Comienza a Personalizar
                </Button>
              </Link>
            </div>

            <div className="flex flex-wrap gap-4 sm:gap-6 pt-6 sm:pt-8">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="w-2 h-2 bg-accent rounded-full" />
                Envío gratis a todo Paraguay
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="w-2 h-2 bg-secondary rounded-full" />
                Garantía de 1 año
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="w-2 h-2 bg-primary rounded-full" />
                Soporte 24/7
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};