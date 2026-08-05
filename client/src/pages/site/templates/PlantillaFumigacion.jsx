import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import '../../../styles/fumigacion.css';

const WHATSAPP_FALLBACK = '5217751667681';

export default function PlantillaFumigacion({ negocio, faq, error }) {
  const [qrDataUrl, setQrDataUrl] = useState(null);
  const whatsapp = negocio?.whatsapp_numero || WHATSAPP_FALLBACK;
  const mensajePrellenado = encodeURIComponent('Hola, quiero agendar una fumigación');
  const whatsappUrl = `https://wa.me/${whatsapp}?text=${mensajePrellenado}`;
  const slug = negocio?.slug || 'fumigacion';
  const nombre = negocio?.nombre || 'FumiGuard';

  useEffect(() => {
    QRCode.toDataURL(whatsappUrl, { width: 320, margin: 1, color: { dark: '#16241a', light: '#f4f9f4' } })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(null));
  }, [whatsappUrl]);

  return (
    <div className="fm-page">
      <header className="fm-hero">
        {negocio?.logo_data_url && <img src={negocio.logo_data_url} alt="" className="fm-logo" />}
        <span className="fm-badge">📍 {negocio?.ciudad || 'Tu ciudad'}</span>
        <h1>{nombre}</h1>
        <p className="fm-tagline">CONTROL DE PLAGAS · SIN RIESGO PARA TU FAMILIA</p>
        <p className="fm-sub">Agenda tu fumigación en segundos — escríbenos o escanea el QR, sin llamadas ni esperas.</p>
        {error && <p className="fm-hint">(Demo sin conexión a la base de datos — así se verá el sitio con datos reales.)</p>}
        <div className="fm-hero-actions">
          <a className="fm-cta" href={`/agenda/${slug}`}>Agendar servicio</a>
          <a className="fm-cta fm-cta-outline" href={whatsappUrl} target="_blank" rel="noreferrer">Escríbenos por WhatsApp</a>
        </div>
      </header>

      <section className="fm-qr-section">
        <div className="fm-qr-card">
          {qrDataUrl ? (
            <>
              <img src={qrDataUrl} alt="QR para agendar por WhatsApp" className="fm-qr-img" />
              <a className="fm-qr-download" href={qrDataUrl} download={`qr-whatsapp-${slug}.png`}>Descargar QR</a>
            </>
          ) : (
            <p>Generando QR…</p>
          )}
          <p className="fm-qr-caption">Escanéalo en tu recibo o folleto — lleva directo a WhatsApp para agendar</p>
        </div>
        <a className="fm-cta" href={whatsappUrl} target="_blank" rel="noreferrer">Escríbenos por WhatsApp</a>
      </section>

      <div className="fm-cards-row">
        <div className="fm-mini-card">
          <h3>Servicios</h3>
          <a href={`/agenda/${slug}`}>Ver servicios</a>
        </div>
        <div className="fm-mini-card">
          <h3>Agendar servicio</h3>
          <a href={`/agenda/${slug}`}>Reservar ahora</a>
        </div>
        <div className="fm-mini-card">
          <h3>Zona de cobertura</h3>
          <a href={`https://www.google.com/maps/search/${encodeURIComponent(nombre)}+${encodeURIComponent(negocio?.ciudad || '')}`} target="_blank" rel="noreferrer">
            {negocio?.ciudad || 'Ver ubicación'}
          </a>
        </div>
      </div>

      <footer className="fm-footer">
        <p>{nombre} · {negocio?.ciudad || ''}</p>
        {negocio?.es_demo !== false && (
          <p className="fm-powered">Demo del ecosistema de bots — Black Sheep Agencia</p>
        )}
      </footer>
    </div>
  );
}
