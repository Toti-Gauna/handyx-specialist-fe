import { entorno } from '../config/entorno.ts';

// Siempre visible con el adaptador mock: los datos de prueba nunca se confunden con datos reales.
export function BannerPrueba() {
  if (process.env.NEXT_PUBLIC_DATA_SOURCE === 'http' || entorno.origen !== 'mock') return null;
  return (
    <p className="banner-prueba" role="note">
      Datos de prueba · nada de lo que ves es real ni se guarda
    </p>
  );
}
