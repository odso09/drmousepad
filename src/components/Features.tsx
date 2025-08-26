import { Layers, Ruler, Type, BadgePlus, Lightbulb } from "lucide-react";

const steps = [
  { icon: Ruler, title: "Tamaño", desc: "Elige 90×40, 80×40, 80×30, 70×30 o 60×30 cm." },
  { icon: Layers, title: "Imagen", desc: "Sube tu imagen, muévela, gírala y recórtala." },
  { icon: Type, title: "Texto", desc: "Agrega tipografías gamers con total control." },
  { icon: BadgePlus, title: "Logo", desc: "Coloca el logo en una esquina o quítalo (+30k)." },
  { icon: Lightbulb, title: "RGB", desc: "Activa el borde RGB (+50k) con glow en vivo." },
];

export const Features = () => {
  return (
    <section className="container py-14" aria-labelledby="proceso">
      <h2 id="proceso" className="text-2xl md:text-3xl font-bold mb-8">Cómo funciona</h2>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
        {steps.map(({ icon: Icon, title, desc }) => (
          <article key={title} className="rounded-xl border border-border bg-card p-5 hover-scale">
            <Icon className="h-6 w-6 text-accent mb-3" aria-hidden />
            <h3 className="font-semibold mb-1">{title}</h3>
            <p className="text-sm text-muted-foreground">{desc}</p>
          </article>
        ))}
      </div>
    </section>
  );
};

export default Features;
