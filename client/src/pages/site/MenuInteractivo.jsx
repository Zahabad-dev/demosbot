import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../../lib/apiClient';
import '../../styles/resto-bar.css';

const WHATSAPP_FALLBACK = '5217751667681';

// Mismo menu de respaldo que la plantilla Resto-bar — se muestra si el negocio
// todavia no tiene filas de FAQ con estas categorias (entradas/fuertes/bebidas/postres).
const MENU_DEMO = {
  entradas: [
    { pregunta: 'Botana de la casa', respuesta: 'Totopos, guacamole, pico de gallo y queso fundido. — $145', imagen_url: null },
    { pregunta: 'Alitas BBQ (8 pzas)', respuesta: 'Bañadas en salsa BBQ casera, con apio y aderezo ranch. — $165', imagen_url: null },
    { pregunta: 'Dedos de queso', respuesta: 'Panko crujiente con mermelada de chipotle. — $120', imagen_url: null },
  ],
  fuertes: [
    { pregunta: 'Hamburguesa Black Angus', respuesta: '200g, tocino, queso cheddar, cebolla caramelizada. — $185', imagen_url: null },
    { pregunta: 'Costillas BBQ (media)', respuesta: 'Costillas de cerdo glaseadas, papas y ensalada. — $245', imagen_url: null },
    { pregunta: 'Fettuccine Alfredo con pollo', respuesta: 'Pasta fresca, salsa cremosa, pollo a la plancha. — $175', imagen_url: null },
  ],
  bebidas: [
    { pregunta: 'Michelada de la casa', respuesta: 'Con especias secretas y chamoy. — $95', imagen_url: null },
    { pregunta: 'Mezcal Paloma', respuesta: 'Mezcal, refresco de toronja, sal de gusano. — $110', imagen_url: null },
    { pregunta: 'Cerveza artesanal', respuesta: 'Varias opciones, consulta la del día. — $75', imagen_url: null },
  ],
  postres: [
    { pregunta: 'Volcán de chocolate', respuesta: 'Con helado de vainilla. — $95', imagen_url: null },
    { pregunta: 'Cheesecake de zarzamora', respuesta: 'Casero, con coulis de frutos rojos. — $90', imagen_url: null },
  ],
};

const SECCIONES = [
  { key: 'entradas', titulo: 'Entradas' },
  { key: 'fuertes', titulo: 'Platos fuertes' },
  { key: 'bebidas', titulo: 'Bebidas y bar' },
  { key: 'postres', titulo: 'Postres' },
];

export default function MenuInteractivo() {
  const { slug } = useParams();
  const [negocio, setNegocio] = useState(null);
  const [faq, setFaq] = useState([]);
  const [error, setError] = useState(false);
  const [tabActiva, setTabActiva] = useState(SECCIONES[0].key);
  const [itemAbierto, setItemAbierto] = useState(null);
  const [seleccionados, setSeleccionados] = useState([]);
  const [resumenAbierto, setResumenAbierto] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get(`/public/negocio/${slug}`),
      api.get(`/public/negocio/${slug}/faq`),
    ])
      .then(([n, f]) => {
        setNegocio(n);
        setFaq(f);
      })
      .catch(() => setError(true));
  }, [slug]);

  const porCategoria = (clave) => {
    const propios = faq.filter((f) => f.categoria === clave);
    return propios.length > 0 ? propios : MENU_DEMO[clave];
  };

  const estaSeleccionado = (item) => seleccionados.some((s) => s.pregunta === item.pregunta);

  const toggleSeleccion = (item) => {
    setSeleccionados((prev) =>
      prev.some((s) => s.pregunta === item.pregunta)
        ? prev.filter((s) => s.pregunta !== item.pregunta)
        : [...prev, item]
    );
  };

  const whatsapp = negocio?.whatsapp_numero || WHATSAPP_FALLBACK;
  const whatsappUrl = `https://wa.me/${whatsapp}?text=${encodeURIComponent('Hola, quiero pedir a domicilio')}`;

  return (
    <div className="rb-page">
      <header className="rb-hero rb-hero-compact">
        {negocio?.logo_data_url && <img src={negocio.logo_data_url} alt="" className="rb-logo" />}
        <h1>{negocio?.nombre || 'Menú'}</h1>
        <p className="rb-tagline">MENÚ INTERACTIVO</p>
        <p className="rb-sub">Selecciona lo que quieras y arma tu pedido para pedirlo en tu mesa.</p>
        {error && <p className="rb-hint">(Demo sin conexión a la base de datos — así se verá con datos reales.)</p>}
      </header>

      <nav className="rb-tabs">
        {SECCIONES.map((s) => (
          <button
            key={s.key}
            className={`rb-tab ${tabActiva === s.key ? 'rb-tab-activa' : ''}`}
            onClick={() => setTabActiva(s.key)}
          >
            {s.titulo}
          </button>
        ))}
      </nav>

      <section className="rb-section">
        <div className="rb-grid">
          {porCategoria(tabActiva).map((item, i) => (
            <div className={`rb-card ${estaSeleccionado(item) ? 'rb-card-seleccionada' : ''}`} key={i}>
              {item.imagen_url ? (
                <img src={item.imagen_url} alt={item.pregunta} className="rb-card-img" />
              ) : (
                <div className="rb-card-img rb-card-img-placeholder">🍽️</div>
              )}
              <h3>{item.pregunta}</h3>
              <p>{item.respuesta}</p>
              <div className="rb-card-actions">
                <button className="rb-card-link" onClick={() => setItemAbierto(item)}>Ver más ⤢</button>
                <button
                  className={`rb-select-btn ${estaSeleccionado(item) ? 'rb-select-btn-activo' : ''}`}
                  onClick={() => toggleSeleccion(item)}
                >
                  {estaSeleccionado(item) ? '✓ Agregado' : '+ Agregar'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="rb-orden-bar">
        <button
          className="rb-cta rb-cta-fixed"
          onClick={() => setResumenAbierto(true)}
          disabled={seleccionados.length === 0}
        >
          Pedido listo{seleccionados.length > 0 && ` (${seleccionados.length})`}
        </button>
        <a className="rb-link-domicilio" href={whatsappUrl} target="_blank" rel="noreferrer">
          ¿Vas a pedir a domicilio? Escríbenos por WhatsApp
        </a>
      </div>

      {itemAbierto && (
        <div className="rb-modal-overlay" onClick={() => setItemAbierto(null)}>
          <div className="rb-modal" onClick={(e) => e.stopPropagation()}>
            <button className="rb-modal-close" onClick={() => setItemAbierto(null)}>✕</button>
            {itemAbierto.imagen_url ? (
              <img src={itemAbierto.imagen_url} alt={itemAbierto.pregunta} className="rb-modal-img" />
            ) : (
              <div className="rb-modal-img rb-card-img-placeholder">🍽️</div>
            )}
            <h2>{itemAbierto.pregunta}</h2>
            <p>{itemAbierto.respuesta}</p>
          </div>
        </div>
      )}

      {resumenAbierto && (
        <div className="rb-modal-overlay" onClick={() => setResumenAbierto(false)}>
          <div className="rb-modal" onClick={(e) => e.stopPropagation()}>
            <button className="rb-modal-close" onClick={() => setResumenAbierto(false)}>✕</button>
            <h2>Tu pedido</h2>
            <ul className="rb-resumen-lista">
              {seleccionados.map((it, i) => (
                <li key={i}>
                  <strong>{it.pregunta}</strong>
                  <span>{it.respuesta}</span>
                </li>
              ))}
            </ul>
            <p className="rb-resumen-aviso">
              👋 Indícale esto a tu mesero para ordenar — este resumen es solo para ti, no se envía
              automáticamente a nadie.
            </p>
          </div>
        </div>
      )}

      <footer className="rb-footer">
        <p>{negocio?.nombre || ''} · {negocio?.ciudad || ''}</p>
        <p className="rb-powered">Demo del ecosistema de bots — Black Sheep Agencia</p>
      </footer>
    </div>
  );
}
