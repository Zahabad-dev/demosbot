import { useEffect, useState } from 'react';
import { api } from '../../lib/apiClient';
import PlantillaGenerica from './templates/PlantillaGenerica';
import PlantillaRestoBar from './templates/PlantillaRestoBar';

const PLANTILLAS = {
  generico: PlantillaGenerica,
  'resto-bar': PlantillaRestoBar,
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

  const Plantilla = PLANTILLAS[negocio?.plantilla] || PlantillaGenerica;
  return <Plantilla negocio={negocio} faq={faq} error={error} />;
}
