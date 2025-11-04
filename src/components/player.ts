/**
 * Componente Player
 * Maneja la visualización de contenido (videos, PDFs, forms, etc.)
 */

import type { CourseItem } from '../types/api.types';
import { escapeHtml } from '../utils/dom.utils';
import { canEmbedUrl, getPlatformName, getPlatformIcon } from '../utils/helpers';

export class Player {
  constructor(
    private playerElement: HTMLElement,
    private contentTitle: HTMLElement,
    private contentIcon: HTMLElement,
    private contentBreadcrumb: HTMLElement
  ) {}

  /**
   * Renderiza un item en el player
   */
  render(item: CourseItem): void {
    // Actualizar header
    this.contentTitle.textContent = item.name || 'Sin nombre';
    this.contentIcon.className = `${item.icon || 'fas fa-play-circle'} content-icon`;

    // Actualizar breadcrumb
    const breadcrumb: string[] = [];
    if (item.folder) breadcrumb.push(item.folder);
    if (item.subfolder) breadcrumb.push(item.subfolder);

    this.contentBreadcrumb.innerHTML = breadcrumb.length > 0
      ? breadcrumb.map(escapeHtml).join(' › ')
      : 'Recurso principal';

    // Renderizar contenido
    const canEmbed = canEmbedUrl(item.url);

    if (canEmbed && item.embedUrl) {
      this.renderEmbedded(item);
    } else if (item.url) {
      this.renderExternal(item);
    } else {
      this.renderNoPreview();
    }
  }

  /**
   * Renderiza contenido embebido
   */
  private renderEmbedded(item: CourseItem): void {
    const iframe = document.createElement('iframe');
    iframe.allow = 'autoplay; clipboard-write; encrypted-media; picture-in-picture; fullscreen';
    iframe.referrerPolicy = 'strict-origin-when-cross-origin';
    iframe.allowFullscreen = true;
    iframe.src = item.embedUrl;
    iframe.title = item.name || 'Contenido embebido';
    iframe.loading = 'lazy';

    this.playerElement.innerHTML = '';
    this.playerElement.appendChild(iframe);
  }

  /**
   * Renderiza enlace externo
   */
  private renderExternal(item: CourseItem): void {
    const platformName = getPlatformName(item.url);
    const platformIcon = getPlatformIcon(item.url);

    this.playerElement.innerHTML = `
      <div class="player-empty">
        <i class="${platformIcon}" aria-hidden="true"></i>
        <h3>${escapeHtml(item.name)}</h3>
        <p>Este contenido se abre en una nueva ventana</p>
        <a href="${escapeHtml(item.url)}" target="_blank" rel="noopener">
          <span>Abrir ${platformName}</span>
          <i class="fas fa-external-link-alt"></i>
        </a>
      </div>
    `;
  }

  /**
   * Renderiza mensaje de "sin vista previa"
   */
  private renderNoPreview(): void {
    this.playerElement.innerHTML = `
      <div class="player-empty">
        <i class="fas fa-exclamation-circle" aria-hidden="true"></i>
        <p>No hay vista previa disponible</p>
      </div>
    `;
  }

  /**
   * Renderiza estado vacío inicial
   */
  renderEmpty(): void {
    this.contentTitle.textContent = 'Sin recursos disponibles';
    this.contentBreadcrumb.innerHTML = 'No hay recursos que coincidan';

    this.playerElement.innerHTML = `
      <div class="player-empty">
        <i class="fas fa-search" aria-hidden="true"></i>
        <p>No se encontraron recursos</p>
      </div>
    `;
  }

  /**
   * Renderiza estado de bienvenida
   */
  renderWelcome(): void {
    this.playerElement.innerHTML = `
      <div class="player-empty">
        <i class="fas fa-rocket" aria-hidden="true"></i>
        <h3>¡Comienza tu aprendizaje!</h3>
        <p>Selecciona un recurso del menú para empezar</p>
      </div>
    `;
  }

  /**
   * Renderiza estado de carga
   */
  renderLoading(): void {
    this.playerElement.innerHTML = `
      <div class="player-empty">
        <div class="loading-spinner" style="width: 36px; height: 36px; border-width: 4px;"></div>
        <p style="margin-top: 14px;">Cargando...</p>
      </div>
    `;
  }
}
