import React, { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

import gallery1 from "@/assets/gallery-1.webp";
import gallery2 from "@/assets/gallery-2.webp";
import gallery3 from "@/assets/gallery-3.webp";
import gallery4 from "@/assets/gallery-4.webp";
import gallery5 from "@/assets/gallery-5.webp";
import gallery6 from "@/assets/gallery-6.webp";
import gallery7 from "@/assets/gallery-7.webp";
import gallery8 from "@/assets/gallery-8.webp";

import gallery9 from "@/assets/gallery-9.webp";
import gallery10 from "@/assets/gallery-10.webp";

const galleryImages = [
  { id: 1, src: gallery1, alt: "Mousepad personalizado con diseño cyberpunk" },
  { id: 2, src: gallery2, alt: "Mousepad gaming con diseño anime y RGB" },
  { id: 3, src: gallery3, alt: "Mousepad minimalista con logo personalizado" },
  { id: 4, src: gallery4, alt: "Mousepad personalizado con diseño geométrico" },
  { id: 5, src: gallery5, alt: "Mousepad con ilustración artística" },
  { id: 6, src: gallery6, alt: "Mousepad con diseño de fantasía" },
  { id: 7, src: gallery7, alt: "Mousepad con arte abstracto" },
  { id: 8, src: gallery8, alt: "Mousepad con diseño minimalista" },
  { id: 9, src: gallery9, alt: "Mousepad personalizado edición especial" },
  { id: 10, src: gallery10, alt: "Mousepad edición limitada 10" },
];

export const Gallery = () => {

  const [currentIndex, setCurrentIndex] = useState(0);
  const [open, setOpen] = useState(false);

  // Autoplay: cambia la imagen cada 5 segundos
  React.useEffect(() => {
    if (open) return; // Pausa autoplay si el modal está abierto
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % galleryImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [open]);

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % galleryImages.length);
  };

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
  };

  // Navegación con teclado en el modal (debe ir después de declarar open y currentIndex y funciones)
  React.useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') nextImage();
      if (e.key === 'ArrowLeft') prevImage();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, currentIndex]);

  return (
    <section className="py-16 sm:py-20 bg-card">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-cyber mb-4">
            Galería de Diseños
          </h2>
          <p className="text-xl text-muted-foreground">
            Inspírate con estos diseños personalizados de otros gamers
          </p>
        </div>

  <div className="relative max-w-5xl mx-auto">
          <div className="relative overflow-hidden rounded-xl card-gamer">
            <div 
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
              {galleryImages.map((image, idx) => (
                <div key={image.id} className="w-full flex-shrink-0">
                  <img
                    src={image.src}
                    alt={image.alt}
        className="w-full max-w-[900px] aspect-[16/9] h-auto object-cover mx-auto cursor-zoom-in"
                    loading="lazy"
                    onClick={() => { setCurrentIndex(idx); setOpen(true); }}
                  />
                </div>
              ))}
            </div>

            <Button
              variant="outline"
              size="icon"
              className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 btn-cyber"
              onClick={prevImage}
              aria-label="Anterior"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </Button>

            <Button
              variant="outline"
              size="icon"
              className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 btn-cyber"
              onClick={nextImage}
              aria-label="Siguiente"
            >
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>

          {/* Modal fullscreen para imagen completa */}
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="fixed inset-0 z-[1000] flex items-center justify-center p-0 m-0 bg-black/90 border-none shadow-none rounded-none">
              {/* Accesibilidad: Título y descripción para screen readers */}
              <h2 className="sr-only" id="gallery-modal-title">Vista previa de imagen de galería</h2>
              <p className="sr-only" id="gallery-modal-desc">Modal de galería, usa las flechas para navegar entre imágenes.</p>
              <button
                onClick={prevImage}
                className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white rounded-full p-2 sm:p-3 z-50 focus:outline-none"
                aria-label="Anterior"
                style={{ fontSize: 0 }}
              >
                <ChevronLeft className="w-6 h-6 sm:w-8 sm:h-8" aria-hidden="true" />
              </button>
              <div style={{width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                <img
                  src={galleryImages[currentIndex].src}
                  alt={galleryImages[currentIndex].alt}
                  className="object-contain rounded-xl shadow-2xl bg-[#111]"
                  style={{ maxWidth: '94vw', maxHeight: '90vh', margin: 'auto', display: 'block', boxSizing: 'border-box' }}
                  aria-labelledby="gallery-modal-title"
                  aria-describedby="gallery-modal-desc"
                />
              </div>
              <button
                onClick={nextImage}
                className="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white rounded-full p-2 sm:p-3 z-50 focus:outline-none"
                aria-label="Siguiente"
                style={{ fontSize: 0 }}
              >
                <ChevronRight className="w-6 h-6 sm:w-8 sm:h-8" aria-hidden="true" />
              </button>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex justify-center mt-6 gap-3">
          {galleryImages.map((_, index) => (
            <button
              key={index}
              className={`w-10 h-10 rounded-full transition-colors ${
                index === currentIndex 
                  ? 'bg-primary shadow-[0_0_10px_hsl(var(--primary)/0.8)]' 
                  : 'bg-muted hover:bg-muted-foreground'
              }`}
              onClick={() => setCurrentIndex(index)}
              aria-label={`Ir a imagen ${index + 1}`}
            />
          ))}
        </div>
      </div>

    </section>
  );
}
