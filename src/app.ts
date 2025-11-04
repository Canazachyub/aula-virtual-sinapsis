/**
 * Aplicación Principal
 * Coordina todos los componentes y maneja la lógica de negocio
 */

import type { AppState } from './types/state.types';
import type { CourseItem } from './types/api.types';
import type { DOMElements } from './types/ui.types';

import { apiService } from './services/api.service';
import { Sidebar } from './components/sidebar';
import { Player } from './components/player';
import { Navigation } from './components/navigation';

import { getDOMElements, escapeHtml } from './utils/dom.utils';
import { detectDevice, vibrate } from './utils/device.utils';
import { debounce, showToast, naturalCompare, getFromStorage, saveToStorage } from './utils/helpers';

export class App {
  private state: AppState;
  private elements!: DOMElements;
  private sidebar!: Sidebar;
  private player!: Player;
  private navigation!: Navigation;

  constructor() {
    // Inicializar estado
    this.state = {
      sheets: [],
      currentSheet: null,
      items: [],
      grouped: new Map(),
      flat: [],
      activeId: null,
      sidebarOpen: false,
      sidebarCollapsed: false,
      isMobile: false,
      isTablet: false
    };
  }

  /**
   * Inicializa la aplicación
   */
  async init(): Promise<void> {
    try {
      // Obtener elementos del DOM
      this.elements = getDOMElements();

      // Detectar dispositivo
      this.updateDeviceInfo();

      // Inicializar componentes
      this.sidebar = new Sidebar(
        this.elements.navContainer,
        this.elements.searchInput,
        this.elements.progressFill
      );

      this.player = new Player(
        this.elements.player,
        this.elements.contentTitle,
        this.elements.contentIcon,
        this.elements.contentBreadcrumb
      );

      this.navigation = new Navigation(this.elements);

      // Configurar event listeners
      this.setupEventListeners();

      // Cargar sidebar colapsado si está guardado
      if (!this.state.isMobile) {
        const savedCollapsed = getFromStorage('sidebarCollapsed', false);
        if (savedCollapsed) {
          this.state.sidebarCollapsed = true;
          this.elements.sidebar.classList.add('collapsed');
        }
      }

      // Configurar gestos táctiles en móvil
      if (this.state.isMobile) {
        this.setupTouchGestures();
      }

      // Cargar cursos
      await this.loadSheets();

    } catch (error) {
      console.error('Error initializing app:', error);
      showToast(this.elements.toast, 'Error al inicializar la aplicación');
    }
  }

  /**
   * Actualiza información del dispositivo
   */
  private updateDeviceInfo(): void {
    const device = detectDevice();
    this.state.isMobile = device.isMobile;
    this.state.isTablet = device.isTablet;
  }

  /**
   * Configura todos los event listeners
   */
  private setupEventListeners(): void {
    // Sidebar
    this.elements.menuToggle.addEventListener('click', () => this.toggleSidebar());
    this.elements.sidebarOverlay.addEventListener('click', () => this.toggleSidebar());

    if (this.elements.sidebarToggle) {
      this.elements.sidebarToggle.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.toggleSidebarCollapse();
      });
    }

    if (this.elements.mobileMenuBtn) {
      this.elements.mobileMenuBtn.addEventListener('click', () => {
        this.toggleSidebar();
        vibrate([10]);
      });
    }

    // Course select
    this.elements.courseSelect.addEventListener('change', (e) => {
      const select = e.target as HTMLSelectElement;
      if (select.value) {
        this.loadCourse(select.value);
        this.closeSidebarIfMobile();
      }
    });

    // Search
    const debouncedSearch = debounce(() => this.handleSearch(), 300);
    this.sidebar.onSearch(debouncedSearch);

    // Agregar listener para tamaño de fuente en móvil (evita zoom)
    this.elements.searchInput.addEventListener('focus', (e) => {
      if (this.state.isMobile) {
        (e.target as HTMLInputElement).style.fontSize = '16px';
      }
    });

    // Sidebar items
    this.sidebar.onItemClick((id) => this.selectItem(id));

    // Navigation
    this.navigation.onNavigate((direction) => this.navigate(direction));
    this.navigation.onHome(() => this.goToFirstItem());
    this.navigation.onRefresh(() => this.refreshData());

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => this.handleKeyboard(e));

    // Window resize
    window.addEventListener('resize', debounce(() => this.handleResize(), 250));
  }

  /**
   * Configura gestos táctiles para móvil
   */
  private setupTouchGestures(): void {
    let touchStartX = 0;
    let touchEndX = 0;
    const threshold = 50;

    document.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    document.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      this.handleSwipe(touchStartX, touchEndX, threshold);
    }, { passive: true });
  }

  /**
   * Maneja gestos de swipe
   */
  private handleSwipe(startX: number, endX: number, threshold: number): void {
    const diff = endX - startX;

    if (Math.abs(diff) > threshold) {
      if (diff > 0) {
        // Swipe right
        if (startX < 30 && !this.state.sidebarOpen) {
          this.toggleSidebar();
        } else if (!this.state.sidebarOpen && this.state.flat.length > 0) {
          this.navigate(-1);
        }
      } else {
        // Swipe left
        if (this.state.sidebarOpen) {
          this.toggleSidebar();
        } else if (this.state.flat.length > 0) {
          this.navigate(1);
        }
      }
      vibrate([5]);
    }
  }

  /**
   * Maneja atajos de teclado
   */
  private handleKeyboard(e: KeyboardEvent): void {
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'SELECT') return;

    switch (e.key) {
      case 'ArrowLeft':
        this.navigate(-1);
        break;
      case 'ArrowRight':
        this.navigate(1);
        break;
      case 'Escape':
        if (this.state.sidebarOpen) this.toggleSidebar();
        break;
      case 'b':
      case 'B':
        if (!this.state.isMobile && e.ctrlKey) {
          e.preventDefault();
          this.toggleSidebarCollapse();
        }
        break;
    }
  }

  /**
   * Maneja resize de ventana
   */
  private handleResize(): void {
    const wasMobile = this.state.isMobile;
    this.updateDeviceInfo();

    if (wasMobile !== this.state.isMobile) {
      if (!this.state.isMobile && this.state.sidebarOpen) {
        this.elements.sidebar.classList.remove('active');
        this.elements.sidebarOverlay.classList.remove('active');
        document.body.classList.remove('no-scroll');
        this.state.sidebarOpen = false;
      }
    }
  }

  /**
   * Toggle sidebar móvil
   */
  private toggleSidebar(): void {
    this.state.sidebarOpen = !this.state.sidebarOpen;
    this.elements.sidebar.classList.toggle('active', this.state.sidebarOpen);
    this.elements.sidebarOverlay.classList.toggle('active', this.state.sidebarOpen);

    if (this.state.isMobile) {
      if (this.state.sidebarOpen) {
        document.body.classList.add('no-scroll');
        vibrate([10]);
      } else {
        document.body.classList.remove('no-scroll');
      }
    }
  }

  /**
   * Toggle sidebar colapsado (desktop)
   */
  private toggleSidebarCollapse(): void {
    this.state.sidebarCollapsed = !this.state.sidebarCollapsed;

    if (this.state.sidebarCollapsed) {
      this.elements.sidebar.classList.add('collapsed');
    } else {
      this.elements.sidebar.classList.remove('collapsed');
    }

    saveToStorage('sidebarCollapsed', this.state.sidebarCollapsed);

    if (this.elements.sidebarToggle) {
      const title = this.state.sidebarCollapsed ? 'Expandir menú' : 'Minimizar menú';
      this.elements.sidebarToggle.title = title;
      this.elements.sidebarToggle.setAttribute('aria-label', title);
    }
  }

  /**
   * Cierra el sidebar si es móvil
   */
  private closeSidebarIfMobile(): void {
    if (this.state.isMobile && this.state.sidebarOpen) {
      this.toggleSidebar();
    }
  }

  /**
   * Carga la lista de hojas del spreadsheet
   */
  private async loadSheets(): Promise<void> {
    try {
      const sheets = await apiService.getSheets();
      this.state.sheets = sheets || [];

      // Poblar select
      this.elements.courseSelect.innerHTML =
        '<option value="">Seleccionar...</option>' +
        this.state.sheets.map(s =>
          `<option value="${escapeHtml(s.name)}">${escapeHtml(s.name)}</option>`
        ).join('');

      // Cargar primera hoja automáticamente
      const firstSheet = this.state.sheets[0]?.name;
      if (firstSheet) {
        this.elements.courseSelect.value = firstSheet;
        await this.loadCourse(firstSheet);
      }
    } catch (error) {
      console.error('Error loading sheets:', error);
      showToast(this.elements.toast, 'Error al conectar con el servidor');
    }
  }

  /**
   * Carga los datos de un curso
   */
  private async loadCourse(sheetName: string): Promise<void> {
    // Resetear estado
    this.state.currentSheet = null;
    this.state.items = [];
    this.state.grouped.clear();
    this.state.flat = [];
    this.state.activeId = null;

    // Mostrar loading
    this.sidebar.renderLoading();
    this.player.renderLoading();

    this.state.currentSheet = sheetName;
    this.elements.courseTitle.textContent = sheetName;

    this.closeSidebarIfMobile();

    try {
      const data = await apiService.getCourseData({
        sheet: sheetName,
        sort: 'order',
        start: 0,
        limit: 5000
      });

      console.log(`Loaded ${data.items?.length || 0} items`);

      this.state.items = data.items || [];

      this.processAndRender();

      if (this.state.flat.length > 0) {
        this.selectItem(this.state.flat[0].id);

        if (this.state.isMobile) {
          showToast(this.elements.toast, `${this.state.flat.length} recursos cargados`);
        }
      } else {
        this.player.renderEmpty();
      }

    } catch (error: any) {
      console.error('Error loading course:', error);
      this.sidebar.renderError(error.message || 'Error desconocido');
      showToast(this.elements.toast, 'Error al cargar recursos');
    }
  }

  /**
   * Refresca los datos del curso actual
   */
  private refreshData(): void {
    if (this.state.currentSheet) {
      this.navigation.showRefreshAnimation();

      if (this.state.isMobile) {
        showToast(this.elements.toast, 'Actualizando...');
      }

      this.loadCourse(this.state.currentSheet);
    }
  }

  /**
   * Maneja la búsqueda
   */
  private handleSearch(): void {
    this.processAndRender();

    // Si el item activo no está en los resultados, seleccionar el primero
    if (this.state.activeId && !this.state.flat.find(x => x.id === this.state.activeId)) {
      if (this.state.flat.length > 0) {
        this.selectItem(this.state.flat[0].id);
      } else {
        this.player.renderEmpty();
      }
    }

    this.navigation.update(
      this.state.flat.findIndex(x => x.id === this.state.activeId),
      this.state.flat.length
    );
  }

  /**
   * Procesa y renderiza los datos
   */
  private processAndRender(): void {
    const query = this.elements.searchInput.value.trim().toLowerCase();

    // Filtrar items
    let filtered = this.state.items;
    if (query) {
      filtered = this.state.items.filter(item =>
        (item.name && item.name.toLowerCase().includes(query)) ||
        (item.folder && item.folder.toLowerCase().includes(query)) ||
        (item.subfolder && item.subfolder.toLowerCase().includes(query))
      );
    }

    // Agrupar por carpeta y subcarpeta
    const grouped = new Map<string, Map<string, CourseItem[]>>();
    filtered.forEach(item => {
      const folder = item.folder || 'General';
      const subfolder = item.subfolder || 'Recursos';

      if (!grouped.has(folder)) grouped.set(folder, new Map());
      if (!grouped.get(folder)!.has(subfolder)) grouped.get(folder)!.set(subfolder, []);
      grouped.get(folder)!.get(subfolder)!.push(item);
    });

    // Ordenar items dentro de cada subcarpeta
    grouped.forEach(subMap => {
      subMap.forEach(items => {
        items.sort((a, b) => {
          const orderA = Number.isFinite(+a.order) ? +a.order : Infinity;
          const orderB = Number.isFinite(+b.order) ? +b.order : Infinity;
          if (orderA !== orderB) return orderA - orderB;
          return naturalCompare(a.name, b.name);
        });
      });
    });

    this.state.grouped = grouped;

    // Crear lista plana en orden de visualización
    this.state.flat = [];
    const sortedFolders = [...grouped.keys()].sort(naturalCompare);
    sortedFolders.forEach(folder => {
      const subMap = grouped.get(folder)!;
      const sortedSubs = [...subMap.keys()].sort(naturalCompare);
      sortedSubs.forEach(sub => {
        this.state.flat.push(...(subMap.get(sub) || []));
      });
    });

    // Renderizar sidebar
    this.sidebar.render({
      grouped: this.state.grouped,
      activeId: this.state.activeId,
      isCollapsed: this.state.sidebarCollapsed
    });

    // Actualizar navegación
    const currentIndex = this.state.flat.findIndex(x => x.id === this.state.activeId);
    this.navigation.update(currentIndex, this.state.flat.length);
  }

  /**
   * Selecciona un item
   */
  private selectItem(id: string): void {
    const item = this.state.flat.find(x => x.id === id);
    if (!item) return;

    this.state.activeId = id;

    // Actualizar sidebar
    this.sidebar.setActiveItem(id);

    // Scroll al item activo (solo desktop)
    if (!this.state.isMobile) {
      this.sidebar.scrollToActive();
    }

    // Renderizar player
    this.player.render(item);

    // Actualizar navegación
    const currentIndex = this.state.flat.findIndex(x => x.id === this.state.activeId);
    this.navigation.update(currentIndex, this.state.flat.length);

    // Actualizar progress bar
    this.sidebar.updateProgress(currentIndex, this.state.flat.length);

    // Scroll to top en móvil
    if (this.state.isMobile) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Cerrar sidebar en móvil
    this.closeSidebarIfMobile();
  }

  /**
   * Navega al siguiente o anterior recurso
   */
  private navigate(direction: -1 | 1): void {
    const currentIndex = this.state.flat.findIndex(x => x.id === this.state.activeId);
    if (currentIndex === -1) return;

    const newIndex = currentIndex + direction;

    if (newIndex >= 0 && newIndex < this.state.flat.length) {
      this.selectItem(this.state.flat[newIndex].id);

      if (this.state.isMobile) {
        const position = `${newIndex + 1} de ${this.state.flat.length}`;
        showToast(this.elements.toast, position, 1500);
      }
    } else {
      // Llegamos al inicio o final
      if (this.state.isMobile) {
        vibrate([20, 50, 20]);
        if (direction > 0) {
          showToast(this.elements.toast, 'Último recurso', 1500);
        } else {
          showToast(this.elements.toast, 'Primer recurso', 1500);
        }
      }
    }
  }

  /**
   * Va al primer recurso
   */
  private goToFirstItem(): void {
    if (this.state.flat.length > 0) {
      this.selectItem(this.state.flat[0].id);
      if (this.state.isMobile) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        vibrate([10]);
      }
    }
  }
}
