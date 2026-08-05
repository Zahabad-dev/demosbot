import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import '../../../styles/asistente.css';

const WHATSAPP_FALLBACK = '5217751667681';

// Plantilla neutral/adaptable: sirve igual para abogados, contadores, consultores u otros
// profesionistas que necesiten agenda + un asistente de WhatsApp que responda preguntas
// frecuentes de sus propios clientes. El copy es deliberadamente genérico.
export default function PlantillaAsistente({ negocio, faq, error }) {
  const [qrDataUrl, setQrDataUrl] = useState(null);
  const whatsapp = negocio?.whatsapp_numero || WHATSAPP_FALLBACK;
  const mensajePrellenado = encodeURIComponent('Hola, quiero agendar una cita');
  const whatsappUrl = `https://wa.me/${whatsapp}?text=${mensajePrellenado}`;
  const slug = negocio?.slug || 'asistente';
  const nombre = negocio?.nombre || 'Bufete Torres Legal';

  useEffect(() => {
    QRCode.toDataURL(whatsappUrl, { width: 320, margin: 1, color: { dark: '#2b2f36', light: '#f5f6f7' } })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(null));
  }, [whatsappUrl]);

  return (
    <div className="ap-page">
      <header className="ap-hero">
        {negocio?.logo_data_url && <img src={negocio.logo_data_url} alt="" className="ap-logo" />}
        <span className="ap-badge">📍 {negocio?.ciudad || 'Tu ciudad'}</span>
        <h1>{nombre}</h1>
        <p className="ap-tagline">ATENCIÓN Y AGENDA POR WHATSAPP</p>
        <p className="ap-sub">Agenda tu cita en segundos — escríbenos o escanea el QR, sin llamadas ni esperas.</p>
        {error && <p className="ap-hint">(Demo sin conexión a la base de datos — así se verá el sitio con datos reales.)</p>}
        <div className="ap-hero-actions">
          <a className="ap-cta" href={`/agenda/${slug}`}>Agendar cita</a>
          <a className="ap-cta ap-cta-outline" href={whatsappUrl} target="_blank" rel="noreferrer">Escríbenos por WhatsApp</a>
        </div>
      </header>

      <section className="ap-qr-section">
        <div className="ap-qr-card">
          {qrDataUrl ? (
            <>
              <img src={qrDataUrl} alt="QR para agendar por WhatsApp" className="ap-qr-img" />
              <a className="ap-qr-download" href={qrDataUrl} download={`qr-whatsapp-${slug}.png`}>Descargar QR</a>
            </>
          ) : (
            <p>Generando QR…</p>
          )}
          <p className="ap-qr-caption">Escanéalo en tu oficina o tarjeta de presentación — lleva directo a WhatsApp</p>
        </div>
        <a className="ap-cta" href={whatsappUrl} target="_blank" rel="noreferrer">Escríbenos por WhatsApp</a>
      </section>

      <div className="ap-cards-row">
        <div className="ap-mini-card">
          <h3>Servicios</h3>
          <a href={`/agenda/${slug}`}>Ver servicios</a>
        </div>
        <div className="ap-mini-card">
          <h3>Agendar cita</h3>
          <a href={`/agenda/${slug}`}>Reservar ahora</a>
        </div>
        <div className="ap-mini-card">
          <h3>Oficina</h3>
          <a href={`https://www.google.com/maps/search/${encodeURIComponent(nombre)}+${encodeURIComponent(negocio?.ciudad || '')}`} target="_blank" rel="noreferrer">
            {negocio?.ciudad || 'Ver ubicación'}
          </a>
        </div>
      </div>

      <footer className="ap-footer">
        <p>{nombre} · {negocio?.ciudad || ''}</p>
        {negocio?.es_demo !== false && (
          <p className="ap-powered">Demo del ecosistema de bots — Black Sheep Agencia</p>
        )}
      </footer>
    </div>
  );
}
