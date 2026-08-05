import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import '../../../styles/mecanico.css';

const WHATSAPP_FALLBACK = '5217751667681';

export default function PlantillaMecanico({ negocio, faq, error }) {
  const [qrDataUrl, setQrDataUrl] = useState(null);
  const whatsapp = negocio?.whatsapp_numero || WHATSAPP_FALLBACK;
  const mensajePrellenado = encodeURIComponent('Hola, quiero agendar un servicio para mi auto');
  const whatsappUrl = `https://wa.me/${whatsapp}?text=${mensajePrellenado}`;
  const slug = negocio?.slug || 'taller';
  const nombre = negocio?.nombre || 'Taller Demo';

  useEffect(() => {
    QRCode.toDataURL(whatsappUrl, { width: 320, margin: 1, color: { dark: '#22262b', light: '#f0f0f0' } })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(null));
  }, [whatsappUrl]);

  return (
    <div className="mc-page">
      <header className="mc-hero">
        {negocio?.logo_data_url && <img src={negocio.logo_data_url} alt="" className="mc-logo" />}
        <span className="mc-badge">📍 {negocio?.ciudad || 'Tu ciudad'}</span>
        <h1>{nombre}</h1>
        <p className="mc-tagline">SERVICIO Y MANTENIMIENTO AUTOMOTRIZ</p>
        <p className="mc-sub">Agenda tu servicio por WhatsApp — sin esperar en el taller.</p>
        {error && <p className="mc-hint">(Demo sin conexión a la base de datos — así se verá el sitio con datos reales.)</p>}
        <div className="mc-hero-actions">
          <a className="mc-cta" href={`/agenda/${slug}`}>Agendar servicio</a>
          <a className="mc-cta mc-cta-outline" href={whatsappUrl} target="_blank" rel="noreferrer">Escríbenos por WhatsApp</a>
        </div>
      </header>

      <section className="mc-qr-section">
        <div className="mc-qr-card">
          {qrDataUrl ? (
            <>
              <img src={qrDataUrl} alt="QR para agendar por WhatsApp" className="mc-qr-img" />
              <a className="mc-qr-download" href={qrDataUrl} download={`qr-whatsapp-${slug}.png`}>Descargar QR</a>
            </>
          ) : (
            <p>Generando QR…</p>
          )}
          <p className="mc-qr-caption">Escanéalo en el taller — lleva directo a WhatsApp para agendar</p>
        </div>
        <a className="mc-cta" href={whatsappUrl} target="_blank" rel="noreferrer">Escríbenos por WhatsApp</a>
      </section>

      <div className="mc-cards-row">
        <div className="mc-mini-card">
          <h3>Servicios</h3>
          <a href={`/agenda/${slug}`}>Ver servicios</a>
        </div>
        <div className="mc-mini-card">
          <h3>Agendar</h3>
          <a href={`/agenda/${slug}`}>Reservar ahora</a>
        </div>
        <div className="mc-mini-card">
          <h3>Ubicación</h3>
          <a href={`https://www.google.com/maps/search/${encodeURIComponent(nombre)}+${encodeURIComponent(negocio?.ciudad || '')}`} target="_blank" rel="noreferrer">
            {negocio?.ciudad || 'Ver ubicación'}
          </a>
        </div>
      </div>

      <footer className="mc-footer">
        <p>{nombre} · {negocio?.ciudad || ''}</p>
        {negocio?.es_demo !== false && (
          <p className="mc-powered">Demo del ecosistema de bots — Black Sheep Agencia</p>
        )}
      </footer>
    </div>
  );
}
