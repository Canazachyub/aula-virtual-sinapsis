/**
 * Tipos relacionados con la API y datos del backend
 */

/** Representa una hoja del spreadsheet */
export interface Sheet {
  name: string;
  id: number;
}

/** Tipos de contenido soportados */
export type ContentType = 'pdf' | 'video' | 'youtube' | 'form' | 'quiz' | 'slides' | 'document' | 'spreadsheet' | 'link';

/** Representa un recurso/item del curso */
export interface CourseItem {
  id: string;
  name: string;
  folder: string;
  subfolder: string;
  level: number;
  order: number;
  type: ContentType;
  mime: string;
  url: string;
  embedUrl: string;
  icon: string;
}

/** Parámetros para obtener datos del curso */
export interface CourseDataParams {
  sheet: string;
  q?: string;
  folder?: string;
  subfolder?: string;
  sort?: 'order' | 'name' | 'level';
  start?: number;
  limit?: number;
}

/** Respuesta de la API para getCourseData */
export interface CourseDataResponse {
  total: number;
  items: CourseItem[];
  sheet: string;
  timestamp?: string;
  actualRowCount?: number;
  error?: boolean;
  message?: string;
}

/** Respuesta de la API para getSheets */
export type SheetsResponse = Sheet[];

/** Respuesta genérica de error */
export interface ApiErrorResponse {
  error: true;
  message: string;
  stack?: string;
}
