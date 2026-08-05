import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import '../../../styles/sanitizacion.css';

const WHATSAPP_FALLBACK = '5217751667681';

export default function PlantillaSanitizacion({ negocio, faq, error }) {
  const [qrDataUrl, setQrDataUrl] = useState(null);
  const whatsapp = negocio?.whatsapp_numero || WHATSAPP_FALLBACK;
  const mensajePrellenado = encodeURIComponent('Hola, quiero agendar una sanitización');
  const whatsappUrl = `https://wa.me/${whatsapp}?text=${mensajePrellenado}`;
  const slug = negocio?.slug || 'sanitizacion';
  const nombre = negocio?.nombre || 'Desinfecta TX';

  useEffect(() => {
    QRCode.toDataURL(whatsappUrl, { width: 320, margin: 1, color: { dark: '#12242c', light: '#f2f8fb' } })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(null));
  }, [whatsappUrl]);

  return (
    <div className="sn-page">
      <header className="sn-hero">
        {negocio?.logo_data_url && <img src={negocio.logo_data_url} alt="" className="sn-logo" />}
        <span className="sn-badge">📍 {negocio?.ciudad || 'Tu ciudad'}</span>
        <h1>{nombre}</h1>
        <p className="sn-tagline">SANITIZACIÓN Y DESINFECCIÓN PROFESIONAL</p>
        <p className="sn-sub">Agenda tu servicio en segundos — escríbenos o escanea el QR, sin llamadas ni esperas.</p>
        {error && <p className="sn-hint">(Demo sin conexión a la base de datos — así se verá el sitio con datos reales.)</p>}
        <div className="sn-hero-actions">
          <a className="sn-cta" href={`/agenda/${slug}`}>Agendar servicio</a>
          <a className="sn-cta sn-cta-outline" href={whatsappUrl} target="_blank" rel="noreferrer">Escríbenos por WhatsApp</a>
        </div>
      </header>

      <section className="sn-qr-section">
        <div className="sn-qr-card">
          {qrDataUrl ? (
            <>
              <img src={qrDataUrl} alt="QR para agendar por WhatsApp" className="sn-qr-img" />
              <a className="sn-qr-download" href={qrDataUrl} download={`qr-whatsapp-${slug}.png`}>Descargar QR</a>
            </>
          ) : (
            <p>Generando QR…</p>
          )}
          <p className="sn-qr-caption">Escanéalo en tu recibo o folleto — lleva directo a WhatsApp para agendar</p>
        </div>
        <a className="sn-cta" href={whatsappUrl} target="_blank" rel="noreferrer">Escríbenos por WhatsApp</a>
      </section>

      <div className="sn-cards-row">
        <div className="sn-mini-card">
          <h3>Servicios</h3>
          <a href={`/agenda/${slug}`}>Ver servicios</a>
        </div>
        <div className="sn-mini-card">
          <h3>Agendar servicio</h3>
          <a href={`/agenda/${slug}`}>Reservar ahora</a>
        </div>
        <div className="sn-mini-card">
          <h3>Zona de cobertura</h3>
          <a href={`https://www.google.com/maps/search/${encodeURIComponent(nombre)}+${encodeURIComponent(negocio?.ciudad || '')}`} target="_blank" rel="noreferrer">
            {negocio?.ciudad || 'Ver ubicación'}
          </a>
        </div>
      </div>

      <footer className="sn-footer">
        <p>{nombre} · {negocio?.ciudad || ''}</p>
        {negocio?.es_demo !== false && (
          <p className="sn-powered">Demo del ecosistema de bots — Black Sheep Agencia</p>
        )}
      </footer>
    </div>
  );
}
