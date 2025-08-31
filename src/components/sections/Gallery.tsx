import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

import gallery1 from "@/assets/gallery-1.jpg";
import gallery2 from "@/assets/gallery-2.jpg";
import gallery3 from "@/assets/gallery-3.jpg";
import gallery4 from "@/assets/gallery-4.jpg";
import gallery5 from "@/assets/gallery-5.jpg";
import gallery6 from "@/assets/gallery-6.jpg";
import gallery7 from "@/assets/gallery-7.jpg";
import gallery8 from "@/assets/gallery-8.jpg";
import gallery9 from "@/assets/gallery-9.jpg";

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
];

export const Gallery = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [open, setOpen] = useState(false);

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % galleryImages.length);
  };

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
  };

  return (
    <section className="py-20 bg-card">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-cyber mb-4">
            Galería de Diseños
          </h2>
          <p className="text-xl text-muted-foreground">
            Inspírate con estos diseños personalizados de otros gamers
          </p>
        </div>

        <div className="relative max-w-4xl mx-auto">
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
                    className="w-[900px] h-[520px] object-cover mx-auto cursor-zoom-in"
                    loading="lazy"
                    onClick={() => { setCurrentIndex(idx); setOpen(true); }}
                  />
                </div>
              ))}
            </div>

            <Button
              variant="outline"
              size="icon"
              className="absolute left-4 top-1/2 -translate-y-1/2 btn-cyber"
              onClick={prevImage}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <Button
              variant="outline"
              size="icon"
              className="absolute right-4 top-1/2 -translate-y-1/2 btn-cyber"
              onClick={nextImage}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Modal para imagen completa */}
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="max-w-3xl p-0 bg-transparent border-none shadow-none flex items-center justify-center">
              <img
                src={galleryImages[currentIndex].src}
                alt={galleryImages[currentIndex].alt}
                className="w-full max-h-[80vh] object-contain rounded-xl shadow-2xl"
                style={{ background: '#111' }}
              />
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex justify-center mt-6 gap-2">
          {galleryImages.map((_, index) => (
            <button
              key={index}
              className={`w-3 h-3 rounded-full transition-colors ${
                index === currentIndex 
                  ? 'bg-primary shadow-[0_0_10px_hsl(var(--primary)/0.8)]' 
                  : 'bg-muted hover:bg-muted-foreground'
              }`}
              onClick={() => setCurrentIndex(index)}
            />
          ))}
        </div>
      </div>

    </section>
  );
}
