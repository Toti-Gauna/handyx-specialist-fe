'use client';
// Privacidad y baja (lote 4.8): quién ve qué, el estado de tus documentos, las políticas aceptadas y la baja real de la
// cuenta (no solo cerrar sesión), con lo que se conserva por ley y cuándo se puede cancelar.
import { api } from '@handyx/origen-datos';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { RUTAS } from '../../app/rutas.ts';
import { Cargando, ErrorCaja } from '../../components/Estados.tsx';
import { usePerfil } from '../../components/GuardiaApp.tsx';
import { Hoja } from '../../components/Hoja.tsx';
import { Icono } from '../../components/Icono.tsx';
import { Aviso, Chip, ChipTexto, Dato } from '../../components/ui.tsx';
import { NOMBRE_RUBRO } from '../../contracts/rubros.ts';
import { useAccion } from '../../hooks/useAccion.ts';
import { useCarga } from '../../hooks/useCarga.ts';
import { DOCUMENTO, PRESENCIAL, PRIVACIDAD_VERSION, TERMINOS_VERSION } from '../../lib/etiquetas.ts';
import { BarraSuperior } from '../../kit/Navegacion.tsx';

export function PrivacidadCuenta() {
  const { perfil } = usePerfil();
  const publico = useCarga(() => api.perfilPublico(), []);
  const [baja, setBaja] = useState(false);

  return (
    <div className="fl-pantalla">
      <BarraSuperior titulo="Privacidad y baja" atras={RUTAS.cuenta.ruta} textoAtras="Volver a Cuenta" acciones={null} />

      <section className="ct-tarjeta" aria-labelledby="ct-quien-t">
        <h2 id="ct-quien-t" className="fl-bloque__titulo">
          Quién ve qué
        </h2>
        <p className="tarjeta__titulo">El cliente ve</p>
        {publico.fallo && !publico.datos ? <ErrorCaja fallo={publico.fallo} onReintentar={() => void publico.recargar()} /> : null}
        {publico.datos ? (
          <dl>
            <Dato etiqueta="Tu nombre" valor={publico.datos.nombrePublico ?? '—'} />
            <Dato etiqueta="Rubros habilitados" valor={publico.datos.rubrosHabilitados.map((r) => NOMBRE_RUBRO[r]).join(', ') || 'Ninguno todavía'} />
            <Dato
              etiqueta="Sello de verificación"
              valor={
                publico.datos.verificado ? (
                  <ChipTexto tono="exito" icono="verificado">
                    Verificado por Handyx
                  </ChipTexto>
                ) : (
                  'Sin sello'
                )
              }
            />
          </dl>
        ) : !publico.fallo ? (
          <Cargando />
        ) : null}
        <p className="tarjeta__titulo">Solo el personal autorizado de Handyx ve</p>
        <p className="texto-suave">Tu DNI, tu CUIT o CUIL, tu foto de cara, tu fecha de nacimiento, tu nacionalidad, tu género y tu ubicación real. Los antecedentes no se guardan: solo el resultado de la verificación presencial.</p>
      </section>

      <section className="ct-tarjeta" aria-labelledby="ct-docs-t">
        <h2 id="ct-docs-t" className="fl-bloque__titulo">
          Tus documentos
        </h2>
        <ul className="sin-lista ct-docs">
          {(
            [
              ['DNI', DOCUMENTO[perfil.documentos.dni]],
              ['CUIT o CUIL', DOCUMENTO[perfil.documentos.cuitCuil]],
              ['Foto de cara', DOCUMENTO[perfil.documentos.fotoCara]],
              ['Antecedentes (presencial)', PRESENCIAL[perfil.antecedentes]],
            ] as const
          ).map(([t, e]) => (
            <li key={t}>
              <span>{t}</span>
              <Chip e={e} />
            </li>
          ))}
        </ul>
        <p className="texto-suave texto-chico">Estos estados los registra Operations. Cargar un documento no lo verifica.</p>
      </section>

      <section className="ct-tarjeta" aria-labelledby="ct-politicas-t">
        <h2 id="ct-politicas-t" className="fl-bloque__titulo">
          Políticas
        </h2>
        <dl>
          <Dato etiqueta="Términos aceptados" valor={<span className="codigo">{TERMINOS_VERSION}</span>} />
          <Dato etiqueta="Aviso de privacidad" valor={<span className="codigo">{PRIVACIDAD_VERSION}</span>} />
        </dl>
        <p className="texto-suave texto-chico">Textos provisorios, pendientes de aprobación de Legal.</p>
      </section>

      <button type="button" className="boton boton--peligro boton--bloque" onClick={() => setBaja(true)}>
        <Icono nombre="tacho" /> Eliminar mi cuenta y mis datos
      </button>
      <BajaHoja abierta={baja} onCerrar={() => setBaja(false)} />
    </div>
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
