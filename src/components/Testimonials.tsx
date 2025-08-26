import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const items = [
  { name: "Carlos R.", city: "Asunción", text: "La personalización fue súper simple y el RGB se ve brutal." },
  { name: "María L.", city: "Encarnación", text: "Excelente calidad, el mouse desliza perfecto. Recomendado." },
  { name: "Diego P.", city: "Ciudad del Este", text: "Pude ajustar mi diseño exacto, llegó rápido y bien empaquetado." },
  { name: "Sofía G.", city: "Luque", text: "El logo en esquina quedó impecable. 10/10." },
];

export const Testimonials = () => {
  return (
    <section className="container py-14" aria-labelledby="testimonios">
      <h2 id="testimonios" className="text-2xl md:text-3xl font-bold mb-8">Testimonios</h2>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {items.map((t) => (
          <article key={t.name} className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-3 mb-3">
              <Avatar>
                <AvatarFallback>{t.name.split(" ")[0][0]}{t.name.split(" ")[1]?.[0] ?? ""}</AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium leading-tight">{t.name}</div>
                <div className="text-xs text-muted-foreground">{t.city}</div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">“{t.text}”</p>
          </article>
        ))}
      </div>
    </section>
  );
};

export default Testimonials;
