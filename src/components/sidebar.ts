/**
 * Componente Sidebar
 * Maneja la navegación lateral con búsqueda y lista de recursos
 */

import type { CourseItem } from '../types/api.types';
import type { SidebarRenderData } from '../types/ui.types';
import { escapeHtml, $$ } from '../utils/dom.utils';
import { naturalCompare } from '../utils/helpers';
import { vibrate } from '../utils/device.utils';

export class Sidebar {
  constructor(
    private navContainer: HTMLElement,
    private searchInput: HTMLInputElement,
    private progressFill: HTMLElement
  ) {}

  /**
   * Renderiza el sidebar con los items agrupados
   */
  render(data: SidebarRenderData): void {
    const { grouped, activeId } = data;

    if (grouped.size === 0) {
      this.renderEmpty();
      return;
    }

    this.navContainer.innerHTML = '';

    grouped.forEach((subMap, folder) => {
      const section = this.createSection(folder);

      const sortedSubfolders = [...subMap.keys()].sort(naturalCompare);

      sortedSubfolders.forEach(subfolder => {
        const items = subMap.get(subfolder) || [];
        const subSection = this.createSubSection(subfolder, items, activeId);
        section.appendChild(subSection);
      });

      this.navContainer.appendChild(section);
    });
  }

  /**
   * Renderiza estado vacío
   */
  private renderEmpty(): void {
    this.navContainer.innerHTML = `
      <div style="padding: 24px 16px; text-align: center;">
        <i class="fas fa-search" style="font-size: 36px; color: #cbd5e1; margin-bottom: 12px;"></i>
        <p style="color: #64748b; font-size: 13px;">No se encontraron recursos</p>
      </div>
    `;
  }

  /**
   * Renderiza estado de carga
   */
  renderLoading(): void {
    this.navContainer.innerHTML = `
      <div style="padding: 24px; text-align: center; color: #999;">
        <div class="loading-spinner"></div>
        <p style="margin-top: 14px; font-size: 14px; font-weight: 600;">Cargando recursos...</p>
      </div>
    `;
  }

  /**
   * Renderiza estado de error
   */
  renderError(message: string): void {
    this.navContainer.innerHTML = `
      <div style="padding: 20px; text-align: center; color: #ef4444;">
        <i class="fas fa-exclamation-circle" style="font-size: 40px; margin-bottom: 10px;"></i>
        <p style="font-size: 14px;">Error al cargar</p>
        <p style="font-size: 12px; margin-top: 8px; opacity: 0.8;">${escapeHtml(message)}</p>
      </div>
    `;
  }

  /**
   * Crea una sección (carpeta)
   */
  private createSection(folderName: string): HTMLDivElement {
    const section = document.createElement('div');
    section.className = 'course-section';

    const title = document.createElement('div');
    title.className = 'section-title';
    title.textContent = folderName;

    section.appendChild(title);
    return section;
  }

  /**
   * Crea una subsección (subcarpeta)
   */
  private createSubSection(
    subfolderName: string,
    items: CourseItem[],
    activeId: string | null
  ): HTMLDivElement {
    const subSection = document.createElement('div');
    subSection.className = 'sub-section';

    const subTitle = document.createElement('div');
    subTitle.className = 'sub-title';
    subTitle.textContent = subfolderName;
    subSection.appendChild(subTitle);

    const list = document.createElement('ul');
    list.className = 'lesson-list';

    items.forEach(item => {
      const li = this.createLessonItem(item, activeId);
      list.appendChild(li);
    });

    subSection.appendChild(list);
    return subSection;
  }

  /**
   * Crea un item de lección
   */
  private createLessonItem(
    item: CourseItem,
    activeId: string | null
  ): HTMLLIElement {
    const li = document.createElement('li');
    li.className = 'lesson-item';
    li.dataset.id = item.id;

    if (item.id === activeId) {
      li.classList.add('active');
    }

    const link = document.createElement('a');
    link.href = '#';
    link.setAttribute('data-tooltip', item.name || 'Sin nombre');
    link.innerHTML = `
      <span class="lesson-icon">
        <i class="${escapeHtml(item.icon || 'fas fa-file')}"></i>
      </span>
      <span class="lesson-name">${escapeHtml(item.name || 'Sin nombre')}</span>
    `;

    li.appendChild(link);
    return li;
  }

  /**
   * Marca un item como activo
   */
  setActiveItem(id: string): void {
    $$<HTMLElement>('.lesson-item', this.navContainer).forEach(el => {
      el.classList.toggle('active', el.dataset.id === id);
    });
  }

  /**
   * Actualiza la barra de progreso
   */
  updateProgress(currentIndex: number, total: number): void {
    if (total > 0 && currentIndex >= 0) {
      const percentage = ((currentIndex + 1) / total) * 100;
      this.progressFill.style.width = percentage + '%';
    } else {
      this.progressFill.style.width = '0%';
    }
  }

  /**
   * Agrega listener al buscador
   */
  onSearch(callback: (query: string) => void): void {
    this.searchInput.addEventListener('input', () => {
      callback(this.searchInput.value);
    });
  }

  /**
   * Agrega listener a los items
   */
  onItemClick(callback: (id: string) => void): void {
    this.navContainer.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a');

      if (link && link.closest('.lesson-item')) {
        e.preventDefault();
        const item = link.closest('.lesson-item') as HTMLElement;
        const id = item.dataset.id;

        if (id) {
          callback(id);
          vibrate([5]);
        }
      }
    });
  }

  /**
   * Scroll al item activo
   */
  scrollToActive(): void {
    const activeElement = this.navContainer.querySelector('.lesson-item.active');
    if (activeElement) {
      activeElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }
}
