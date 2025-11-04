/**
 * Utilidades para manipulación del DOM
 */

import type { DOMElements } from '../types/ui.types';

/** Selecciona un elemento del DOM */
export const $ = <T extends HTMLElement = HTMLElement>(
  sel: string,
  ctx: Document | HTMLElement = document
): T | null => ctx.querySelector<T>(sel);

/** Selecciona todos los elementos que coinciden */
export const $$ = <T extends HTMLElement = HTMLElement>(
  sel: string,
  ctx: Document | HTMLElement = document
): T[] => [...ctx.querySelectorAll<T>(sel)];

/** Obtiene un elemento por su ID */
export const byId = <T extends HTMLElement = HTMLElement>(id: string): T | null =>
  document.getElementById(id) as T | null;

/** Escapa HTML para prevenir XSS */
export function escapeHtml(str: string | null | undefined): string {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}

/** Obtiene todos los elementos DOM necesarios */
export function getDOMElements(): DOMElements {
  const get = <T extends HTMLElement>(id: string): T => {
    const el = byId<T>(id);
    if (!el) throw new Error(`Element #${id} not found`);
    return el;
  };

  const getOptional = <T extends HTMLElement>(id: string): T | undefined => {
    return byId<T>(id) || undefined;
  };

  return {
    // Header
    menuToggle: get<HTMLButtonElement>('menuToggle'),
    courseSelect: get<HTMLSelectElement>('courseSelect'),
    btnRefresh: get<HTMLButtonElement>('btnRefresh'),
    btnHome: get<HTMLAnchorElement>('btnHome'),

    // Sidebar
    sidebar: get<HTMLElement>('sidebar'),
    sidebarOverlay: get<HTMLElement>('sidebarOverlay'),
    sidebarToggle: get<HTMLButtonElement>('sidebarToggle'),
    searchInput: get<HTMLInputElement>('searchInput'),
    courseTitle: get<HTMLElement>('courseTitle'),
    progressFill: get<HTMLElement>('progressFill'),
    navContainer: get<HTMLElement>('navContainer'),

    // Main content
    contentTitle: get<HTMLElement>('contentTitle'),
    contentIcon: get<HTMLElement>('contentIcon'),
    contentBreadcrumb: get<HTMLElement>('contentBreadcrumb'),
    player: get<HTMLElement>('player'),

    // Navigation
    prevBtn: get<HTMLButtonElement>('prevBtn'),
    nextBtn: get<HTMLButtonElement>('nextBtn'),
    navInfo: get<HTMLElement>('navInfo'),

    // Mobile navigation (optional)
    mobileMenuBtn: getOptional<HTMLButtonElement>('mobileMenuBtn'),
    mobilePrevBtn: getOptional<HTMLButtonElement>('mobilePrevBtn'),
    mobileNextBtn: getOptional<HTMLButtonElement>('mobileNextBtn'),
    mobileHomeBtn: getOptional<HTMLButtonElement>('mobileHomeBtn'),
    mobileRefreshBtn: getOptional<HTMLButtonElement>('mobileRefreshBtn'),
    resourceCounter: getOptional<HTMLElement>('resourceCounter'),

    // Toast
    toast: get<HTMLElement>('toast')
  };
}
