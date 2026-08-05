import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../../lib/apiClient';
import '../../styles/estetica-barberia.css';
import '../../styles/garage.css';
import '../../styles/medicina.css';
import '../../styles/mecanico.css';
import '../../styles/gimnasio.css';
import '../../styles/barberia.css';
import '../../styles/fumigacion.css';
import '../../styles/sanitizacion.css';
import { colorOverrideStyle } from '../../lib/plantillaColores';

const WHATSAPP_FALLBACK = '5217751667681';

const DIAS = ['Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const HORAS = ['10:00 am', '12:00 pm', '3:00 pm', '5:00 pm', '7:00 pm'];

// Un solo componente de agenda sirve a todas las plantillas de tipo_funcion='citas' — lo
// unico que cambia por plantilla es el "skin" (prefijo de clases CSS + copy de respaldo).
// Agregar una plantilla nueva de citas = agregar una entrada aqui, no tocar la logica.
const SKINS = {
  garage: {
    prefix: 'gr',
    nombreDemo: 'Mr. Garage',
    tagline: 'AGENDA TU PRUEBA DE MANEJO',
    tituloPaso2: '2. Elige el auto',
    ctaTexto: 'Agendar prueba por WhatsApp',
    conImagen: true,
    iconoPlaceholder: '🚗',
    demoServicios: [
      { pregunta: 'Sedán deportivo 2023', respuesta: 'Motor turbo, único dueño, 28,000 km. — $385,000' },
      { pregunta: 'Camioneta 4x4 2022', respuesta: 'Doble cabina, 4x4, listo para carretera u off-road. — $520,000' },
      { pregunta: 'SUV familiar 2023', respuesta: '7 pasajeros, cámara de reversa, garantía vigente. — $460,000' },
    ],
  },
  medicina: {
    prefix: 'md',
    nombreDemo: 'Consultorio Demo',
    tagline: 'AGENDA TU CITA',
    tituloPaso2: '2. Elige el servicio',
    ctaTexto: 'Agendar por WhatsApp',
    conImagen: false,
    demoServicios: [
      { pregunta: 'Consulta general', respuesta: 'Valoración inicial y diagnóstico. — $450 · 30 min' },
      { pregunta: 'Limpieza dental', respuesta: 'Limpieza profunda y revisión. — $600 · 45 min' },
      { pregunta: 'Revisión de seguimiento', respuesta: 'Para pacientes en tratamiento. — $300 · 20 min' },
    ],
  },
  mecanico: {
    prefix: 'mc',
    nombreDemo: 'Taller Demo',
    tagline: 'AGENDA TU SERVICIO',
    tituloPaso2: '2. Elige el servicio',
    ctaTexto: 'Agendar por WhatsApp',
    conImagen: false,
    demoServicios: [
      { pregunta: 'Cambio de aceite y filtro', respuesta: 'Incluye revisión de niveles. — $450 · 30 min' },
      { pregunta: 'Afinación mayor', respuesta: 'Bujías, filtros, diagnóstico computarizado. — $1,800 · 2 hrs' },
      { pregunta: 'Diagnóstico de falla', respuesta: 'Escaneo computarizado y reporte. — $350 · 40 min' },
    ],
  },
  gimnasio: {
    prefix: 'gm',
    nombreDemo: 'Gimnasio Demo',
    tagline: 'AGENDA TU CLASE',
    tituloPaso2: '2. Elige la clase',
    ctaTexto: 'Agendar por WhatsApp',
    conImagen: false,
    demoServicios: [
      { pregunta: 'Clase de prueba gratis', respuesta: 'Conoce las instalaciones y entrena una vez sin costo. — $0 · 60 min' },
      { pregunta: 'Funcional grupal', respuesta: 'Entrenamiento en grupo de alta intensidad. — $80 · 50 min' },
      { pregunta: 'Sesión personalizada', respuesta: 'Uno a uno con entrenador certificado. — $250 · 60 min' },
    ],
  },
  barberia: {
    prefix: 'bb',
    nombreDemo: 'Barbería Demo',
    tagline: 'AGENDA TU CORTE',
    tituloPaso2: '2. Elige el servicio',
    ctaTexto: 'Agendar por WhatsApp',
    conImagen: false,
    demoServicios: [
      { pregunta: 'Corte clásico', respuesta: 'Corte a tijera y máquina, incluye lavado. — $150 · 30 min' },
      { pregunta: 'Corte + barba', respuesta: 'Corte completo más arreglo de barba con navaja. — $220 · 45 min' },
      { pregunta: 'Afeitado tradicional', respuesta: 'Toalla caliente, navaja y loción. — $130 · 25 min' },
    ],
  },
  fumigacion: {
    prefix: 'fm',
    nombreDemo: 'FumiGuard',
    tagline: 'AGENDA TU FUMIGACIÓN',
    tituloPaso2: '2. Elige el servicio',
    ctaTexto: 'Agendar por WhatsApp',
    conImagen: false,
    demoServicios: [
      { pregunta: 'Fumigación residencial', respuesta: 'Control de cucarachas, hormigas y arañas. Casa hasta 120 m². — $650 · 1 hr' },
      { pregunta: 'Control de plagas comercial', respuesta: 'Para restaurantes, oficinas y locales. — $1,200 · 2 hrs' },
      { pregunta: 'Fumigación de jardín', respuesta: 'Control de mosquitos y plagas de exterior. — $500 · 45 min' },
    ],
  },
  sanitizacion: {
    prefix: 'sn',
    nombreDemo: 'Desinfecta TX',
    tagline: 'AGENDA TU SANITIZACIÓN',
    tituloPaso2: '2. Elige el servicio',
    ctaTexto: 'Agendar por WhatsApp',
    conImagen: false,
    demoServicios: [
      { pregunta: 'Sanitización de espacios', respuesta: 'Desinfección con nebulizado grado hospitalario. Hasta 100 m². — $700 · 1 hr' },
      { pregunta: 'Sanitización de vehículos', respuesta: 'Interior de auto, camioneta o unidad de transporte. — $350 · 30 min' },
      { pregunta: 'Sanitización de oficinas', respuesta: 'Áreas comunes, escritorios y superficies de contacto. — $1,100 · 2 hrs' },
    ],
  },
};

const SKIN_DEFAULT = {
  prefix: 'eb',
  nombreDemo: 'Glow Studio',
  tagline: 'AGENDA TU CITA',
  tituloPaso2: '2. Elige tu servicio',
  ctaTexto: 'Agendar por WhatsApp',
  conImagen: false,
  demoServicios: [
    { pregunta: 'Corte y peinado', respuesta: 'Corte a la medida + peinado con plancha o tenaza. — $250 · 45 min' },
    { pregunta: 'Manicure spa', respuesta: 'Limado, cutícula, masaje y esmaltado. — $220 · 40 min' },
    { pregunta: 'Pedicure spa', respuesta: 'Exfoliación, masaje y esmaltado. — $250 · 50 min' },
    { pregunta: 'Facial hidratante', respuesta: 'Limpieza profunda + mascarilla hidratante. — $350 · 60 min' },
    { pregunta: 'Depilación de cejas', respuesta: 'Diseño y depilación con cera o hilo. — $120 · 15 min' },
    { pregunta: 'Maquillaje social', respuesta: 'Maquillaje para evento, incluye pestañas. — $450 · 60 min' },
  ],
};

export default function AgendaInteractiva() {
  const { slug } = useParams();
  const [negocio, setNegocio] = useState(null);
  const [faq, setFaq] = useState([]);
  const [error, setError] = useState(false);
  const [nombreCliente, setNombreCliente] = useState('');
  const [servicioSeleccionado, setServicioSeleccionado] = useState(null);
  const [slotSeleccionado, setSlotSeleccionado] = useState(null); // { dia, hora }

  useEffect(() => {
    Promise.all([
      api.get(`/public/negocio/${slug}`),
      api.get(`/public/negocio/${slug}/faq`),
    ])
      .then(([n, f]) => {
        setNegocio(n);
        setFaq(f);
      })
      .catch(() => setError(true));
  }, [slug]);

  const skin = SKINS[negocio?.plantilla] || SKIN_DEFAULT;
  const { prefix: px, tagline, tituloPaso2, ctaTexto, conImagen, iconoPlaceholder, demoServicios } = skin;

  const servicios = faq.filter((f) => f.categoria === 'servicios');
  const serviciosMostrados = servicios.length > 0 ? servicios : demoServicios;

  const whatsapp = negocio?.whatsapp_numero || WHATSAPP_FALLBACK;
  const listo = nombreCliente.trim() && servicioSeleccionado && slotSeleccionado;

  const agendarPorWhatsapp = () => {
    if (!listo) return;
    const mensaje = [
      '[CITA_INTERACTIVA]',
      `Nombre: ${nombreCliente.trim()}`,
      `Servicio: ${servicioSeleccionado.pregunta}`,
      `Día: ${slotSeleccionado.dia}`,
      `Horario: ${slotSeleccionado.hora}`,
    ].join('\n');
    window.open(`https://wa.me/${whatsapp}?text=${encodeURIComponent(mensaje)}`, '_blank', 'noreferrer');
  };

  return (
    <div className={`${px}-page`} style={colorOverrideStyle(negocio)}>
      <header className={`${px}-hero ${px}-hero-compact`}>
        {negocio?.logo_data_url && <img src={negocio.logo_data_url} alt="" className={`${px}-logo`} />}
        <h1>{negocio?.nombre || skin.nombreDemo}</h1>
        <p className={`${px}-tagline`}>{tagline}</p>
        {error && <p className={`${px}-hint`}>(Demo sin conexión a la base de datos — así se verá con datos reales.)</p>}
      </header>

      <section className={`${px}-section`}>
        <h2>1. Tu nombre</h2>
        <label className={`${px}-field-label`}>¿Cómo te llamas?</label>
        <input
          className={`${px}-input`}
          value={nombreCliente}
          onChange={(e) => setNombreCliente(e.target.value)}
          placeholder="Ej. Ana Torres"
        />
      </section>

      <section className={`${px}-section`}>
        <h2>{tituloPaso2}</h2>
        <div className={`${px}-grid`}>
          {serviciosMostrados.map((item, i) => (
            <button
              key={i}
              className={`${px}-servicio-card ${servicioSeleccionado?.pregunta === item.pregunta ? `${px}-servicio-card-activa` : ''}`}
              onClick={() => setServicioSeleccionado(item)}
            >
              {conImagen && (item.imagen_url ? (
                <img src={item.imagen_url} alt={item.pregunta} className={`${px}-card-img`} />
              ) : (
                <div className={`${px}-card-img ${px}-card-img-placeholder`}>{iconoPlaceholder}</div>
              ))}
              <div className={conImagen ? `${px}-servicio-card-body` : ''}>
                <h3>{item.pregunta}</h3>
                <p>{item.respuesta}</p>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className={`${px}-section`}>
        <h2>3. Elige día y horario</h2>
        {DIAS.map((dia) => (
          <div key={dia} style={{ marginBottom: '1rem' }}>
            <p style={{ textAlign: 'center', fontWeight: 700, marginBottom: '0.5rem' }}>{dia}</p>
            <div className={`${px}-agenda-grid`}>
              {HORAS.map((hora) => {
                const activo = slotSeleccionado?.dia === dia && slotSeleccionado?.hora === hora;
                return (
                  <button
                    key={hora}
                    className={`${px}-slot ${activo ? `${px}-slot-activo` : ''}`}
                    onClick={() => setSlotSeleccionado({ dia, hora })}
                  >
                    {hora}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </section>

      <div className={`${px}-agenda-bar`}>
        <button className={`${px}-cta`} onClick={agendarPorWhatsapp} disabled={!listo}>
          {ctaTexto}
        </button>
      </div>

      <footer className={`${px}-footer`}>
        <p>{negocio?.nombre || ''} · {negocio?.ciudad || ''}</p>
        {negocio?.es_demo !== false && (
          <p className={`${px}-powered`}>Demo del ecosistema de bots — Black Sheep Agencia</p>
        )}
      </footer>
    </div>
  );
}
