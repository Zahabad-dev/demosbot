import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../../lib/apiClient';

export default function Solicitudes() {
  const { negocioId } = useParams();
  const [items, setItems] = useState([]);

  const load = () => api.get(`/admin/negocios/${negocioId}/solicitudes`).then(setItems).catch(() => setItems([]));

  useEffect(() => { load(); }, [negocioId]);

  const toggleBot = async (item) => {
    await api.put(`/admin/solicitudes/${item.id}`, { bot_bloqueado: !item.bot_bloqueado });
    load();
  };

  return (
    <div>
      <h1>Solicitudes / conversaciones</h1>
      {items.length === 0 && <p style={{ color: '#9aa1ad' }}>Aún no hay conversaciones registradas.</p>}
      {items.map((item) => (
        <div className="faq-row" key={item.id}>
          <strong>{item.nombre_contacto || item.telefono}</strong>
          <span style={{ color: '#9aa1ad' }}>{item.telefono} · {item.canal} · {item.estado}</span>
          <p>{item.ultimo_mensaje}</p>
          <div className="faq-row-actions">
            <button className="secondary" onClick={() => toggleBot(item)}>
              {item.bot_bloqueado ? 'Reactivar bot' : 'Pausar bot (tomar yo la conversación)'}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
