import { useEffect, useState } from 'react';
import { api } from '../../lib/apiClient';

const NEGOCIO_SLUG = 'tacos-memo';
const WHATSAPP_FALLBACK = '7770000000';

export default function Home() {
  const [negocio, setNegocio] = useState(null);
  const [faq, setFaq] = useState([]);
  const [error, setError] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get(`/public/negocio/${NEGOCIO_SLUG}`),
      api.get(`/public/negocio/${NEGOCIO_SLUG}/faq`),
    ])
      .then(([n, f]) => {
        setNegocio(n);
        setFaq(f);
      })
      .catch(() => setError(true));
  }, []);

  const whatsapp = negocio?.whatsapp_numero || WHATSAPP_FALLBACK;
  const menu = faq.filter((f) => f.categoria === 'menu' || f.categoria === 'precios');
  const infoGeneral = faq.filter((f) => !['menu', 'precios'].includes(f.categoria));

  return (
    <div className="page">
      <header className="hero">
        <span className="crown">👑</span>
        <span className="badge">📍 Centro de Tulancingo, Hidalgo</span>
        <h1>Tacos Memo</h1>
        <p className="tagline">EL REY DEL TROMPO</p>
        <p>Tacos de verdad, atendidos por WhatsApp — pregúntale a nuestro asistente por menú, precios y horarios.</p>
        <a className="cta" href={`https://wa.me/${whatsapp}`} target="_blank" rel="noreferrer">
          Escríbenos por WhatsApp
        </a>
        {error && <p className="hint">(Demo sin conexión a la base de datos — así se verá el sitio con datos reales.)</p>}
      </header>

      {menu.length > 0 && (
        <section className="section">
          <h2>Menú</h2>
          <div className="grid">
            {menu.map((item, i) => (
              <div className="card" key={i}>
                <h3>{item.pregunta}</h3>
                <p>{item.respuesta}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {infoGeneral.length > 0 && (
        <section className="section alt">
          <h2>Info rápida</h2>
          <div className="grid">
            {infoGeneral.map((item, i) => (
              <div className="card" key={i}>
                <h3>{item.pregunta}</h3>
                <p>{item.respuesta}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <footer className="footer">
        <p>Tacos Memo · Centro de Tulancingo de Bravo, Hidalgo</p>
        <p className="powered">Demo del ecosistema de bots — Black Sheep Agencia</p>
      </footer>
    </div>
  );
}
