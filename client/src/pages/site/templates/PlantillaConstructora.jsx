import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import '../../../styles/constructora.css';

const WHATSAPP_FALLBACK = '5217751667681';

export default function PlantillaConstructora({ negocio, faq, error }) {
  const [qrDataUrl, setQrDataUrl] = useState(null);
  const whatsapp = negocio?.whatsapp_numero || WHATSAPP_FALLBACK;
  const mensajePrellenado = encodeURIComponent('Hola, quiero agendar una visita/cotización de obra');
  const whatsappUrl = `https://wa.me/${whatsapp}?text=${mensajePrellenado}`;
  const slug = negocio?.slug || 'constructora';
  const nombre = negocio?.nombre || 'Constructora Del Valle';

  useEffect(() => {
    QRCode.toDataURL(whatsappUrl, { width: 320, margin: 1, color: { dark: '#16324a', light: '#f3f4f5' } })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(null));
  }, [whatsappUrl]);

  return (
    <div className="co-page">
      <header className="co-hero">
        {negocio?.logo_data_url && <img src={negocio.logo_data_url} alt="" className="co-logo" />}
        <span className="co-badge">📍 {negocio?.ciudad || 'Tu ciudad'}</span>
        <h1>{nombre}</h1>
        <p className="co-tagline">CONSTRUCCIÓN Y REMODELACIÓN DE CONFIANZA</p>
        <p className="co-sub">Agenda tu visita de obra o cotización en segundos — escríbenos o escanea el QR, sin llamadas ni esperas.</p>
        {error && <p className="co-hint">(Demo sin conexión a la base de datos — así se verá el sitio con datos reales.)</p>}
        <div className="co-hero-actions">
          <a className="co-cta" href={`/agenda/${slug}`}>Agendar visita</a>
          <a className="co-cta co-cta-outline" href={whatsappUrl} target="_blank" rel="noreferrer">Escríbenos por WhatsApp</a>
        </div>
      </header>

      <div className="co-stats-row">
        <div className="co-stat">
          <span className="co-stat-num">+120</span>
          <span className="co-stat-label">Proyectos entregados</span>
        </div>
        <div className="co-stat">
          <span className="co-stat-num">15</span>
          <span className="co-stat-label">Años de experiencia</span>
        </div>
        <div className="co-stat">
          <span className="co-stat-num">100%</span>
          <span className="co-stat-label">Presupuesto garantizado</span>
        </div>
      </div>

      <section className="co-qr-section">
        <div className="co-qr-card">
          {qrDataUrl ? (
            <>
              <img src={qrDataUrl} alt="QR para agendar por WhatsApp" className="co-qr-img" />
              <a className="co-qr-download" href={qrDataUrl} download={`qr-whatsapp-${slug}.png`}>Descargar QR</a>
            </>
          ) : (
            <p>Generando QR…</p>
          )}
          <p className="co-qr-caption">Escanéalo en tu oficina de obra o tarjeta de presentación — lleva directo a WhatsApp</p>
        </div>
        <a className="co-cta" href={whatsappUrl} target="_blank" rel="noreferrer">Escríbenos por WhatsApp</a>
      </section>

      <div className="co-cards-row">
        <div className="co-mini-card">
          <h3>Servicios</h3>
          <a href={`/agenda/${slug}`}>Ver servicios</a>
        </div>
        <div className="co-mini-card">
          <h3>Agendar visita</h3>
          <a href={`/agenda/${slug}`}>Reservar ahora</a>
        </div>
        <div className="co-mini-card">
          <h3>Zona de trabajo</h3>
          <a href={`https://www.google.com/maps/search/${encodeURIComponent(nombre)}+${encodeURIComponent(negocio?.ciudad || '')}`} target="_blank" rel="noreferrer">
            {negocio?.ciudad || 'Ver ubicación'}
          </a>
        </div>
      </div>

      <footer className="co-footer">
        <p>{nombre} · {negocio?.ciudad || ''}</p>
        {negocio?.es_demo !== false && (
          <p className="co-powered">Demo del ecosistema de bots — Black Sheep Agencia</p>
        )}
      </footer>
    </div>
  );
}
