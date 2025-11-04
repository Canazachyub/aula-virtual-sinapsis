/**
 * Componente Player
 * Maneja la visualización de contenido (videos, PDFs, forms, etc.)
 */

import type { CourseItem } from '../types/api.types';
import { escapeHtml } from '../utils/dom.utils';
import { canEmbedUrl, getPlatformName, getPlatformIcon } from '../utils/helpers';

export class Player {
  private zoomLevel: number = 1;
  private currentIframe: HTMLIFrameElement | null = null;
  private controlsHideTimer: number | null = null;

  constructor(
    private playerElement: HTMLElement,
    private contentTitle: HTMLElement,
    private contentIcon: HTMLElement,
    private contentBreadcrumb: HTMLElement
  ) {
    this.setupFullscreenListener();
    this.setupControlsAutoHide();
  }

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
    // Detectar tipo de contenido
    const isPDF = item.mime === 'application/pdf' || item.type === 'pdf' || item.url.includes('.pdf');
    const isVideo = item.mime?.includes('video') || item.type === 'video' || item.url.includes('youtube.com') || item.url.includes('vimeo.com');
    const isForm = item.url.includes('forms.gle') || item.url.includes('forms.google.com');

    // Mejorar URL según tipo de contenido
    let enhancedUrl = item.embedUrl;

    if (isPDF && item.embedUrl.includes('drive.google.com')) {
      // Mejorar PDFs de Google Drive para permitir zoom
      enhancedUrl = item.embedUrl.includes('?')
        ? `${item.embedUrl}&embedded=true&rm=minimal`
        : `${item.embedUrl}?embedded=true&rm=minimal`;
    }

    const iframe = document.createElement('iframe');
    iframe.allow = 'autoplay; clipboard-write; encrypted-media; picture-in-picture; fullscreen';
    iframe.referrerPolicy = 'strict-origin-when-cross-origin';
    iframe.allowFullscreen = true;
    iframe.src = enhancedUrl;
    iframe.title = item.name || 'Contenido embebido';
    iframe.loading = 'lazy';

    // Agregar atributos específicos para PDFs
    if (isPDF) {
      iframe.setAttribute('scrolling', 'yes');
    }

    this.playerElement.innerHTML = '';
    this.playerElement.appendChild(iframe);
    this.currentIframe = iframe;

    // Agregar controles flotantes solo en móvil
    if (window.innerWidth <= 768) {
      this.addFloatingControls(isPDF, isVideo, isForm);
      this.showControlsInitially();
    }
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

  /**
   * Agrega controles flotantes de zoom y fullscreen
   */
  private addFloatingControls(isPDF: boolean, isVideo: boolean, isForm: boolean): void {
    // Crear contenedor de controles
    const controls = document.createElement('div');
    controls.className = 'player-controls';

    // Botón de fullscreen (siempre visible en móvil)
    const fullscreenBtn = document.createElement('button');
    fullscreenBtn.className = 'player-control-btn fullscreen';
    fullscreenBtn.innerHTML = '<i class="fas fa-expand"></i>';
    fullscreenBtn.setAttribute('aria-label', 'Pantalla completa');
    fullscreenBtn.addEventListener('click', () => this.toggleFullscreen());
    controls.appendChild(fullscreenBtn);

    // Botones de zoom solo para PDFs y contenido externo (no para videos ni forms)
    if (isPDF && !isVideo && !isForm) {
      const zoomInBtn = document.createElement('button');
      zoomInBtn.className = 'player-control-btn';
      zoomInBtn.innerHTML = '<i class="fas fa-plus"></i>';
      zoomInBtn.setAttribute('aria-label', 'Aumentar zoom');
      zoomInBtn.addEventListener('click', () => this.zoomIn());
      controls.appendChild(zoomInBtn);

      const zoomOutBtn = document.createElement('button');
      zoomOutBtn.className = 'player-control-btn';
      zoomOutBtn.innerHTML = '<i class="fas fa-minus"></i>';
      zoomOutBtn.setAttribute('aria-label', 'Reducir zoom');
      zoomOutBtn.addEventListener('click', () => this.zoomOut());
      controls.appendChild(zoomOutBtn);

      const zoomResetBtn = document.createElement('button');
      zoomResetBtn.className = 'player-control-btn';
      zoomResetBtn.innerHTML = '<i class="fas fa-undo"></i>';
      zoomResetBtn.setAttribute('aria-label', 'Restablecer zoom');
      zoomResetBtn.addEventListener('click', () => this.resetZoom());
      controls.appendChild(zoomResetBtn);
    }

    this.playerElement.appendChild(controls);
  }

  /**
   * Aumentar zoom
   */
  private zoomIn(): void {
    if (this.zoomLevel < 3) {
      this.zoomLevel += 0.25;
      this.applyZoom();
    }
  }

  /**
   * Reducir zoom
   */
  private zoomOut(): void {
    if (this.zoomLevel > 0.5) {
      this.zoomLevel -= 0.25;
      this.applyZoom();
    }
  }

  /**
   * Restablecer zoom
   */
  private resetZoom(): void {
    this.zoomLevel = 1;
    this.applyZoom();
  }

  /**
   * Aplicar zoom al iframe
   */
  private applyZoom(): void {
    if (this.currentIframe) {
      this.currentIframe.style.transform = `scale(${this.zoomLevel})`;
      this.currentIframe.style.transformOrigin = 'top left';
      this.currentIframe.style.width = `${100 / this.zoomLevel}%`;
      this.currentIframe.style.height = `${100 / this.zoomLevel}%`;
    }
  }

  /**
   * Activar/desactivar pantalla completa
   */
  private toggleFullscreen(): void {
    if (!document.fullscreenElement) {
      this.playerElement.requestFullscreen().catch((err) => {
        console.error('Error al activar pantalla completa:', err);
      });
    } else {
      document.exitFullscreen();
    }
  }

  /**
   * Configurar listener para cambios de fullscreen
   */
  private setupFullscreenListener(): void {
    document.addEventListener('fullscreenchange', () => {
      const fullscreenBtn = this.playerElement.querySelector('.fullscreen');
      if (fullscreenBtn) {
        const icon = fullscreenBtn.querySelector('i');
        if (icon) {
          icon.className = document.fullscreenElement ? 'fas fa-compress' : 'fas fa-expand';
        }
      }
    });
  }

  /**
   * Configurar auto-hide de controles
   */
  private setupControlsAutoHide(): void {
    // Mostrar controles al tocar/mover en el player
    this.playerElement.addEventListener('touchstart', () => this.showControls());
    this.playerElement.addEventListener('touchmove', () => this.showControls());
    this.playerElement.addEventListener('click', (e) => {
      // Solo mostrar si no se clickeó un botón de control
      const target = e.target as HTMLElement;
      if (!target.closest('.player-control-btn')) {
        this.showControls();
      }
    });
  }

  /**
   * Mostrar controles temporalmente
   */
  private showControls(): void {
    const controls = this.playerElement.querySelector('.player-controls');
    if (!controls || window.innerWidth > 768) return;

    // Mostrar controles
    controls.classList.add('visible');

    // Cancelar timer anterior
    if (this.controlsHideTimer) {
      window.clearTimeout(this.controlsHideTimer);
    }

    // Ocultar después de 3 segundos
    this.controlsHideTimer = window.setTimeout(() => {
      controls.classList.remove('visible');
    }, 3000);
  }

  /**
   * Mostrar controles inicialmente
   */
  private showControlsInitially(): void {
    if (window.innerWidth <= 768) {
      setTimeout(() => this.showControls(), 500);
    }
  }
}
