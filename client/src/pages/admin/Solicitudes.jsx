import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../../lib/apiClient';

function SolicitudRow({ item, onUpdated }) {
  const [motivo, setMotivo] = useState('');
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

  return (
    <div className="faq-row">
      <strong>
        {item.nombre_contacto || item.telefono} {estaBaneado && <span className="badge-baneado">Baneado</span>}
      </strong>
      <span style={{ color: '#9aa1ad' }}>{item.telefono} · {item.canal} · {item.estado}</span>
      <p>{item.ultimo_mensaje}</p>
      {estaBaneado && item.motivo_baneo && <p className="error-msg">Motivo del baneo: {item.motivo_baneo}</p>}

      <div className="faq-row-actions">
        <button className="secondary" onClick={toggleBot}>
          {item.bot_bloqueado ? 'Reactivar bot' : 'Pausar bot (tomar yo la conversación)'}
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
    </div>
  );
}

export default function Solicitudes() {
  const { negocioId } = useParams();
  const [items, setItems] = useState([]);

  const load = () => api.get(`/admin/negocios/${negocioId}/solicitudes`).then(setItems).catch(() => setItems([]));

  useEffect(() => { load(); }, [negocioId]);

  return (
    <div>
      <h1>Solicitudes / conversaciones</h1>
      <p style={{ color: '#9aa1ad' }}>
        Banear un número apaga el bot para esa conversación de forma permanente (no se
        reactiva solo a las 24h como una pausa normal) — queda a decisión humana reactivarlo.
        Úsalo para pedidos falsos a domicilio o abuso.
      </p>
      {items.length === 0 && <p style={{ color: '#9aa1ad' }}>Aún no hay conversaciones registradas.</p>}
      {items.map((item) => (
        <SolicitudRow key={item.id} item={item} onUpdated={load} />
      ))}
    </div>
  );
}
