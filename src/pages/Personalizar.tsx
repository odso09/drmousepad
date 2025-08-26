import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas as FabricCanvas, Image as FabricImage, Rect, Textbox } from "fabric";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { useCart } from "@/context/CartContext";
import { toast } from "sonner";

const SIZES = ["90×40 cm", "80×40 cm", "80×30 cm", "70×30 cm", "60×30 cm"] as const;
const DEFAULT_SIZE = "90×40 cm" as const;

const FONTS = [
  { label: "Oxanium (Gamer)", value: "Oxanium, sans-serif" },
  { label: "Orbitron (Tech)", value: "Orbitron, sans-serif" },
  { label: "Audiowide (Display)", value: "Audiowide, cursive" },
  { label: "Press Start 2P (Retro)", value: '"Press Start 2P", cursive' },
  { label: "Rajdhani (Display)", value: "Rajdhani, sans-serif" },
  { label: "Exo 2", value: '"Exo 2", sans-serif' },
  { label: "Barlow", value: "Barlow, sans-serif" },
  { label: "Montserrat", value: "Montserrat, sans-serif" },
  { label: "Teko", value: "Teko, sans-serif" },
  { label: "Anton", value: "Anton, sans-serif" },
];

const BASE_PRICE = 200_000;
const EXTRA_LOGO = 30_000;
const EXTRA_RGB = 50_000;

const parseSize = (s: string) => {
  const [w, h] = s.replace(" cm", "").split("×").map((n) => parseInt(n));
  return { w, h };
};

export default function PersonalizarPage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [size, setSize] = useState<string>(DEFAULT_SIZE);
  const [rgb, setRgb] = useState(false);
  const [logoRemoved, setLogoRemoved] = useState(false);
  const [logoPos, setLogoPos] = useState<"top-left" | "top-right" | "bottom-left" | "bottom-right">("bottom-right");
  const [texts, setTexts] = useState<{ id: string; content: string; font: string }[]>([]);
  const [activeFont, setActiveFont] = useState(FONTS[0].value);
  const [logoObj, setLogoObj] = useState<Textbox | null>(null);

  const { addItem } = useCart();

  const ratio = useMemo(() => {
    const { w, h } = parseSize(size);
    return w / h;
  }, [size]);

  useEffect(() => {
    if (!canvasRef.current) return;
    const fc = new FabricCanvas(canvasRef.current, {
      width: 960,
      height: 960 / (ratio || 2.25),
      backgroundColor: "#0b0f14",
      selection: true,
    });

    // enable drawing controls look & feel
    fc.preserveObjectStacking = true;
    setFabricCanvas(fc);

    // Add default logo (top layer)
    const lg = new Textbox("Dr Mousepad", {
      fontFamily: "Orbitron, sans-serif",
      fill: "#a78bfa",
      fontSize: 20,
      selectable: true,
      editable: false,
      shadow: "0 0 10px rgba(167,139,250,0.6)",
    } as any);
    fc.add(lg);
    setLogoObj(lg);

    positionLogo(fc, lg, logoPos);

    return () => { void fc.dispose(); };

  }, []);

 
  useEffect(() => {
    if (!fabricCanvas) return;
    const { w, h } = parseSize(size);
    const WIDTH = 960;
    const HEIGHT = WIDTH * (h / w);
    fabricCanvas.setWidth(WIDTH);
    fabricCanvas.setHeight(HEIGHT);
    fabricCanvas.renderAll();
    if (logoObj) positionLogo(fabricCanvas, logoObj, logoPos);
  }, [size, fabricCanvas, logoObj, logoPos]);

  const positionLogo = (fc: FabricCanvas, lg: Textbox, pos: typeof logoPos) => {
    const pad = 12;
    const { width = 0, height = 0 } = fc;
    const w = typeof width === 'number' ? width : 0;
    const h = typeof height === 'number' ? height : 0;
    lg.set({});
    if (pos === "top-left") lg.set({ left: pad, top: pad });
    if (pos === "top-right") lg.set({ left: w - (lg.width || 0) - pad, top: pad });
    if (pos === "bottom-left") lg.set({ left: pad, top: h - (lg.height || 0) - pad });
    if (pos === "bottom-right") lg.set({ left: w - (lg.width || 0) - pad, top: h - (lg.height || 0) - pad });
    fc.bringObjectToFront(lg as any);
    fc.renderAll();
  };

  const addText = () => {
    if (!fabricCanvas) return;
    const id = `${Date.now()}`;
    const tb = new Textbox("Tu texto", {
      fontFamily: activeFont,
      fill: "#e5e7eb",
      fontSize: 28,
      editable: true,
      left: 40,
      top: 40,
    } as any);
    fabricCanvas.add(tb);
    setTexts((t) => [...t, { id, content: "Tu texto", font: activeFont }]);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!fabricCanvas) return;
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    FabricImage.fromURL(url).then((img) => {
      const cw = fabricCanvas.width as number;
      const ch = fabricCanvas.height as number;

      // Escala al 50% del canvas
      const scale = 0.5 * Math.min(cw / (img.width as number), ch / (img.height as number));

      img.set({
        left: cw / 2,
        top: ch / 2,
        scaleX: scale,
        scaleY: scale,
        originX: "center",
        originY: "center",
        selectable: true,
      } as any);

      fabricCanvas.add(img);
      fabricCanvas.sendObjectToBack(img as any);
      fabricCanvas.renderAll();
      toast.success("Imagen agregada al centro.");
    });
  };


  useEffect(() => {
    if (!fabricCanvas) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Delete") {
        const active = fabricCanvas.getActiveObject();
        if (active) {
          fabricCanvas.remove(active);
          fabricCanvas.discardActiveObject();
          fabricCanvas.renderAll();
          toast.success("Elemento eliminado");
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [fabricCanvas]);


  const toggleCrop = () => {
    if (!fabricCanvas) return;
    // Simple crop zone overlay
    const existing = fabricCanvas.getObjects().find((o) => (o as any).name === 'cropZone');
    if (existing) {
      fabricCanvas.remove(existing);
      fabricCanvas.renderAll();
      return;
    }
    const cz = new Rect({
      name: 'cropZone' as any,
      left: 80,
      top: 80,
      width: Math.min(400, (fabricCanvas.width as number) - 160),
      height: Math.min(200, (fabricCanvas.height as number) - 160),
      stroke: '#22d3ee',
      fill: 'rgba(34,211,238,0.08)',
      strokeDashArray: [6, 4],
      selectable: true,
      hasRotatingPoint: false,
    } as any);
    fabricCanvas.add(cz);
    fabricCanvas.bringObjectToFront(cz as any);
    if (logoObj && !logoRemoved) fabricCanvas.bringObjectToFront(logoObj as any);
    fabricCanvas.setActiveObject(cz);
  };

  const applyCrop = () => {
    if (!fabricCanvas) return;
    const cz = fabricCanvas.getObjects().find((o) => (o as any).name === 'cropZone') as Rect | undefined;
    if (!cz) return toast.info("Activa el recorte primero.");
    // Find top-most image to crop
    const img = fabricCanvas.getObjects().find((o) => o instanceof FabricImage) as FabricImage | undefined;
    if (!img) return toast.error("No hay imagen para recortar.");

    // Clip image relative to its local coordinates
    const clip = new Rect({ left: (cz.left || 0) - (img.left || 0), top: (cz.top || 0) - (img.top || 0), width: cz.width || 0, height: cz.height || 0 } as any);
    (clip as any).absolutePositioned = false;
    (img as any).clipPath = clip;
    fabricCanvas.remove(cz);
    fabricCanvas.renderAll();
    toast.success("Recorte aplicado.");
  };

  // Logo visibility
  useEffect(() => {
    if (!fabricCanvas || !logoObj) return;
    logoObj.set({ visible: !logoRemoved } as any);
    if (!logoRemoved) fabricCanvas.bringObjectToFront(logoObj as any);
    fabricCanvas.renderAll();
  }, [logoRemoved, fabricCanvas, logoObj]);

  // Logo position change
  useEffect(() => {
    if (!fabricCanvas || !logoObj) return;
    positionLogo(fabricCanvas, logoObj, logoPos);
  }, [logoPos]);

  const textCount = texts.length;
  const total = BASE_PRICE + (logoRemoved ? EXTRA_LOGO : 0) + (rgb ? EXTRA_RGB : 0);

  const handleAddToCart = async () => {
    if (!fabricCanvas) return;
    // Export compressed thumbnail
    const dataUrl = (fabricCanvas as any).toDataURL({ format: 'jpeg', quality: 0.7 });
    addItem({
      quantity: 1,
      data: {
        size,
        images: [],
        texts,
        logo: { position: logoPos, removed: logoRemoved },
        rgb,
        basePrice: BASE_PRICE,
        extras: { logoRemoved, rgb },
        total,
        thumbnail: dataUrl,
      },
    });
    toast.success("Agregado al carrito");
  };

  const { w, h } = parseSize(size);

  return (
    <section className="container py-8 grid gap-8 lg:grid-cols-[1fr_360px]">
      <div>
        <div className={`relative rounded-xl border border-border bg-card p-3 ${rgb ? 'animate-rgb-glow' : ''}`}>
          {rgb && <div aria-hidden className="led-gradient-ring pointer-events-none absolute inset-0 rounded-xl" />}
          <div className="relative flex items-center justify-center w-full h-full bg-white rounded-lg overflow-hidden border border-border">
            <canvas
              ref={canvasRef}
              className="absolute"
              style={{ width: "100%", height: "100%" }}
            />
          </div>

        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {/* Tamaño */}
          <div className="grid gap-2">
            <label className="text-sm">Tamaño</label>
            <Select value={size} onValueChange={setSize}>
              <SelectTrigger className="w-1/4 min-w-[150px]">
                <SelectValue placeholder="Selecciona tamaño" />
              </SelectTrigger>
              <SelectContent>
                {SIZES.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {}
          <div className="grid gap-2">
            <label className="text-sm">Subir imagen</label>
            <input
              id="upload-image"
              type="file"
              accept="image/*"
              onChange={handleUpload}
              className="hidden"
            />
            <Button
              type="button"
              onClick={() => document.getElementById("upload-image")?.click()}
              className="w-1/4 min-w-[150px] btn-hero "
            >
              Seleccionar imagen
            </Button>
          </div>

          {/* Fuente */}
          <div className="grid gap-2">
            <label className="text-sm">Fuente del texto</label>
            <Select value={activeFont} onValueChange={setActiveFont}>
              <SelectTrigger className="w-1/4 min-w-[150px]">
                <SelectValue placeholder="Selecciona fuente" />
              </SelectTrigger>
              <SelectContent>
                {FONTS.map((f) => (
                  <SelectItem key={f.value} value={f.value}>
                    <span style={{ fontFamily: f.value }}>{f.label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Agregar texto */}
          <div className="grid gap-2">
            <label className="text-sm">Texto</label>
            <Button type="button" onClick={addText} className="w-1/4 min-w-[150px] btn-hero ">
              Agregar texto
            </Button>
          </div>

          {/* RGB */}
          <div className="flex items-center gap-2">
            <Switch checked={rgb} onCheckedChange={setRgb} id="rgb" />
            <label htmlFor="rgb" className="text-sm">Activar RGB (+50 000 Gs)</label>
          </div>

          
          <div className="flex items-center gap-2">
            <Checkbox id="qlogo" checked={logoRemoved} onCheckedChange={(v) => setLogoRemoved(Boolean(v))} />
            <label htmlFor="qlogo" className="text-sm">Quitar logo (+30 000 Gs)</label>
          </div>

       
          <div className="grid gap-2 md:col-span-2">
            <label className="text-sm">Posición del logo</label>
            <Select value={logoPos} onValueChange={setLogoPos} disabled={logoRemoved}>
              <SelectTrigger className="w-1/4 min-w-[150px]">
                <SelectValue placeholder="Selecciona posición" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="top-left">Arriba / Izquierda</SelectItem>
                <SelectItem value="top-right">Arriba / Derecha</SelectItem>
                <SelectItem value="bottom-left">Abajo / Izquierda</SelectItem>
                <SelectItem value="bottom-right">Abajo / Derecha</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Recorte */}
          <div className="flex gap-2 md:col-span-2">
            <Button variant="secondary" onClick={toggleCrop} className="w-1/4 min-w-[150px] btn-hero ">
              Activar/Desactivar recorte
            </Button>
            <Button onClick={applyCrop} className="w-1/4 min-w-[150px] btn-hero ">
              Aplicar recorte
            </Button>
          </div>
        </div>

      </div>

      {/* Side Panel (no miniatura) */}
      <aside className="lg:sticky lg:top-24 h-fit rounded-xl border border-border bg-card p-5">
        <h3 className="text-lg font-semibold mb-4">Resumen</h3>
        <ul className="space-y-2 text-sm">
          {/* Tamaño con precio base */}
          <li className="flex justify-between">
            <span className="text-muted-foreground">Tamaño: {size}</span>
            <span className="font-medium">200 000 Gs</span>
          </li>

          {/* Logo */}
          <li className="flex justify-between">
            <span className="text-muted-foreground">Logo:</span>
            <span className="font-medium">
              {logoRemoved ? "+30 000 Gs" : "Incluido"}
            </span>
          </li>

          {/* RGB */}
          <li className="flex justify-between">
            <span className="text-muted-foreground">RGB:</span>
            <span className="font-medium">
              {rgb ? "+50 000 Gs" : "No"}
            </span>
          </li>


        </ul>

        {/* Total */}
        <div className="mt-4 flex items-center justify-between border-t pt-3">
          <span className="text-sm text-muted-foreground">Total</span>
          <span className="text-2xl font-bold">{total.toLocaleString()} Gs</span>
        </div>

        <Button className="w-full mt-4 btn-hero " onClick={handleAddToCart}>
          Agregar al carrito
        </Button>
      </aside>

    </section>
  );
}
