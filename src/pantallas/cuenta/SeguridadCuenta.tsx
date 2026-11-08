'use client';
// D6-Seguridad (lote 1.4): la segunda verificación (opcional), tus dispositivos y los códigos de respaldo. La app
// autenticadora es la recomendada (anda sin señal); el SMS queda como «Todavía no disponible» mientras no haya proveedor
// autorizado (el servidor responde 503); el email se prende o se apaga acá. Los cambios sensibles piden la contraseña o un
// código. Los códigos de respaldo se muestran UNA vez y nunca se guardan en el navegador.
import { api } from '@handyx/origen-datos';
import { useState } from 'react';
import { RUTAS } from '../../app/rutas.ts';
import { Cargando, ErrorCaja } from '../../components/Estados.tsx';
import type { Seguridad } from '../../contracts/seguridad.ts';
import { useAccion } from '../../hooks/useAccion.ts';
import { useAhora } from '../../hooks/useAhora.ts';
import { useCarga } from '../../hooks/useCarga.ts';
import { textoIngreso } from '../../lib/avisos.ts';
import { mensajeReauth } from '../../lib/cuenta.ts';
import { Boton, BotonEnlace } from '../../ui/atomos/Boton.tsx';
import { Chip } from '../../ui/atomos/Texto.tsx';
import { FilaMetodo, GrupoAjustes } from '../../ui/moleculas/Ajustes.tsx';
import { FilaIcono } from '../../ui/moleculas/Tarjeta.tsx';
import { AccionFija } from '../../ui/organismos/Acciones.tsx';
import { BarraCompacta } from '../../ui/organismos/Cabeceras.tsx';
import { Hoja } from '../../ui/organismos/Hoja.tsx';
import { HojaReautenticar, ListaCodigos, type Reauth } from '../../ui/organismos/Seguridad.tsx';
import { PantallaSecundaria } from '../../ui/plantillas/Plantillas.tsx';
import { Mosaico } from '../../ui/moleculas/Mosaico.tsx';

type Metodo = Seguridad['segundaVerificacion']['metodos'][number];
type Hojas = { tipo: 'cambiar'; metodo: 'totp' | 'email'; activar: boolean } | { tipo: 'respaldo' } | { tipo: 'dispositivos' } | null;

const NOMBRE: Record<Metodo['metodo'], string> = { totp: 'App autenticadora', sms: 'SMS al teléfono', email: 'Email' };
const ICONO = { totp: 'llave', sms: 'telefono', email: 'sobre' } as const;
const DETALLE: Record<Metodo['metodo'], string> = {
  totp: 'Google Authenticator, Microsoft o la que uses · funciona sin señal',
  sms: '',
  email: '',
};

export function SeguridadCuenta() {
  const c = useCarga(() => api.seguridad(), []);
  const ahora = useAhora(60_000);
  const [hoja, setHoja] = useState<Hojas>(null);
  // Los códigos nuevos viven solo en esta memoria, hasta que se cierra la hoja.
  const [codigos, setCodigos] = useState<readonly string[] | null>(null);
  const accion = useAccion({ publica: true });
  const cierre = useAccion();
  if (c.fallo && !c.datos) return <ErrorCaja pantalla fallo={c.fallo} onReintentar={() => void c.recargar()} />;
  if (!c.datos) return <Cargando />;
  const s = c.datos;
  const totp = s.segundaVerificacion.metodos.find((m) => m.metodo === 'totp');
  const activa = s.segundaVerificacion.activa;

  function cerrarHoja() {
    setHoja(null);
    accion.limpiar();
  }
  async function cambiar(metodo: 'totp' | 'email', activo: boolean, r: Reauth) {
    const x = await accion.ejecutar(async () => {
      await api.cambiarSegundaVerificacion({ metodo, activo, reautenticacion: r, version: s.version });
      await c.recargar();
    });
    if (x.ok) cerrarHoja();
  }
  async function generar(r: Reauth) {
    const x = await accion.ejecutar(async () => {
      const nuevos = await api.generarCodigosRespaldo(r);
      await c.recargar();
      return nuevos;
    });
    if (x.ok) {
      cerrarHoja();
      setCodigos(x.valor.codigos);
    }
  }
  async function cerrarDispositivo(id: string) {
    await cierre.ejecutar(async () => {
      await api.cerrarDispositivo(id);
      await c.recargar();
    });
  }

  return (
    <PantallaSecundaria
      barra={<BarraCompacta titulo="Seguridad" hrefVolver={RUTAS.cuenta.ruta} />}
      accion={
        !totp?.activo ? (
          <AccionFija>
            <BotonEnlace href={RUTAS.cuentaSeguridadApp.ruta} icono="llave">
              Activar la app autenticadora
            </BotonEnlace>
          </AccionFija>
        ) : undefined
      }
    >
      <section className="ui-seg-cab" aria-labelledby="seg-t">
        <Mosaico icono="escudo" tam="grande" tono="azul" />
        <div>
          <h2 id="seg-t">Segunda verificación</h2>
          <p>Opcional. Además del código, te pedimos otra prueba al entrar desde un teléfono nuevo.</p>
        </div>
      </section>

      <div className="ui-metodos">
        {s.segundaVerificacion.metodos.map((m) => {
          const chip = m.activo ? (
            <Chip tono="exito" icono="check">
              Activa
            </Chip>
          ) : !m.disponible ? (
            <Chip tono="gris" icono="reloj">
              Todavía no disponible
            </Chip>
          ) : m.metodo === 'totp' ? (
            <Chip tono="amarillo" icono="estrella">
              Recomendada
            </Chip>
          ) : undefined;
          const detalle = m.metodo === 'totp' ? DETALLE.totp : m.detalle;
          if (m.metodo === 'totp' && !m.activo) return <FilaMetodo key={m.metodo} icono={ICONO.totp} titulo={NOMBRE.totp} detalle={detalle} destacado chip={chip} href={RUTAS.cuentaSeguridadApp.ruta} />;
          return (
            <FilaMetodo
              key={m.metodo}
              icono={ICONO[m.metodo]}
              titulo={NOMBRE[m.metodo]}
              detalle={m.metodo === 'email' ? m.detalle : detalle}
              destacado={m.metodo === 'totp'}
              chip={chip}
              deshabilitado={!m.disponible}
              onClick={m.metodo === 'sms' ? undefined : () => setHoja({ tipo: 'cambiar', metodo: m.metodo as 'totp' | 'email', activar: !m.activo })}
            />
          );
        })}
      </div>
      {s.segundaVerificacion.metodos.some((m) => !m.disponible) ? <p className="ui-nota">El SMS se suma cuando tengamos un proveedor autorizado. Mientras tanto, usá la app o el email.</p> : null}

      <GrupoAjustes>
        <FilaIcono icono="telefono" titulo="Tus dispositivos" detalle={dispositivoActual(s, ahora)} onClick={() => setHoja({ tipo: 'dispositivos' })} />
        <FilaIcono
          icono="llave"
          titulo="Códigos de respaldo"
          detalle={activa ? (s.codigosRespaldo.restantes > 0 ? `Te quedan ${s.codigosRespaldo.restantes} códigos por si perdés el teléfono` : '10 códigos por si perdés el teléfono') : 'Primero activá la segunda verificación'}
          onClick={activa ? () => setHoja({ tipo: 'respaldo' }) : undefined}
        />
      </GrupoAjustes>

      <HojaReautenticar
        abierta={hoja?.tipo === 'cambiar'}
        titulo={hoja?.tipo === 'cambiar' ? `${hoja.activar ? 'Activar' : 'Apagar'}: ${NOMBRE[hoja.metodo]}` : 'Confirmá que sos vos'}
        texto={hoja?.tipo === 'cambiar' && !hoja.activar ? 'Si la apagás, tu cuenta queda menos protegida. Confirmá que sos vos para seguir.' : 'Confirmá que sos vos para seguir.'}
        textoBoton={hoja?.tipo === 'cambiar' ? (hoja.activar ? 'Activar' : 'Apagar') : 'Seguir'}
        textoOcupado="Guardando…"
        permiteCodigo={totp?.activo === true}
        ocupado={accion.pendiente}
        error={mensajeReauth(accion.fallo)}
        onConfirmar={(r) => hoja?.tipo === 'cambiar' && void cambiar(hoja.metodo, hoja.activar, r)}
        onCerrar={cerrarHoja}
      />
      <HojaReautenticar
        abierta={hoja?.tipo === 'respaldo'}
        titulo="Códigos de respaldo nuevos"
        texto="Vas a ver 10 códigos nuevos. Los que tenías dejan de servir. Confirmá que sos vos para seguir."
        textoBoton="Ver los códigos nuevos"
        textoOcupado="Armando los códigos…"
        permiteCodigo={totp?.activo === true}
        ocupado={accion.pendiente}
        error={mensajeReauth(accion.fallo)}
        onConfirmar={(r) => void generar(r)}
        onCerrar={cerrarHoja}
      />
      <Hoja abierta={codigos !== null} titulo="Tus códigos de respaldo" cerrable={false} pie={<Boton onClick={() => setCodigos(null)}>Ya los guardé</Boton>} onCerrar={() => setCodigos(null)}>
        <div className="ui-edicion">
          <p>Cada código sirve una sola vez. Guardalos en un lugar seguro: no los vas a poder ver de nuevo.</p>
          {codigos ? <ListaCodigos codigos={codigos} /> : null}
        </div>
      </Hoja>
      <Hoja abierta={hoja?.tipo === 'dispositivos'} titulo="Tus dispositivos" onCerrar={cerrarHoja}>
        <div className="ui-edicion">
          {cierre.fallo ? <ErrorCaja fallo={cierre.fallo} /> : null}
          <ul className="ui-dispositivos">
            {s.dispositivos.map((d) => (
              <li key={d.id}>
                <span>
                  <strong>{d.nombre}</strong>
                  <span>
                    Entró {textoIngreso(d.ultimoIngreso, ahora)}
                    {d.recordado ? ' · lo recordamos' : ''}
                  </span>
                </span>
                {d.esEste ? (
                  <Chip tono="tinte" icono="check">
                    Este teléfono
                  </Chip>
                ) : (
                  <Boton variante="contorno" chico bloque={false} ocupado={cierre.pendiente} textoOcupado="Cerrando…" onClick={() => void cerrarDispositivo(d.id)} aria-label={`Cerrar la sesión de ${d.nombre}`}>
                    Cerrar sesión
                  </Boton>
                )}
              </li>
            ))}
          </ul>
        </div>
      </Hoja>
    </PantallaSecundaria>
  );
}

function dispositivoActual(s: Seguridad, ahora: Date): string {
  const este = s.dispositivos.find((d) => d.esEste);
  return este ? `Este teléfono · entró ${textoIngreso(este.ultimoIngreso, ahora)}` : `${s.dispositivos.length} con la sesión abierta`;
}
