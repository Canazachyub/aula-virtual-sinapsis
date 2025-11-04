/**
 * Componente Navigation
 * Maneja los controles de navegación entre recursos
 */

import type { DOMElements } from '../types/ui.types';

export class Navigation {
  constructor(private elements: DOMElements) {}

  /**
   * Actualiza el estado de los botones de navegación
   */
  update(currentIndex: number, total: number): void {
    // Botones desktop
    this.elements.prevBtn.disabled = currentIndex <= 0;
    this.elements.nextBtn.disabled = currentIndex === -1 || currentIndex >= total - 1;

    // Botones móvil
    if (this.elements.mobilePrevBtn) {
      this.elements.mobilePrevBtn.disabled = currentIndex <= 0;
    }
    if (this.elements.mobileNextBtn) {
      this.elements.mobileNextBtn.disabled = currentIndex === -1 || currentIndex >= total - 1;
    }

    // Actualizar info de navegación
    if (currentIndex >= 0 && total > 0) {
      this.elements.navInfo.textContent = `${currentIndex + 1} de ${total}`;
    } else {
      this.elements.navInfo.textContent = '';
    }

    // Actualizar contador móvil
    if (this.elements.resourceCounter && total > 0) {
      this.elements.resourceCounter.textContent = total.toString();
      this.elements.resourceCounter.style.display = 'block';
    } else if (this.elements.resourceCounter) {
      this.elements.resourceCounter.style.display = 'none';
    }
  }

  /**
   * Agrega listeners a los botones de navegación
   */
  onNavigate(callback: (direction: -1 | 1) => void): void {
    // Desktop buttons
    this.elements.prevBtn.addEventListener('click', () => callback(-1));
    this.elements.nextBtn.addEventListener('click', () => callback(1));

    // Mobile buttons
    if (this.elements.mobilePrevBtn) {
      this.elements.mobilePrevBtn.addEventListener('click', () => callback(-1));
    }
    if (this.elements.mobileNextBtn) {
      this.elements.mobileNextBtn.addEventListener('click', () => callback(1));
    }
  }

  /**
   * Agrega listener al botón home
   */
  onHome(callback: () => void): void {
    this.elements.btnHome.addEventListener('click', (e) => {
      e.preventDefault();
      callback();
    });

    if (this.elements.mobileHomeBtn) {
      this.elements.mobileHomeBtn.addEventListener('click', callback);
    }
  }

  /**
   * Agrega listener al botón refresh
   */
  onRefresh(callback: () => void): void {
    this.elements.btnRefresh.addEventListener('click', callback);

    if (this.elements.mobileRefreshBtn) {
      this.elements.mobileRefreshBtn.addEventListener('click', callback);
    }
  }

  /**
   * Muestra animación de refresh
   */
  showRefreshAnimation(): void {
    const icon = this.elements.btnRefresh.querySelector('i');
    if (icon) {
      icon.className = 'fas fa-sync-alt fa-spin';
    }

    if (this.elements.mobileRefreshBtn) {
      const mobileIcon = this.elements.mobileRefreshBtn.querySelector('i');
      if (mobileIcon) {
        mobileIcon.className = 'fas fa-sync-alt fa-spin';
      }
    }

    setTimeout(() => {
      if (icon) icon.className = 'fas fa-sync-alt';
      if (this.elements.mobileRefreshBtn) {
        const mobileIcon = this.elements.mobileRefreshBtn.querySelector('i');
        if (mobileIcon) mobileIcon.className = 'fas fa-sync-alt';
      }
    }, 1000);
  }
}
