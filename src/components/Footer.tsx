import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export const Footer = () => {
  const [open, setOpen] = useState<string | null>(null);
  const openDialog = (id: string) => setOpen(id);
  const closeDialog = () => setOpen(null);

  return (
    <footer className="border-t border-border mt-16">
      <div className="container py-10 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <h4 className="font-semibold mb-3">Dr Mousepad</h4>
          <p className="text-sm text-muted-foreground">Dirección: Av. Gamer 123, Asunción, PY</p>
          <p className="text-sm text-muted-foreground">Email: contacto@drmousepad.com</p>
          <p className="text-sm text-muted-foreground">Tel: +595 981 000 000</p>
        </div>

        <div>
          <h4 className="font-semibold mb-3">Legales</h4>
          <ul className="space-y-2 text-sm">
            <li><button className="underline hover:text-primary" onClick={() => openDialog('tyc')}>Términos y Condiciones</button></li>
            <li><button className="underline hover:text-primary" onClick={() => openDialog('priv')}>Política de Privacidad</button></li>
            <li><button className="underline hover:text-primary" onClick={() => openDialog('faq')}>FAQ</button></li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold mb-3">Contacto</h4>
          <button className="underline hover:text-primary text-sm" onClick={() => openDialog('contacto')}>Formulario y datos</button>
        </div>

        <div>
          <h4 className="font-semibold mb-3">Síguenos</h4>
          <div className="flex gap-3 text-muted-foreground">
            <a href="#" aria-label="Instagram" className="hover:text-foreground">Instagram</a>
            <a href="#" aria-label="Facebook" className="hover:text-foreground">Facebook</a>
            <a href="#" aria-label="Twitter" className="hover:text-foreground">Twitter/X</a>
          </div>
        </div>
      </div>

      {/* Términos y Condiciones */}
      <Dialog open={open === 'tyc'} onOpenChange={closeDialog}>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Términos y Condiciones</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p><strong>Introducción:</strong> Bienvenido a Dr Mousepad. Al utilizar nuestro sitio acepta los presentes términos.</p>
            <p><strong>Propiedad intelectual:</strong> Todo el contenido del sitio es propiedad de Dr Mousepad o sus licenciantes.</p>
            <p><strong>Proceso de compra:</strong> La compra se realiza a través del carrito y confirmación de pago por pasarela.</p>
            <p><strong>Precios y medios de pago:</strong> Los precios están en guaraníes. Aceptamos pasarelas listadas en el checkout.</p>
            <p><strong>Envíos/entregas:</strong> Realizamos envíos a todo el país. Los tiempos dependerán de la localidad.</p>
            <p><strong>Cambios y devoluciones:</strong> Para productos personalizados, aplican condiciones especiales. Contacte soporte.</p>
            <p><strong>Garantías:</strong> 6 meses contra defectos de fabricación. No cubre uso indebido.</p>
            <p><strong>Limitación de responsabilidad:</strong> El uso del sitio es bajo su propio riesgo. No garantizamos disponibilidad ininterrumpida.</p>
            <p><strong>Ley aplicable y jurisdicción:</strong> Se rige por las leyes de Paraguay. Jurisdicción de Asunción.</p>
            <p><strong>Contacto:</strong> contacto@drmousepad.com</p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Política de Privacidad */}
      <Dialog open={open === 'priv'} onOpenChange={closeDialog}>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Política de Privacidad</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p><strong>Datos recolectados:</strong> Nombre, email, teléfono y contenidos de personalización.</p>
            <p><strong>Finalidades:</strong> Procesar pedidos, brindar soporte y mejorar el servicio.</p>
            <p><strong>Base legal:</strong> Consentimiento del usuario y ejecución del contrato.</p>
            <p><strong>Conservación:</strong> Conservamos datos el tiempo necesario para cumplir las finalidades.</p>
            <p><strong>Derechos ARCO:</strong> Acceso, rectificación, cancelación y oposición. Contacte soporte.</p>
            <p><strong>Cookies:</strong> Usamos cookies para mejorar su experiencia y análisis.</p>
            <p><strong>Terceros/encargados:</strong> Proveedores de pago y logística bajo acuerdos de confidencialidad.</p>
            <p><strong>Seguridad:</strong> Aplicamos medidas técnicas y organizativas razonables.</p>
            <p><strong>Contacto:</strong> privacidad@drmousepad.com</p>
          </div>
        </DialogContent>
      </Dialog>

      {/* FAQ */}
      <Dialog open={open === 'faq'} onOpenChange={closeDialog}>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Preguntas Frecuentes</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p><strong>¿Tiempos de producción?</strong> 3-5 días hábiles.</p>
            <p><strong>¿Formatos de imagen?</strong> JPEG/PNG en alta resolución.</p>
            <p><strong>¿Límites de diseño?</strong> Evite contenidos con derechos de terceros o no aptos.</p>
            <p><strong>¿RGB?</strong> Luz perimetral con animación cíclica, opcional.</p>
            <p><strong>¿Quitar logo y costo?</strong> Puede quitarse con costo adicional de 30.000 Gs.</p>
            <p><strong>¿Cuidados del producto?</strong> Limpie con paño húmedo; evite solventes.</p>
            <p><strong>¿Medios de pago?</strong> Bancard, Tigo Money, Mercado Pago (placeholders).</p>
            <p><strong>¿Envíos?</strong> A todo el país con terceros logísticos.</p>
            <p><strong>¿Devoluciones?</strong> Ver políticas aplicables; personalizaciones pueden no aplicar.</p>
            <p><strong>¿Soporte?</strong> soporte@drmousepad.com (24-48h).</p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Contacto */}
      <Dialog open={open === 'contacto'} onOpenChange={closeDialog}>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Contacto</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 text-sm">
            <div className="grid grid-cols-1 gap-2">
              <label htmlFor="nombre">Nombre</label>
              <Input id="nombre" placeholder="Tu nombre" />
            </div>
            <div className="grid grid-cols-1 gap-2">
              <label htmlFor="email">Email</label>
              <Input id="email" type="email" placeholder="tu@email.com" />
            </div>
            <div className="grid grid-cols-1 gap-2">
              <label htmlFor="tel">Teléfono</label>
              <Input id="tel" placeholder="Tu número" />
            </div>
            <div className="grid grid-cols-1 gap-2">
              <label htmlFor="msg">Mensaje</label>
              <Textarea id="msg" placeholder="Cuéntanos tu consulta" />
            </div>
            <p className="text-muted-foreground">Respuesta estimada: 24-48 horas hábiles.</p>
            <div className="flex justify-end">
              <DialogTrigger asChild>
                <Button type="button" onClick={closeDialog}>Enviar</Button>
              </DialogTrigger>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </footer>
  );
};

export default Footer;
