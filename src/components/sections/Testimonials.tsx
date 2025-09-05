import { Star } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";

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
  // Auto-scrolling marquee with manual drag/swipe to advance/rewind
  const innerRef = useRef<HTMLDivElement | null>(null);
  const groupRef = useRef<HTMLDivElement | null>(null);
  const widthRef = useRef(0); // width of a single group
  const posXRef = useRef(0); // current translateX in px
  const isDraggingRef = useRef(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartXRef = useRef(0);
  const startPosXRef = useRef(0);

  const applyTransform = (x: number) => {
    const el = innerRef.current;
    if (el) {
      el.style.transform = `translate3d(${x}px, 0, 0)`;
    }
  };

  const SPEED_PX_PER_SEC = 40; // auto-scroll speed (right->left)

  // Observe width of the group for seamless wrapping
  useEffect(() => {
    if (!groupRef.current) return;
    const updateWidth = () => {
      widthRef.current = groupRef.current?.getBoundingClientRect().width || 0;
    };
    updateWidth();
    const ro = new ResizeObserver(() => updateWidth());
    ro.observe(groupRef.current);
    window.addEventListener("resize", updateWidth);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", updateWidth);
    };
  }, []);

  // Auto ticker
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      if (!isDraggingRef.current) {
        let next = posXRef.current - SPEED_PX_PER_SEC * dt; // move left
        const w = widthRef.current;
        if (w > 0) {
          while (next <= -w) next += w;
          while (next > 0) next -= w;
        }
        posXRef.current = next;
        applyTransform(next);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Pointer/Touch handlers
  const onPointerDown: React.PointerEventHandler<HTMLDivElement> = (e) => {
    isDraggingRef.current = true;
    setIsDragging(true);
    dragStartXRef.current = e.clientX;
    startPosXRef.current = posXRef.current;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
  };

  const onPointerMove: React.PointerEventHandler<HTMLDivElement> = (e) => {
    if (!isDraggingRef.current) return;
    e.preventDefault();
    const delta = e.clientX - dragStartXRef.current;
    let next = startPosXRef.current + delta; // allow both directions
    const w = widthRef.current;
    if (w > 0) {
      while (next <= -w) next += w;
      while (next > 0) next -= w;
    }
    posXRef.current = next;
    applyTransform(next);
  };

  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    isDraggingRef.current = false;
    setIsDragging(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
  };

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
            .no-select { user-select: none; -webkit-user-select: none; -ms-user-select: none; }
          `}</style>

          <div
            className="marquee"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
          >
            <div
              ref={innerRef}
              className="marquee-inner no-select"
              style={{
                willChange: "transform",
                cursor: isDragging ? "grabbing" : "grab",
                touchAction: "none",
              }}
            >
              <div ref={groupRef} className="marquee-group">
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
                      <div className="flex space-x-1" aria-hidden="true">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 star-fuchsia" />
                        ))}
                      </div>
                      <span className="sr-only">Calificación: {testimonial.rating} de 5</span>
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
                      <div className="flex space-x-1" aria-hidden="true">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 star-fuchsia" />
                        ))}
                      </div>
                      <span className="sr-only">Calificación: {testimonial.rating} de 5</span>
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