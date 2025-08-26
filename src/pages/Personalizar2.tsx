import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas as FabricCanvas, Image as FabricImage, IText, Rect } from "fabric";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { useCart } from "@/context/CartContext";
import { toast } from "sonner";

const SIZE_OPTIONS = [
  { label: "90×40 cm", w: 90, h: 40 },
  { label: "80×40 cm", w: 80, h: 40 },
  { label: "80×30 cm", w: 80, h: 30 },
  { label: "70×30 cm", w: 70, h: 30 },
  { label: "60×30 cm", w: 60, h: 30 },
];

const FONT_OPTIONS = [
  { label: "Orbitron", value: "Orbitron" },
  { label: "Russo One", value: "Russo One" },
  { label: "Audiowide", value: "Audiowide" },
  { label: "Rajdhani", value: "Rajdhani" },
  { label: "Exo 2", value: "Exo 2" },
  { label: "Teko", value: "Teko" },
  { label: "Quantico", value: "Quantico" },
  { label: "Share Tech Mono", value: "Share Tech Mono" },
  { label: "Bebas Neue", value: "Bebas Neue" },
  { label: "Kanit", value: "Kanit" },
];

const BASE_PRICE = 200_000;
const EXTRA_LOGO_REMOVED = 30_000;
const EXTRA_RGB = 50_000;

export default function Personalizar() {
  // Canvas refs/state
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasElRef = useRef<HTMLCanvasElement>(null);
  const [canvas, setCanvas] = useState<FabricCanvas | null>(null);
  const [baseImage, setBaseImage] = useState<FabricImage | null>(null);
  const [logoObj, setLogoObj] = useState<IText | null>(null);
  const cropRectRef = useRef<Rect | null>(null);

  // Config state
  const [size, setSize] = useState(SIZE_OPTIONS[0]);
  const [rgb, setRgb] = useState(false);
  const [logoRemoved, setLogoRemoved] = useState(false);
  const [logoCorner, setLogoCorner] = useState<"top-left" | "top-right" | "bottom-left" | "bottom-right">("bottom-right");

  // Text state
  const [textInput, setTextInput] = useState("");
  const [fontFamily, setFontFamily] = useState(FONT_OPTIONS[0].value);
  const [textsCount, setTextsCount] = useState(0);

  const { addItem } = useCart();

  // Resize canvas to container, preserving aspect ratio by size selection
  useEffect(() => {
    const el = canvasElRef.current;
    if (!el) return;

    const c = new FabricCanvas(el, {
      backgroundColor: "#0b0b0d",
      selection: true,
      preserveObjectStacking: true,
    });

    // better control handles
    c.renderAll();
    setCanvas(c);
    return () => { void c.dispose(); }
  }, []);

  // Fit canvas dimensions when size or container width changes
  useEffect(() => {
    if (!canvas || !containerRef.current) return;
    const fit = () => {
      const maxW = containerRef.current!.clientWidth;
      const ratio = size.w / size.h;
      const width = Math.min(maxW, 900);
      const height = Math.round(width / ratio);
      canvas.setWidth(width);
      canvas.setHeight(height);
      canvas.renderAll();
    };
    fit();
    const obs = new ResizeObserver(fit);
    obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, [canvas, size]);

  // Track texts count
  useEffect(() => {
    if (!canvas) return;
    const update = () => {
      const count = canvas.getObjects().filter((o) => o.type === "i-text").length;
      setTextsCount(count);
    };
    update();
    canvas.on("object:added", update);
    canvas.on("object:removed", update);
    return () => {
      canvas.off("object:added", update);
      canvas.off("object:removed", update);
    };
  }, [canvas]);

  const total = useMemo(() => {
    return BASE_PRICE + (logoRemoved ? EXTRA_LOGO_REMOVED : 0) + (rgb ? EXTRA_RGB : 0);
  }, [logoRemoved, rgb]);

  // Handlers
  const onUploadImage = (file: File) => {
    if (!canvas) return;
    const reader = new FileReader();
    reader.onload = () => {
      FabricImage.fromURL(reader.result as string).then((img) => {
        // scale to fit canvas
        const scale = Math.min(canvas.getWidth() / img.width!, canvas.getHeight() / img.height!);
        img.set({ left: 0, top: 0, selectable: true });
        img.scale(scale);
        canvas.add(img);
        // base image added first stays al fondo
        setBaseImage(img);
        canvas.setActiveObject(img);
        canvas.renderAll();
      });
    };
    reader.readAsDataURL(file);
  };

  const startCrop = () => {
    if (!canvas || !baseImage) return;
    // create crop rect in center
    const rect = new Rect({
      left: canvas.getWidth() * 0.1,
      top: canvas.getHeight() * 0.1,
      width: canvas.getWidth() * 0.8,
      height: canvas.getHeight() * 0.8,
      fill: "rgba(255,255,255,0.08)",
      stroke: "#8b5cf6",
      strokeWidth: 1,
      transparentCorners: false,
      cornerColor: "#8b5cf6",
      cornerStyle: "circle",
      hasBorders: true,
      lockRotation: false,
    });
    cropRectRef.current = rect;
    canvas.add(rect);
    canvas.setActiveObject(rect);
    // ensure crop rectangle is on top in Fabric v6
    canvas.remove(rect);
    canvas.add(rect);
  };

  const cancelCrop = () => {
    if (!canvas || !cropRectRef.current) return;
    canvas.remove(cropRectRef.current);
    cropRectRef.current = null;
    canvas.discardActiveObject();
    canvas.renderAll();
  };

  const confirmCrop = () => {
    if (!canvas || !baseImage || !cropRectRef.current) return;
    const rect = cropRectRef.current;
    rect.set({ absolutePositioned: true });
    baseImage.clipPath = rect;
    canvas.discardActiveObject();
    cropRectRef.current = null; // keep visual rect via clipPath only
    canvas.renderAll();
  };

  const addText = () => {
    if (!canvas || !textInput.trim()) return;
    const it = new IText(textInput.trim(), {
      left: canvas.getWidth() / 2 - 60,
      top: canvas.getHeight() / 2 - 20,
      fill: "#ffffff",
      fontFamily,
      fontSize: 28,
      transparentCorners: false,
      cornerColor: "#22d3ee",
      cornerStyle: "circle",
    });
    canvas.add(it);
    canvas.setActiveObject(it);
    canvas.renderAll();
    setTextInput("");
  };

  const ensureLogo = () => {
    if (!canvas) return null;
    if (logoRemoved) {
      if (logoObj) {
        canvas.remove(logoObj);
        setLogoObj(null);
      }
      return null;
    }
    if (!logoObj) {
      const lo = new IText("Dr Mousepad", {
        left: 10,
        top: 10,
        fill: "#ffffff",
        fontFamily: "Russo One",
        fontSize: 20,
        selectable: true,
      });
      canvas.add(lo);
      setLogoObj(lo);
      positionLogo(lo, logoCorner, canvas);
      return lo;
    }
    return logoObj;
  };

  useEffect(() => {
    if (!canvas) return;
    if (logoRemoved) {
      if (logoObj) {
        canvas.remove(logoObj);
        setLogoObj(null);
        canvas.renderAll();
      }
    } else {
      const lo = ensureLogo();
      if (lo) {
        positionLogo(lo, logoCorner, canvas);
        // ensure logo stays on top in Fabric v6
        canvas.remove(lo);
        canvas.add(lo);
        canvas.renderAll();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [logoRemoved, logoCorner, canvas]);

  const addToCart = async () => {
    if (!canvas) return;
    const thumbnail = canvas.toDataURL({ format: "jpeg", quality: 0.7, multiplier: 0.4 });
    const images: string[] = [];
    if (baseImage) {
      try {
        images.push(baseImage.toDataURL());
      } catch {}
    }

    addItem({
      size: size.label,
      images,
      texts: (canvas.getObjects("i-text") as IText[]).map((t, idx) => ({ id: `${Date.now()}-${idx}`, text: t.text || "", fontFamily: t.fontFamily || "" })),
      logo: { position: logoRemoved ? null : logoCorner, removed: logoRemoved },
      rgb,
      basePrice: BASE_PRICE,
      extras: { logoRemoved: logoRemoved ? EXTRA_LOGO_REMOVED : 0, rgb: rgb ? EXTRA_RGB : 0 },
      total,
      thumbnail,
    });
    toast.success("Producto agregado al carrito");
  };

  const panelContent = (
    <div className="space-y-6">
      {/* Paso 1: Tamaño */}
      <div>
        <Label>Tamaño</Label>
        <Select value={size.label} onValueChange={(v) => setSize(SIZE_OPTIONS.find((s) => s.label === v)!)}>
          <SelectTrigger className="mt-2"><SelectValue placeholder="Selecciona tamaño" /></SelectTrigger>
          <SelectContent>
            {SIZE_OPTIONS.map((s) => (
              <SelectItem key={s.label} value={s.label}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Paso 2: Imagen */}
      <div className="space-y-2">
        <Label>Imagen (JPG/PNG)</Label>
        <Input type="file" accept="image/*" onChange={(e) => e.target.files && onUploadImage(e.target.files[0])} />
        <div className="flex gap-2">
          <Button variant="outline" onClick={startCrop}>Iniciar recorte</Button>
          <Button variant="outline" onClick={confirmCrop}>Confirmar</Button>
          <Button variant="ghost" onClick={cancelCrop}>Cancelar</Button>
        </div>
      </div>

      {/* Paso 3: Texto */}
      <div className="space-y-2">
        <Label>Texto</Label>
        <Input value={textInput} onChange={(e) => setTextInput(e.target.value)} placeholder="Escribe tu texto" />
        <Label className="mt-2">Tipografía</Label>
        <Select value={fontFamily} onValueChange={setFontFamily}>
          <SelectTrigger className="mt-1"><SelectValue placeholder="Elegir fuente" /></SelectTrigger>
          <SelectContent>
            {FONT_OPTIONS.map((f) => (
              <SelectItem key={f.value} value={f.value}>
                <span style={{ fontFamily: f.value }}>{f.label}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={addText} className="mt-2">Agregar texto</Button>
        <p className="text-xs text-muted-foreground">Nº de textos: {textsCount}</p>
      </div>

      {/* Paso 4: Logo */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Quitar logo (+30 000 Gs)</Label>
          <Switch checked={logoRemoved} onCheckedChange={setLogoRemoved} />
        </div>
        {!logoRemoved && (
          <div>
            <Label>Ubicación</Label>
            <Select value={logoCorner} onValueChange={(v) => setLogoCorner(v as any)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {(["top-left", "top-right", "bottom-left", "bottom-right"] as const).map((c) => (
                  <SelectItem key={c} value={c}>{cornerLabel(c)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Paso 5: RGB */}
      <div className="flex items-center justify-between">
        <Label>Activar RGB (+50 000 Gs)</Label>
        <Switch checked={rgb} onCheckedChange={setRgb} />
      </div>

      {/* Resumen */}
      <div className="rounded-lg border p-4 bg-card space-y-2">
        <p className="flex justify-between text-sm"><span className="text-muted-foreground">Tamaño</span><span>{size.label}</span></p>
        <p className="flex justify-between text-sm"><span className="text-muted-foreground">Logo</span><span>{logoRemoved ? "No (quitado)" : cornerLabel(logoCorner)}</span></p>
        <p className="flex justify-between text-sm"><span className="text-muted-foreground">RGB</span><span>{rgb ? "Sí" : "No"}</span></p>
        <p className="flex justify-between text-sm"><span className="text-muted-foreground">Textos</span><span>{textsCount}</span></p>
        <hr className="my-2 border-border" />
        <p className="flex justify-between text-sm"><span className="text-muted-foreground">Precio base</span><span>{BASE_PRICE.toLocaleString("es-PY")} Gs</span></p>
        {logoRemoved && <p className="flex justify-between text-sm"><span className="text-muted-foreground">Extra logo</span><span>{EXTRA_LOGO_REMOVED.toLocaleString("es-PY")} Gs</span></p>}
        {rgb && <p className="flex justify-between text-sm"><span className="text-muted-foreground">Extra RGB</span><span>{EXTRA_RGB.toLocaleString("es-PY")} Gs</span></p>}
        <p className="flex justify-between text-base font-semibold pt-1"><span>Total</span><span>{total.toLocaleString("es-PY")} Gs</span></p>
        <Button className="w-full mt-2" variant="hero" onClick={addToCart}>Agregar al carrito</Button>
      </div>
    </div>
  );

  return (
    <main className="section">
      <div className="grid lg:grid-cols-[1fr,360px] gap-8">
        <div>
          <div className={`rgb-glow ${rgb ? "" : "rgb-off"}`}>
            <div className="rounded-lg border overflow-hidden">
              <div ref={containerRef} className="w-full">
                <canvas ref={canvasElRef} className="block max-w-full" />
              </div>
            </div>
          </div>
          {/* Mobile summary button */}
          <div className="mt-4 lg:hidden">
            <Drawer>
              <DrawerTrigger asChild>
                <Button className="w-full" variant="hero">Resumen y total</Button>
              </DrawerTrigger>
              <DrawerContent>
                <DrawerHeader>
                  <DrawerTitle>Resumen</DrawerTitle>
                </DrawerHeader>
                <div className="p-4 pb-8 max-h-[70vh] overflow-y-auto">
                  {panelContent}
                </div>
              </DrawerContent>
            </Drawer>
          </div>
        </div>
        {/* Desktop side panel (sticky) */}
        <aside className="hidden lg:block">
          <div className="sticky top-24 space-y-6">
            {panelContent}
          </div>
        </aside>
      </div>
    </main>
  );
}

function positionLogo(lo: IText, corner: "top-left" | "top-right" | "bottom-left" | "bottom-right", canvas: FabricCanvas) {
  const pad = 12;
  const w = canvas.getWidth();
  const h = canvas.getHeight();
  lo.set({ originX: "left", originY: "top" });
  switch (corner) {
    case "top-left":
      lo.set({ left: pad, top: pad });
      break;
    case "top-right":
      lo.set({ left: w - (lo.width ?? 100) - pad, top: pad });
      break;
    case "bottom-left":
      lo.set({ left: pad, top: h - (lo.height ?? 20) - pad });
      break;
    case "bottom-right":
      lo.set({ left: w - (lo.width ?? 100) - pad, top: h - (lo.height ?? 20) - pad });
      break;
  }
}

function cornerLabel(c: string) {
  return c
    .replace("top", "Arriba")
    .replace("bottom", "Abajo")
    .replace("left", " izquierda")
    .replace("right", " derecha");
}
