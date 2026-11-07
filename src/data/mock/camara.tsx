// Visor de la cámara simulada (lote 4.4). Solo en la vista previa: nunca abre la cámara ni usa una foto real.
import type { CamaraPrueba } from '../ayudas.ts';

function Visor({ modo }: { modo: 'documento' | 'selfie' }) {
  return (
    <div className="hx-camara__simulada" aria-hidden="true">
      {modo === 'documento' ? <span className="hx-camara__dni-prueba">DOCUMENTO DE PRUEBA</span> : <span className="hx-camara__cara-prueba" />}
    </div>
  );
}

export const camaraPrueba: CamaraPrueba = {
  Visor,
  disparo: 'Sacar foto de prueba',
  aviso: 'Cámara simulada: no se usa la tuya',
  sello: 'Foto de prueba',
};
