import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/apiClient';

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [colorAccento, setColorAccento] = useState(null);

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
