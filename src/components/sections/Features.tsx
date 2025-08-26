import { Ruler, Upload, Edit3, Zap, Truck } from "lucide-react";

const features = [
  {
    icon: Ruler,
    title: "1. Elige tu Tamaño",
    description: "Selecciona el tamaño que mejor se adapte a tu setup"
  },
  {
    icon: Upload,
    title: "2. Sube tu Imagen",
    description: "Carga la imagen que quieras imprimir en tu mousepad"
  },
  {
    icon: Edit3,
    title: "3. Personaliza tu Diseño",
    description: "Ajusta posición, texto y elementos de tu diseño"
  },
  {
    icon: Zap,
    title: "4. Activa RGB",
    description: "Configura efectos y colores para las luces RGB"
  },
  {
    icon: Truck,
    title: "5. Confirma y Recibe tu Mousepad",
    description: "Confirma tu pedido y recibe el producto en tu domicilio"
  }
];

export const Features = () => {
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-cyber mb-4">
            Proceso de Personalización
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Cuatro pasos simples para crear tu mousepad gamer perfecto
          </p>
        </div>

  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="card-gamer card-gamer--purple group h-52 flex items-start pt-6 px-4">
              <div className="grid grid-cols-[64px_1fr] gap-4 items-start w-full">
                <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  {index === 3 ? (
                    /* For the "Activa RGB" (index 3) use a filled, fuchsia icon so the interior is painted */
                    <feature.icon className="w-8 h-8 fill-current icon-rainbow" fill="currentColor" stroke="none" />
                  ) : (
                    <feature.icon className="w-8 h-8 text-neon-purple" />
                  )}
                </div>

                <div className="flex items-start min-h-[3rem]">
                  <h3 className="text-lg font-bold mb-0 text-neon-purple text-left leading-tight">
                    {feature.title}
                  </h3>
                </div>

                {/* Description starts on a new row, aligned under the icon (col-start 1) and spans both columns */}
                <p className="col-start-1 col-span-2 mt-3 text-sm text-muted-foreground text-left">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>

  {/* Sección RGB avanzada movida a Index.tsx */}
      </div>
    </section>
  );
};