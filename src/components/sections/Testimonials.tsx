import { Star } from "lucide-react";

const testimonials = [
  {
    id: 1,
    name: "Carlos González",
    city: "Asunción",
    rating: 5,
    comment: "¡Increíble calidad! El RGB es espectacular y la personalización quedó perfecta. Muy recomendado.",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face"
  },
  {
    id: 2,
    name: "María Fernández",
    city: "Ciudad del Este",
    rating: 5,
  comment: "El proceso de diseño es súper fácil y el resultado superó mis expectativas. ¡El mousepad es hermoso!",
  avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=face"
  },
  {
    id: 3,
    name: "Diego Ramírez",
    city: "Encarnación",
    rating: 5,
    comment: "Excelente servicio y calidad premium. Las luces RGB dan un toque profesional a mi setup gaming.",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face"
  },
  {
    id: 4,
    name: "Ana López",
    city: "San Lorenzo",
    rating: 5,
    comment: "¡Perfecto para mi setup! La calidad de impresión es excelente y llegó súper rápido.",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face"
  }
  ,
  {
    id: 5,
    name: "Luis Pérez",
    city: "Pedro Juan Caballero",
    rating: 5,
    comment: "Muy buena atención y el producto llegó en perfecto estado. Repetiré la compra.",
  avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop&crop=face"
  },
  {
    id: 6,
    name: "Sofía Gómez",
    city: "Luque",
    rating: 4,
    comment: "Calidad excelente y entrega rápida. Me gustaría más opciones de color en RGB.",
    avatar: "https://images.unsplash.com/photo-1554151228-14d9def656e4?w=100&h=100&fit=crop&crop=face"
  }
];

export const Testimonials = () => {
  // We'll use a CSS-based marquee: duplicate the items in the DOM and animate the track

  return (
    <section className="py-20 bg-card">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-cyber mb-4">
            Lo Que Dicen Nuestros Clientes
          </h2>
          <p className="text-xl text-muted-foreground">
            Miles de gamers ya confían en Dr Mousepad
          </p>
        </div>

        <div className="relative w-full">
          <style>{`
            .testimonial-scroller::-webkit-scrollbar { display: none; }
            .testimonial-scroller { -ms-overflow-style: none; scrollbar-width: none; }

            /* marquee containers */
            .marquee { overflow: hidden; }
            .marquee-inner { display: flex; gap: 12px; align-items: stretch; }
            .marquee-group { display: flex; gap: 12px; }

            /* animate the inner wrapper: translateX from 0 -> -50% for seamless loop */
            @keyframes marqueeMove {
              0% { transform: translate3d(0,0,0); }
              100% { transform: translate3d(-50%,0,0); }
            }

            .marquee-inner.animate { animation: marqueeMove 30s linear infinite; }
          `}</style>

          <div className="marquee">
            <div className="marquee-inner animate" style={{ willChange: 'transform' }}>
              <div className="marquee-group">
                {testimonials.map((testimonial) => (
                  <div
                    key={testimonial.id}
                    className="card-gamer p-4 h-56 grid grid-cols-[56px_1fr] grid-rows-[auto_auto_1fr] gap-3 items-start"
                    style={{ minWidth: 260, flex: '0 0 260px' }}
                  >
                    <img
                      src={testimonial.avatar}
                      alt={testimonial.name}
                      className="w-14 h-14 rounded-full col-start-1 row-start-1 ring-2 ring-primary/20"
                    />

                    <div className="col-start-2 row-start-1">
                      <h4 className="font-semibold text-sm">{testimonial.name}</h4>
                      <p className="text-xs text-muted-foreground">{testimonial.city}</p>
                    </div>

                    {/* Stars aligned under the avatar column */}
                    <div className="col-start-1 row-start-2 flex flex-col items-start mt-1">
                      <div className="flex space-x-1">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 star-fuchsia" />
                        ))}
                      </div>
                    </div>

                    <p className="col-start-1 col-span-2 row-start-3 text-sm text-muted-foreground leading-relaxed">"{testimonial.comment}"</p>
                  </div>
                ))}
              </div>

              <div className="marquee-group" aria-hidden>
                {testimonials.map((testimonial) => (
                  <div
                    key={'dup-' + testimonial.id}
                    className="card-gamer p-4 h-56 grid grid-cols-[56px_1fr] grid-rows-[auto_auto_1fr] gap-3 items-start"
                    style={{ minWidth: 260, flex: '0 0 260px' }}
                  >
                    <img
                      src={testimonial.avatar}
                      alt={testimonial.name}
                      className="w-14 h-14 rounded-full col-start-1 row-start-1 ring-2 ring-primary/20"
                    />

                    <div className="col-start-2 row-start-1">
                      <h4 className="font-semibold text-sm">{testimonial.name}</h4>
                      <p className="text-xs text-muted-foreground">{testimonial.city}</p>
                    </div>

                    <div className="col-start-1 row-start-2 flex flex-col items-start mt-1">
                      <div className="flex space-x-1">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 star-fuchsia" />
                        ))}
                      </div>
                    </div>

                    <p className="col-start-1 col-span-2 row-start-3 text-sm text-muted-foreground leading-relaxed">"{testimonial.comment}"</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        

        {/* Metrics row (single horizontal line) */}
        <div className="mt-10">
          <div className="flex items-center justify-between gap-4 overflow-x-auto">
            <div className="flex-1 min-w-[90px] text-center">
              <div className="text-xl sm:text-2xl font-bold text-cyber">500+</div>
              <div className="text-xs sm:text-sm text-muted-foreground">Mousepads Vendidos</div>
            </div>
            <div className="flex-1 min-w-[90px] text-center">
              <div className="text-xl sm:text-2xl font-bold text-cyber">4.9★</div>
              <div className="text-xs sm:text-sm text-muted-foreground">Rating Promedio</div>
            </div>
            <div className="flex-1 min-w-[90px] text-center">
              <div className="text-xl sm:text-2xl font-bold text-cyber">98%</div>
              <div className="text-xs sm:text-sm text-muted-foreground">Clientes Satisfechos</div>
            </div>
            <div className="flex-1 min-w-[90px] text-center">
              <div className="text-xl sm:text-2xl font-bold text-cyber">24h / 7</div>
              <div className="text-xs sm:text-sm text-muted-foreground">Soporte Técnico</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};