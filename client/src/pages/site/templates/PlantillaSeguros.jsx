import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import '../../../styles/seguros.css';

const WHATSAPP_FALLBACK = '5217751667681';

export default function PlantillaSeguros({ negocio, faq, error }) {
  const [qrDataUrl, setQrDataUrl] = useState(null);
  const whatsapp = negocio?.whatsapp_numero || WHATSAPP_FALLBACK;
  const mensajePrellenado = encodeURIComponent('Hola, quiero agendar una asesoría de seguros');
  const whatsappUrl = `https://wa.me/${whatsapp}?text=${mensajePrellenado}`;
  const slug = negocio?.slug || 'seguros';
  const nombre = negocio?.nombre || 'Escudo Seguros';

  useEffect(() => {
    QRCode.toDataURL(whatsappUrl, { width: 320, margin: 1, color: { dark: '#0f2540', light: '#f6f4ee' } })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(null));
  }, [whatsappUrl]);

  return (
    <div className="sg-page">
      <header className="sg-hero">
        {negocio?.logo_data_url && <img src={negocio.logo_data_url} alt="" className="sg-logo" />}
        <span className="sg-badge">📍 {negocio?.ciudad || 'Tu ciudad'}</span>
        <h1>{nombre}</h1>
        <p className="sg-tagline">PROTECCIÓN Y ASESORÍA PERSONALIZADA</p>
        <p className="sg-sub">Agenda tu asesoría en segundos — escríbenos o escanea el QR, sin llamadas ni esperas.</p>
        {error && <p className="sg-hint">(Demo sin conexión a la base de datos — así se verá el sitio con datos reales.)</p>}
        <div className="sg-hero-actions">
          <a className="sg-cta" href={`/agenda/${slug}`}>Agendar asesoría</a>
          <a className="sg-cta sg-cta-outline" href={whatsappUrl} target="_blank" rel="noreferrer">Escríbenos por WhatsApp</a>
        </div>
      </header>

      <section className="sg-qr-section">
        <div className="sg-qr-card">
          {qrDataUrl ? (
            <>
              <img src={qrDataUrl} alt="QR para agendar por WhatsApp" className="sg-qr-img" />
              <a className="sg-qr-download" href={qrDataUrl} download={`qr-whatsapp-${slug}.png`}>Descargar QR</a>
            </>
          ) : (
            <p>Generando QR…</p>
          )}
          <p className="sg-qr-caption">Escanéalo en tu oficina o tarjeta de presentación — lleva directo a WhatsApp</p>
        </div>
        <a className="sg-cta" href={whatsappUrl} target="_blank" rel="noreferrer">Escríbenos por WhatsApp</a>
      </section>

      <div className="sg-cards-row">
        <div className="sg-mini-card">
          <h3>Pólizas y planes</h3>
          <a href={`/agenda/${slug}`}>Ver opciones</a>
        </div>
        <div className="sg-mini-card">
          <h3>Agendar asesoría</h3>
          <a href={`/agenda/${slug}`}>Reservar ahora</a>
        </div>
        <div className="sg-mini-card">
          <h3>Oficina</h3>
          <a href={`https://www.google.com/maps/search/${encodeURIComponent(nombre)}+${encodeURIComponent(negocio?.ciudad || '')}`} target="_blank" rel="noreferrer">
            {negocio?.ciudad || 'Ver ubicación'}
          </a>
        </div>
      </div>

      <footer className="sg-footer">
        <p>{nombre} · {negocio?.ciudad || ''}</p>
        {negocio?.es_demo !== false && (
          <p className="sg-powered">Demo del ecosistema de bots — Black Sheep Agencia</p>
        )}
      </footer>
    </div>
  );
}
