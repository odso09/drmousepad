import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import g1 from "@/assets/gallery-1.jpg";
import g2 from "@/assets/gallery-2.jpg";
import g3 from "@/assets/gallery-3.jpg";
import g4 from "@/assets/gallery-4.jpg";
import g5 from "@/assets/gallery-5.jpg";
import g6 from "@/assets/gallery-6.jpg";
import g7 from "@/assets/gallery-7.jpg";
import g8 from "@/assets/gallery-8.jpg";

const images = [g1, g2, g3, g4, g5, g6, g7, g8];

export const Gallery = () => {
  return (
    <section className="container py-14" aria-labelledby="galeria">
      <h2 id="galeria" className="text-2xl md:text-3xl font-bold mb-6">Galería</h2>
      <Carousel className="w-full">
        <CarouselContent>
          {images.map((src, i) => (
            <CarouselItem key={i} className="md:basis-1/2 lg:basis-1/3">
              <div className="rounded-lg overflow-hidden border border-border bg-card">
                <img src={src} loading="lazy" alt={`Mousepad personalizado ${i+1}`} className="w-full h-64 object-cover" />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </section>
  );
};

export default Gallery;
