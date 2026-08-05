import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import '../../../styles/medicina.css';

const WHATSAPP_FALLBACK = '5217751667681';

export default function PlantillaMedicina({ negocio, faq, error }) {
  const [qrDataUrl, setQrDataUrl] = useState(null);
  const whatsapp = negocio?.whatsapp_numero || WHATSAPP_FALLBACK;
  const mensajePrellenado = encodeURIComponent('Hola, quiero agendar una cita');
  const whatsappUrl = `https://wa.me/${whatsapp}?text=${mensajePrellenado}`;
  const slug = negocio?.slug || 'consultorio';
  const nombre = negocio?.nombre || 'Consultorio Demo';

  useEffect(() => {
    QRCode.toDataURL(whatsappUrl, { width: 320, margin: 1, color: { dark: '#1c2b2e', light: '#f4f8f9' } })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(null));
  }, [whatsappUrl]);

  return (
    <div className="md-page">
      <header className="md-hero">
        {negocio?.logo_data_url && <img src={negocio.logo_data_url} alt="" className="md-logo" />}
        <span className="md-badge">📍 {negocio?.ciudad || 'Tu ciudad'}</span>
        <h1>{nombre}</h1>
        <p className="md-tagline">ATENCIÓN PROFESIONAL · CITAS POR WHATSAPP</p>
        <p className="md-sub">Agenda tu cita en segundos — escríbenos o escanea el QR, sin llamadas ni esperas.</p>
        {error && <p className="md-hint">(Demo sin conexión a la base de datos — así se verá el sitio con datos reales.)</p>}
        <div className="md-hero-actions">
          <a className="md-cta" href={`/agenda/${slug}`}>Agendar cita</a>
          <a className="md-cta md-cta-outline" href={whatsappUrl} target="_blank" rel="noreferrer">Escríbenos por WhatsApp</a>
        </div>
      </header>

      <section className="md-qr-section">
        <div className="md-qr-card">
          {qrDataUrl ? (
            <>
              <img src={qrDataUrl} alt="QR para agendar por WhatsApp" className="md-qr-img" />
              <a className="md-qr-download" href={qrDataUrl} download={`qr-whatsapp-${slug}.png`}>Descargar QR</a>
            </>
          ) : (
            <p>Generando QR…</p>
          )}
          <p className="md-qr-caption">Escanéalo en recepción — lleva directo a WhatsApp para agendar</p>
        </div>
        <a className="md-cta" href={whatsappUrl} target="_blank" rel="noreferrer">Escríbenos por WhatsApp</a>
      </section>

      <div className="md-cards-row">
        <div className="md-mini-card">
          <h3>Servicios</h3>
          <a href={`/agenda/${slug}`}>Ver servicios</a>
        </div>
        <div className="md-mini-card">
          <h3>Agendar cita</h3>
          <a href={`/agenda/${slug}`}>Reservar ahora</a>
        </div>
        <div className="md-mini-card">
          <h3>Ubicación</h3>
          <a href={`https://www.google.com/maps/search/${encodeURIComponent(nombre)}+${encodeURIComponent(negocio?.ciudad || '')}`} target="_blank" rel="noreferrer">
            {negocio?.ciudad || 'Ver ubicación'}
          </a>
        </div>
      </div>

      <footer className="md-footer">
        <p>{nombre} · {negocio?.ciudad || ''}</p>
        {negocio?.es_demo !== false && (
          <p className="md-powered">Demo del ecosistema de bots — Black Sheep Agencia</p>
        )}
      </footer>
    </div>
  );
}
