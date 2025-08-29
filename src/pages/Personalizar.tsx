import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Canvas as FabricCanvas, Image as FabricImage, Rect, Textbox, Object as FabricObject, Line as FabricLine } from "fabric";
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
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("id");
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

  const { addItem, items } = useCart();
  // Cargar datos si editando
  useEffect(() => {
    if (!editId || !items.length) return;
    const item = items.find(i => i.id === editId);
    if (!item) return;
    // Setear todos los estados principales
    setSize(item.data.size);
    setRgb(item.data.rgb);
    setLogoRemoved(item.data.logo.removed);
    setLogoPos(item.data.logo.position);
    setTexts(item.data.texts);
    // Restaurar el canvas si hay json guardado
    if (item.canvasJson && fabricCanvas) {
      fabricCanvas.loadFromJSON(item.canvasJson, () => {
        fabricCanvas.renderAll();
      });
    }
    // NOTA: Si tienes más campos, agrégalos aquí
  }, [editId, items, fabricCanvas]);

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

    // Dos líneas guía horizontales: una gira a la derecha, otra a la izquierda
    let guideLines: [FabricLine?, FabricLine?] = [null, null];
    const addOrUpdateGuides = () => {
      if (!fc) return;
      const obj = fc.getActiveObject();
      if (!obj) return;
      // Eliminar líneas previas
      guideLines.forEach(line => { if (line) fc.remove(line as unknown as FabricObject); });
      guideLines = [null, null];
      const w = typeof fc.width === 'number' ? fc.width : 0;
      const h = typeof fc.height === 'number' ? fc.height : 0;
      const cx = w / 2;
      const cy = h / 2;
      const len = w * 0.8;
      // Ángulo de la imagen
      const baseAngle = (obj.angle || 0) * Math.PI / 180;
      // Línea 1: gira igual que el objeto (sentido horario)
      const angle1 = baseAngle;
      // Línea 2: gira en sentido contrario (antihorario)
      const angle2 = -baseAngle;
      // Primera línea
      const x1a = cx - (len/2) * Math.cos(angle1);
      const y1a = cy - (len/2) * Math.sin(angle1);
      const x2a = cx + (len/2) * Math.cos(angle1);
      const y2a = cy + (len/2) * Math.sin(angle1);
      // Segunda línea
      const x1b = cx - (len/2) * Math.cos(angle2);
      const y1b = cy - (len/2) * Math.sin(angle2);
      const x2b = cx + (len/2) * Math.cos(angle2);
      const y2b = cy + (len/2) * Math.sin(angle2);
      // Líneas verdes continuas
      const line1 = new FabricLine([x1a, y1a, x2a, y2a], {
        stroke: '#22c55e', strokeWidth: 3, selectable: false, evented: false, excludeFromExport: true, name: 'guideLine', hoverCursor: 'default',
      } as any);
      const line2 = new FabricLine([x1b, y1b, x2b, y2b], {
        stroke: '#22c55e', strokeWidth: 3, selectable: false, evented: false, excludeFromExport: true, name: 'guideLine', hoverCursor: 'default',
      } as any);
      fc.add(line1 as unknown as FabricObject);
      fc.add(line2 as unknown as FabricObject);
      fc.bringObjectToFront(line1 as unknown as FabricObject);
      fc.bringObjectToFront(line2 as unknown as FabricObject);
      guideLines = [line1, line2];
      fc.renderAll();
    };
    const removeGuides = () => {
      if (!fc) return;
      guideLines.forEach(line => { if (line) fc.remove(line as unknown as FabricObject); });
      guideLines = [null, null];
      fc.renderAll();
    };
    fc.on('object:rotating', addOrUpdateGuides);
    fc.on('mouse:up', removeGuides);

    return () => {
      void fc.dispose();
      fc.off('object:rotating', addOrUpdateGuides);
      fc.off('mouse:up', removeGuides);
    };
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
    const canvasJson = fabricCanvas.toJSON();
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
      canvasJson,
    });
    toast.success("Agregado al carrito");
  };

  const { w, h } = parseSize(size);


  // Overlay state for object positions
  const [objectOverlays, setObjectOverlays] = useState<any[]>([]);
  const [selectedObj, setSelectedObj] = useState<any>(null);

  // Helper to get all objects except background and logo (if present)
  const getDeletableObjects = () => {
    if (!fabricCanvas) return [];
    return fabricCanvas.getObjects().filter(obj => {
      // Exclude background, cropZone, and logo
      if ((obj as any).name === 'cropZone') return false;
      if (logoObj && obj === logoObj) return false;
      // Only allow images and textboxes
      return obj.type === 'image' || obj.type === 'textbox';
    });
  };

  // Update overlay positions on canvas/object changes
  useEffect(() => {
    if (!fabricCanvas) return;
    const updateOverlays = () => {
      const objs = getDeletableObjects();
      const overlays = objs.map(obj => {
        // Get bounding rect relative to canvas
        const bound = obj.getBoundingRect();
        return {
          id: obj.toString(),
          left: bound.left,
          top: bound.top,
          width: bound.width,
          height: bound.height,
          obj,
        };
      });
      setObjectOverlays(overlays);
    };
    updateOverlays();
    // Listen to object events
    const events = ['object:moving', 'object:scaling', 'object:rotating', 'object:added', 'object:removed', 'object:modified'];
    events.forEach(evt => fabricCanvas.on(evt as any, updateOverlays));
    // Also update on renderAll
    fabricCanvas.on('after:render' as any, updateOverlays);

    // Listen for selection changes
    const handleSelection = () => {
      const active = fabricCanvas.getActiveObject();
      setSelectedObj(active && (active.type === 'image' || active.type === 'textbox') ? active : null);
    };
    fabricCanvas.on('selection:created' as any, handleSelection);
    fabricCanvas.on('selection:updated' as any, handleSelection);
    fabricCanvas.on('selection:cleared' as any, () => setSelectedObj(null));

    // Initial
    updateOverlays();
    handleSelection();
    return () => {
      events.forEach(evt => fabricCanvas.off(evt as any, updateOverlays));
      fabricCanvas.off('after:render' as any, updateOverlays);
      fabricCanvas.off('selection:created' as any, handleSelection);
      fabricCanvas.off('selection:updated' as any, handleSelection);
      fabricCanvas.off('selection:cleared' as any, () => setSelectedObj(null));
    };
  }, [fabricCanvas, logoObj]);

  // Delete handler
  const handleDeleteObject = (obj: any) => {
    if (!fabricCanvas) return;
    fabricCanvas.remove(obj);
    fabricCanvas.discardActiveObject();
    fabricCanvas.renderAll();
    toast.success('Elemento eliminado');
  };

  return (
    <section className="container py-8 grid gap-8 lg:grid-cols-[1fr_360px]">
      <div>
        {/* Título y subtítulo */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-extrabold text-cyber mb-2">Personaliza Tu Mousepad</h1>
          <p className="text-muted-foreground text-lg">Diseña tu Mousepad perfecto con nuestro editor avanzado</p>
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
                  background: 'linear-gradient(90deg, #0891b2 0%, #6d28d9 100%)',
                boxShadow: '0 0 8px 0 rgba(0,0,0,0.12)'
              }}>1</span>
              <span className="font-bold">Seleccionar tamaño del Mousepad</span>
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
                  background: 'linear-gradient(90deg, #0891b2 0%, #6d28d9 100%)',
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
              className="w-full btn-purple-yellow btn-purple-glow"
            >
              Seleccionar Imagen
            </Button>
          </div>
        </div>

        {/* Barra superior de la vista previa */}
        <div className="rounded-t-xl bg-[#0f172a] px-6 py-3 flex items-center justify-between border border-b-0 border-card mb-0" style={{marginBottom: 0}}>
          <span className="text-lg md:text-xl font-bold text-white tracking-wide">Vista Previa</span>
          <span className="text-sm text-muted-foreground flex items-center gap-2">Color de fondo:
            <ColorPicker color={fabricCanvas?.backgroundColor as string || '#0b0f14'} onChange={color => {
              if (fabricCanvas) {
                fabricCanvas.backgroundColor = color;
                fabricCanvas.renderAll();
              }
            }} />
          </span>
        </div>
        {/* Canvas */}
        <div className="rounded-b-xl bg-card border-t-0 border p-5 mb-6">
          <div className={`relative rounded-xl bg-black/80 p-2 ${rgb ? 'animate-rgb-glow' : ''}`}> 
            {rgb && <div aria-hidden className="led-gradient-ring pointer-events-none absolute inset-0 rounded-xl" />}
            <div className="relative flex items-center justify-center w-full h-full rounded-lg overflow-hidden">
              <canvas
                ref={canvasRef}
                className="absolute"
                style={{ width: "100%", height: "100%" }}
              />
              {/* Overlay delete buttons for each object */}
              {objectOverlays.map(overlay => {
                if (!selectedObj || selectedObj !== overlay.obj) return null;
                // Margin between object and button
                const margin = 8;
                // Place button at top-right, outside the bounding box
                const btnLeft = overlay.left + overlay.width + margin;
                const btnTop = overlay.top - 16;
                return (
                  <button
                    key={overlay.id}
                    type="button"
                    onClick={() => handleDeleteObject(overlay.obj)}
                    style={{
                      position: 'absolute',
                      left: btnLeft,
                      top: btnTop,
                      zIndex: 10,
                      width: 32,
                      height: 32,
                      background: 'rgba(30,41,59,0.92)',
                      border: '2px solid #3a0ca3',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 2px 8px 0 rgba(0,0,0,0.18)',
                      cursor: 'pointer',
                      transition: 'background 0.18s',
                    }}
                    title="Eliminar"
                  >
                    {/* Trash bin SVG icon */}
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3a0ca3" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ pointerEvents: 'none' }}>
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
                      <line x1="10" y1="11" x2="10" y2="17" />
                      <line x1="14" y1="11" x2="14" y2="17" />
                    </svg>
                  </button>
                );
              })}
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
                  background: 'linear-gradient(90deg, #0891b2 0%, #6d28d9 100%)',
                boxShadow: '0 0 8px 0 rgba(0,0,0,0.12)'
              }}>3</span>
              <span className="font-bold">Agregar Texto</span>
            </div>
            <div className="mb-2">
              {/* Texto label */}
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-semibold text-white">Texto</span>
                <span className="text-sm font-semibold text-white">Color</span>
              </div>
              <div className="flex gap-2 items-center mb-2">
                <Input
                  placeholder="Ingresa tu texto..."
                  className="flex-1"
                  value={textInput}
                  onChange={e => setTextInput(e.target.value)}
                />
                <div className="flex flex-col justify-center items-center" style={{height: 40, marginTop: -6}}>
                  <ColorPicker color={textColor} onChange={setTextColor} />
                </div>
              </div>
              {/* Fuente label */}
              <span className="text-sm font-semibold text-white block mb-1">Fuente</span>
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
                <Button type="button" onClick={addText} className="btn-purple-yellow btn-purple-glow">
                  Agregar Texto
                </Button>
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
                  background: 'linear-gradient(90deg, #0891b2 0%, #6d28d9 100%)',
                boxShadow: '0 0 8px 0 rgba(0,0,0,0.12)'
              }}>4</span>
              <span className="font-bold">Logo Dr Mousepad</span>
            </div>
            <div className="mb-2 flex items-center gap-2 mt-10">
              <Switch checked={logoRemoved} onCheckedChange={setLogoRemoved} id="qlogo" />
              <label htmlFor="qlogo" className="text-sm">Quitar logo (+30,000 Gs)</label>
            </div>
            {!logoRemoved && (
              <div className="mt-5 mb-2">
                <span className="text-sm font-semibold text-white block mb-1">Posición del logo</span>
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
              </div>
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
                  background: 'linear-gradient(90deg, #0891b2 0%, #6d28d9 100%)',
                boxShadow: '0 0 8px 0 rgba(0,0,0,0.12)'
              }}>5</span>
              <span className="font-bold">Luces RGB</span>
            </div>
            <div className="flex items-center gap-2 mb-2 mt-10">
              <Switch checked={rgb} onCheckedChange={setRgb} id="rgb" />
              <label htmlFor="rgb" className="text-sm">Activar RGB (+50,000 Gs)</label>
            </div>
            <p className="text-xs text-muted-foreground">Añade efectos de luces LED sincronizables</p>
          </div>
        </div>
      </div>
  {/* Aside derecho: Resumen */}
  <aside className="lg:sticky lg:top-[172px] mt-0 lg:mt-[110px] h-fit rounded-xl border border-border bg-card p-5">
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
  <Button
    className="w-full btn-purple-yellow btn-purple-glow mb-4 flex items-center justify-center gap-2"
    style={{ animation: 'btn-pulse 1.6s ease-in-out infinite' }}
    onClick={handleAddToCart}
  >
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
