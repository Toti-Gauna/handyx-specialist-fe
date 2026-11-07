'use client';
// Paso 3 · Tu foto (lote 4.4): selfie con marco ovalado y consejos de luz. Sirve para que Operations verifique que sos
// vos; en tu perfil se ve solo si la verificó.
import { api } from '@handyx/origen-datos';
import { Camara } from '../../components/Camara.tsx';
import { ErrorCaja } from '../../components/Estados.tsx';
import { Aviso, Chip } from '../../components/ui.tsx';
import { useAccion } from '../../hooks/useAccion.ts';
import { DOCUMENTO } from '../../lib/etiquetas.ts';
import { BotonFijo } from '../../kit/Piezas.tsx';
import { MarcoPaso, type PropsPaso } from './comunes.tsx';

export function PasoSelfie({ perfil, recargar, alTerminar }: PropsPaso) {
  const { pendiente, fallo, ejecutar } = useAccion();
  const estado = perfil.documentos.fotoCara;
  const puede = estado !== 'en_revision' && estado !== 'verificado';

  async function usar(foto: Blob | null) {
    const r = await ejecutar(async () => {
      await api.cargarDocumento('foto_cara', undefined, foto ?? undefined);
      await recargar();
    });
    if (r.ok) alTerminar();
  }

  return (
    <MarcoPaso paso="selfie" titulo="Tu foto">
      <h2 className="hx-titulo al-pregunta__titulo">
        Una <span className="hx-marca">selfie</span>, de frente
      </h2>
      <div className="al-doc">
        <span>Foto de cara</span>
        <Chip e={DOCUMENTO[estado]} />
      </div>
      {estado === 'rechazado' ? (
        <Aviso tono="aviso" icono="alerta">
          {perfil.motivoRevision ?? 'Operations no pudo aceptar la foto anterior.'} Sacá una nueva.
        </Aviso>
      ) : null}
      {fallo ? <ErrorCaja fallo={fallo} /> : null}
      {puede ? (
        <Camara
          modo="selfie"
          titulo="Tu cara"
          consejos={['La cara entera adentro del óvalo', 'Con luz de frente (mirando a una ventana)', 'Sin lentes de sol, gorra ni barbijo']}
          ocupado={pendiente}
          onFoto={(f) => usar(f)}
        />
      ) : (
        <>
          <p>{estado === 'verificado' ? 'Operations ya verificó tu foto.' : 'Operations está revisando tu foto.'}</p>
          <BotonFijo>
            <button type="button" className="boton boton--bloque" onClick={alTerminar}>
              Volver a la lista
            </button>
          </BotonFijo>
        </>
      )}
    </MarcoPaso>
  );
}
