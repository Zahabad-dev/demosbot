import { useEffect, useState } from 'react';
import { api } from '../../lib/apiClient';
import PlantillaGenerica from './templates/PlantillaGenerica';
import PlantillaRestoBar from './templates/PlantillaRestoBar';
import PlantillaEsteticaBarberia from './templates/PlantillaEsteticaBarberia';
import PlantillaElegante from './templates/PlantillaElegante';
import PlantillaGarage from './templates/PlantillaGarage';
import PlantillaMedicina from './templates/PlantillaMedicina';
import PlantillaMecanico from './templates/PlantillaMecanico';
import PlantillaGimnasio from './templates/PlantillaGimnasio';
import PlantillaBarberia from './templates/PlantillaBarberia';
import PlantillaFumigacion from './templates/PlantillaFumigacion';
import PlantillaSanitizacion from './templates/PlantillaSanitizacion';
import PlantillaSeguros from './templates/PlantillaSeguros';
import PlantillaAsistente from './templates/PlantillaAsistente';
import ServicioSuspendido from './ServicioSuspendido';
import CargandoSitio from './CargandoSitio';
import { colorOverrideStyle } from '../../lib/plantillaColores';

const PLANTILLAS = {
  generico: PlantillaGenerica,
  'resto-bar': PlantillaRestoBar,
  'estetica-barberia': PlantillaEsteticaBarberia,
  flora: PlantillaElegante,
  garage: PlantillaGarage,
  medicina: PlantillaMedicina,
  mecanico: PlantillaMecanico,
  gimnasio: PlantillaGimnasio,
  barberia: PlantillaBarberia,
  fumigacion: PlantillaFumigacion,
  sanitizacion: PlantillaSanitizacion,
  seguros: PlantillaSeguros,
  asistente: PlantillaAsistente,
};

export default function Home() {
  const [negocio, setNegocio] = useState(null);
  const [faq, setFaq] = useState([]);
  const [error, setError] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get('/public/negocio-activo'),
      api.get('/public/negocio-activo/faq'),
    ])
      .then(([n, f]) => {
        setNegocio(n);
        setFaq(f);
      })
      .catch(() => setError(true));
  }, []);

  if (!negocio && !error) return <CargandoSitio />;
  if (negocio?.suspendido) return <ServicioSuspendido negocio={negocio} />;

  const Plantilla = PLANTILLAS[negocio?.plantilla] || PlantillaGenerica;
  return (
    <div style={colorOverrideStyle(negocio)}>
      <Plantilla negocio={negocio} faq={faq} error={error} />
    </div>
  );
}
