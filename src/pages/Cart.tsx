import SEO from "@/components/SEO";
import { useCart } from "@/context/CartContext";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger, DialogContent } from "@/components/ui/dialog";
import Checkout from "./Checkout";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Link } from "react-router-dom";

export default function CartPage() {
  const { items, updateQuantity, removeItem, total, clear } = useCart();

  const handlePay = (method: string) => {
    toast.success(`Pago iniciado vía ${method}. Te enviaremos un email con instrucciones.`);
    // Mantener el carrito para demo; en prod podríamos limpiar al confirmar
  };

  return (
    <>
      <SEO
        title="Carrito de Compras | Dr Mousepad"
        description="Revisa y finaliza tu compra de mousepads personalizados. Elige método de pago y recibe tu pedido en todo Paraguay."
        canonical="https://drmousepad.com/carrito"
      />
      <section className="container py-10">
      <h1 className="text-3xl font-bold mb-6">Carrito</h1>
      {items.length === 0 ? (
        <p className="text-muted-foreground">Tu carrito está vacío.</p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="space-y-4">
            {items.map((it) => (
              <div key={it.id} className="flex gap-4 border border-border rounded-lg p-3 bg-card">
                {it.data.thumbnail && (
                  <img src={it.data.thumbnail} alt="Diseño del Mousepad" className="w-40 h-28 object-cover rounded" loading="lazy" />
                )}
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-semibold">Mousepad Personalizado</h3>
                    <div className="flex gap-2">
                      <Link to={`/personalizar?id=${it.id}`} className="text-sm underline text-cyan-400 hover:text-cyan-300">Editar</Link>
                      <button
                        className="text-sm underline text-muted-foreground"
                        onClick={() => { removeItem(it.id); toast.success('Producto eliminado del carrito'); }}
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {it.data.size} · RGB: {it.data.rgb ? 'Sí' : 'No'} · Logo: {it.data.logo.removed ? 'No' : (
                      it.data.logo.position === 'top-left' ? 'Superior Izquierda' :
                      it.data.logo.position === 'top-right' ? 'Superior Derecha' :
                      it.data.logo.position === 'bottom-left' ? 'Inferior Izquierda' :
                      it.data.logo.position === 'bottom-right' ? 'Inferior Derecha' :
                      it.data.logo.position
                    )}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <label className="text-sm">Cantidad</label>
                    <Input type="number" className="w-20" value={it.quantity} min={1} onChange={(e) => updateQuantity(it.id, Math.max(1, parseInt(e.target.value || '1')))} />
                  </div>
                </div>
                <div className="text-right font-semibold min-w-[120px]">{(it.data.total * it.quantity).toLocaleString()} Gs</div>
              </div>
            ))}
          </div>
          <aside className="h-fit rounded-lg border border-border p-5 bg-card">
            <h3 className="text-lg font-semibold mb-3">Resumen</h3>
            <div className="flex items-center justify-between">
              <span className="text-sm">Total</span>
              <span className="text-2xl font-bold">{total.toLocaleString()} Gs</span>
            </div>
            <div className="mt-4 grid gap-2">
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    className="btn-hero-static text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6 w-full flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-cyan-400"
                    aria-label="Finalizar compra"
                  >
                    <span className="material-icons" style={{ fontSize: '1.2em' }}></span>
                    Finalizar compra
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <Checkout />
                </DialogContent>
              </Dialog>
              <Button variant="ghost" onClick={() => clear()}>Vaciar carrito</Button>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">Recibirás un email de confirmación con instrucciones de contacto.</p>
          </aside>
        </div>
      )}
    </section>
    </>
  );
}
