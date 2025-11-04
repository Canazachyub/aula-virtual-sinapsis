/**
 * Entry Point - Aula Virtual SINAPSIS PREU
 * Punto de entrada principal de la aplicación
 */

import { App } from './app';
import './styles/main.css';

// Inicializar aplicación cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

async function initApp() {
  try {
    const app = new App();
    await app.init();
    console.log('✅ Aula Virtual SINAPSIS PREU iniciada correctamente');
  } catch (error) {
    console.error('❌ Error al iniciar la aplicación:', error);
  }
}
