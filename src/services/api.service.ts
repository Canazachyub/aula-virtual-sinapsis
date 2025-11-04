/**
 * Servicio para interactuar con la API de Google Apps Script
 */

import type {
  Sheet,
  CourseDataParams,
  CourseDataResponse,
  SheetsResponse,
  ApiErrorResponse
} from '../types/api.types';

export class ApiService {
  private readonly API_URL = 'https://script.google.com/macros/s/AKfycbwdb4ToRIuHsfkfB5cXuQisJUY-qlUYxvX0d8mpkX9iGaH4eSj4QLNxhRCpRkDPQPbG/exec';

  /**
   * Llama a la API con fetch() y maneja errores
   */
  private async callAPI<T>(action: string, params: Record<string, any> = {}): Promise<T> {
    try {
      // Construir URL con parámetros
      const url = new URL(this.API_URL);
      url.searchParams.append('action', action);

      // Agregar parámetros adicionales
      Object.keys(params).forEach(key => {
        const value = params[key];
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });

      // Hacer la petición
      const response = await fetch(url.toString());

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Verificar si hay error en la respuesta
      if ((data as ApiErrorResponse).error) {
        throw new Error((data as ApiErrorResponse).message || 'Error desconocido');
      }

      return data as T;

    } catch (error) {
      console.error('Error en API:', error);
      throw error;
    }
  }

  /**
   * Obtiene la lista de hojas del spreadsheet
   */
  async getSheets(): Promise<Sheet[]> {
    return await this.callAPI<SheetsResponse>('getSheets');
  }

  /**
   * Obtiene los datos de un curso específico
   */
  async getCourseData(params: CourseDataParams): Promise<CourseDataResponse> {
    return await this.callAPI<CourseDataResponse>('getCourseData', params);
  }
}

// Exportar instancia singleton
export const apiService = new ApiService();
