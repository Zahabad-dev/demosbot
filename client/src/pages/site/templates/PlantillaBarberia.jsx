import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import '../../../styles/barberia.css';

const WHATSAPP_FALLBACK = '5217751667681';

export default function PlantillaBarberia({ negocio, faq, error }) {
  const [qrDataUrl, setQrDataUrl] = useState(null);
  const whatsapp = negocio?.whatsapp_numero || WHATSAPP_FALLBACK;
  const mensajePrellenado = encodeURIComponent('Hola, quiero agendar un corte');
  const whatsappUrl = `https://wa.me/${whatsapp}?text=${mensajePrellenado}`;
  const slug = negocio?.slug || 'barberia';
  const nombre = negocio?.nombre || 'Barbería Demo';

  useEffect(() => {
    QRCode.toDataURL(whatsappUrl, { width: 320, margin: 1, color: { dark: '#1b3a2b', light: '#f2ead9' } })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(null));
  }, [whatsappUrl]);

  return (
    <div className="bb-page">
      <header className="bb-hero">
        {negocio?.logo_data_url && <img src={negocio.logo_data_url} alt="" className="bb-logo" />}
        <span className="bb-badge">📍 {negocio?.ciudad || 'Tu ciudad'}</span>
        <h1>{nombre}</h1>
        <p className="bb-tagline">CORTE CLÁSICO · ESTILO PROPIO</p>
        <p className="bb-sub">Agenda tu corte por WhatsApp — sin esperar tu turno en la silla.</p>
        {error && <p className="bb-hint">(Demo sin conexión a la base de datos — así se verá el sitio con datos reales.)</p>}
        <div className="bb-hero-actions">
          <a className="bb-cta" href={`/agenda/${slug}`}>Agendar corte</a>
          <a className="bb-cta bb-cta-outline" href={whatsappUrl} target="_blank" rel="noreferrer">Escríbenos por WhatsApp</a>
        </div>
      </header>

      <section className="bb-qr-section">
        <div className="bb-qr-card">
          {qrDataUrl ? (
            <>
              <img src={qrDataUrl} alt="QR para agendar por WhatsApp" className="bb-qr-img" />
              <a className="bb-qr-download" href={qrDataUrl} download={`qr-whatsapp-${slug}.png`}>Descargar QR</a>
            </>
          ) : (
            <p>Generando QR…</p>
          )}
          <p className="bb-qr-caption">Escanéalo en el local — lleva directo a WhatsApp para agendar</p>
        </div>
        <a className="bb-cta" href={whatsappUrl} target="_blank" rel="noreferrer">Escríbenos por WhatsApp</a>
      </section>

      <div className="bb-cards-row">
        <div className="bb-mini-card">
          <h3>Servicios</h3>
          <a href={`/agenda/${slug}`}>Ver servicios</a>
        </div>
        <div className="bb-mini-card">
          <h3>Agendar</h3>
          <a href={`/agenda/${slug}`}>Reservar ahora</a>
        </div>
        <div className="bb-mini-card">
          <h3>Ubicación</h3>
          <a href={`https://www.google.com/maps/search/${encodeURIComponent(nombre)}+${encodeURIComponent(negocio?.ciudad || '')}`} target="_blank" rel="noreferrer">
            {negocio?.ciudad || 'Ver ubicación'}
          </a>
        </div>
      </div>

      <footer className="bb-footer">
        <p>{nombre} · {negocio?.ciudad || ''}</p>
        {negocio?.es_demo !== false && (
          <p className="bb-powered">Demo del ecosistema de bots — Black Sheep Agencia</p>
        )}
      </footer>
    </div>
  );
}
