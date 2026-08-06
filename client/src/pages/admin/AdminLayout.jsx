import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/apiClient';
import { activarPush, activarNotificacionesEnPestana, notificarEnPestana } from '../../lib/pushNotifications';

const POLL_MS = 30000;

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [colorAccento, setColorAccento] = useState(null);
  const [notifEstado, setNotifEstado] = useState('inactivo'); // inactivo | activando | push | pestana | no-soportado
  const pendientesPrevRef = useRef(null);

  // Camino "real" (Android, o iOS con la PWA agregada a pantalla de inicio): push del
  // navegador, avisa aunque el panel este cerrado. Si el navegador no lo soporta (típico de
  // Safari en iPhone sin instalar la PWA), cae al modo "pestaña": solo avisa mientras el panel
  // sigue abierto, comparando el total de pendientes cada POLL_MS contra la última lectura.
  const onActivarNotificaciones = async () => {
    setNotifEstado('activando');
    const push = await activarPush();
    if (push.ok) { setNotifEstado('push'); return; }
    const enPestana = await activarNotificacionesEnPestana();
    setNotifEstado(enPestana.ok ? 'pestana' : 'no-soportado');
  };

  useEffect(() => {
    if (notifEstado !== 'pestana') return;
    const tick = async () => {
      try {
        const negocios = await api.get('/admin/negocios');
        const total = negocios.reduce((acc, n) => acc + (n.pendientes || 0), 0);
        if (pendientesPrevRef.current !== null && total > pendientesPrevRef.current) {
          notificarEnPestana('Nuevo pendiente', 'Te llegó algo nuevo en Solicitudes.');
        }
        pendientesPrevRef.current = total;
      } catch {
        // silencioso: un fallo de polling no debe interrumpir el uso del panel
      }
    };
    tick();
    const id = setInterval(tick, POLL_MS);
    return () => clearInterval(id);
  }, [notifEstado]);

  // Un cliente activado ve su propio panel con su color de marca — el accent dorado por
  // defecto se queda igual para la agencia y para clientes que aun no eligieron colores.
  useEffect(() => {
    if (user?.rol === 'cliente' && user?.negocioId) {
      api.get(`/admin/negocios/${user.negocioId}`)
        .then((n) => setColorAccento(n.color_acento || n.color_primario || null))
        .catch(() => setColorAccento(null));
    }
  }, [user?.rol, user?.negocioId]);

  const onLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  return (
    <div className="admin admin-shell" style={colorAccento ? { '--admin-accent': colorAccento } : undefined}>
      <nav className="admin-nav">
        <strong style={{ color: 'var(--admin-accent, #F5C518)', marginBottom: '1rem' }}>
          {user?.rol === 'cliente' ? 'Mi Panel' : 'Ecosistema FAQ Bot'}
        </strong>
        <NavLink to="/admin" end>Negocios</NavLink>
        {(notifEstado === 'inactivo' || notifEstado === 'activando') && (
          <button className="secondary" onClick={onActivarNotificaciones} disabled={notifEstado === 'activando'}>
            {notifEstado === 'activando' ? 'Activando…' : 'Activar notificaciones'}
          </button>
        )}
        {notifEstado === 'push' && (
          <p style={{ fontSize: '0.75rem', color: '#7a8090' }}>🔔 Notificaciones activas</p>
        )}
        {notifEstado === 'pestana' && (
          <p style={{ fontSize: '0.75rem', color: '#7a8090' }}>🔔 Notificaciones activas (solo con el panel abierto)</p>
        )}
        {notifEstado === 'no-soportado' && (
          <p style={{ fontSize: '0.75rem', color: '#7a8090' }}>Tu navegador no soporta notificaciones</p>
        )}
        <div style={{ marginTop: 'auto', paddingTop: '1rem', fontSize: '0.8rem', color: '#7a8090' }}>
          {user?.nombre} ({user?.rol})
        </div>
        <button className="secondary" onClick={onLogout}>Cerrar sesión</button>
      </nav>
      <div className="admin-content">
        <Outlet />
      </div>
    </div>
  );
}
