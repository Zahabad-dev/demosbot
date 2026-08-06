// Mapea el color_primario/color_acento de cada negocio (campos libres en BD) a las variables
// CSS reales que ya usa cada plantilla — asi dos clientes con la misma plantilla no se ven
// identicos, sin tener que tocar el CSS de la plantilla por cliente. Si el negocio no definio
// colores propios, no se sobreescribe nada y se usa el color por defecto de la plantilla.
const VARS_POR_PLANTILLA = {
  generico: { primario: '--tm-red', acento: '--tm-gold' },
  'resto-bar': { primario: '--rb-lime', acento: '--rb-wood' },
  'estetica-barberia': { primario: '--eb-gold', acento: '--eb-gold-soft' },
  flora: { primario: '--fl-sage', acento: '--fl-sage-dark' },
  garage: { primario: '--gr-red', acento: '--gr-red-dark' },
  medicina: { primario: '--md-teal', acento: '--md-teal-dark' },
  mecanico: { primario: '--mc-orange', acento: '--mc-orange-dark' },
  gimnasio: { primario: '--gm-lime', acento: '--gm-lime-dark' },
  barberia: { primario: '--bb-burgundy', acento: '--bb-green' },
  fumigacion: { primario: '--fm-green', acento: '--fm-green-dark' },
  sanitizacion: { primario: '--sn-blue', acento: '--sn-cyan' },
  seguros: { primario: '--sg-navy', acento: '--sg-gold' },
  asistente: { primario: '--ap-graphite', acento: '--ap-blue' },
  constructora: { primario: '--co-blue', acento: '--co-amber' },
};

export function colorOverrideStyle(negocio) {
  const vars = VARS_POR_PLANTILLA[negocio?.plantilla] || VARS_POR_PLANTILLA.generico;
  const style = {};
  if (negocio?.color_primario) style[vars.primario] = negocio.color_primario;
  if (negocio?.color_acento) style[vars.acento] = negocio.color_acento;
  return style;
}
