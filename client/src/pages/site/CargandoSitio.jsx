// Se muestra mientras todavia no sabemos que negocio/plantilla es (antes de que responda la
// API) — evita el "flash" de ver brevemente la plantilla generica de respaldo antes de que
// cambie a la real. Neutral a proposito: no debe parecerse a ninguna plantilla en particular.
export default function CargandoSitio() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f4f4f5',
      }}
    >
      <div
        style={{
          width: '2.2rem',
          height: '2.2rem',
          borderRadius: '50%',
          border: '3px solid #d4d4d8',
          borderTopColor: '#71717a',
          animation: 'cargando-sitio-spin 0.8s linear infinite',
        }}
      />
      <style>{'@keyframes cargando-sitio-spin { to { transform: rotate(360deg); } }'}</style>
    </div>
  );
}
