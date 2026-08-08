import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../../lib/apiClient';

const ESTADOS_PEDIDO = ['Nuevo', 'En proceso', 'Completado'];
const ESTADOS_CITA = ['Nueva', 'Confirmada', 'Completada', 'Cancelada'];
const ESTADOS_RESERVA = ['Nueva', 'Confirmada', 'Completada', 'Cancelada'];
// Columnas del tablero, en el orden natural del ciclo de vida de una conversación.
const ESTADOS_SOLICITUD = ['Nuevo', 'Escalado', 'Atendido', 'Cerrado', 'Baneado'];

// Sufijo de clase por estado (kanban-column-nuevo, kanban-card-escalado, etc. en admin.css) —
// permite reconocer de un vistazo qué tan urgente está cada tarjeta, sin leer texto.
const claseEstado = (estado) => estado.toLowerCase();

function PedidosModal({ solicitudId, onClose }) {
  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(true);

  const load = () =>
    api.get(`/admin/solicitudes/${solicitudId}/pedidos`)
      .then(setPedidos)
      .catch(() => setPedidos([]))
      .finally(() => setCargando(false));

  useEffect(() => { load(); }, [solicitudId]);

  const cambiarEstado = async (pedido, estado) => {
    await api.put(`/admin/pedidos/${pedido.id}`, { estado });
    load();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <button className="modal-box-close" onClick={onClose}>✕</button>
        <h2>Historial de pedidos</h2>
        {cargando && <p className="texto-tenue">Cargando…</p>}
        {!cargando && pedidos.length === 0 && (
          <p className="texto-tenue">Este contacto todavía no ha hecho un pedido desde el menú interactivo.</p>
        )}
        {pedidos.map((p) => (
          <div className="faq-row" key={p.id}>
            <strong>Pedido #{p.id} · {p.tipo_entrega === 'domicilio' ? 'A domicilio' : 'Pasar por él'}</strong>
            <span className="texto-tenue">{new Date(p.creado_en).toLocaleString('es-MX')}</span>
            <ul style={{ margin: '0.5rem 0', paddingLeft: '1.1rem' }}>
              {(Array.isArray(p.items) ? p.items : []).map((it, i) => (
                <li key={i}>
                  <strong>{it.nombre}</strong>{it.detalle ? ` — ${it.detalle}` : ''}
                </li>
              ))}
            </ul>
            <div className="field">
              <label>Estatus del pedido</label>
              <select value={p.estado} onChange={(e) => cambiarEstado(p, e.target.value)}>
                {ESTADOS_PEDIDO.map((e) => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CitasModal({ solicitudId, onClose }) {
  const [citas, setCitas] = useState([]);
  const [cargando, setCargando] = useState(true);

  const load = () =>
    api.get(`/admin/solicitudes/${solicitudId}/citas`)
      .then(setCitas)
      .catch(() => setCitas([]))
      .finally(() => setCargando(false));

  useEffect(() => { load(); }, [solicitudId]);

  const cambiarEstado = async (cita, estado) => {
    await api.put(`/admin/citas/${cita.id}`, { estado });
    load();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <button className="modal-box-close" onClick={onClose}>✕</button>
        <h2>Historial de citas</h2>
        {cargando && <p className="texto-tenue">Cargando…</p>}
        {!cargando && citas.length === 0 && (
          <p className="texto-tenue">Este contacto todavía no ha agendado una cita desde la agenda interactiva.</p>
        )}
        {citas.map((c) => (
          <div className="faq-row" key={c.id}>
            <strong>Cita #{c.id} · {c.servicio || 'Servicio sin especificar'}</strong>
            <span className="texto-tenue">
              {c.nombre_cliente || 'Sin nombre'} · {c.fecha || '—'} {c.horario || ''}
            </span>
            <span className="texto-tenue" style={{ fontSize: '0.8rem' }}>Solicitada: {new Date(c.creado_en).toLocaleString('es-MX')}</span>
            <div className="field">
              <label>Estatus de la cita</label>
              <select value={c.estado} onChange={(e) => cambiarEstado(c, e.target.value)}>
                {ESTADOS_CITA.map((e) => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReservasModal({ solicitudId, onClose }) {
  const [reservas, setReservas] = useState([]);
  const [cargando, setCargando] = useState(true);

  const load = () =>
    api.get(`/admin/solicitudes/${solicitudId}/reservas`)
      .then(setReservas)
      .catch(() => setReservas([]))
      .finally(() => setCargando(false));

  useEffect(() => { load(); }, [solicitudId]);

  const cambiarEstado = async (reserva, estado) => {
    await api.put(`/admin/reservas/${reserva.id}`, { estado });
    load();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <button className="modal-box-close" onClick={onClose}>✕</button>
        <h2>Historial de reservas</h2>
        {cargando && <p className="texto-tenue">Cargando…</p>}
        {!cargando && reservas.length === 0 && (
          <p className="texto-tenue">Este contacto todavía no ha reservado mesa por WhatsApp.</p>
        )}
        {reservas.map((r) => (
          <div className="faq-row" key={r.id}>
            <strong>Reserva #{r.id} · {r.personas || '?'} personas</strong>
            <span className="texto-tenue">
              {r.nombre_cliente || 'Sin nombre'} · {r.fecha || '—'} {r.horario || ''}
            </span>
            <span className="texto-tenue" style={{ fontSize: '0.8rem' }}>Solicitada: {new Date(r.creado_en).toLocaleString('es-MX')}</span>
            <div className="field">
              <label>Estatus de la reserva</label>
              <select value={r.estado} onChange={(e) => cambiarEstado(r, e.target.value)}>
                {ESTADOS_RESERVA.map((e) => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Tarjeta compacta del tablero — el detalle completo (banear, pausar bot, historiales) vive en
// SolicitudDetalleModal, que se abre al hacer clic en la tarjeta. El select de estado permite
// mover la tarjeta de columna sin abrir el detalle (la version "simple" del kanban: sin
// arrastrar y soltar, pero con la misma sensación de tablero tipo Monday).
function TarjetaSolicitud({ item, onAbrir, onCambiarEstado }) {
  return (
    <div className={`kanban-card kanban-card-${claseEstado(item.estado)}`} onClick={() => onAbrir(item)}>
      <div className="kanban-card-top">
        <strong>{item.nombre_contacto || item.telefono}</strong>
        {!item.leido && <span className="badge-atencion">Nuevo</span>}
      </div>
      <p className="kanban-card-mensaje">{item.ultimo_mensaje}</p>
      {(item.pedidos_nuevos > 0 || item.citas_nuevas > 0 || item.reservas_nuevas > 0) && (
        <div className="kanban-card-badges">
          {item.pedidos_nuevos > 0 && <span className="badge-notificacion">{item.pedidos_nuevos} pedido(s)</span>}
          {item.citas_nuevas > 0 && <span className="badge-notificacion">{item.citas_nuevas} cita(s)</span>}
          {item.reservas_nuevas > 0 && <span className="badge-notificacion">{item.reservas_nuevas} reserva(s)</span>}
        </div>
      )}
      <select
        className="kanban-card-select"
        value={item.estado}
        onClick={(e) => e.stopPropagation()}
        onChange={(e) => onCambiarEstado(item, e.target.value)}
      >
        {ESTADOS_SOLICITUD.map((e) => <option key={e} value={e}>{e}</option>)}
      </select>
    </div>
  );
}

// Detalle completo de una solicitud, en modal — mismas acciones que antes vivian en la fila
// plana (pausar bot, marcar atendido, banear/desbanear, abrir historiales de pedidos/citas/
// reservas), solo que ahora se abren desde la tarjeta del tablero en vez de estar siempre visibles.
function SolicitudDetalleModal({ item, onClose, onUpdated }) {
  const [motivo, setMotivo] = useState('');
  const [pedidosAbierto, setPedidosAbierto] = useState(false);
  const [citasAbierto, setCitasAbierto] = useState(false);
  const [reservasAbierto, setReservasAbierto] = useState(false);
  const estaBaneado = item.estado === 'Baneado';

  const toggleBot = async () => {
    await api.put(`/admin/solicitudes/${item.id}`, { bot_bloqueado: !item.bot_bloqueado });
    onUpdated();
  };

  const banear = async () => {
    await api.put(`/admin/solicitudes/${item.id}`, {
      bot_bloqueado: true,
      estado: 'Baneado',
      motivo_baneo: motivo || 'Sin motivo especificado',
    });
    onUpdated();
  };

  const desbanear = async () => {
    await api.put(`/admin/solicitudes/${item.id}`, {
      bot_bloqueado: false,
      estado: 'Atendido',
      motivo_baneo: '',
    });
    onUpdated();
  };

  const marcarAtendido = async () => {
    await api.put(`/admin/solicitudes/${item.id}`, { leido: true });
    onUpdated();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <button className="modal-box-close" onClick={onClose}>✕</button>
        <h2>
          {item.nombre_contacto || item.telefono} {estaBaneado && <span className="badge-baneado">Baneado</span>}
        </h2>
        <p className="texto-tenue">{item.telefono} · {item.canal} · {item.estado}</p>
        <p>{item.ultimo_mensaje}</p>
        {estaBaneado && item.motivo_baneo && <p className="error-msg">Motivo del baneo: {item.motivo_baneo}</p>}

        <div className="faq-row-actions">
          <button className="secondary" onClick={toggleBot}>
            {item.bot_bloqueado ? 'Reactivar bot' : 'Pausar bot (tomar yo la conversación)'}
          </button>
          {!item.leido && (
            <button className="secondary" onClick={marcarAtendido}>Marcar como atendido</button>
          )}
        </div>

        <div className="faq-row-actions">
          <button className="secondary" onClick={() => setPedidosAbierto(true)}>
            Historial de pedidos{item.pedidos_nuevos > 0 && <span className="badge-notificacion">{item.pedidos_nuevos}</span>}
          </button>
          <button className="secondary" onClick={() => setCitasAbierto(true)}>
            Historial de citas{item.citas_nuevas > 0 && <span className="badge-notificacion">{item.citas_nuevas}</span>}
          </button>
          <button className="secondary" onClick={() => setReservasAbierto(true)}>
            Historial de reservas{item.reservas_nuevas > 0 && <span className="badge-notificacion">{item.reservas_nuevas}</span>}
          </button>
        </div>

        {estaBaneado ? (
          <div className="faq-row-actions">
            <button className="danger" onClick={desbanear}>Quitar baneo</button>
          </div>
        ) : (
          <div className="ban-row">
            <input
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Motivo del baneo (ej. pedido falso a domicilio)"
            />
            <button className="danger" onClick={banear}>Banear número</button>
          </div>
        )}

        {pedidosAbierto && (
          <PedidosModal solicitudId={item.id} onClose={() => setPedidosAbierto(false)} />
        )}
        {citasAbierto && (
          <CitasModal solicitudId={item.id} onClose={() => setCitasAbierto(false)} />
        )}
        {reservasAbierto && (
          <ReservasModal solicitudId={item.id} onClose={() => setReservasAbierto(false)} />
        )}
      </div>
    </div>
  );
}

export default function Solicitudes() {
  const { negocioId } = useParams();
  const [items, setItems] = useState([]);
  const [detalleAbierto, setDetalleAbierto] = useState(null);

  const load = () => api.get(`/admin/negocios/${negocioId}/solicitudes`).then(setItems).catch(() => setItems([]));

  useEffect(() => { load(); }, [negocioId]);

  const cambiarEstadoRapido = async (item, estado) => {
    await api.put(`/admin/solicitudes/${item.id}`, { estado });
    load();
  };

  // No cierra el modal — así se pueden encadenar acciones (ej. marcar atendido y luego abrir
  // el historial de pedidos) sin tener que volver a buscar la tarjeta cada vez.
  const onUpdated = () => load();

  return (
    <div>
      <h1>Solicitudes / conversaciones</h1>
      <p className="texto-tenue">
        Arrastra el estado de cada tarjeta con el selector, o haz clic en una para ver el
        detalle completo. Banear un número apaga el bot para esa conversación de forma
        permanente — queda a decisión humana reactivarlo.
      </p>
      {items.length === 0 ? (
        <p className="texto-tenue">Aún no hay conversaciones registradas.</p>
      ) : (
        <div className="kanban-board">
          {ESTADOS_SOLICITUD.map((estado) => {
            const columna = items.filter((it) => it.estado === estado);
            return (
              <div className={`kanban-column kanban-column-${claseEstado(estado)}`} key={estado}>
                <h3>{estado} <span className="kanban-count">{columna.length}</span></h3>
                {columna.map((item) => (
                  <TarjetaSolicitud
                    key={item.id}
                    item={item}
                    onAbrir={setDetalleAbierto}
                    onCambiarEstado={cambiarEstadoRapido}
                  />
                ))}
                {columna.length === 0 && <p className="kanban-vacio">Sin tarjetas</p>}
              </div>
            );
          })}
        </div>
      )}

      {detalleAbierto && (
        <SolicitudDetalleModal
          item={detalleAbierto}
          onClose={() => setDetalleAbierto(null)}
          onUpdated={onUpdated}
        />
      )}
    </div>
  );
}
