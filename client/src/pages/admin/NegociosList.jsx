import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/apiClient';

export default function NegociosList() {
  const [negocios, setNegocios] = useState([]);

  useEffect(() => {
    api.get('/admin/negocios').then(setNegocios).catch(() => setNegocios([]));
  }, []);

  return (
    <div>
      <h1>Negocios</h1>
      <p style={{ color: '#9aa1ad' }}>
        Cada fila es un negocio moldeado sobre el mismo bot: cambia giro, tono, system prompt y FAQ
        sin tocar código.
      </p>
      {negocios.map((n) => (
        <div className="faq-row" key={n.id}>
          <strong>{n.nombre}</strong>
          <span style={{ color: '#9aa1ad' }}>{n.giro} · {n.ciudad}</span>
          <div className="faq-row-actions">
            <Link to={`/admin/negocios/${n.id}`}><button className="secondary">Editar bot</button></Link>
            <Link to={`/admin/negocios/${n.id}/faq`}><button className="secondary">FAQ</button></Link>
            <Link to={`/admin/negocios/${n.id}/solicitudes`}><button className="secondary">Solicitudes</button></Link>
          </div>
        </div>
      ))}
    </div>
  );
}
