import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import '../../../styles/gimnasio.css';

const WHATSAPP_FALLBACK = '5217751667681';

export default function PlantillaGimnasio({ negocio, faq, error }) {
  const [qrDataUrl, setQrDataUrl] = useState(null);
  const whatsapp = negocio?.whatsapp_numero || WHATSAPP_FALLBACK;
  const mensajePrellenado = encodeURIComponent('Hola, quiero agendar una clase');
  const whatsappUrl = `https://wa.me/${whatsapp}?text=${mensajePrellenado}`;
  const slug = negocio?.slug || 'gimnasio';
  const nombre = negocio?.nombre || 'Gimnasio Demo';

  useEffect(() => {
    QRCode.toDataURL(whatsappUrl, { width: 320, margin: 1, color: { dark: '#0a0a0a', light: '#f5f5f5' } })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(null));
  }, [whatsappUrl]);

  return (
    <div className="gm-page">
      <header className="gm-hero">
        {negocio?.logo_data_url && <img src={negocio.logo_data_url} alt="" className="gm-logo" />}
        <span className="gm-badge">📍 {negocio?.ciudad || 'Tu ciudad'}</span>
        <h1>{nombre}</h1>
        <p className="gm-tagline">ENTRENA · SUPÉRATE · REPITE</p>
        <p className="gm-sub">Agenda tu clase o sesión por WhatsApp — sin filas, sin llamadas.</p>
        {error && <p className="gm-hint">(Demo sin conexión a la base de datos — así se verá el sitio con datos reales.)</p>}
        <div className="gm-hero-actions">
          <a className="gm-cta" href={`/agenda/${slug}`}>Agendar clase</a>
          <a className="gm-cta gm-cta-outline" href={whatsappUrl} target="_blank" rel="noreferrer">Escríbenos por WhatsApp</a>
        </div>
      </header>

      <section className="gm-qr-section">
        <div className="gm-qr-card">
          {qrDataUrl ? (
            <>
              <img src={qrDataUrl} alt="QR para agendar por WhatsApp" className="gm-qr-img" />
              <a className="gm-qr-download" href={qrDataUrl} download={`qr-whatsapp-${slug}.png`}>Descargar QR</a>
            </>
          ) : (
            <p>Generando QR…</p>
          )}
          <p className="gm-qr-caption">Escanéalo en recepción — lleva directo a WhatsApp para agendar</p>
        </div>
        <a className="gm-cta" href={whatsappUrl} target="_blank" rel="noreferrer">Escríbenos por WhatsApp</a>
      </section>

      <div className="gm-cards-row">
        <div className="gm-mini-card">
          <h3>Clases</h3>
          <a href={`/agenda/${slug}`}>Ver clases</a>
        </div>
        <div className="gm-mini-card">
          <h3>Agendar</h3>
          <a href={`/agenda/${slug}`}>Reservar ahora</a>
        </div>
        <div className="gm-mini-card">
          <h3>Ubicación</h3>
          <a href={`https://www.google.com/maps/search/${encodeURIComponent(nombre)}+${encodeURIComponent(negocio?.ciudad || '')}`} target="_blank" rel="noreferrer">
            {negocio?.ciudad || 'Ver ubicación'}
          </a>
        </div>
      </div>

      <footer className="gm-footer">
        <p>{nombre} · {negocio?.ciudad || ''}</p>
        {negocio?.es_demo !== false && (
          <p className="gm-powered">Demo del ecosistema de bots — Black Sheep Agencia</p>
        )}
      </footer>
    </div>
  );
}
