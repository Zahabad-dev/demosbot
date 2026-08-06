import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../../lib/apiClient';

const HORARIO_PREGUNTA = 'Horario de citas disponibles';
const empty = { categoria: 'general', pregunta: '', respuesta: '', orden: 0, imagen_url: '' };
const LIMITE_SERVICIOS_ESTRELLA = 15;
const CATEGORIAS_SIN_LIMITE = ['general', 'horario'];

// Categorías válidas por tipo_funcion — deben coincidir EXACTO con lo que cada plantilla del
// sitio público filtra (ej. `categoria === 'servicios'` en AgendaInteractiva.jsx/MenuInteractivo.jsx),
// por eso ahora es un desplegable y no texto libre: un typo aquí (ej. "servicio" sin la s) hace
// que el item exista en la BD pero nunca se muestre en el sitio ni al bot.
const CATEGORIAS_POR_TIPO = {
  citas: [
    { value: 'general', label: 'General (políticas, ubicación, info...)' },
    { value: 'servicios', label: 'Servicios/productos (catálogo, cuenta para el límite de 15)' },
    { value: 'horario', label: 'Horario de citas disponibles (días y horas agendables)' },
  ],
  pedidos: [
    { value: 'general', label: 'General (horarios, políticas, info...)' },
    { value: 'entradas', label: 'Entradas' },
    { value: 'fuertes', label: 'Platos fuertes' },
    { value: 'bebidas', label: 'Bebidas y bar' },
    { value: 'postres', label: 'Postres' },
  ],
  ninguna: [
    { value: 'general', label: 'General (horarios, políticas, info...)' },
    { value: 'menu', label: 'Menú' },
    { value: 'precios', label: 'Precios' },
  ],
};

const DIAS_SEMANA = [
  { key: 'lunes', label: 'Lunes' },
  { key: 'martes', label: 'Martes' },
  { key: 'miercoles', label: 'Miércoles' },
  { key: 'jueves', label: 'Jueves' },
  { key: 'viernes', label: 'Viernes' },
  { key: 'sabado', label: 'Sábado' },
  { key: 'domingo', label: 'Domingo' },
];

// Si el valor actual no está en la lista oficial (ej. quedó de un typo viejo o de otra
// plantilla), lo agrega como opción aparte para que no desaparezca del selector — así el
// usuario puede verlo y corregirlo eligiendo la categoría correcta de la lista.
function opcionesCon(valorActual, base) {
  if (valorActual && !base.some((o) => o.value === valorActual)) {
    return [...base, { value: valorActual, label: `${valorActual} (no reconocida — corrígela)` }];
  }
  return base;
}

function parseHorario(respuesta) {
  try {
    const obj = JSON.parse(respuesta || '{}');
    return obj && typeof obj === 'object' ? obj : {};
  } catch {
    return {};
  }
}

// Editor de horario: 7 días, cada uno con un checkbox para activarlo y una lista de horarios
// libres que el cliente agrega/quita a mano (ej. "1:00 pm"). Se guarda como JSON dentro del
// campo `respuesta` de una sola fila de FAQ (categoria='horario') — reutiliza la tabla faq en
// vez de crear una tabla nueva. Un día sin horarios = no se puede agendar ese día.
function HorarioEditor({ value, onChange }) {
  const horario = parseHorario(value);
  const [nuevaHora, setNuevaHora] = useState({});

  const toggleDia = (dia) => {
    const copia = { ...horario };
    if (copia[dia]) delete copia[dia];
    else copia[dia] = [];
    onChange(JSON.stringify(copia));
  };

  const agregarHora = (dia) => {
    const hora = (nuevaHora[dia] || '').trim();
    if (!hora) return;
    onChange(JSON.stringify({ ...horario, [dia]: [...(horario[dia] || []), hora] }));
    setNuevaHora({ ...nuevaHora, [dia]: '' });
  };

  const quitarHora = (dia, i) => {
    onChange(JSON.stringify({ ...horario, [dia]: horario[dia].filter((_, idx) => idx !== i) }));
  };

  return (
    <div className="horario-editor">
      {DIAS_SEMANA.map(({ key, label }) => {
        const activo = Object.prototype.hasOwnProperty.call(horario, key);
        const horas = horario[key] || [];
        return (
          <div key={key} className="horario-dia-box">
            <label className="horario-dia-check">
              <input type="checkbox" checked={activo} onChange={() => toggleDia(key)} />
              {label}
            </label>
            {activo && (
              <>
                <div className="horario-chips">
                  {horas.map((h, i) => (
                    <span key={i} className="horario-chip">
                      {h}
                      <button type="button" onClick={() => quitarHora(key, i)}>×</button>
                    </span>
                  ))}
                  {horas.length === 0 && <span className="horario-vacio">Sin horarios — agrega al menos uno</span>}
                </div>
                <div className="horario-agregar">
                  <input
                    placeholder="ej. 1:00 pm"
                    value={nuevaHora[key] || ''}
                    onChange={(e) => setNuevaHora({ ...nuevaHora, [key]: e.target.value })}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); agregarHora(key); } }}
                  />
                  <button type="button" className="secondary" onClick={() => agregarHora(key)}>+ Agregar</button>
                </div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function FaqManager() {
  const { negocioId } = useParams();
  const [items, setItems] = useState([]);
  const [negocio, setNegocio] = useState(null);
  const [nuevo, setNuevo] = useState(empty);
  const [error, setError] = useState('');

  const load = () => api.get(`/admin/negocios/${negocioId}/faq`).then(setItems).catch((e) => setError(e.message));

  useEffect(() => { load(); }, [negocioId]);
  useEffect(() => { api.get(`/admin/negocios/${negocioId}`).then(setNegocio).catch(() => {}); }, [negocioId]);

  const categoriasBase = CATEGORIAS_POR_TIPO[negocio?.tipo_funcion] || CATEGORIAS_POR_TIPO.ninguna;
  const yaTieneHorario = items.some((it) => it.categoria === 'horario');
  // Solo tiene sentido una fila de horario por negocio — si ya existe, se oculta la opción del
  // formulario "Agregar nueva" (se edita la que ya está, no se crean varias).
  const categorias = yaTieneHorario ? categoriasBase.filter((o) => o.value !== 'horario') : categoriasBase;

  const onChange = (id, field, value) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, [field]: value } : it)));
  };

  const onSave = async (item) => {
    await api.put(`/admin/faq/${item.id}`, item);
    load();
  };

  const onDelete = async (id) => {
    await api.delete(`/admin/faq/${id}`);
    load();
  };

  const onCreate = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const body = nuevo.categoria === 'horario'
        ? { ...nuevo, pregunta: HORARIO_PREGUNTA, respuesta: nuevo.respuesta || '{}' }
        : nuevo;
      await api.post(`/admin/negocios/${negocioId}/faq`, body);
      setNuevo(empty);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const totalEstrella = items.filter((it) => !CATEGORIAS_SIN_LIMITE.includes(it.categoria)).length;
  const alLimite = totalEstrella >= LIMITE_SERVICIOS_ESTRELLA;
  const nuevoEsCatalogo = !CATEGORIAS_SIN_LIMITE.includes(nuevo.categoria);

  return (
    <div>
      <h1>Preguntas frecuentes (FAQ)</h1>
      <p style={{ color: '#9aa1ad' }}>
        El agente de IA solo responde con lo que está aquí. Para cambiar el negocio de giro
        (ej. de tacos a azulejos) basta con reemplazar estas filas. Las filas con categoría
        "general" u "horario" no tienen límite — los servicios/productos (cualquier otra
        categoría, ej. "servicios", "entradas") tienen un máximo de{' '}
        <strong>{LIMITE_SERVICIOS_ESTRELLA}</strong> por negocio: llevas{' '}
        <strong>{totalEstrella}/{LIMITE_SERVICIOS_ESTRELLA}</strong>.
      </p>

      {items.map((item) => (
        <div className="faq-row" key={item.id}>
          <select value={item.categoria} onChange={(e) => onChange(item.id, 'categoria', e.target.value)}>
            {opcionesCon(item.categoria, categoriasBase).map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          {item.categoria === 'horario' ? (
            <HorarioEditor value={item.respuesta} onChange={(v) => onChange(item.id, 'respuesta', v)} />
          ) : (
            <>
              <input value={item.pregunta} onChange={(e) => onChange(item.id, 'pregunta', e.target.value)} placeholder="pregunta" />
              <textarea value={item.respuesta} onChange={(e) => onChange(item.id, 'respuesta', e.target.value)} rows={3} />
              <input
                value={item.imagen_url || ''}
                onChange={(e) => onChange(item.id, 'imagen_url', e.target.value)}
                placeholder="URL de imagen (opcional, ej. para ítems de menú)"
              />
            </>
          )}
          <label style={{ fontSize: '0.85rem', color: '#9aa1ad' }}>
            <input
              type="checkbox"
              checked={item.activo}
              onChange={(e) => onChange(item.id, 'activo', e.target.checked)}
              style={{ width: 'auto', marginRight: '0.4rem' }}
            />
            Activo
          </label>
          <div className="faq-row-actions">
            <button className="secondary" onClick={() => onSave(item)}>Guardar</button>
            <button className="danger" onClick={() => onDelete(item.id)}>Eliminar</button>
          </div>
        </div>
      ))}

      <h2 style={{ marginTop: '2rem' }}>Agregar nueva</h2>
      <form onSubmit={onCreate} className="faq-row">
        <select value={nuevo.categoria} onChange={(e) => setNuevo({ ...nuevo, categoria: e.target.value })}>
          {categorias.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        {nuevo.categoria === 'horario' ? (
          <HorarioEditor value={nuevo.respuesta} onChange={(v) => setNuevo({ ...nuevo, respuesta: v })} />
        ) : (
          <>
            <input value={nuevo.pregunta} onChange={(e) => setNuevo({ ...nuevo, pregunta: e.target.value })} placeholder="pregunta" required />
            <textarea value={nuevo.respuesta} onChange={(e) => setNuevo({ ...nuevo, respuesta: e.target.value })} placeholder="respuesta" rows={3} required />
            <input
              value={nuevo.imagen_url}
              onChange={(e) => setNuevo({ ...nuevo, imagen_url: e.target.value })}
              placeholder="URL de imagen (opcional, ej. para ítems de menú)"
            />
          </>
        )}
        {error && <p className="error-msg">{error}</p>}
        {alLimite && nuevoEsCatalogo && (
          <p className="error-msg">Ya llegaste al límite de {LIMITE_SERVICIOS_ESTRELLA} servicios/productos. Borra alguno o usa categoría "general" para info que no es catálogo.</p>
        )}
        <button type="submit" disabled={alLimite && nuevoEsCatalogo}>Agregar</button>
      </form>
    </div>
  );
}
