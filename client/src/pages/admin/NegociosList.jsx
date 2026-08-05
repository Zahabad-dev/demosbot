import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/apiClient';
import { useAuth } from '../../context/AuthContext';

const emptyNegocio = { slug: '', nombre: '', giro: '', ciudad: '', tono: 'amigable', system_prompt: '' };

export default function NegociosList() {
  const { user } = useAuth();
  const isAgencia = user?.rol === 'agencia';
  const [negocios, setNegocios] = useState([]);
  const [activandoId, setActivandoId] = useState(null);
  const [activandoClienteId, setActivandoClienteId] = useState(null);
  const [nuevo, setNuevo] = useState(emptyNegocio);
  const [error, setError] = useState('');

  const load = () => api.get('/admin/negocios').then(setNegocios).catch(() => setNegocios([]));

  useEffect(() => { load(); }, []);

  const onActivar = async (n) => {
    setActivandoId(n.id);
    setError('');
    try {
      await api.put(`/admin/negocios/${n.id}/activar`, {});
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setActivandoId(null);
    }
  };

  // El cliente ya pago: se marca como no-demo y se le crea su usuario del panel (solo FAQ +
  // solicitudes/pedidos/citas/reservas). La contraseña se muestra UNA sola vez aqui — despues
  // no queda visible en ningun lado, hay que copiarla y pasarsela al cliente en este momento.
  const onActivarCliente = async (n) => {
    const username = window.prompt(`Correo/usuario para el panel de ${n.nombre}:`);
    if (!username) return;
    setActivandoClienteId(n.id);
    setError('');
    try {
      const res = await api.post(`/admin/negocios/${n.id}/activar-cliente`, { username });
      window.alert(`Cliente activado.\n\nUsuario: ${res.usuario.username}\nContraseña: ${res.password}\n\nCópiala ahora — no se vuelve a mostrar.`);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setActivandoClienteId(null);
    }
  };

  const onCreate = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/admin/negocios', nuevo);
      setNuevo(emptyNegocio);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <h1>Negocios</h1>
      <p style={{ color: '#9aa1ad' }}>
        Cada fila es un negocio moldeado sobre el mismo bot: cambia giro, tono, system prompt y FAQ
        sin tocar código. Entre las <strong>demos</strong> solo una puede estar activa a la vez
        (para presentar prospectos sin pisar otra demo). Un negocio marcado como <strong>Cliente</strong>
        ya no compite por ese switch — corre de forma independiente y permanente con su propio canal.
      </p>

      {negocios.map((n) => (
        <div className="faq-row" key={n.id}>
          <strong>
            {n.nombre} {n.activo && <span className="badge-activo">Activo</span>}
            {!n.es_demo && <span className="badge-atencion">Cliente{n.dominio ? ` · ${n.dominio}` : ''}</span>}
          </strong>
          <span style={{ color: '#9aa1ad' }}>{n.giro} · {n.ciudad}</span>
          <div className="faq-row-actions">
            {isAgencia && n.es_demo && !n.activo && (
              <button
                className="secondary"
                onClick={() => onActivar(n)}
                disabled={activandoId === n.id}
              >
                {activandoId === n.id ? 'Activando…' : 'Activar demo'}
              </button>
            )}
            {isAgencia && n.es_demo && (
              <button
                className="secondary"
                onClick={() => onActivarCliente(n)}
                disabled={activandoClienteId === n.id}
              >
                {activandoClienteId === n.id ? 'Activando…' : 'Activar Cliente'}
              </button>
            )}
            {isAgencia && <Link to={`/admin/negocios/${n.id}`}><button className="secondary">Editar bot</button></Link>}
            <Link to={`/admin/negocios/${n.id}/faq`}><button className="secondary">FAQ</button></Link>
            <Link to={`/admin/negocios/${n.id}/solicitudes`}>
              <button className="secondary">
                Solicitudes{n.pendientes > 0 && <span className="badge-notificacion">{n.pendientes}</span>}
              </button>
            </Link>
          </div>
        </div>
      ))}

      {error && <p className="error-msg">{error}</p>}

      {isAgencia && (
        <>
          <h2 style={{ marginTop: '2rem' }}>Agregar negocio nuevo (demo/cliente)</h2>
          <form onSubmit={onCreate} className="faq-row">
            <input
              value={nuevo.slug}
              onChange={(e) => setNuevo({ ...nuevo, slug: e.target.value })}
              placeholder="slug (ej. azulejos-lopez)"
              required
            />
            <input
              value={nuevo.nombre}
              onChange={(e) => setNuevo({ ...nuevo, nombre: e.target.value })}
              placeholder="nombre del negocio"
              required
            />
            <input
              value={nuevo.giro}
              onChange={(e) => setNuevo({ ...nuevo, giro: e.target.value })}
              placeholder="giro (ej. taqueria, veterinaria...)"
              required
            />
            <input
              value={nuevo.ciudad}
              onChange={(e) => setNuevo({ ...nuevo, ciudad: e.target.value })}
              placeholder="ciudad"
            />
            <textarea
              value={nuevo.system_prompt}
              onChange={(e) => setNuevo({ ...nuevo, system_prompt: e.target.value })}
              placeholder="system prompt del agente IA"
              rows={4}
              required
            />
            <button type="submit">Crear negocio</button>
          </form>
        </>
      )}
    </div>
  );
}
