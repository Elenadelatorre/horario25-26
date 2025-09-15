const API_URL = 'http://localhost:4000/api/horario';
const tableBody = document.querySelector('#horario tbody');
const diasOrden = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

// Horario fijo
const horarioFijo = {
  Lunes: [{ inicio: '15:30', fin: '20:30', clase: 'Pádel' }],
  Martes: [
    { inicio: '11:30', fin: '12:30', clase: 'Funcional Training' },
    { inicio: '12:30', fin: '14:00', clase: 'Sala Cardio' },
    { inicio: '14:00', fin: '14:30', clase: 'Descanso' },
    { inicio: '14:30', fin: '15:30', clase: 'Sala Cardio' },
    { inicio: '15:30', fin: '20:30', clase: 'Pádel' }
  ],
  Miércoles: [{ inicio: '15:30', fin: '20:30', clase: 'Pádel' }],
  Jueves: [
    { inicio: '11:30', fin: '12:30', clase: 'Funcional Training' },
    { inicio: '12:30', fin: '14:00', clase: 'Sala Cardio' },
    { inicio: '14:00', fin: '14:30', clase: 'Descanso' },
    { inicio: '14:30', fin: '15:30', clase: 'Sala Cardio' },
    { inicio: '15:30', fin: '20:30', clase: 'Pádel' }
  ],
  Viernes: [{ inicio: '08:30', fin: '13:30', clase: 'Sala Cardio' }]
};

// Generar horas cada 30 minutos
function generarHorasMediaHora(inicio = '08:30', fin = '21:30') {
  const horas = [];
  let [h, m] = inicio.split(':').map(Number);
  const [hFin, mFin] = fin.split(':').map(Number);

  while (h < hFin || (h === hFin && m <= mFin)) {
    let horaInicio = `${h.toString().padStart(2, '0')}:${m
      .toString()
      .padStart(2, '0')}`;
    m += 30;
    if (m >= 60) {
      m -= 60;
      h += 1;
    }
    let horaFin = `${h.toString().padStart(2, '0')}:${m
      .toString()
      .padStart(2, '0')}`;
    horas.push({
      inicio: horaInicio,
      fin: horaFin,
      label: `${horaInicio} - ${horaFin}`
    });
  }
  return horas;
}

const horasTotales = generarHorasMediaHora();
let semanaOffset = 0;
let diaIndexMovil = null; // null = vista semana; 0..4 = vista día en móvil
const viernesTurnos = [
  { id: 1, inicio: '08:30', fin: '13:30', label: '08:30 - 13:30' },
  { id: 2, inicio: '12:30', fin: '17:30', label: '12:30 - 17:30' },
  { id: 3, inicio: '15:00', fin: '20:00', label: '15:00 - 20:00' },
  { id: 4, inicio: '16:30', fin: '21:30', label: '16:30 - 21:30' }
];
// Turno seleccionado de viernes por semana
const viernesRotativo = {}; // { semanaOffset: turnoId }

// Días bloqueados por semana (VACACIONES/AAPP)
const diasBloqueados = {}; // { [semanaOffset]: { [diaNombre]: 'VACACIONES'|'AAPP' } }

// Colores para Pádel por día
const padelColorPorDia = {
  Lunes: '#f8bbd0',       // rosa claro
  Martes: '#f48fb1',      // rosa medio
  Miércoles: '#f06292',   // rosa fuerte
  Jueves: '#ec407a',      // rosa intenso
  Viernes: '#ff80ab'      // rosa vivo
};

// Propietario de cada fila por día (para gestionar rowSpan y uniones)
const dayCellOwner = {
  Lunes: [],
  Martes: [],
  Miércoles: [],
  Jueves: [],
  Viernes: []
};

function aplicarColorPorPalabraClave(td) {
  const clasesColor = ['color-funcional', 'color-gap', 'color-pilates', 'color-salacardio'];
  td.classList.remove(...clasesColor);
  const titulo = td.querySelector('.titulo-fijo')?.textContent || '';
  const nota = td.querySelector('.anotacion')?.textContent || '';
  const texto = `${titulo} ${nota}`.toLowerCase();

  // Bloqueo por VACACIONES/AAPP
  if (texto.includes('vacaciones') || texto.includes('aapp')) {
    td.style.backgroundColor = texto.includes('vacaciones') ? '#d7ccc8' : '#bcaaa4';
    return;
  }

  // Coincidir con clases fijas y aplicar MISMO color
  if (texto.includes('pádel') || texto.includes('padel')) {
    td.style.backgroundColor = '#f8bbd0';
    return;
  }
  if (texto.includes('sala cardio')) {
    td.style.backgroundColor = '#bbdefb';
    return;
  }
  if (texto.includes('funcional')) {
    td.style.backgroundColor = '#c8e6c9';
    return;
  }
  if (texto.includes('descanso')) {
    td.style.backgroundColor = '#e0e0e0';
    return;
  }

  // Palabras personalizadas
  if (texto.includes('gap')) {
    td.classList.add('color-gap');
    return;
  }
  if (texto.includes('pilates')) {
    td.classList.add('color-pilates');
    return;
  }

  // Si no coincide con nada personalizado, no forzamos color
}

// Guardar anotaciones y nuevas clases por semana
const semanas = {}; // {0: { 'titulo1': 'nota1', ... }}
const nuevasClases = {}; // {0: [ {dia:'Lunes', inicio:'09:00', titulo:'Clase nueva'} ]}

// Guardado automático
const CACHE_KEY = 'horario_cache_v1';
function saveCache() {
  try {
    const payload = {
      semanas,
      nuevasClases,
      viernesRotativo,
      diasBloqueados
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
  } catch (_) { }
}
function loadCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (_) {
    return null;
  }
}

async function guardarCelda(td) {
  const titulo = td.querySelector('.titulo-fijo')?.textContent || '';
  const nota = td.querySelector('.anotacion')?.textContent || '';

  if (!semanas[semanaOffset]) semanas[semanaOffset] = {};
  semanas[semanaOffset][titulo || 'sin-titulo'] = nota;

  try {
    await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        usuario: 'elena',
        semanas: { [semanaOffset]: semanas[semanaOffset] || {} },
        nuevasClases: { [semanaOffset]: nuevasClases[semanaOffset] || [] },
        viernesRotativo: { [semanaOffset]: viernesRotativo[semanaOffset] || null },
        diasBloqueados: { [semanaOffset]: diasBloqueados[semanaOffset] || {} }
      })
    });
    saveCache();
  } catch (e) {
    console.error('Error guardando:', e);
    // Guardamos en cache local aunque falle backend
    saveCache();
  }
}

// Guardar toda la semana actual (usado tras borrar)
async function guardarSemanaCompleta() {
  try {
    await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        usuario: 'elena',
        semanas: { [semanaOffset]: semanas[semanaOffset] || {} },
        nuevasClases: { [semanaOffset]: nuevasClases[semanaOffset] || [] },
        viernesRotativo: { [semanaOffset]: viernesRotativo[semanaOffset] || null },
        diasBloqueados: { [semanaOffset]: diasBloqueados[semanaOffset] || {} }
      })
    });
    saveCache();
  } catch (e) {
    console.error('Error guardando semana completa:', e);
    saveCache();
  }
}

// Obtener lunes de la semana según offset
function getLunesSemana(offset = 0) {
  const hoy = new Date();
  const dia = hoy.getDay(); // 0 = domingo, 1 = lunes, ...
  const diff = (dia === 0 ? -6 : 1 - dia) + offset * 7;
  const lunes = new Date(hoy);
  lunes.setDate(hoy.getDate() + diff);
  return lunes;
}

// Construir cabecera con días de la semana y fechas
function construirCabecera() {
  const theadRow = document.querySelector('#horario thead tr');
  if (!theadRow) return;
  theadRow.innerHTML = '';

  const thHora = document.createElement('th');
  thHora.textContent = 'Hora';
  theadRow.appendChild(thHora);

  const lunes = getLunesSemana(semanaOffset);
  const hoy = new Date();
  diasOrden.forEach((diaNombre, i) => {
    const fecha = new Date(lunes);
    fecha.setDate(lunes.getDate() + i);
    const th = document.createElement('th');
    const diaNumero = fecha.getDate();
    const bloqueo = (diasBloqueados[semanaOffset] || {})[diaNombre];
    const diaTexto = `${diaNombre.toLowerCase()} ${String(diaNumero).padStart(2, '0')}`;
    if (diaNombre === 'Viernes') {
      const turnoId = viernesRotativo[semanaOffset] || 1;
      const turnoLabel = viernesTurnos.find((t) => t.id === turnoId)?.label || '';
      th.innerHTML = `<div style="display:flex;justify-content:center;align-items:center;gap:6px;">
          <span>${diaTexto}</span>
          <button aria-label="Configurar viernes" title="Configurar viernes" style="padding:2px 6px;font-size:14px;line-height:1;border-radius:6px;">⚙️</button>
          ${bloqueo ? `<span style="font-size:12px;padding:2px 6px;border-radius:6px;background:${bloqueo === 'vacaciones' ? '#d7ccc8' : '#bcaaa4'};color:#4e342e;">${bloqueo.toUpperCase()}</span>
          <button aria-label="Quitar bloqueo" title="Quitar bloqueo" style="padding:2px 6px;font-size:12px;line-height:1;border-radius:6px;">✖</button>` : ''}
        </div>
        <div style="margin-top:4px;font-size:12px;color:#1b5e20;">${turnoLabel}</div>`;

      const btn = th.querySelector('button');
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        // Crear panel con opciones visibles
        let panel = th.querySelector('.turno-panel');
        if (panel) { panel.remove(); return; }
        panel = document.createElement('div');
        panel.className = 'turno-panel';
        panel.style.position = 'absolute';
        panel.style.marginTop = '6px';
        panel.style.background = '#ffffff';
        panel.style.border = '1px solid #ccc';
        panel.style.borderRadius = '8px';
        panel.style.padding = '8px';
        panel.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
        panel.style.zIndex = '20';
        viernesTurnos.forEach((t) => {
          const b = document.createElement('button');
          b.textContent = `${t.id} — ${t.label}`;
          b.style.display = 'block';
          b.style.width = '100%';
          b.style.margin = '4px 0';
          b.style.fontSize = '13px';
          b.onclick = async () => {
            viernesRotativo[semanaOffset] = t.id;
            try {
              await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  usuario: 'elena',
                  semana: semanaOffset,
                  viernesRotativo: { [semanaOffset]: t.id }
                })
              });
            } catch (err) {
              console.error('Error guardando turno de viernes:', err);
            }
            tableBody.innerHTML = '';
            construirCabecera();
            generarTabla();
          };
          panel.appendChild(b);
        });
        th.appendChild(panel);
        const close = (ev) => {
          if (!panel.contains(ev.target) && ev.target !== btn) {
            panel.remove();
            document.removeEventListener('click', close);
          }
        };
        setTimeout(() => document.addEventListener('click', close), 0);
      });
      // Quitar bloqueo si existe
      if (bloqueo) {
        const btnClear = th.querySelector('button[aria-label="Quitar bloqueo"]');
        btnClear?.addEventListener('click', async (e) => {
          e.stopPropagation();
          if (diasBloqueados[semanaOffset]) {
            delete diasBloqueados[semanaOffset][diaNombre];
          }
          await guardarSemanaCompleta();
          tableBody.innerHTML = '';
          generarTabla();
        });
      }
    } else {
      th.innerHTML = `<div style="display:flex;justify-content:center;align-items:center;gap:6px;">
          <span>${diaTexto}</span>
          ${bloqueo ? `<span style=\"font-size:12px;padding:2px 6px;border-radius:6px;background:${bloqueo === 'vacaciones' ? '#d7ccc8' : '#bcaaa4'};color:#4e342e;\">${bloqueo.toUpperCase()}</span>
          <button aria-label=\"Quitar bloqueo\" title=\"Quitar bloqueo\" style=\"padding:2px 6px;font-size:12px;line-height:1;border-radius:6px;\">✖</button>` : ''}
        </div>`;
      if (bloqueo) {
        const btnClear = th.querySelector('button[aria-label="Quitar bloqueo"]');
        btnClear?.addEventListener('click', async (e) => {
          e.stopPropagation();
          if (diasBloqueados[semanaOffset]) {
            delete diasBloqueados[semanaOffset][diaNombre];
          }
          await guardarSemanaCompleta();
          tableBody.innerHTML = '';
          generarTabla();
        });
      }
    }
    if (hoy.toDateString() === fecha.toDateString()) {
      th.classList.add('col-hoy');
    }
    // En móvil con vista de día, solo mostrar el día seleccionado
    if (diaIndexMovil === null || diaIndexMovil === i) {
      theadRow.appendChild(th);
    }
  });
}

// Cargar semana actual
function cargarSemana() {
  tableBody.querySelectorAll('td').forEach((td) => {
    const anotacion = td.querySelector('.anotacion');
    if (!anotacion) return;

    const titulo = td.querySelector('.titulo-fijo')?.textContent || '';
    const key = titulo || 'sin-titulo';
    anotacion.textContent = semanas[semanaOffset]?.[key] || '';
    aplicarColorPorPalabraClave(td);
  });

  const lunes = getLunesSemana(semanaOffset);
  const domingo = new Date(lunes);
  domingo.setDate(lunes.getDate() + 6);

  const semanaLabel = document.getElementById('semanaLabel');
  semanaLabel.textContent = `Semana del ${lunes.toLocaleDateString()} al ${domingo.toLocaleDateString()}`;
}

function obtenerTextoClaveCelda(td) {
  const titulo = td.querySelector('.titulo-fijo')?.textContent?.trim();
  const anotacion = td.querySelector('.anotacion')?.textContent?.trim();
  const texto = (titulo && titulo.length > 0) ? titulo : (anotacion || '');
  return texto.toLowerCase();
}

// Unir celdas consecutivas de un mismo día cuando tienen el mismo contenido (título si hay, si no, anotación)
function agruparCeldasPorContenido(dia) {
  let prevOwner = null;
  let prevKey = '';
  for (let row = 0; row < horasTotales.length; row++) {
    const owner = dayCellOwner[dia][row];
    if (!owner) continue;
    const key = obtenerTextoClaveCelda(owner);
    if (!key) {
      prevOwner = null;
      prevKey = '';
      continue;
    }
    if (prevOwner && owner !== prevOwner && key === prevKey) {
      // Unir con el anterior
      const currentRowspan = Number(prevOwner.getAttribute('rowspan') || 1);
      prevOwner.setAttribute('rowspan', String(currentRowspan + 1));
      // Eliminar celda actual y actualizar mapa de propietarios
      owner.remove();
      dayCellOwner[dia][row] = prevOwner;
      // Mantener prevOwner y prevKey para seguir uniendo
    } else {
      prevOwner = owner;
      prevKey = key;
    }
  }
}

// Calcular rowspan
function calcularRowspan(clase) {
  const [hIni, mIni] = clase.inicio.split(':').map(Number);
  const [hFin, mFin] = clase.fin.split(':').map(Number);
  const inicioTotal = hIni * 60 + mIni;
  const finTotal = hFin * 60 + mFin;

  return (finTotal - inicioTotal) / 30;
}

// Generar tabla
function generarTabla() {
  // Asegurar cabecera actualizada para la semana
  construirCabecera();

  // Reiniciar propietarios
  diasOrden.forEach((d) => { dayCellOwner[d] = []; });

  const skipCells = {
    Lunes: {},
    Martes: {},
    Miércoles: {},
    Jueves: {},
    Viernes: {}
  };

  const horasPorDia = horasTotales.length;

  horasTotales.forEach((horaObj, rowIndex) => {
    const fila = document.createElement('tr');
    const tdHora = document.createElement('td');
    tdHora.classList.add('fijo');
    tdHora.textContent = horaObj.label;
    fila.appendChild(tdHora);

    const lunes = getLunesSemana(semanaOffset);
    const hoy = new Date();
    diasOrden.forEach((dia, diaIndex) => {
      // Día bloqueado: crear una sola celda al inicio y saltar el resto
      const bloqueo = (diasBloqueados[semanaOffset] || {})[dia];
      if (bloqueo && rowIndex === 0) {
        const td = document.createElement('td');
        dayCellOwner[dia][rowIndex] = td;
        const fechaDia = new Date(lunes);
        fechaDia.setDate(lunes.getDate() + diaIndex);
        if (hoy.toDateString() === fechaDia.toDateString()) td.classList.add('col-hoy');
        const span = document.createElement('span');
        span.classList.add('titulo-fijo');
        span.textContent = bloqueo === 'vacaciones' ? 'VACACIONES' : 'AAPP';
        span.style.color = '#4e342e';
        td.style.backgroundColor = bloqueo === 'vacaciones' ? '#d7ccc8' : '#bcaaa4';
        td.appendChild(span);
        td.rowSpan = horasPorDia;
        // Respetar vista móvil: sólo añadir la celda si estamos mostrando este día
        if (diaIndexMovil === null || diaIndexMovil === diaIndex) {
          fila.appendChild(td);
        }
        for (let i = 1; i < horasPorDia; i++) skipCells[dia][rowIndex + i] = true;
        return;
      }
      if (bloqueo && rowIndex > 0) {
        // Nada que renderizar en filas siguientes de este día
        return;
      }

      if (skipCells[dia][rowIndex]) return;
      const td = document.createElement('td');

      // Resaltar columna del día actual
      const fechaDia = new Date(lunes);
      fechaDia.setDate(lunes.getDate() + diaIndex);
      if (hoy.toDateString() === fechaDia.toDateString()) {
        td.classList.add('col-hoy');
      }

      // Registrar propietario por defecto
      dayCellOwner[dia][rowIndex] = td;

      // Clases fijas (excepto viernes o día bloqueado)
      const esViernes = dia === 'Viernes';
      const clasesDia = (bloqueo ? [] : (!esViernes ? horarioFijo[dia] : []));
      let claseObj = clasesDia?.find(
        (c) => horaObj.inicio >= c.inicio && horaObj.inicio < c.fin
      );
      if (
        claseObj &&
        horaObj.inicio === claseObj.inicio
      ) {
        const spanFijo = document.createElement('span');
        spanFijo.textContent = claseObj.clase;
        spanFijo.classList.add('titulo-fijo');

        switch (claseObj.clase) {
          case 'Pádel': {
            const color = padelColorPorDia[dia] || '#f8bbd0';
            td.style.backgroundColor = color;
            spanFijo.style.color = '#ad1457';
            break;
          }
          case 'Sala Cardio':
            td.style.backgroundColor = '#bbdefb';
            spanFijo.style.color = '#0d47a1';
            break;
          case 'Funcional Training':
            td.style.backgroundColor = '#c8e6c9';
            spanFijo.style.color = '#1b5e20';
            break;
          case 'Descanso':
            td.style.backgroundColor = '#e0e0e0';
            spanFijo.style.color = '#555';
            break;
          default:
            td.style.backgroundColor = '#e1bee7';
            spanFijo.style.color = '#4a148c';
        }

        td.appendChild(spanFijo);

        const rowspan = calcularRowspan(claseObj);
        if (rowspan > 1) {
          td.rowSpan = rowspan;
          for (let i = 1; i < rowspan; i++) {
            skipCells[dia][rowIndex + i] = true;
            dayCellOwner[dia][rowIndex + i] = td;
          }
        }
      }

      // Nuevas clases (si no está bloqueado)
      if (!bloqueo) {
        (nuevasClases[semanaOffset] || []).forEach((clase) => {
          if (clase.dia === dia && clase.inicio === horaObj.inicio) {
            const spanFijo = document.createElement('span');
            spanFijo.textContent = clase.titulo;
            spanFijo.classList.add('titulo-fijo');
            spanFijo.style.color = '#4a148c';
            spanFijo.style.fontWeight = 'bold';
            td.appendChild(spanFijo);
            td.style.backgroundColor = '#f3f8ff';

            const btnBorrarPrev = document.createElement('button');
            btnBorrarPrev.textContent = '❌';
            btnBorrarPrev.style.marginLeft = '5px';
            btnBorrarPrev.style.fontSize = '12px';
            btnBorrarPrev.style.cursor = 'pointer';
            btnBorrarPrev.addEventListener('click', async (e) => {
              e.stopPropagation();
              nuevasClases[semanaOffset] = (nuevasClases[semanaOffset] || []).filter(
                (c) => !(c.dia === dia && c.inicio === horaObj.inicio && c.titulo === clase.titulo)
              );
              if (semanas[semanaOffset] && semanas[semanaOffset][clase.titulo]) {
                delete semanas[semanaOffset][clase.titulo];
              }
              td.innerHTML = '';
              td.style.backgroundColor = '#ffffff';
              await guardarSemanaCompleta();
              tableBody.innerHTML = '';
              generarTabla();
            });
            td.insertBefore(btnBorrarPrev, spanFijo);
          }
        });
      }

      // Anotación editable (si no está bloqueado)
      const anotacion = document.createElement('div');
      anotacion.classList.add('anotacion');
      anotacion.contentEditable = 'true';
      td.appendChild(anotacion);

      anotacion.addEventListener('input', () => {
        // Detectar bloqueo
        const text = anotacion.textContent?.toLowerCase() || '';
        if (text.includes('vacaciones') || text.includes('aapp')) {
          if (!diasBloqueados[semanaOffset]) diasBloqueados[semanaOffset] = {};
          diasBloqueados[semanaOffset][dia] = text.includes('vacaciones') ? 'vacaciones' : 'aapp';
          // Limpiar cualquier nuevasClases del día bloqueado
          if (nuevasClases[semanaOffset]) {
            nuevasClases[semanaOffset] = nuevasClases[semanaOffset].filter((c) => c.dia !== dia);
          }
          // Persistir y regenerar inmediatamente
          guardarSemanaCompleta();
          tableBody.innerHTML = '';
          generarTabla();
          return;
        }
        aplicarColorPorPalabraClave(td);
        guardarCelda(td);
        agruparCeldasPorContenido(dia);
      });

      // Crear nuevas clases al click (si no está bloqueado)
      td.addEventListener('click', () => {
        if (!td.querySelector('.titulo-fijo')) {
          const inputTitulo = document.createElement('input');
          inputTitulo.type = 'text';
          inputTitulo.placeholder = 'Nuevo título';
          inputTitulo.classList.add('titulo-fijo');
          inputTitulo.style.color = '#4a148c';
          inputTitulo.style.fontWeight = 'bold';

          td.style.backgroundColor = '#f3f8ff';
          td.prepend(inputTitulo);

          const btnBorrar = document.createElement('button');
          btnBorrar.textContent = '❌';
          btnBorrar.style.marginLeft = '5px';
          btnBorrar.style.fontSize = '12px';
          btnBorrar.style.cursor = 'pointer';
          btnBorrar.addEventListener('click', async (e) => {
            e.stopPropagation();
            inputTitulo.remove();
            btnBorrar.remove();
            const existingTitle = td.querySelector('.titulo-fijo')?.textContent || '';
            if (existingTitle && semanas[semanaOffset]?.[existingTitle]) {
              delete semanas[semanaOffset][existingTitle];
            }
            nuevasClases[semanaOffset] = (nuevasClases[semanaOffset] || []).filter(
              (c) => !(c.dia === dia && c.inicio === horaObj.inicio)
            );
            td.style.backgroundColor = '#ffffff';
            const anotacionDiv = td.querySelector('.anotacion');
            if (anotacionDiv) anotacionDiv.textContent = '';
            await guardarSemanaCompleta();
            tableBody.innerHTML = '';
            generarTabla();
          });

          td.insertBefore(btnBorrar, anotacion);
          inputTitulo.focus();

          inputTitulo.addEventListener('blur', () => {
            if (inputTitulo.value.trim() !== '') {
              const tituloNuevo = inputTitulo.value.trim();
              const lower = tituloNuevo.toLowerCase();
              // Si el título es VACACIONES/AAPP, bloquear día completo
              if (lower.includes('vacaciones') || lower.includes('aapp')) {
                if (!diasBloqueados[semanaOffset]) diasBloqueados[semanaOffset] = {};
                diasBloqueados[semanaOffset][dia] = lower.includes('vacaciones') ? 'vacaciones' : 'aapp';
                // Persistir y regenerar inmediatamente
                guardarSemanaCompleta();
                tableBody.innerHTML = '';
                generarTabla();
                return;
              }
              if (!nuevasClases[semanaOffset]) nuevasClases[semanaOffset] = [];
              nuevasClases[semanaOffset].push({
                dia,
                inicio: horaObj.inicio,
                titulo: tituloNuevo
              });

              const spanFijo = document.createElement('span');
              spanFijo.textContent = tituloNuevo;
              spanFijo.classList.add('titulo-fijo');
              spanFijo.style.color = '#4a148c';
              spanFijo.style.fontWeight = 'bold';
              btnBorrar.after(spanFijo);

              inputTitulo.remove();
              aplicarColorPorPalabraClave(td);
            }
            guardarCelda(td);
            agruparCeldasPorContenido(dia);
          });
        }
      });

      // En móvil con vista de día, sólo renderizar el día seleccionado
      if (diaIndexMovil === null || diaIndexMovil === diaIndex) {
        fila.appendChild(td);
      }
    });

    tableBody.appendChild(fila);
  });

  cargarSemana();
  diasOrden.forEach((d) => agruparCeldasPorContenido(d));
}

// Cambiar semana
function cambiarSemana(offset) {
  semanaOffset += offset;
  tableBody.innerHTML = '';
  generarTabla();
}

// Ir a la semana actual
function irAHoy() {
  semanaOffset = 0;
  const hoy = new Date();
  let idx = hoy.getDay(); // 0 domingo ... 6 sábado
  if (idx === 0 || idx === 6) {
    idx = 0; // fuera de lunes-viernes, caer en lunes
  } else {
    idx = idx - 1; // mapear 1..5 a 0..4
  }
  if (window.matchMedia('(max-width: 768px)').matches) {
    diaIndexMovil = idx; // mostrar día actual en móvil
  } else {
    diaIndexMovil = null; // vista semana en escritorio
  }
  tableBody.innerHTML = '';
  generarTabla();
}

// Cargar datos persistidos al iniciar y luego generar la tabla
(async function init() {
  try {
    const res = await fetch(API_URL, { method: 'GET' });
    const data = await res.json();
    const hasData = data && (data.semanas || data.nuevasClases || data.viernesRotativo || data.diasBloqueados);
    if (hasData) {
      if (data?.semanas) Object.assign(semanas, data.semanas);
      if (data?.nuevasClases) Object.assign(nuevasClases, data.nuevasClases);
      if (data?.viernesRotativo) Object.assign(viernesRotativo, data.viernesRotativo);
      if (data?.diasBloqueados) Object.assign(diasBloqueados, data.diasBloqueados);
      saveCache();
    } else {
      const cache = loadCache();
      if (cache) {
        Object.assign(semanas, cache.semanas || {});
        Object.assign(nuevasClases, cache.nuevasClases || {});
        Object.assign(viernesRotativo, cache.viernesRotativo || {});
        Object.assign(diasBloqueados, cache.diasBloqueados || {});
      }
    }
  } catch (e) {
    const cache = loadCache();
    if (cache) {
      Object.assign(semanas, cache.semanas || {});
      Object.assign(nuevasClases, cache.nuevasClases || {});
      Object.assign(viernesRotativo, cache.viernesRotativo || {});
      Object.assign(diasBloqueados, cache.diasBloqueados || {});
    }
  }
  generarTabla();
  // Controles móvil
  const btnPrev = document.getElementById('btnPrevDia');
  const btnHoy = document.getElementById('btnHoy');
  const btnNext = document.getElementById('btnNextDia');
  const isMobile = window.matchMedia('(max-width: 768px)').matches;
  if (isMobile) {
    // Empezar mostrando el día de hoy
    const hoy = new Date();
    let idx = hoy.getDay();
    if (idx === 0 || idx === 6) idx = 0; else idx = idx - 1;
    diaIndexMovil = idx;
    tableBody.innerHTML = '';
    generarTabla();
  }
  if (btnPrev && btnNext && btnHoy) {
    btnPrev.onclick = () => {
      if (diaIndexMovil === null) diaIndexMovil = 0;
      if (diaIndexMovil > 0) {
        diaIndexMovil -= 1;
      } else {
        // ir a semana anterior, último día
        semanaOffset -= 1;
        diaIndexMovil = diasOrden.length - 1;
      }
      tableBody.innerHTML = '';
      generarTabla();
    };
    btnNext.onclick = () => {
      if (diaIndexMovil === null) diaIndexMovil = 0;
      if (diaIndexMovil < diasOrden.length - 1) {
        diaIndexMovil += 1;
      } else {
        // ir a semana siguiente, primer día
        semanaOffset += 1;
        diaIndexMovil = 0;
      }
      tableBody.innerHTML = '';
      generarTabla();
    };
    btnHoy.onclick = () => irAHoy();
  }
  // Cambiar modo al redimensionar
  window.addEventListener('resize', () => {
    const isNowMobile = window.matchMedia('(max-width: 768px)').matches;
    diaIndexMovil = isNowMobile ? (diaIndexMovil ?? 0) : null;
    tableBody.innerHTML = '';
    generarTabla();
  });
})();
