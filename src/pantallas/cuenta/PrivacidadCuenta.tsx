'use client';
// CU-Privacidad (lote 1.4): descargar tus datos, el aviso de privacidad, tu sesión y la baja real de la cuenta (no solo
// cerrar sesión), con lo que se conserva por ley. Pedir tus datos o dar de baja es una decisión: se confirma antes.
import { api } from '@handyx/origen-datos';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { RUTAS } from '../../app/rutas.ts';
import { Cargando, ErrorCaja } from '../../components/Estados.tsx';
import type { ExportacionDatos } from '../../contracts/cuenta.ts';
import { useAccion } from '../../hooks/useAccion.ts';
import { useAhora } from '../../hooks/useAhora.ts';
import { useCarga } from '../../hooks/useCarga.ts';
import { textoIngreso } from '../../lib/avisos.ts';
import { mensajeReauth } from '../../lib/cuenta.ts';
import { fechaHora } from '../../lib/formato.ts';
import { AVISO_PROVISORIO } from '../../lib/legales.ts';
import { Boton, BotonEnlace } from '../../ui/atomos/Boton.tsx';
import { Chip } from '../../ui/atomos/Texto.tsx';
import { FilaAlerta, GrupoAjustes } from '../../ui/moleculas/Ajustes.tsx';
import { FilaIcono } from '../../ui/moleculas/Tarjeta.tsx';
import { BarraCompacta } from '../../ui/organismos/Cabeceras.tsx';
import { Hoja } from '../../ui/organismos/Hoja.tsx';
import { HojaReautenticar, type Reauth } from '../../ui/organismos/Seguridad.tsx';
import { PantallaSecundaria } from '../../ui/plantillas/Plantillas.tsx';
import { aplicarLetraGrande } from '../../ui/letra.tsx';

/** Lo que Handyx guarda y por cuánto tiempo, en palabras simples. PROVISORIO hasta el texto definitivo de Legal. */
const AVISO = [
  'Tu nombre, tu teléfono, tu email, tu domicilio y tus documentos se guardan cifrados. Solo los ve el equipo autorizado de Handyx.',
  'Los antecedentes penales, en foto o PDF, se guardan cifrados, los ve solo el equipo de verificación y se borran apenas se verifican.',
  'Tu ubicación se usa solo durante un viaje y se borra a los 30 días.',
  'Los clientes ven tu nombre, tus rubros habilitados, tu foto y tu presentación, y el sello si estás verificado. Nada más.',
  'No compartimos tus datos con servicios de inteligencia artificial.',
  'Podés pedir tus datos o dar de baja tu cuenta cuando quieras. Conservamos solo lo que la ley nos obliga a guardar.',
];

export function PrivacidadCuenta() {
  const router = useRouter();
  const ahora = useAhora(60_000);
  const c = useCarga(async () => {
    const [exportacion, seguridad] = await Promise.all([api.exportacionDatos(), api.seguridad()]);
    return { exportacion, seguridad };
  }, []);
  const [hoja, setHoja] = useState<'datos' | 'aviso' | 'baja' | null>(null);
  const salida = useAccion();
  if (c.fallo && !c.datos) return <ErrorCaja pantalla fallo={c.fallo} onReintentar={() => void c.recargar()} />;
  if (!c.datos) return <Cargando />;
  const { exportacion, seguridad } = c.datos;
  const este = seguridad.dispositivos.find((d) => d.esEste);
  const lista = exportacion?.estado === 'lista' && exportacion.descarga;
  const pedida = exportacion?.estado === 'pedida';

  async function salir() {
    const r = await salida.ejecutar(() => api.salir());
    if (!r.ok) return;
    aplicarLetraGrande(false);
    router.replace(RUTAS.acceso.ruta);
  }

  return (
    <PantallaSecundaria barra={<BarraCompacta titulo="Privacidad y baja" hrefVolver={RUTAS.cuenta.ruta} />}>
      <GrupoAjustes etiqueta="Tus datos">
        <FilaIcono
          icono="descargar"
          titulo="Descargar mis datos"
          detalle={textoExportacion(exportacion)}
          derecha={pedida ? <Chip tono="amarillo" icono="reloj">Pedidos</Chip> : lista ? <Chip tono="exito" icono="check">Listos</Chip> : undefined}
          onClick={pedida ? undefined : () => setHoja('datos')}
        />
        {lista && exportacion?.descarga ? (
          <div className="ui-ajuste__extra">
            <BotonEnlace href={exportacion.descarga.url} icono="descargar" variante="contorno" chico>
              Bajar el archivo (hasta {fechaHora(exportacion.descarga.venceEn)})
            </BotonEnlace>
          </div>
        ) : null}
        <FilaIcono icono="documento" titulo="Aviso de privacidad" detalle="Qué guardamos, para qué y cuánto tiempo" onClick={() => setHoja('aviso')} />
        <FilaIcono icono="pin" titulo="Ubicación" detalle="Se borra a los 30 días de cada viaje" />
      </GrupoAjustes>

      <GrupoAjustes etiqueta="Sesión">
        <FilaIcono icono="telefono" titulo="Este teléfono" detalle={este ? `Entró ${textoIngreso(este.ultimoIngreso, ahora)}` : 'Con la sesión abierta'} />
        <FilaIcono icono="salir" titulo="Cerrar sesión" detalle="En este teléfono" onClick={() => void salir()} />
      </GrupoAjustes>
      {salida.fallo ? <ErrorCaja fallo={salida.fallo} /> : null}

      <FilaAlerta titulo="Darme de baja" detalle="Te contamos qué se borra y qué guardamos por ley" onClick={() => setHoja('baja')} />

      <HojaPedirDatos abierta={hoja === 'datos'} permiteCodigo={seguridad.segundaVerificacion.metodos.some((m) => m.metodo === 'totp' && m.activo)} onCerrar={() => setHoja(null)} onPedida={async () => { await c.recargar(); setHoja(null); }} />
      <Hoja abierta={hoja === 'aviso'} titulo="Aviso de privacidad" onCerrar={() => setHoja(null)} pie={<Boton onClick={() => setHoja(null)}>Entendido</Boton>}>
        <div className="ui-edicion">
          <ul className="ui-lista-simple">
            {AVISO.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
          <p className="ui-nota">{AVISO_PROVISORIO}</p>
        </div>
      </Hoja>
      <HojaBaja abierta={hoja === 'baja'} onCerrar={() => setHoja(null)} />
    </PantallaSecundaria>
  );
}

function textoExportacion(e: ExportacionDatos | null): string {
  if (!e || e.estado === 'vencida') return 'Te mandamos un archivo en 48 horas';
  if (e.estado === 'pedida') return `Lo estamos armando. Va a estar antes del ${fechaHora(e.listaAntesDe)}`;
  return 'Tu archivo está listo para bajar';
}

function HojaPedirDatos({ abierta, permiteCodigo, onCerrar, onPedida }: { abierta: boolean; permiteCodigo: boolean; onCerrar(): void; onPedida(): Promise<void> }) {
  // Una contraseña equivocada puede venir como 400 o 401: acá no es una sesión vencida.
  const { pendiente, fallo, ejecutar } = useAccion({ publica: true });
  async function pedir(r: Reauth) {
    const x = await ejecutar(() => api.pedirExportacionDatos(r));
    if (x.ok) await onPedida();
  }
  return (
    <HojaReautenticar
      abierta={abierta}
      titulo="Descargar mis datos"
      texto="Te preparamos un archivo con tus datos. Para cuidarlos, confirmá que sos vos. Tarda hasta 48 horas y te avisamos."
      textoBoton="Pedir mis datos"
      textoOcupado="Pidiendo…"
      permiteCodigo={permiteCodigo}
      ocupado={pendiente}
      error={mensajeReauth(fallo)}
      onConfirmar={(r) => void pedir(r)}
      onCerrar={onCerrar}
    />
  );
}

function HojaBaja({ abierta, onCerrar }: { abierta: boolean; onCerrar(): void }) {
  const router = useRouter();
  const { pendiente, fallo, ejecutar } = useAccion();
  async function pedir() {
    const r = await ejecutar(() => api.solicitarBaja());
    if (r.ok) {
      aplicarLetraGrande(false);
      router.replace(RUTAS.acceso.ruta); // la baja cierra las sesiones: para ver el estado se vuelve a entrar
    }
  }
  return (
    <Hoja
      abierta={abierta}
      titulo="¿Darte de baja?"
      onCerrar={onCerrar}
      pie={
        <>
          <Boton variante="peligro" ocupado={pendiente} textoOcupado="Enviando…" onClick={() => void pedir()}>
            Sí, quiero darme de baja
          </Boton>
          <Boton variante="contorno" onClick={onCerrar}>
            No, volver
          </Boton>
        </>
      }
    >
      <div className="ui-edicion">
        <p>Vamos a borrar tu perfil, tus documentos y tus datos personales. Es una baja real, no solo cerrar la sesión.</p>
        <ul className="ui-lista-simple">
          <li>Cerramos todas tus sesiones y dejás de recibir pedidos.</li>
          <li>Mientras la solicitud figure como «solicitada» la podés cancelar volviendo a entrar.</li>
          <li>Una vez en proceso, ya no se puede cancelar.</li>
          <li>Por ley conservamos algunos registros de trabajos y pagos ya hechos, con acceso restringido. Te lo mostramos en el estado de la baja.</li>
        </ul>
        {fallo ? <ErrorCaja fallo={fallo} onReintentar={() => void pedir()} /> : null}
      </div>
    </Hoja>
  );
}
