import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-mousepad.jpg";
import { Button } from "@/components/ui/button";

export const Hero = () => {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 opacity-40" aria-hidden>
        <img src={heroImage} alt="Mousepad gamer con borde RGB" className="w-full h-full object-cover" loading="eager" />
      </div>
      <div className="relative container py-20 md:py-28">
        <div className="max-w-2xl">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight animate-fade-in">
            Mousepad Gamer Personalizable
          </h1>
          <p className="mt-4 text-lg md:text-xl text-muted-foreground">
            ¡Diseña tu propio Mousepad! Tamaños XL, logo, texto y luces RGB.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Button asChild size="lg" className="hover-scale shadow-[var(--shadow-neon)]">
              <Link to="/personalizar">Comienza a personalizar</Link>
            </Button>
            <ul className="flex flex-wrap gap-6 text-sm text-muted-foreground">
              <li>🚚 Envíos a todo el país</li>
              <li>🛡️ Garantía 6 meses</li>
              <li>🤝 Soporte dedicado</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
