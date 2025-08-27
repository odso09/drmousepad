import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas as FabricCanvas, Image as FabricImage, Rect, Textbox, Object as FabricObject } from "fabric";
const logoUrl = new URL("../assets/logo.png", import.meta.url).href;
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { ColorPicker } from "@/components/ui/color-picker";
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
  { label: "Roboto", value: "Roboto, sans-serif" },
  { label: "Lato", value: "Lato, sans-serif" },
  { label: "Oswald", value: "Oswald, sans-serif" },
  { label: "Bebas Neue", value: '"Bebas Neue", cursive' },
  { label: "Poppins", value: "Poppins, sans-serif" },
  { label: "Fira Sans", value: '"Fira Sans", sans-serif' },
  { label: "Rubik", value: "Rubik, sans-serif" },
  { label: "Russo One (Gamer)", value: '"Russo One", sans-serif' },
  { label: "VT323 (Retro)", value: '"VT323", monospace' },
  { label: "Share Tech Mono", value: '"Share Tech Mono", monospace' },
  { label: "Bangers (Cómic)", value: '"Bangers", cursive' },
  { label: "Permanent Marker", value: '"Permanent Marker", cursive' },
  { label: "Luckiest Guy", value: '"Luckiest Guy", cursive' },
  { label: "Archivo Black", value: '"Archivo Black", sans-serif' },
  { label: "Chakra Petch", value: '"Chakra Petch", sans-serif' },
  { label: "Titillium Web", value: '"Titillium Web", sans-serif' },
  { label: "Unica One", value: '"Unica One", cursive' },
  { label: "Syncopate", value: '"Syncopate", sans-serif' },
  { label: "Saira", value: '"Saira", sans-serif' },
  { label: "Coda Caption", value: '"Coda Caption", sans-serif' },
  { label: "Black Ops One", value: '"Black Ops One", cursive' },
  { label: "Staatliches", value: '"Staatliches", cursive' },
  { label: "Barlow Condensed", value: '"Barlow Condensed", sans-serif' },
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
  const [logoObj, setLogoObj] = useState<FabricObject | null>(null);
  const [textColor, setTextColor] = useState("#ffffff");
  // const [textInput, setTextInput] = useState("");

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
    fc.preserveObjectStacking = true;
    setFabricCanvas(fc);

    // Cargar el logo y posicionarlo en la esquina seleccionada
    (FabricImage.fromURL(logoUrl) as Promise<FabricImage>)
      .then((img) => {
        if (!img) {
          console.error('No se pudo cargar el logo:', logoUrl);
          return;
        }
        const maxWidth = 180;
        const maxHeight = 80;
        const scale = Math.min(maxWidth / img.width, maxHeight / img.height, 1);
        img.set({
          scaleX: scale,
          scaleY: scale,
          selectable: true,
          shadow: "0 0 10px rgba(167,139,250,0.6)",
        });
        fc.add(img);
        setLogoObj(img);
        // Esperar a que la imagen esté lista para posicionar
        setTimeout(() => {
          positionLogo(fc, img, logoPos);
          fc.renderAll();
        }, 100);
      })
      .catch((e) => {
        console.error('No se pudo cargar el logo (catch):', logoUrl, e);
      });

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

  const positionLogo = (fc: FabricCanvas, lg: FabricObject, pos: typeof logoPos) => {
    const pad = 12;
    const w = typeof fc.width === 'number' ? fc.width : 0;
    const h = typeof fc.height === 'number' ? fc.height : 0;
    let left = pad, top = pad;
    if (pos === "top-right") {
      left = w - (lg.getScaledWidth ? lg.getScaledWidth() : (lg.width || 0)) - pad;
      top = pad;
    } else if (pos === "bottom-left") {
      left = pad;
      top = h - (lg.getScaledHeight ? lg.getScaledHeight() : (lg.height || 0)) - pad;
    } else if (pos === "bottom-right") {
      left = w - (lg.getScaledWidth ? lg.getScaledWidth() : (lg.width || 0)) - pad;
      top = h - (lg.getScaledHeight ? lg.getScaledHeight() : (lg.height || 0)) - pad;
    }
    lg.set({ left, top });
    fc.bringObjectToFront(lg as any);
    fc.renderAll();
  };

  const [textInput, setTextInput] = useState("");
  const addText = () => {
    if (!fabricCanvas || !textInput.trim()) return;
    const id = `${Date.now()}`;
    const tb = new Textbox(textInput, {
      fontFamily: activeFont,
      fill: textColor,
      fontSize: 28,
      editable: true,
      left: 40,
      top: 40,
    } as any);
    fabricCanvas.add(tb);
    setTexts((t) => [...t, { id, content: textInput, font: activeFont }]);
    setTextInput("");
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
        {/* Título y subtítulo */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-extrabold text-cyber mb-2">Personaliza Tu Mousepad</h1>
          <p className="text-muted-foreground text-lg">Diseña tu mousepad gamer perfecto con nuestro editor avanzado</p>
        </div>

        {/* Paso 1 y 2: Tamaño e Imagen */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div className="rounded-xl bg-card border p-5">
            <div className="flex items-center gap-3 mb-3">
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '2.2rem',
                height: '2.2rem',
                borderRadius: '50%',
                fontWeight: 'bold',
                fontSize: '1.2rem',
                marginRight: '0.5rem',
                color: '#fff',
                background: '#06b6d4', // cyan
                boxShadow: '0 0 8px 0 rgba(0,0,0,0.12)'
              }}>1</span>
              <span className="font-bold">Seleccionar Tamaño</span>
            </div>
            <Select value={size} onValueChange={setSize}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecciona tamaño" />
              </SelectTrigger>
              <SelectContent>
                {SIZES.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="rounded-xl bg-card border p-5">
            <div className="flex items-center gap-3 mb-3">
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '2.2rem',
                height: '2.2rem',
                borderRadius: '50%',
                fontWeight: 'bold',
                fontSize: '1.2rem',
                marginRight: '0.5rem',
                color: '#fff',
                background: '#d946ef', // fuchsia
                boxShadow: '0 0 8px 0 rgba(0,0,0,0.12)'
              }}>2</span>
              <span className="font-bold">Subir Imagen</span>
            </div>
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
              className="w-full btn-hero"
            >
              Seleccionar Imagen
            </Button>
          </div>
        </div>

        {/* Canvas con título */}
        <div className="rounded-xl bg-card border p-5 mb-6">
          <div className={`relative rounded-xl bg-black/80 p-2 ${rgb ? 'animate-rgb-glow' : ''}`}> 
            {rgb && <div aria-hidden className="led-gradient-ring pointer-events-none absolute inset-0 rounded-xl" />}
            <div className="relative flex items-center justify-center w-full h-full rounded-lg overflow-hidden">
              <canvas
                ref={canvasRef}
                className="absolute"
                style={{ width: "100%", height: "100%" }}
              />
            </div>
          </div>
        </div>

        {/* Paso 3, 4, 5: Texto, Logo, RGB */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Paso 3: Texto */}
          <div className="rounded-xl bg-card border p-5">
            <div className="flex items-center gap-3 mb-3">
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '2.2rem',
                height: '2.2rem',
                borderRadius: '50%',
                fontWeight: 'bold',
                fontSize: '1.2rem',
                marginRight: '0.5rem',
                color: '#fff',
                background: '#22c55e', // green
                boxShadow: '0 0 8px 0 rgba(0,0,0,0.12)'
              }}>3</span>
              <span className="font-bold">Agregar Texto</span>
              <span className="font-bold text-base ml-auto">Color</span>
            </div>
            <div className="mb-2">
              <div className="flex gap-2 items-center">
                <Input
                  placeholder="Ingresa tu texto..."
                  className="mb-2 flex-1"
                  value={textInput}
                  onChange={e => setTextInput(e.target.value)}
                />
                <div className="flex flex-col justify-center items-center" style={{height: 40, marginTop: -6}}>
                  <ColorPicker color={textColor} onChange={setTextColor} />
                </div>
              </div>
              <div className="flex gap-2">
                <Select value={activeFont} onValueChange={setActiveFont}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Fuente" />
                  </SelectTrigger>
                  <SelectContent>
                    {FONTS.map((f) => (
                      <SelectItem key={f.value} value={f.value}>
                        <span style={{ fontFamily: f.value }}>{f.label}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button type="button" onClick={addText} className="btn-hero">Agregar Texto</Button>
              </div>
            </div>
          </div>
          {/* Paso 4: Logo */}
          <div className="rounded-xl bg-card border p-5">
            <div className="flex items-center gap-3 mb-5">
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '2.2rem',
                height: '2.2rem',
                borderRadius: '50%',
                fontWeight: 'bold',
                fontSize: '1.2rem',
                marginRight: '0.5rem',
                color: '#fff',
                background: '#fb923c', // orange
                boxShadow: '0 0 8px 0 rgba(0,0,0,0.12)'
              }}>4</span>
              <span className="font-bold">Logo Dr Mousepad</span>
            </div>
            <div className="mb-2 flex items-center gap-2">
              <Switch checked={logoRemoved} onCheckedChange={setLogoRemoved} id="qlogo" />
              <label htmlFor="qlogo" className="text-sm">Quitar logo (+30,000 Gs)</label>
            </div>
            {!logoRemoved && (
              <Select value={logoPos} onValueChange={v => setLogoPos(v as typeof logoPos)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Posición del logo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="top-left">Superior Izquierda</SelectItem>
                  <SelectItem value="top-right">Superior Derecha</SelectItem>
                  <SelectItem value="bottom-left">Inferior Izquierda</SelectItem>
                  <SelectItem value="bottom-right">Inferior Derecha</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
          {/* Paso 5: RGB */}
          <div className="rounded-xl bg-card border p-5">
            <div className="flex items-center gap-3 mb-5">
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '2.2rem',
                height: '2.2rem',
                borderRadius: '50%',
                fontWeight: 'bold',
                fontSize: '1.2rem',
                marginRight: '0.5rem',
                color: '#fff',
                background: '#ec4899', // pink
                boxShadow: '0 0 8px 0 rgba(0,0,0,0.12)'
              }}>5</span>
              <span className="font-bold">Luces RGB</span>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <Switch checked={rgb} onCheckedChange={setRgb} id="rgb" />
              <label htmlFor="rgb" className="text-sm">Activar RGB (+50,000 Gs)</label>
            </div>
            <p className="text-xs text-muted-foreground">Añade efectos de luces LED sincronizables</p>
          </div>
        </div>
      </div>
      {/* Aside derecho: Resumen */}
      <aside className="lg:sticky lg:top-24 h-fit rounded-xl border border-border bg-card p-5">
  <h3 className="text-lg font-bold mb-4 text-cyber">Resumen del Pedido</h3>
        <ul className="space-y-2 text-sm mb-4">
          <li className="flex justify-between items-center">
            <span>Tamaño:</span>
            <span className="font-bold text-base">{size}</span>
          </li>
          <li className="flex justify-between items-center">
            <span>Logo Dr Mousepad:</span>
            <span className="font-bold flex items-center gap-1">
              {logoRemoved
                ? <><span className="text-lg" style={{color:'#ef4444 !important'}}>&#10006;</span> <span className="text-red-500">Removido</span></>
                : <><span className="text-green-400 text-lg">&#10003;</span> Incluido</>}
            </span>
          </li>
          <li className="flex justify-between items-center">
            <span>Luces RGB:</span>
            <span className="font-bold flex items-center gap-1">
              {rgb
                ? <><span className="text-green-400 text-lg">&#10003;</span> Activado</>
                : <span className="text-red-500 font-bold flex items-center gap-1"><span className="text-lg" style={{color:'#ef4444 !important'}}>&#10006;</span>Desactivado</span>}
            </span>
          </li>
        </ul>
        <hr className="my-2 border-border" />
        <div className="mb-2 flex justify-between text-sm"><span>Precio base:</span><span>{BASE_PRICE.toLocaleString()} Gs</span></div>
        {logoRemoved && (
          <div className="mb-2 flex justify-between text-sm"><span>Quitar logo:</span><span>+{EXTRA_LOGO.toLocaleString()} Gs</span></div>
        )}
        {rgb && (
          <div className="mb-2 flex justify-between text-sm"><span>Luces RGB:</span><span>+{EXTRA_RGB.toLocaleString()} Gs</span></div>
        )}
  <div className="mb-4 flex justify-between text-lg font-bold text-cyber"><span>Total:</span><span className="text-cyan-400">{total.toLocaleString()} Gs</span></div>
        <Button className="w-full btn-hero mb-4 flex items-center justify-center gap-2" onClick={handleAddToCart}>
          <span className="material-icons" style={{ fontSize: '1.2em' }}></span>
          Agregar al Carrito
        </Button>

        <div className="bg-background/80 rounded-lg p-3 text-xs text-muted-foreground border mt-2">
          <ul className="space-y-1">
            <li><span className="text-cyan-400 mr-1">&#10003;</span> Envío gratis a todo Paraguay</li>
            <li><span className="text-cyan-400 mr-1">&#10003;</span> Producción 3-5 días hábiles</li>
            <li><span className="text-cyan-400 mr-1">&#10003;</span> Garantía de 1 año</li>
          </ul>
        </div>
      </aside>
    </section>
  );
}
