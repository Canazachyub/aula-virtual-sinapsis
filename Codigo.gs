/******************************************************
 * SINAPSIS MED - API REST
 * Permite llamadas desde sitios web externos
 ******************************************************/

const SPREADSHEET_ID = '1DkmOqVSRxLPkRZ6ytNQA9HfhVmPndrp47Ts3Rzl21lU';

/**
 * Maneja las peticiones GET y las convierte en API REST
 * Parámetros esperados:
 *   - action: 'getSheets' | 'getCourseData'
 *   - sheet: nombre de la hoja (solo para getCourseData)
 *   - otros parámetros según la acción
 */
function doGet(e) {
  // Habilitar CORS para permitir llamadas desde otros dominios
  const output = ContentService.createTextOutput();
  output.setMimeType(ContentService.MimeType.JSON);
  
  try {
    // Obtener parámetros de la URL
    const params = e.parameter || {};
    const action = params.action || '';
    
    let result;
    
    // Enrutamiento según la acción solicitada
    switch(action) {
      case 'getSheets':
        result = getSheets();
        break;
        
      case 'getCourseData':
        // Construir objeto de petición desde los parámetros
        const req = {
          sheet: params.sheet || '',
          q: params.q || '',
          folder: params.folder || '',
          subfolder: params.subfolder || '',
          sort: params.sort || 'order',
          start: parseInt(params.start) || 0,
          limit: parseInt(params.limit) || 5000
        };
        result = getCourseData(req);
        break;
        
      default:
        result = {
          error: true,
          message: 'Acción no válida. Use: action=getSheets o action=getCourseData'
        };
    }
    
    // Devolver resultado como JSON
    output.setContent(JSON.stringify(result));
    
  } catch(error) {
    // Manejo de errores
    output.setContent(JSON.stringify({
      error: true,
      message: error.toString(),
      stack: error.stack
    }));
  }
  
  return output;
}

/**
 * Obtiene la lista de hojas del spreadsheet
 * @returns {Array} Array de objetos con nombre e id de cada hoja
 */
function getSheets() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    return ss.getSheets().map(s => ({ 
      name: s.getName(), 
      id: s.getSheetId() 
    }));
  } catch(error) {
    return {
      error: true,
      message: 'Error al obtener hojas: ' + error.toString()
    };
  }
}

/**
 * Obtiene los datos de un curso específico
 * @param {Object} req - Objeto con parámetros de la petición
 * @returns {Object} Objeto con total, items y metadatos
 */
function getCourseData(req) {
  try {
    // Log para debug
    console.log('Getting data for sheet:', req.sheet);
    
    // Obtener datos SOLO de la hoja solicitada
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sh = ss.getSheetByName(req.sheet);
    
    if (!sh) {
      return { 
        total: 0, 
        items: [],
        sheet: req.sheet,
        error: 'Sheet not found'
      };
    }

    // Leer datos de la hoja
    const data = sh.getDataRange().getValues();
    
    // Validar que hay datos
    if (data.length <= 1) {
      return { 
        total: 0, 
        items: [],
        sheet: req.sheet,
        message: 'No data in sheet'
      };
    }

    // Procesar encabezados
    const { map } = headerMap(data[0]);
    const rows = [];
    
    // Procesar cada fila (empezando desde 1 para saltar encabezados)
    for (let i = 1; i < data.length; i++) {
      const r = data[i];
      if (isEmpty(r)) continue;
      
      const obj = rowToObj(r, map, req.sheet, i);
      if (obj) rows.push(obj);
    }
    
    console.log(`Loaded ${rows.length} rows from ${req.sheet}`);
    
    // Aplicar filtros
    let result = rows;
    
    const q = (req.q || '').toString().trim().toLowerCase();
    if (q) {
      result = result.filter(o =>
        (o.nameLc && o.nameLc.includes(q)) ||
        (o.folderLc && o.folderLc.includes(q)) ||
        (o.subLc && o.subLc.includes(q))
      );
    }
    
    if (req.folder) result = result.filter(o => o.folder === req.folder);
    if (req.subfolder) result = result.filter(o => o.subfolder === req.subfolder);

    // Ordenamiento
    result.sort((a, b) =>
      (a.level - b.level) ||
      strCmp(a.folder, b.folder) ||
      strCmp(a.subfolder, b.subfolder) ||
      (a.order - b.order) ||
      strCmp(a.name, b.name)
    );

    // Paginación
    const total = result.length;
    const start = Math.max(0, req.start || 0);
    const end = Math.min(total, start + Math.max(1, req.limit || 5000));
    const items = result.slice(start, end).map(stripPrivate);

    return { 
      total, 
      items,
      sheet: req.sheet,
      timestamp: new Date().toISOString(),
      actualRowCount: data.length - 1
    };
    
  } catch(error) {
    return {
      error: true,
      message: 'Error en getCourseData: ' + error.toString(),
      sheet: req.sheet
    };
  }
}

/**
 * Elimina propiedades privadas del objeto
 */
function stripPrivate(o) {
  return {
    id: o.id,
    name: o.name,
    folder: o.folder,
    subfolder: o.subfolder,
    level: o.level,
    order: o.order,
    type: o.type,
    mime: o.mime,
    url: o.url,
    embedUrl: o.embedUrl,
    icon: o.icon
  };
}

/**
 * Mapea los encabezados de la hoja a índices
 */
function headerMap(headers) {
  const idx = Object.create(null);
  const norm = x => String(x || '').trim().toLowerCase();
  headers.forEach((h, i) => idx[norm(h)] = i);
  
  const getIdx = (keys) => {
    for (const k of keys) {
      if (k in idx) return idx[k];
    }
    return -1;
  };

  return {
    map: {
      hash: getIdx(['#', 'num', 'n°', 'no', 'numero', 'número']),
      level: getIdx(['nivel']),
      name: getIdx(['nombre', 'titulo', 'título']),
      fileId: getIdx(['id-archivo', 'id archivo', 'id']),
      mime: getIdx(['tipo', 'tipo archivo', 'content-type']),
      url: getIdx(['url-archivo', 'url', 'enlace', 'link']),
      folder: getIdx(['carpeta padre', 'carpeta', 'folder']),
      subfolder: getIdx(['subcarpeta', 'sub folder', 'sub-folder']),
      folderUrl: getIdx(['url-carpeta', 'url carpeta']),
      size: getIdx(['tamaño', 'tamano', 'size']),
      sizeFmt: getIdx(['tamaño formateado', 'tamano formateado', 'size formatted'])
    }
  };
}

/**
 * Convierte una fila en objeto
 */
function rowToObj(r, map, sheetName, rowIndex) {
  const get = (k) => map[k] !== -1 ? r[map[k]] : '';

  const name = safe(get('name'));
  const url = safe(get('url'));
  
  if (!name && !url) return null;

  const fileId = safe(get('fileId'));
  const mime = safe(get('mime'));
  const folder = safe(get('folder'));
  const subfolder = safe(get('subfolder'));

  const order = toInt(get('hash'), 999999);
  const level = toInt(get('level'), 9999);

  let type = 'link';
  let icon = 'fas fa-external-link-alt';
  let embedUrl = url;

  const urlLower = String(url || '').toLowerCase();

  // Wayground/Quizizz
  if (urlLower.includes('wayground.com') || urlLower.includes('quizizz.com')) {
    type = 'quiz';
    icon = 'fas fa-question-circle';
    embedUrl = url;
  }
  // Google Forms
  else if (urlLower.includes('docs.google.com/forms') || 
           urlLower.includes('forms.google.com') || 
           urlLower.includes('forms.gle')) {
    type = 'form';
    icon = 'fab fa-wpforms';
    embedUrl = url;
  }
  // YouTube
  else if (urlLower.includes('youtube.com') || urlLower.includes('youtu.be')) {
    type = 'youtube';
    icon = 'fab fa-youtube';
    let videoId = '';
    if (urlLower.includes('youtube.com/watch')) {
      const match = url.match(/[?&]v=([^&]+)/);
      if (match) videoId = match[1];
    } else if (urlLower.includes('youtu.be/')) {
      const match = url.match(/youtu\.be\/([^?]+)/);
      if (match) videoId = match[1];
    }
    embedUrl = videoId ? `https://www.youtube.com/embed/${videoId}` : url;
  }
  // Google Drive Files
  else if ((urlLower.includes('drive.google.com/file/') || 
            urlLower.includes('drive.google.com/open')) && fileId) {
    const idForPreview = fileId || extractDriveId(url);
    if (idForPreview) {
      type = mimeToType(mime, url);
      embedUrl = `https://drive.google.com/file/d/${encodeURIComponent(idForPreview)}/preview`;
      icon = typeToIcon(type);
    }
  }
  // Otros servicios de Google
  else if (urlLower.includes('docs.google.com/presentation')) {
    type = 'slides';
    icon = 'fas fa-file-powerpoint';
    if (!url.includes('/embed')) {
      embedUrl = url.replace('/edit', '/embed').replace('/view', '/embed');
    }
  }
  else if (urlLower.includes('docs.google.com/document')) {
    type = 'document';
    icon = 'fas fa-file-alt';
    if (!url.includes('/preview')) {
      embedUrl = url.replace('/edit', '/preview').replace('/view', '/preview');
    }
  }
  else if (urlLower.includes('docs.google.com/spreadsheets')) {
    type = 'spreadsheet';
    icon = 'fas fa-file-excel';
    if (!url.includes('?embedded=true')) {
      embedUrl = url + (url.includes('?') ? '&embedded=true' : '?embedded=true');
    }
  }

  const id = `${sheetName}_row${rowIndex}_${hash(name + url)}`;

  return {
    id,
    name,
    folder,
    subfolder,
    level,
    order,
    type,
    mime,
    url,
    embedUrl,
    icon,
    nameLc: name.toLowerCase(),
    folderLc: (folder || '').toLowerCase(),
    subLc: (subfolder || '').toLowerCase()
  };
}

// ============================================
// FUNCIONES DE UTILIDAD
// ============================================

function mimeToType(mime, url) {
  const m = String(mime || '').toLowerCase();
  if (m.startsWith('video/')) return 'video';
  if (m === 'application/pdf' || /\.pdf($|\?)/i.test(url || '')) return 'pdf';
  return 'link';
}

function extractDriveId(u) {
  if (!u) return '';
  let m = String(u).match(/\/file\/d\/([a-zA-Z0-9_-]{10,})/);
  if (!m) m = String(u).match(/[?&]id=([a-zA-Z0-9_-]{10,})/);
  return m ? m[1] : '';
}

function typeToIcon(type) {
  switch (String(type || '').toLowerCase()) {
    case 'video': return 'far fa-play-circle';
    case 'pdf': return 'far fa-file-pdf';
    default: return 'fas fa-external-link-alt';
  }
}

function isEmpty(arr) {
  return arr.every(v => v === null || v === undefined || String(v).trim() === '');
}

function safe(v) {
  return v == null ? '' : String(v);
}

function toInt(v, dflt) {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : dflt;
}

function hash(s) {
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) + h) + s.charCodeAt(i);
  }
  return (h >>> 0).toString(36);
}

function strCmp(a, b) {
  return String(a || '').localeCompare(String(b || ''));
}