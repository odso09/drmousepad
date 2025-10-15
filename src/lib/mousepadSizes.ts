/**
 * Utilidades centralizadas para tamaños de mousepads
 * Evita duplicación de código en múltiples archivos
 */

export const SIZES = ["90×40 cm", "80×40 cm", "80×30 cm", "70×30 cm", "60×30 cm"] as const;

export type MousepadSize = typeof SIZES[number];

/**
 * Parsea un string de tamaño (ej: "90×40 cm") y retorna ancho y alto
 * @param s String de tamaño con formato "WxH cm"
 * @returns Objeto con propiedades w (ancho) y h (alto)
 */
export const parseSize = (s: string): { w: number; h: number } => {
  const [w, h] = s.replace(" cm", "").split("×").map((n) => parseInt(n));
  return { w, h };
};

/**
 * Convierte un tamaño de mousepad a dimensiones en píxeles para impresión
 * Aproximadamente 300 DPI de resolución
 * @param tamano String de tamaño (ej: "90×40 cm")
 * @returns Objeto con dimensiones en píxeles { w, h }
 */
export const sizeToPixels = (tamano?: string): { w: number; h: number } => {
  if (!tamano) return { w: 3840, h: 1920 };
  
  const map: Record<string, { w: number; h: number }> = {
    "90×40 cm": { w: 10630, h: 4724 },
    "80×40 cm": { w: 9449, h: 4724 },
    "80×30 cm": { w: 9449, h: 3543 },
    "70×30 cm": { w: 8268, h: 3543 },
    "60×30 cm": { w: 7087, h: 3543 },
  };
  
  return map[tamano] || { w: 3840, h: 1920 };
};
