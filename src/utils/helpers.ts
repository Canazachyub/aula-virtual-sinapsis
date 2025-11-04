/**
 * Funciones de utilidad generales
 */

/** Crea una función debounced */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | undefined;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };

    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/** Comparación natural de strings (considera números) */
export function naturalCompare(a: string | null | undefined, b: string | null | undefined): number {
  const extractNum = (str: string | null | undefined): number => {
    const match = String(str || '').match(/\d+/);
    return match ? parseInt(match[0], 10) : Infinity;
  };

  const numA = extractNum(a);
  const numB = extractNum(b);

  if (numA !== numB) return numA - numB;

  return String(a || '').localeCompare(String(b || ''), 'es', { numeric: true });
}

/** Muestra un toast/notificación */
export function showToast(element: HTMLElement, message: string, duration = 3000): void {
  element.textContent = message;
  element.classList.add('show');

  setTimeout(() => {
    element.classList.remove('show');
  }, duration);
}

/** Guarda un valor en localStorage de forma segura */
export function saveToStorage(key: string, value: any): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn('Error saving to localStorage:', error);
  }
}

/** Obtiene un valor de localStorage de forma segura */
export function getFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.warn('Error reading from localStorage:', error);
    return defaultValue;
  }
}

/** Verifica si una URL puede ser embebida */
export function canEmbedUrl(url: string): boolean {
  const urlLower = String(url || '').toLowerCase();

  const embeddableDomains = [
    'drive.google.com/file/',
    'docs.google.com/forms',
    'forms.google.com',
    'wayground.com',
    'quizizz.com',
    'youtube.com',
    'youtu.be',
    'padlet.com',
    'genial.ly',
    'canva.com',
    'docs.google.com/presentation',
    'docs.google.com/document',
    'docs.google.com/spreadsheets'
  ];

  const isEmbeddable = embeddableDomains.some(domain => urlLower.includes(domain));

  // Kahoot no se puede embeber
  if (urlLower.includes('kahoot.com') || urlLower.includes('kahoot.it')) {
    return false;
  }

  return isEmbeddable;
}

/** Obtiene el nombre de la plataforma desde una URL */
export function getPlatformName(url: string): string {
  const urlLower = String(url || '').toLowerCase();

  if (urlLower.includes('kahoot')) return 'Kahoot!';
  if (urlLower.includes('wayground')) return 'Wayground';
  if (urlLower.includes('forms.google')) return 'Google Forms';
  if (urlLower.includes('quizizz')) return 'Quizizz';
  if (urlLower.includes('youtube')) return 'YouTube';
  if (urlLower.includes('drive.google')) return 'Google Drive';

  return 'este recurso';
}

/** Obtiene el icono de la plataforma desde una URL */
export function getPlatformIcon(url: string): string {
  const urlLower = String(url || '').toLowerCase();

  if (urlLower.includes('kahoot')) return 'fas fa-gamepad';
  if (urlLower.includes('wayground')) return 'fas fa-map';
  if (urlLower.includes('forms.google')) return 'fas fa-clipboard-list';
  if (urlLower.includes('quizizz')) return 'fas fa-question-circle';
  if (urlLower.includes('youtube')) return 'fab fa-youtube';

  return 'fas fa-external-link-alt';
}

/** Formatea un número con separadores de miles */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('es-ES').format(num);
}

/** Retrasa la ejecución */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
