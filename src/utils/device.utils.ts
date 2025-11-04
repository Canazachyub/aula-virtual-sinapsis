/**
 * Utilidades para detección de dispositivos
 */

import type { DeviceInfo } from '../types/state.types';

/** Detecta el tipo de dispositivo basado en el ancho de la ventana */
export function detectDevice(): DeviceInfo {
  const width = window.innerWidth;
  const height = window.innerHeight;

  return {
    isMobile: width <= 768,
    isTablet: width > 768 && width <= 1024,
    isDesktop: width > 1024,
    width,
    height
  };
}

/** Vibra el dispositivo (solo móviles) */
export function vibrate(pattern: number | number[] = [10]): void {
  if ('vibrate' in navigator && detectDevice().isMobile) {
    navigator.vibrate(pattern);
  }
}

/** Verifica si el dispositivo soporta touch */
export function isTouchDevice(): boolean {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

/** Aplica estilos específicos para iOS */
export function isIOS(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

/** Obtiene la orientación del dispositivo */
export function getOrientation(): 'portrait' | 'landscape' {
  return window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
}
