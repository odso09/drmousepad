// Declaración para evitar error de TypeScript con EyeDropper
import SEO from "@/components/SEO";
declare global {
  interface Window {
    EyeDropper?: any;
  }
}
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Canvas as FabricCanvas, Image as FabricImage, Rect, Textbox, Object as FabricObject, Line as FabricLine } from "fabric";
const logoUrl = new URL("../assets/logo.png", import.meta.url).href;
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { ColorPicker } from "@/components/ui/color-picker";
import { useCart } from "@/context/CartContext";
import { toast } from "sonner";
import { deleteImageBlob, getImageBlob, saveImageBlob } from "@/lib/idb";

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
  // URL del logo para filtrar imágenes personalizadas
  const LOGO_URL = logoUrl;
  // Clave para localStorage
  const LOCAL_KEY = 'personalizar_drmousepad';
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("id");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [size, setSize] = useState<string>(DEFAULT_SIZE);
  const [rgb, setRgb] = useState(false);
  const [logoRemoved, setLogoRemoved] = useState(false);
  const [logoPos, setLogoPos] = useState<"top-left" | "top-right" | "bottom-left" | "bottom-right">("bottom-right");
  const logoPosRef = useRef<typeof logoPos>("bottom-right");
  useEffect(() => { logoPosRef.current = logoPos; }, [logoPos]);
  const [texts, setTexts] = useState<Array<{
    id: string;
    content: string;
    font: string;
    fill?: string;
    fontSize?: number;
    left?: number;
    top?: number;
    scaleX?: number;
    scaleY?: number;
    angle?: number;
    width?: number;
    height?: number;
    originX?: string;
    originY?: string;
  }>>([]);
  const [activeFont, setActiveFont] = useState(FONTS[0].value);
  const [logoObj, setLogoObj] = useState<FabricObject | null>(null);
  // Estado para múltiples imágenes subidas
  // For each image we now store an id (IndexedDB key) and optional props; keep url for backward compatibility when restoring
  const [uploadedImages, setUploadedImages] = useState<Array<{ id?: string; url?: string; props?: any }>>([]);
  const [textColor, setTextColor] = useState("#ffffff");
  const [backgroundColor, setBackgroundColor] = useState("#0b0f14");
  // Evita re-restaurar (p. ej., tras agregar al carrito que dispara cambios en items)
  const restoredOnceRef = useRef(false);

  const { addItem, items } = useCart();

  useEffect(() => {
    const data = {
      size,
      rgb,
      logoRemoved,
      logoPos,
      texts,
      // Persist only lightweight references (id + props). If legacy url exists, keep it to render older entries.
      images: uploadedImages.map(img => ({ id: img.id, url: img.url, props: img.props })),
      backgroundColor,
    };
    localStorage.setItem(LOCAL_KEY, JSON.stringify(data));
  }, [size, rgb, logoRemoved, logoPos, texts, uploadedImages, backgroundColor]);

  // Segundo efecto: restaurar desde carrito solo una vez por editId
  useEffect(() => {
    if (!editId || !items.length || !fabricCanvas || restoredOnceRef.current) return;
    const item = items.find(i => i.id === editId);
    if (!item) return;
    // Restaurar tamaño seleccionado del mousepad
    if (item.data?.size) {
      setSize(item.data.size);
    }
    // Restaurar estado de logo, rgb y backgroundColor
    setLogoRemoved(item.data.logo?.removed ?? false);
    setRgb(item.data.rgb ?? false);
    if (item.data.logo?.position) {
      setLogoPos(item.data.logo.position);
      // Si el logo ya está cargado, re-posicionar de inmediato
      if (logoObj && fabricCanvas) {
        positionLogo(fabricCanvas, logoObj, item.data.logo.position as any);
      }
    }
    if (item.data?.backgroundColor) {
      setBackgroundColor(item.data.backgroundColor);
      if (fabricCanvas) {
        fabricCanvas.backgroundColor = item.data.backgroundColor;
        fabricCanvas.renderAll();
      }
    }
    // Imágenes personalizadas (todas)
    if (item.data.images && item.data.images.length > 0) {
      const hasImages = fabricCanvas.getObjects().some(o => o.type === 'image');
      if (!hasImages) {
        // Load each image either from IndexedDB (by id) or fallback to URL (legacy)
        (async () => {
          for (const raw of item.data.images) {
            const ref: any = raw;
            const urlVal = typeof ref === 'string' ? ref : ref.url;
            const idVal = typeof ref === 'string' ? undefined : ref.id;
            const isLogo = urlVal === LOGO_URL;
            if (isLogo) continue;
            const imgProps = typeof ref === 'string' ? {} : (ref.props || {});
            try {
              let src: string | undefined;
              if (idVal) {
                const blob = await getImageBlob(idVal);
                if (blob) {
                  // Convertir blob a dataURL para evitar problemas con URLs temporales
                  src = await new Promise<string>((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result as string);
                    reader.readAsDataURL(blob);
                  });
                }
              }
              if (!src && urlVal) src = urlVal; // legacy fallback
              if (!src) continue;
              // eslint-disable-next-line no-await-in-loop
              const img = await FabricImage.fromURL(src);
              // Etiquetar la instancia con el id de IndexedDB para limpieza/guardado confiable
              if (idVal) (img as any).__idbId = idVal;
              img.set({
                left: imgProps.left ?? (fabricCanvas.width as number) / 2,
                top: imgProps.top ?? (fabricCanvas.height as number) / 2,
                scaleX: imgProps.scaleX ?? 0.5,
                scaleY: imgProps.scaleY ?? 0.5,
                originX: imgProps.originX ?? 'center',
                originY: imgProps.originY ?? 'center',
                selectable: true,
                ...imgProps
              } as any);
              fabricCanvas.add(img);
              fabricCanvas.sendObjectToBack(img as any);
              fabricCanvas.renderAll();
            } catch (e) {
              console.error('Error restaurando imagen desde IndexedDB/URL', e);
            }
          }
        })();
      }
    }
    // Textos personalizados
    if (item.data.texts && item.data.texts.length > 0) {
      const hasText = fabricCanvas.getObjects().some(o => o.type === 'textbox');
      if (!hasText) {
        item.data.texts.forEach(tb => {
          const textbox = new Textbox(tb.content, {
            fontFamily: tb.font,
            fill: tb.fill,
            fontSize: tb.fontSize,
            left: typeof tb.left === 'number' ? tb.left : 40,
            top: typeof tb.top === 'number' ? tb.top : 40,
            originX: tb.originX,
            originY: tb.originY,
            selectable: true,
          } as any);
          // Aplicar tamaño, escala y ángulo después de crear el textbox
          if (typeof tb.width === 'number') textbox.set('width', tb.width);
          if (typeof tb.height === 'number') textbox.set('height', tb.height);
          if (typeof tb.scaleX === 'number') textbox.set('scaleX', tb.scaleX);
          if (typeof tb.scaleY === 'number') textbox.set('scaleY', tb.scaleY);
          if (typeof tb.angle === 'number') textbox.set('angle', tb.angle);
          fabricCanvas.add(textbox);
        });
        fabricCanvas.renderAll();
      }
    }
    // Marcar como restaurado para no sobreescribir cambios del usuario posteriormente
    restoredOnceRef.current = true;
  }, [editId, items, fabricCanvas]);

  // Si cambia el id de edición, permitir una nueva restauración
  useEffect(() => {
    restoredOnceRef.current = false;
  }, [editId]);

  // También resetear al desmontar
  useEffect(() => {
    return () => {
      restoredOnceRef.current = false;
    };
  }, []);

  const ratio = useMemo(() => {
    const { w, h } = parseSize(size);
    return w / h;
  }, [size]);

  useEffect(() => {
    if (!canvasRef.current) return;
    const fc = new FabricCanvas(canvasRef.current, {
      width: 960,
      height: 960 / (ratio || 2.25),
      backgroundColor: backgroundColor,
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
        // Esperar a que la imagen esté lista para posicionar usando la posición más reciente
        setTimeout(() => {
          positionLogo(fc, img, logoPosRef.current);
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
    if (!fabricCanvas) return;
    if (!textInput.trim()) {
      toast.info('Ingresa un texto antes de agregar');
      return;
    }
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
    // Guardar las props reales del textbox
    setTexts((t) => [
      ...t,
      {
        id,
        content: textInput,
        font: activeFont,
        fill: typeof tb.fill === 'string' ? tb.fill : '#ffffff',
        fontSize: tb.fontSize,
  left: tb.left,
  top: tb.top,
        scaleX: tb.scaleX,
        scaleY: tb.scaleY,
        angle: tb.angle,
        width: tb.width,
        height: tb.height,
  originX: typeof tb.originX === 'string' ? tb.originX : 'left',
  originY: typeof tb.originY === 'string' ? tb.originY : 'top',
      },
    ]);
    setTextInput("");
  toast.success('Texto agregado');
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!fabricCanvas) return;
    const fileUp = e.target.files?.[0];
    if (!fileUp) return;
    try {
      // Guardar el archivo original en IndexedDB como blob
    const id = await saveImageBlob(fileUp);
    const objUrl = URL.createObjectURL(fileUp);
  const img = await FabricImage.fromURL(objUrl);
  // Revocar el URL temporal inmediatamente después de cargar
  try { URL.revokeObjectURL(objUrl); } catch {}
  // Etiquetar la instancia con el id de IndexedDB
  (img as any).__idbId = id;
      const cw = fabricCanvas.width as number;
      const ch = fabricCanvas.height as number;
      const scale = 0.5 * Math.min(cw / (img.width as number), ch / (img.height as number));
      const props = {
  left: cw / 2,
  top: ch / 2,
        scaleX: scale,
        scaleY: scale,
        originX: "center",
        originY: "center",
        selectable: true,
      };
      img.set(props as any);
      fabricCanvas.add(img);
      fabricCanvas.sendObjectToBack(img as any);
      fabricCanvas.renderAll();
      // Persist only the id + props; keep url undefined to avoid localStorage bloat
      setUploadedImages(prev => [...prev, { id, props }]);
      toast.success("Imagen agregada al centro.");
    } catch (err) {
      console.error('Fallo al subir/guardar imagen en IndexedDB', err);
      toast.error('No se pudo cargar la imagen');
    }
  };

  useEffect(() => {
    if (!fabricCanvas) return;

  const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Delete") {
        const active = fabricCanvas.getActiveObject();
        if (active) {
      // Reutilizar la lógica de borrado con limpieza de IndexedDB
      void handleDeleteObject(active);
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
    if (!logoRemoved) {
      // Asegurar que el logo esté en la esquina elegida con padding al volver a mostrarse
      positionLogo(fabricCanvas, logoObj, logoPos);
      fabricCanvas.bringObjectToFront(logoObj as any);
    }
    fabricCanvas.renderAll();
  }, [logoRemoved, fabricCanvas, logoObj]);

  // Logo position change
  useEffect(() => {
    if (!fabricCanvas || !logoObj) return;
    positionLogo(fabricCanvas, logoObj, logoPos);
  }, [logoPos]);

  const textCount = texts.length;
  const total = BASE_PRICE + (logoRemoved ? EXTRA_LOGO : 0) + (rgb ? EXTRA_RGB : 0);
  
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  const handleAddToCart = async () => {
    if (!fabricCanvas || isAddingToCart) return;
    
    setIsAddingToCart(true);
    
    try {
      // Exportar thumbnail adaptativo: calcula multiplier según la imagen de mayor resolución
      // Objetivo: conservar detalle sin inflar demasiado (rango 2x - 4x)
      let dataUrl: string;
      const baseW = (fabricCanvas.getWidth && fabricCanvas.getWidth()) || (fabricCanvas as any).width || 960;
      let maxNatural = 0;
      try {
        const imgs = fabricCanvas.getObjects().filter(o => o.type === 'image') as any[];
        for (const img of imgs) {
          const el: HTMLImageElement | undefined = (img as any)._element;
          if (!el) continue;
          const nw = el.naturalWidth || el.width || 0;
          if (nw > maxNatural) maxNatural = nw;
      }
    } catch {/* silencioso */}
    // Ratio entre la mayor imagen y el ancho del canvas visible
    let ratio = maxNatural && baseW ? maxNatural / baseW : 0;
    // Si no hay imágenes grandes, mantener mínimo 2 para nitidez de textos
    if (!ratio || ratio < 2) ratio = 2;
    // Limitar techo para no explotar memoria (puedes ajustar a 5 si lo ves estable)
    let multiplier = Math.min(ratio, 4);
    // Redondear a 1 decimal para estabilidad
    multiplier = Math.round(multiplier * 10) / 10;
    try {
      dataUrl = (fabricCanvas as any).toDataURL({ format: 'png', multiplier });
    } catch {
      // Fallback: intentar con 2, luego sin multiplier
      try {
        dataUrl = (fabricCanvas as any).toDataURL({ format: 'png', multiplier: 2 });
      } catch {
        dataUrl = (fabricCanvas as any).toDataURL({ format: 'png' });
      }
    }

    // Obtener todas las imágenes del canvas antes de serializar
    const imageObjects = fabricCanvas.getObjects().filter(o => o.type === 'image') as any[];
    
    console.log('📦 Preparando para agregar al carrito, imágenes:', imageObjects.length);
    
    // CRÍTICO: Convertir blob: URLs a dataURL ANTES de toJSON()
    // Solo necesitamos convertir las imágenes blob:, el logo ya es una URL válida
    const conversionPromises = imageObjects
      .filter((imgObj) => {
        const src: string = (imgObj as any).getSrc ? (imgObj as any).getSrc() : (imgObj as any)._originalElement?.src || '';
        return src.startsWith('blob:');
      })
      .map(async (imgObj) => {
        const src: string = (imgObj as any).getSrc ? (imgObj as any).getSrc() : (imgObj as any)._originalElement?.src || '';
        console.log('🖼️ Convirtiendo imagen blob src:', src.substring(0, 50));
        
        const el: HTMLImageElement | undefined = (imgObj as any)._element || (imgObj as any)._originalElement;
        if (!el || !el.complete) {
          console.warn('⚠️ Elemento de imagen no disponible o no cargado');
          return;
        }
        
        try {
          // Crear canvas temporal con el tamaño natural de la imagen
          const w = el.naturalWidth || el.width || 100;
          const h = el.naturalHeight || el.height || 100;
          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = w;
          tempCanvas.height = h;
          const ctx = tempCanvas.getContext('2d');
          
          if (!ctx) {
            console.error('❌ No se pudo obtener contexto 2D');
            return;
          }
          
          ctx.drawImage(el, 0, 0, w, h);
          const dataURL = tempCanvas.toDataURL('image/png');
          
          // Actualizar directamente las propiedades del objeto Fabric
          // setSrc es asíncrono y puede causar problemas, mejor actualizar directamente
          if ((imgObj as any)._element) {
            (imgObj as any)._element.src = dataURL;
          }
          if ((imgObj as any)._originalElement) {
            (imgObj as any)._originalElement.src = dataURL;
          }
          // Actualizar la propiedad interna src
          if ((imgObj as any).src) {
            (imgObj as any).src = dataURL;
          }
          
          console.log('✅ Imagen convertida a dataURL correctamente');
        } catch (err) {
          console.error('❌ Error convirtiendo blob a dataURL:', err);
        }
      });
    
    // Esperar a que TODAS las conversiones terminen
    if (conversionPromises.length > 0) {
      console.log('⏳ Esperando conversión de', conversionPromises.length, 'imágenes blob...');
      await Promise.all(conversionPromises);
      console.log('✅ Todas las imágenes convertidas');
    } else {
      console.log('✅ No hay imágenes blob para convertir');
    }
    
    // Forzar actualización del canvas después de las conversiones
    fabricCanvas.renderAll();
    
    // Generar JSON del canvas (ahora debería tener dataURLs)
    const canvasJson: any = fabricCanvas.toJSON();
    
    // Verificar qué tenemos en el JSON
    if (Array.isArray(canvasJson?.objects)) {
      for (const obj of canvasJson.objects) {
        if (obj.type === 'image') {
          console.log('📄 Objeto en JSON, src:', obj.src?.substring(0, 50));
        }
      }
    }
    
    // Guardar solo imágenes personalizadas (excluyendo el logo)
    const canvasImages = fabricCanvas.getObjects().filter(o => o.type === 'image') as any[];
    
    // Para cada imagen: guardar su ID de IndexedDB y propiedades de transformación
    const imagesArr = await Promise.all(canvasImages.map(async (img) => {
      const instanceId: string | undefined = (img as any).__idbId;
      const src: string = img._element?.src || '';
      const isLogo = src === LOGO_URL;
      if (isLogo) return null;
      
      const props = {
        left: img.left,
        top: img.top,
        scaleX: img.scaleX,
        scaleY: img.scaleY,
        originX: img.originX,
        originY: img.originY,
        angle: img.angle,
        width: img.width,
        height: img.height,
      };
      if (instanceId) return { id: instanceId, props };
      // Si la imagen proviene de un blob: persistir en IndexedDB para que sobreviva reload
      if (src && src.startsWith('blob:')) {
        try {
          const resp = await fetch(src);
          const blob = await resp.blob();
          const newId = await saveImageBlob(blob);
          return { id: newId, props };
        } catch {
          // Si falla, continuar al fallback
        }
      }
      // Fallback: guardar url (legacy)
      return { url: src, props };
    })).then(arr => arr.filter(Boolean) as any);
    setUploadedImages(imagesArr);
    // Guardar textos con props actuales del canvas
    const canvasTexts = fabricCanvas.getObjects().filter(o => o.type === 'textbox');
    const textsArr = canvasTexts.map((tb: any, idx: number) => ({
      id: tb.id || `text-${idx}`,
      content: tb.text,
      font: tb.fontFamily,
      fill: typeof tb.fill === 'string' ? tb.fill : '#ffffff',
      fontSize: tb.fontSize,
  left: tb.left,
  top: tb.top,
      scaleX: tb.scaleX,
      scaleY: tb.scaleY,
      angle: tb.angle,
      width: tb.width,
      height: tb.height,
      originX: typeof tb.originX === 'string' ? tb.originX : 'left',
      originY: typeof tb.originY === 'string' ? tb.originY : 'top',
    }));
    addItem({
      quantity: 1,
      data: {
        size,
  images: imagesArr,
        texts: textsArr,
        logo: { position: logoPos, removed: logoRemoved },
        rgb,
  backgroundColor,
        basePrice: BASE_PRICE,
        extras: { logoRemoved, rgb },
        total,
        thumbnail: dataUrl,
      },
      canvasJson,
    });
    toast.success("Agregado al carrito");
    } catch (error) {
      console.error('❌ Error al agregar al carrito:', error);
      toast.error("Error al agregar al carrito");
    } finally {
      setIsAddingToCart(false);
    }
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
    let rafId: number | null = null;
    const computeOverlays = () => {
      const active = fabricCanvas.getActiveObject();
      if (!active || !(active.type === 'image' || active.type === 'textbox')) {
        setObjectOverlays([]);
        return;
      }
      const bound = active.getBoundingRect();
      setObjectOverlays([
        {
          id: active.toString(),
          left: bound.left,
          top: bound.top,
          width: bound.width,
          height: bound.height,
          obj: active,
        },
      ]);
    };
    const scheduleUpdate = () => {
      if (rafId !== null) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        computeOverlays();
      });
    };
    scheduleUpdate();
    const events = ['object:moving', 'object:scaling', 'object:rotating', 'object:added', 'object:removed', 'object:modified'];
  events.forEach(evt => fabricCanvas.on(evt as any, scheduleUpdate));

    const handleSelection = () => {
      const active = fabricCanvas.getActiveObject();
      setSelectedObj(active && (active.type === 'image' || active.type === 'textbox') ? active : null);
    };
    fabricCanvas.on('selection:created' as any, handleSelection);
    fabricCanvas.on('selection:updated' as any, handleSelection);
    fabricCanvas.on('selection:cleared' as any, () => setSelectedObj(null));

    scheduleUpdate();
    handleSelection();
    return () => {
  events.forEach(evt => fabricCanvas.off(evt as any, scheduleUpdate));
      fabricCanvas.off('selection:created' as any, handleSelection);
      fabricCanvas.off('selection:updated' as any, handleSelection);
      fabricCanvas.off('selection:cleared' as any, () => setSelectedObj(null));
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [fabricCanvas, logoObj]);

  // Delete handler
  const handleDeleteObject = async (obj: any) => {
    if (!fabricCanvas) return;
    try {
      if (obj?.type === 'image' && (obj as any).__idbId) {
        await deleteImageBlob((obj as any).__idbId);
      }
    } catch (e) {
      // Silencioso: si falla la limpieza no bloquea la UI
      console.warn('No se pudo borrar blob de IndexedDB', e);
    }
    // Revocar URL blob si existe en el elemento HTML
    try {
      const src: string | undefined = (obj as any)?._element?.src;
      if (src && src.startsWith('blob:')) {
        URL.revokeObjectURL(src);
      }
    } catch {}
    fabricCanvas.remove(obj);
    fabricCanvas.discardActiveObject();
    fabricCanvas.renderAll();
    toast.success('Elemento eliminado');
  };

  return (
    <>
      <SEO
        title="Personaliza tu Mousepad Gamer | Dr Mousepad"
        description="Crea tu mousepad único: elige tamaño, color, agrega tu logo y textos. Vista previa en tiempo real y envío gratis en Paraguay."
        canonical="https://drmousepad.com/personalizar"
      />
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
            <div className="flex items-center gap-3 mb-3" id="size-section-title">
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
              <SelectTrigger className="w-full" aria-labelledby="size-section-title">
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
            {/* Label oculto para el input de archivo */}
            <label htmlFor="upload-image" className="sr-only">Subir imagen</label>
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
              className="w-full btn-hero-static"
            >
              Seleccionar Imagen
            </Button>
          </div>
        </div>

        {/* Barra superior de la vista previa */}
        <div className="rounded-t-xl bg-[#0f172a] px-6 py-3 flex items-center justify-between border border-b-0 border-card mb-0" style={{marginBottom: 0}}>
          <span className="text-lg md:text-xl font-bold text-white tracking-wide">Vista Previa</span>
          <span className="text-lg text-muted-foreground flex items-center gap-2">
            <span id="bgcolor-label" className="text-muted-foreground text-lg">Color de fondo:</span>
            <ColorPicker ariaLabel="Elegir color de fondo" color={backgroundColor} onChange={color => {
              setBackgroundColor(color);
              if (fabricCanvas) {
                fabricCanvas.backgroundColor = color;
                fabricCanvas.renderAll();
              }
            }} />
            {/* Eyedropper button */}
            <button
              type="button"
              aria-label="Elegir color desde la pantalla"
              title="Copiar algun color de la pantalla"
              onClick={async () => {
                if (window.EyeDropper) {
                  try {
                    const eyeDropper = new (window as any).EyeDropper();
                    const result = await eyeDropper.open();
                    setBackgroundColor(result.sRGBHex);
                    if (fabricCanvas) {
                      fabricCanvas.backgroundColor = result.sRGBHex;
                      fabricCanvas.renderAll();
                    }
                  } catch (e) {
                    // Cancelled or error
                  }
                } else {
                  toast.info('Tu navegador no soporta la herramienta de cuentagotas (EyeDropper).');
                }
              }}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                marginLeft: 4,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                height: 32,
                width: 32,
              }}
            >
              {/* Eyedropper icon matching attached image, white */}
              <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 22l1-1h3l9-9-4-4-9 9v3l-1 1z" />
                <path d="M14.5 5.5l4 4" />
                <path d="M19 2.5a2.121 2.121 0 0 1 3 3l-1.5 1.5-3-3L19 2.5z" />
              </svg>
            </button>
          </span>
        </div>
        {/* Canvas */}
        <div className="rounded-b-xl bg-card border-t-0 border p-5 mb-6">
          <div className={`relative rounded-xl bg-black/80 p-2 ${rgb ? 'animate-rgb-glow' : ''}`}> 
            {rgb && <div aria-hidden="true" className="led-gradient-ring pointer-events-none absolute inset-0 rounded-xl" />}
            <div className="relative flex items-center justify-center w-full h-full rounded-lg overflow-hidden">
              <canvas
                ref={canvasRef}
                className="absolute"
                aria-label="Vista previa del diseño"
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
        aria-label="Eliminar elemento"
                    onClick={() => handleDeleteObject(overlay.obj)}
                    style={{
                      position: 'absolute',
                      left: btnLeft,
                      top: btnTop,
                      zIndex: 10,
                      width: 32,
                      height: 32,
                      background: 'rgba(30,41,59,0.92)',
                      border: '2px solid #ef4444',
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
                    <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ pointerEvents: 'none' }}>
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
          <ColorPicker ariaLabel="Elegir color de texto" color={textColor} onChange={setTextColor} />
                </div>
              </div>
              {/* Fuente label */}
        <span id="font-label" className="text-sm font-semibold text-white block mb-1">Fuente</span>
              <div className="flex gap-2">
                <Select value={activeFont} onValueChange={setActiveFont}>
          <SelectTrigger className="w-full" aria-labelledby="font-label">
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
                <Button type="button" onClick={addText} className="btn-hero-static">
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
                <span id="logo-pos-label" className="text-sm font-semibold text-white block mb-1">Posición del logo</span>
                <Select value={logoPos} onValueChange={v => setLogoPos(v as typeof logoPos)}>
                  <SelectTrigger className="w-full" aria-labelledby="logo-pos-label">
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
                ? <><X size={18} className="text-red-500" strokeWidth={3} /> <span className="text-red-500">Removido</span></>
                : <><span className="text-green-400 text-lg">&#10003;</span> Incluido</>}
            </span>
          </li>
          <li className="flex justify-between items-center">
            <span>Luces RGB:</span>
            <span className="font-bold flex items-center gap-1">
              {rgb
                ? <><span className="text-green-400 text-lg">&#10003;</span> Activado</>
                : <span className="text-red-500 font-bold flex items-center gap-1"><X size={18} className="text-red-500" strokeWidth={3} />Desactivado</span>}
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
  <div className="mb-4 flex justify-between text-lg font-bold"><span style={{color:'#a259f7', fontSize:'1.4rem'}}>Total:</span><span style={{color:'#a259f7', fontWeight:'bold', fontSize:'1.4rem'}}>{total.toLocaleString()} Gs</span></div>
  <Button
  className="btn-hero-static text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6 w-full mt-16 mb-4 flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-cyan-400"
    onClick={handleAddToCart}
    disabled={isAddingToCart}
    aria-label="Agregar al Carrito"
  >
    {isAddingToCart ? (
      <>
        <span className="material-icons animate-spin" style={{ fontSize: '1.2em' }}>refresh</span>
        Procesando...
      </>
    ) : (
      <>
        <span className="material-icons" style={{ fontSize: '1.2em' }}></span>
        Agregar al Carrito
      </>
    )}
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
    </>
  );
}
