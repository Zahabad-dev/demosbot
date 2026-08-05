// Vista neutral, independiente de plantilla, para negocios con suspendido = true (ej. cliente
// real que no pago). No usa clases con prefijo de skin a proposito: debe verse igual sin
// importar la plantilla visual del negocio.
export default function ServicioSuspendido({ negocio }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '2rem',
        fontFamily: 'system-ui, sans-serif',
        background: '#f4f4f5',
        color: '#27272a',
      }}
    >
      <h1 style={{ fontSize: '1.6rem', margin: '0 0 0.75rem' }}>{negocio?.nombre || 'Este sitio'}</h1>
      <p style={{ maxWidth: '26rem', color: '#52525b', lineHeight: 1.5 }}>
        Este servicio está pausado temporalmente. Si tienes dudas, contacta directamente al
        negocio o a Black Sheep Agencia.
      </p>
    </div>
  );
}
