/**
 * Tipos relacionados con el estado de la aplicación
 */

import type { Sheet, CourseItem } from './api.types';

/** Estado global de la aplicación */
export interface AppState {
  /** Lista de hojas disponibles */
  sheets: Sheet[];

  /** Hoja actualmente seleccionada */
  currentSheet: string | null;

  /** Todos los items del curso actual */
  items: CourseItem[];

  /** Items agrupados por carpeta y subcarpeta */
  grouped: Map<string, Map<string, CourseItem[]>>;

  /** Lista plana de items en orden de visualización */
  flat: CourseItem[];

  /** ID del item actualmente seleccionado */
  activeId: string | null;

  /** Estado del sidebar en móvil (abierto/cerrado) */
  sidebarOpen: boolean;

  /** Estado del sidebar en desktop (colapsado/expandido) */
  sidebarCollapsed: boolean;

  /** Indica si es un dispositivo móvil */
  isMobile: boolean;

  /** Indica si es una tablet */
  isTablet: boolean;
}

/** Configuración de dispositivo */
export interface DeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  width: number;
  height: number;
}
