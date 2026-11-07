'use client';
// Datos personales (lote 4.8): lo que tenés cargado, de solo lectura. El DNI y el CUIT o CUIL se ven solo con sus
// últimos números. Los datos verificados se cambian con Operations (desde Ayuda), para no perder la verificación.
import { api } from '@handyx/origen-datos';
import Link from 'next/link';
import { RUTAS } from '../../app/rutas.ts';
import { Cargando, ErrorCaja } from '../../components/Estados.tsx';
import { usePerfil } from '../../components/GuardiaApp.tsx';
import { Aviso, Dato } from '../../components/ui.tsx';
import { useCarga } from '../../hooks/useCarga.ts';
import { GENERO } from '../../lib/etiquetas.ts';
import { BarraSuperior } from '../../kit/Navegacion.tsx';

const dmy = (f: string) => f.split('-').reverse().join('/');

export function DatosPersonales() {
  const { perfil } = usePerfil();
  const c = useCarga(() => api.datosAlta(), []);
  const editable = perfil.estadoAlta === 'borrador' || perfil.estadoAlta === 'requiere_correccion';
  const d = c.datos;
  const nada = 'Sin cargar';

  return (
    <div className="fl-pantalla">
      <BarraSuperior titulo="Datos personales" atras={RUTAS.cuenta.ruta} textoAtras="Volver a Cuenta" acciones={null} />
      {c.fallo && !d ? <ErrorCaja fallo={c.fallo} onReintentar={() => void c.recargar()} /> : null}
      {!d && !c.fallo ? <Cargando /> : null}
      {d ? (
        <>
          <section className="ct-tarjeta" aria-labelledby="ct-datos-t">
            <h2 id="ct-datos-t" className="fl-bloque__titulo">
              Tus datos
            </h2>
            <dl>
              <Dato etiqueta="Nombre" valor={[d.nombre ?? perfil.nombre, d.apellido ?? perfil.apellido].filter(Boolean).join(' ') || nada} />
              <Dato etiqueta="Email" valor={perfil.email} />
              <Dato etiqueta="Fecha de nacimiento" valor={d.fechaNacimiento ? dmy(d.fechaNacimiento) : nada} />
              <Dato etiqueta="Nacionalidad" valor={d.nacionalidad ?? nada} />
              <Dato etiqueta="Género" valor={d.genero ? GENERO[d.genero] : nada} />
              <Dato etiqueta="Dónde vivís" valor={[d.barrio, d.ciudad].filter(Boolean).join(', ') || nada} />
              <Dato etiqueta="DNI" valor={d.dniUltimos ? `terminado en ${d.dniUltimos}` : nada} />
              <Dato etiqueta="CUIT o CUIL" valor={d.cuitCuilUltimos ? `terminado en ${d.cuitCuilUltimos}` : nada} />
            </dl>
          </section>
          {editable ? (
            <Link className="boton boton--bloque" href={`${RUTAS.alta.ruta}?paso=datos`}>
              Corregir mis datos
            </Link>
          ) : (
            <Aviso tono="azul" icono="info">
              Tus datos ya están revisados. Para cambiar alguno, escribinos desde el <Link href={RUTAS.soporte.ruta}>Centro de ayuda</Link>: así no perdés la verificación.
            </Aviso>
          )}
          <p className="texto-suave texto-chico">El cliente ve solo tu nombre, tus rubros habilitados y el sello si estás verificado. El resto lo ve solo el personal autorizado de Handyx.</p>
        </>
      ) : null}
    </div>
  );
}
