import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import logo from '../../assets/logo.png';
import heroImage from "@/assets/hero-mousepad.jpg";

export const Hero = () => {
  return (
    <section className="hero-bg min-h-screen flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-background/90 to-transparent z-10" />
      
      <div className="absolute inset-0">
        <img src={heroImage} alt="Hero" className="w-full h-full object-cover" />
      </div>
      
      <div className="container mx-auto px-6 relative z-20">
      <div className="grid lg:grid-cols-2 gap-12 items-center">
        <div className="space-y-8 -mt-12">
      <div className="space-y-4">
          <h1 className="text-5xl lg:text-6xl font-black text-cyber leading-tight capitalize">
                  Tu Mousepad Gamer
                  <span className="block text-muted-foreground">como nunca antes</span>
                </h1>

                <p className="text-lg lg:text-xl text-muted-foreground max-w-2xl">
                  Haz que tu escritorio cobre vida: diseña tu propio mousepad,
                  enciende las luces RGB y dale estilo a tu espacio.   
                </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/personalizar">
                <Button className="btn-hero text-lg px-8 py-6">
                  Empieza a Personalizar
                </Button>
              </Link>
            </div>

            <div className="flex flex-wrap gap-6 pt-8">
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