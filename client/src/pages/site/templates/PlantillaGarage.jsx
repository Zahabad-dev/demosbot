import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import '../../../styles/garage.css';

const WHATSAPP_FALLBACK = '5217751667681';

export default function PlantillaGarage({ negocio, faq, error }) {
  const [qrDataUrl, setQrDataUrl] = useState(null);
  const whatsapp = negocio?.whatsapp_numero || WHATSAPP_FALLBACK;
  const mensajePrellenado = encodeURIComponent('Hola, quiero ver el catálogo de autos');
  const whatsappUrl = `https://wa.me/${whatsapp}?text=${mensajePrellenado}`;
  const slug = negocio?.slug || 'garage';
  const nombre = negocio?.nombre || 'Mr. Garage';

  useEffect(() => {
    QRCode.toDataURL(whatsappUrl, { width: 320, margin: 1, color: { dark: '#0a0a0a', light: '#f5f5f5' } })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(null));
  }, [whatsappUrl]);

  const destacado = faq.find((f) => f.categoria === 'servicios');

  // Ultima palabra del nombre en rojo (acento visual), el resto en blanco — funciona
  // para cualquier nombre de negocio, no solo "Mr. Garage".
  const palabras = nombre.split(' ');
  const ultima = palabras.pop();

  return (
    <div className="gr-page">
      <header className="gr-hero">
        {negocio?.logo_data_url && <img src={negocio.logo_data_url} alt="" className="gr-logo" />}
        <span className="gr-badge">📍 {negocio?.ciudad || 'Tu ciudad'}</span>
        <h1>{palabras.length > 0 && palabras.join(' ') + ' '}<span>{ultima}</span></h1>
        <p className="gr-tagline">AUTOS SELECCIONADOS · CALIDAD GARANTIZADA</p>
        <p className="gr-sub">
          {destacado
            ? `Disponible ahora: ${destacado.pregunta}.`
            : 'Escanea el QR o escríbenos por WhatsApp para ver el catálogo y agendar tu prueba de manejo.'}
        </p>
        {error && <p className="gr-hint">(Demo sin conexión a la base de datos — así se verá el sitio con datos reales.)</p>}
        <div className="gr-hero-actions">
          <a className="gr-cta" href={`/agenda/${slug}`}>Ver catálogo</a>
          <a className="gr-cta gr-cta-outline" href={whatsappUrl} target="_blank" rel="noreferrer">Escríbenos por WhatsApp</a>
        </div>
      </header>

      <section className="gr-qr-section">
        <div className="gr-qr-card">
          {qrDataUrl ? (
            <>
              <img src={qrDataUrl} alt="QR para escribir por WhatsApp" className="gr-qr-img" />
              <a className="gr-qr-download" href={qrDataUrl} download={`qr-whatsapp-${slug}.png`}>Descargar QR</a>
            </>
          ) : (
            <p>Generando QR…</p>
          )}
          <p className="gr-qr-caption">Escanéalo en el lote — lleva directo a WhatsApp para cotizar o agendar prueba de manejo</p>
        </div>
        <a className="gr-cta" href={whatsappUrl} target="_blank" rel="noreferrer">Escríbenos por WhatsApp</a>
      </section>

      <div className="gr-cards-row">
        <div className="gr-mini-card">
          <h3>Catálogo</h3>
          <a href={`/agenda/${slug}`}>Ver autos disponibles</a>
        </div>
        <div className="gr-mini-card">
          <h3>Prueba de manejo</h3>
          <a href={`/agenda/${slug}`}>Agendar cita</a>
        </div>
        <div className="gr-mini-card">
          <h3>Ubicación</h3>
          <a href={`https://www.google.com/maps/search/${encodeURIComponent(nombre)}+${encodeURIComponent(negocio?.ciudad || '')}`} target="_blank" rel="noreferrer">
            {negocio?.ciudad || 'Ver ubicación'}
          </a>
        </div>
      </div>

      <footer className="gr-footer">
        <p>{nombre} · {negocio?.ciudad || ''}</p>
        {negocio?.es_demo !== false && (
          <p className="gr-powered">Demo del ecosistema de bots — Black Sheep Agencia</p>
        )}
      </footer>
    </div>
  );
}
