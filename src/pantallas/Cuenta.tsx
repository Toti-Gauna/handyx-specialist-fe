'use client';
import { api } from '@handyx/origen-datos';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { RUTAS } from '../app/rutas.ts';
import { Cargando, ErrorCaja } from '../components/Estados.tsx';
import { ContadorFee } from '../components/FeeAviso.tsx';
import { usePerfil } from '../components/GuardiaApp.tsx';
import { Hoja } from '../components/Hoja.tsx';
import { Icono, type NombreIcono } from '../components/Icono.tsx';
import { Aviso, Chip, ChipTexto, Dato, Interruptor, Seccion, Tarjeta } from '../components/ui.tsx';
import { NOMBRE_RUBRO } from '../contracts/rubros.ts';
import { useAccion } from '../hooks/useAccion.ts';
import { useCarga } from '../hooks/useCarga.ts';
import { ALTA, DOCUMENTO, PRESENCIAL, PRIVACIDAD_VERSION, TERMINOS_VERSION } from '../lib/etiquetas.ts';

export function Cuenta() {
  const router = useRouter();
  const { perfil } = usePerfil();
  const fee = useCarga(() => api.feeVigente(), []);
  const publico = useCarga(() => api.perfilPublico(), []);
  const [baja, setBaja] = useState(false);
  const salida = useAccion();
  const info = ALTA[perfil.estadoAlta];

  async function salir() {
    await salida.ejecutar(() => api.salir());
    router.replace(RUTAS.acceso.ruta);
  }

  return (
    <div className="pila">
      <h1 className="titulo">Cuenta</h1>
      <Tarjeta tono="gris">
        <p className="tarjeta__titulo">{[perfil.nombre, perfil.apellido].filter(Boolean).join(' ') || 'Tu cuenta'}</p>
        <p className="texto-suave">{perfil.email}</p>
        <div className="fila-flex">
          <Chip e={info} />
        </div>
      </Tarjeta>

      {fee.fallo && !fee.datos ? <ErrorCaja fallo={fee.fallo} onReintentar={() => void fee.recargar()} /> : null}
      {fee.datos?.politica ? <ContadorFee politica={fee.datos.politica} /> : null}

      <Seccion titulo="Tu alta y tus documentos" accion={<Link href={RUTAS.alta.ruta}>Ver detalle</Link>}>
        <Tarjeta>
          <ul className="sin-lista pila pila--chica">
            {([['DNI', perfil.documentos.dni], ['CUIT o CUIL', perfil.documentos.cuitCuil], ['Foto de cara', perfil.documentos.fotoCara]] as const).map(([t, e]) => (
              <li key={t} className="fila-flex fila-flex--entre">
                <span>{t}</span>
                <Chip e={DOCUMENTO[e]} />
              </li>
            ))}
            <li className="fila-flex fila-flex--entre">
              <span>Antecedentes (presencial)</span>
              <Chip e={PRESENCIAL[perfil.antecedentes]} />
            </li>
          </ul>
          <p className="texto-suave texto-chico">Estos estados los registra Operations. Cargar un documento no lo verifica.</p>
        </Tarjeta>
      </Seccion>

      <Seccion titulo="Quién ve qué">
        <Tarjeta>
          <p className="tarjeta__titulo">El usuario del hogar ve</p>
          {publico.datos ? (
            <>
              <dl>
                <Dato etiqueta="Tu nombre" valor={publico.datos.nombrePublico ?? '—'} />
                <Dato etiqueta="Rubros habilitados" valor={publico.datos.rubrosHabilitados.map((r) => NOMBRE_RUBRO[r]).join(', ') || 'Ninguno todavía'} />
                <Dato etiqueta="Sello de verificación" valor={publico.datos.verificado ? <ChipTexto tono="exito" icono="verificado">Verificado por Handy</ChipTexto> : 'Sin sello'} />
              </dl>
              {!publico.datos.verificado ? <p className="texto-suave texto-chico">El sello aparece solo cuando Handy verificó tu alta completa.</p> : null}
            </>
          ) : (
            <Cargando />
          )}
          <p className="tarjeta__titulo">Solo el personal autorizado de Handy ve</p>
          <p className="texto-suave">Tu DNI, tu CUIT o CUIL, tu foto de cara, tu fecha de nacimiento, tu nacionalidad, tu género y tu ubicación real. Los antecedentes no se guardan: solo el resultado de la verificación presencial.</p>
        </Tarjeta>
      </Seccion>

      <Seccion titulo="Accesos">
        <ul className="lista-tarjetas">
          <Acceso ruta={RUTAS.disponibilidad.ruta} icono="reloj" texto="Mi disponibilidad y cobertura" />
          <Acceso ruta={RUTAS.caja.ruta} icono="caja" texto="Caja: pagos directos" />
          <Acceso ruta={RUTAS.soporte.ruta} icono="pregunta" texto="Ayuda y reclamos" />
          <Acceso ruta={RUTAS.notificaciones.ruta} icono="campana" texto="Avisos" />
        </ul>
      </Seccion>

      <Preferencias />

      <Seccion titulo="Políticas">
        <Tarjeta>
          <dl>
            <Dato etiqueta="Términos aceptados" valor={TERMINOS_VERSION} />
            <Dato etiqueta="Aviso de privacidad" valor={PRIVACIDAD_VERSION} />
          </dl>
          <p className="texto-suave texto-chico">Textos provisorios, pendientes de aprobación de Legal.</p>
        </Tarjeta>
      </Seccion>

      <Seccion titulo="Sesión y datos">
        <button type="button" className="boton boton--claro boton--bloque" onClick={() => void salir()}>
          <Icono nombre="salir" /> Cerrar sesión
        </button>
        <button type="button" className="boton boton--peligro boton--bloque" onClick={() => setBaja(true)}>
          <Icono nombre="tacho" /> Eliminar mi cuenta y mis datos
        </button>
      </Seccion>
      <BajaHoja abierta={baja} onCerrar={() => setBaja(false)} />
    </div>
  );
}

function Acceso({ ruta, icono, texto }: { ruta: string; icono: NombreIcono; texto: string }) {
  return (
    <li>
      <Link className="tarjeta" href={ruta}>
        <span className="fila-flex fila-flex--entre">
          <span className="fila-flex">
            <Icono nombre={icono} /> <strong>{texto}</strong>
          </span>
          <Icono nombre="derecha" />
        </span>
      </Link>
    </li>
  );
}

function Preferencias() {
  const c = useCarga(() => api.preferencias(), []);
  const { pendiente, fallo, ejecutar } = useAccion();
  const p = c.datos;

  async function cambiar(parcial: Partial<{ avisosUrgentes: boolean; avisosProgramados: boolean; avisosMensajes: boolean; avisosPagos: boolean }>) {
    if (!p) return;
    const r = await ejecutar(() => api.guardarPreferencias({ avisosUrgentes: p.avisosUrgentes, avisosProgramados: p.avisosProgramados, avisosMensajes: p.avisosMensajes, avisosPagos: p.avisosPagos, ...parcial }));
    if (r.ok) await c.recargar();
  }
  async function activarPush() {
    const r = await ejecutar(() => api.activarPush());
    if (r.ok) await c.recargar();
  }

  return (
    <Seccion titulo="Avisos">
      {c.fallo && !p ? <ErrorCaja fallo={c.fallo} onReintentar={() => void c.recargar()} /> : null}
      {p ? (
        <Tarjeta>
          {fallo ? <ErrorCaja fallo={fallo} /> : null}
          <Interruptor etiqueta="Pedidos urgentes" descripcion="Avisos distintos de los programados. Para recibir pedidos urgentes tenés que activar “Ahora” en tu disponibilidad." activo={p.avisosUrgentes} deshabilitado={pendiente} onCambio={(v) => void cambiar({ avisosUrgentes: v })} />
          <Interruptor etiqueta="Pedidos programados" activo={p.avisosProgramados} deshabilitado={pendiente} onCambio={(v) => void cambiar({ avisosProgramados: v })} />
          <Interruptor etiqueta="Mensajes" activo={p.avisosMensajes} deshabilitado={pendiente} onCambio={(v) => void cambiar({ avisosMensajes: v })} />
          <Interruptor etiqueta="Pagos" activo={p.avisosPagos} deshabilitado={pendiente} onCambio={(v) => void cambiar({ avisosPagos: v })} />
          <p className="tarjeta__titulo">Avisos del dispositivo</p>
          {p.push === 'activado' ? <ChipTexto tono="exito" icono="check">Activados en este dispositivo</ChipTexto> : null}
          {p.push === 'rechazado' ? (
            <Aviso tono="aviso" icono="alerta">
              Rechazaste el permiso en este dispositivo. Podés cambiarlo desde los ajustes del navegador. La app sigue funcionando: todos los avisos están en la pantalla Avisos.
            </Aviso>
          ) : null}
          {p.push === 'sin_pedir' || p.push === 'rechazado' ? (
            <button type="button" className="boton boton--claro boton--chico" disabled={pendiente} onClick={() => void activarPush()}>
              <Icono nombre="campana" /> Activar avisos del dispositivo
            </button>
          ) : null}
          <p className="texto-suave texto-chico">La entrega de avisos del dispositivo no está garantizada (sobre todo en iPhone). Los avisos importantes siempre quedan en la app.</p>
        </Tarjeta>
      ) : null}
    </Seccion>
  );
}

function BajaHoja({ abierta, onCerrar }: { abierta: boolean; onCerrar(): void }) {
  const router = useRouter();
  const { pendiente, fallo, ejecutar } = useAccion();

  async function pedir() {
    const r = await ejecutar(() => api.solicitarBaja());
    if (r.ok) router.replace(RUTAS.acceso.ruta); // la baja cierra las sesiones: para ver el estado se vuelve a entrar
  }

  return (
    <Hoja abierta={abierta} titulo="¿Eliminar tu cuenta?" onCerrar={onCerrar}>
      <p>Vamos a borrar tu perfil, tus documentos y tus datos personales. Esto es una baja real, no solo cerrar sesión.</p>
      <Aviso tono="aviso" icono="info">
        Por ley conservamos algunos registros de trabajos y pagos ya realizados, con acceso restringido. Te lo mostramos en el estado de la baja.
      </Aviso>
      <ul>
        <li>Cerramos todas tus sesiones y dejás de recibir pedidos.</li>
        <li>Mientras la solicitud figure como “solicitada” podés cancelarla volviendo a entrar.</li>
        <li>Una vez en proceso ya no se puede cancelar.</li>
      </ul>
      {fallo ? <ErrorCaja fallo={fallo} onReintentar={() => void pedir()} /> : null}
      <div className="botones">
        <button type="button" className="boton boton--peligro" disabled={pendiente} onClick={() => void pedir()}>
          {pendiente ? 'Enviando…' : 'Sí, solicitar la baja'}
        </button>
        <button type="button" className="boton boton--claro" onClick={onCerrar}>
          No, volver
        </button>
      </div>
    </Hoja>
  );
}
