import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { deleteImageBlob, saveCanvasJson, getCanvasJson, deleteCanvasJson } from "@/lib/idb";
import { toast } from "sonner";

export type LogoState = {
  position: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  removed: boolean;
};

export type PersonalizationData = {
  size: string;
  // Now supports IndexedDB id reference or legacy url
  images: { id?: string; url?: string; props?: any }[]; // referencia + props
  texts: Array<{
    id: string;
    content: string;
    font: string;
    left: any;
    top: any;
    fill?: string;
    fontSize?: number;
    scaleX?: number;
    scaleY?: number;
    angle?: number;
    width?: number;
    height?: number;
    originX?: string;
    originY?: string;
    // Puedes agregar más props si lo deseas
  }>;
  logo: LogoState;
  rgb: boolean;
  basePrice: number;
  extras: { logoRemoved: boolean; rgb: boolean };
  total: number;
  thumbnail?: string; // dataURL
  backgroundColor?: string;
};

export type CartItem = {
  id: string;
  data: PersonalizationData;
  quantity: number;
  canvasJson?: any;
};



type CartContextValue = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "id"> & { thumbnail?: string }) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clear: () => void;
  count: number;
  total: number;
};

const CartContext = createContext<CartContextValue | undefined>(undefined);

const LS_KEY = "dr-mousepad-cart";

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Cargar items del localStorage e IndexedDB al iniciar
  useEffect(() => {
    const cached = localStorage.getItem(LS_KEY);
    if (cached) {
      try {
        const parsedItems: CartItem[] = JSON.parse(cached);
        // Recuperar canvasJson de IndexedDB para cada item
        Promise.all(
          parsedItems.map(async (item) => {
            const canvasJson = await getCanvasJson(item.id);
            return { ...item, canvasJson: canvasJson ? JSON.parse(canvasJson) : undefined };
          })
        ).then(itemsWithCanvas => {
          setItems(itemsWithCanvas);
          setIsInitialized(true);
        }).catch(() => {
          setItems(parsedItems);
          setIsInitialized(true);
        });
      } catch {
        setIsInitialized(true);
      }
    } else {
      setIsInitialized(true);
    }
  }, []);

  // Guardar items cuando cambien (solo después de la inicialización)
  useEffect(() => {
    if (!isInitialized) return; // No guardar durante la carga inicial

    // Guardar en localStorage SOLO lo esencial (sin datos pesados)
    const itemsToSave = items.map(item => {
      const { canvasJson, ...itemWithoutCanvas } = item as any;
      
      // Limpiar data: quitar thumbnail y urls de imágenes base64
      const cleanData = {
        ...itemWithoutCanvas.data,
        thumbnail: undefined, // Quitar thumbnail
        images: (itemWithoutCanvas.data?.images || []).map((img: any) => ({
          id: img.id, // Solo guardar el ID de IndexedDB
          props: img.props // Mantener propiedades de transformación
          // NO guardar url (puede ser base64 grande)
        }))
      };
      
      return {
        ...itemWithoutCanvas,
        data: cleanData
      };
    });
    
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(itemsToSave));
      
      // Guardar canvasJson en IndexedDB
      items.forEach(item => {
        if (item.canvasJson) {
          saveCanvasJson(item.id, JSON.stringify(item.canvasJson)).catch(err => {
            console.warn('Error guardando canvasJson en IndexedDB:', err);
          });
        }
      });
    } catch (e) {
      console.warn('Error guardando carrito en localStorage:', e);
      // Si falla, intentar guardar sin las imágenes
      try {
        localStorage.setItem(LS_KEY, JSON.stringify(itemsToSave));
      } catch (retryError) {
        console.error('Error crítico guardando carrito:', retryError);
        toast.error('Error al guardar el carrito. Por favor, intenta de nuevo.');
      }
    }
  }, [items, isInitialized]);

  const addItem: CartContextValue["addItem"] = (item) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setItems((prev) => [
      ...prev,
      { id, quantity: item.quantity, data: item.data, canvasJson: (item as any).canvasJson },
    ]);
  };

  const removeItem = (id: string) => {
    setItems((prev) => {
      const itemToRemove = prev.find(i => i.id === id);
      const next = prev.filter(i => i.id !== id);
      // Limpieza de blobs: borrar solo ids que ya no están referenciados por otros items
      if (itemToRemove) {
        const idsToCheck = Array.from(new Set((itemToRemove.data?.images || []).map((img: any) => img?.id).filter(Boolean))) as string[];
        if (idsToCheck.length) {
          (async () => {
            // Construir set de ids aún usados por 'next'
            const stillUsed = new Set<string>();
            next.forEach(it => (it.data?.images || []).forEach((img: any) => { if (img?.id) stillUsed.add(img.id); }));
            const deletables = idsToCheck.filter(id => !stillUsed.has(id));
            if (deletables.length) {
              await Promise.allSettled(deletables.map(did => deleteImageBlob(did)));
            }
          })();
        }
        // Eliminar canvasJson de IndexedDB
        deleteCanvasJson(id).catch(err => console.warn('Error eliminando canvasJson:', err));
      }
      return next;
    });
  };

  const updateQuantity = (id: string, quantity: number) =>
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, quantity } : i)));

  const clear = () => {
    // Capturar ids de imágenes antes de limpiar el estado
    const ids = Array.from(new Set(
      items
        .flatMap(i => i.data?.images || [])
        .map((img: any) => img?.id)
        .filter(Boolean)
    )) as string[];
    
    // Capturar ids de items para eliminar canvasJson
    const itemIds = items.map(i => i.id);
    
    // Limpiar UI inmediatamente
    setItems([]);
    
    // Borrar blobs de IndexedDB en segundo plano
    if (ids.length) {
      (async () => {
        await Promise.allSettled(ids.map(id => deleteImageBlob(id)));
      })();
    }
    
    // Borrar canvasJson de IndexedDB
    if (itemIds.length) {
      (async () => {
        await Promise.allSettled(itemIds.map(id => deleteCanvasJson(id)));
      })();
    }
  };

  const { count, total } = useMemo(() => {
    const count = items.reduce((sum, i) => sum + i.quantity, 0);
    const total = items.reduce((sum, i) => sum + i.quantity * i.data.total, 0);
    return { count, total };
  }, [items]);

  const value: CartContextValue = { items, addItem, removeItem, updateQuantity, clear, count, total };
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
};
