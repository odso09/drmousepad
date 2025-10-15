/**
 * Sistema de logging condicional
 * Solo muestra logs en modo desarrollo para mejor performance en producción
 */

const isDev = import.meta.env.MODE === 'development';

export const logger = {
  /**
   * Log normal - solo en desarrollo
   */
  log: (...args: any[]) => {
    if (isDev) console.log(...args);
  },

  /**
   * Warning - solo en desarrollo
   */
  warn: (...args: any[]) => {
    if (isDev) console.warn(...args);
  },

  /**
   * Error - siempre se muestra (crítico para debugging)
   */
  error: (...args: any[]) => {
    console.error(...args);
  },

  /**
   * Info - solo en desarrollo
   */
  info: (...args: any[]) => {
    if (isDev) console.info(...args);
  },

  /**
   * Debug - solo en desarrollo
   */
  debug: (...args: any[]) => {
    if (isDev) console.debug(...args);
  },
};
