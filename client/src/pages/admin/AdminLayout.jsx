import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/apiClient';
import { activarPush, activarNotificacionesEnPestana, notificarEnPestana, detectarEstadoNotificaciones } from '../../lib/pushNotifications';

const POLL_MS = 30000;
const TEMA_KEY = 'admin-tema';

// Elección de tema 100% manual — nunca sigue prefers-color-scheme del sistema/navegador, se
// guarda en localStorage para que se recuerde en este navegador entre visitas.
function temaGuardado() {
  try {
    const v = localStorage.getItem(TEMA_KEY);
    return v === 'light' || v === 'dark' ? v : 'dark';
  } catch {
    return 'dark';
  }
}

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [colorAccento, setColorAccento] = useState(null);
  const [tema, setTema] = useState(temaGuardado);
  const [notifEstado, setNotifEstado] = useState('cargando'); // cargando | inactivo | activando | push | pestana | denegado | no-soportado
  const pendientesPrevRef = useRef(null);

  const toggleTema = () => {
    const nuevo = tema === 'dark' ? 'light' : 'dark';
    setTema(nuevo);
    try { localStorage.setItem(TEMA_KEY, nuevo); } catch { /* localStorage no disponible, se queda solo en memoria de esta sesión */ }
  };

  // Al entrar al panel, revisa si el navegador YA tiene el permiso concedido de una vez
  // anterior (en vez de asumir "inactivo" y volver a pedirlo cada vez que se recarga la página).
  useEffect(() => {
    detectarEstadoNotificaciones().then(setNotifEstado);
  }, []);

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
    <div
      className="admin admin-shell"
      data-theme={tema}
      style={colorAccento ? { '--admin-accent': colorAccento } : undefined}
    >
      <nav className="admin-nav">
        <strong style={{ color: 'var(--admin-accent, #F5C518)', marginBottom: '1rem' }}>
          {user?.rol === 'cliente' ? 'Mi Panel' : 'Ecosistema FAQ Bot'}
        </strong>
        <NavLink to="/admin" end>Negocios</NavLink>
        <button className="secondary theme-toggle" onClick={toggleTema}>
          {tema === 'dark' ? '☀️ Tema claro' : '🌙 Tema oscuro'}
        </button>
        {(notifEstado === 'inactivo' || notifEstado === 'activando') && (
          <button className="secondary" onClick={onActivarNotificaciones} disabled={notifEstado === 'activando'}>
            {notifEstado === 'activando' ? 'Activando…' : 'Activar notificaciones'}
          </button>
        )}
        {notifEstado === 'push' && (
          <p className="texto-fino" style={{ fontSize: '0.75rem' }}>🔔 Notificaciones activas</p>
        )}
        {notifEstado === 'pestana' && (
          <p className="texto-fino" style={{ fontSize: '0.75rem' }}>🔔 Notificaciones activas (solo con el panel abierto)</p>
        )}
        {notifEstado === 'no-soportado' && (
          <p className="texto-fino" style={{ fontSize: '0.75rem' }}>Tu navegador no soporta notificaciones</p>
        )}
        {notifEstado === 'denegado' && (
          <p className="texto-fino" style={{ fontSize: '0.75rem' }}>Bloqueaste las notificaciones — actívalas desde el ícono de candado junto a la URL</p>
        )}
        <div className="texto-fino" style={{ marginTop: 'auto', paddingTop: '1rem', fontSize: '0.8rem' }}>
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
