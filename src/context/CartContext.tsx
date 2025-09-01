import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

export type LogoState = {
  position: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  removed: boolean;
};

export type PersonalizationData = {
  size: string;
  images: { url: string; props?: any }[]; // dataURL y props de la imagen
  texts: Array<{
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

  useEffect(() => {
    const cached = localStorage.getItem(LS_KEY);
    if (cached) {
      try {
        setItems(JSON.parse(cached));
      } catch {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify(items));
  }, [items]);

  const addItem: CartContextValue["addItem"] = (item) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setItems((prev) => [...prev, { id, quantity: item.quantity, data: item.data }]);
  };

  const removeItem = (id: string) => setItems((prev) => prev.filter((i) => i.id !== id));

  const updateQuantity = (id: string, quantity: number) =>
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, quantity } : i)));

  const clear = () => setItems([]);

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
