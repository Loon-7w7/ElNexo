import { useEffect } from 'preact/hooks';
import { navigate, useRoute } from './lib/router';
import { Configurator } from './pages/Configurator';
import { GridView } from './pages/GridView';

export default function App() {
  const path = useRoute();

  // Cualquier otra ruta vuelve al configurador.
  useEffect(() => {
    if (path !== '/' && path !== '/grid') navigate('/', { replace: true });
  }, [path]);

  if (path === '/grid') return <GridView />;
  return <Configurator />;
}
