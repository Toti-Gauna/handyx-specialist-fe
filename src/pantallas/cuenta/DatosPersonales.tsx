'use client';
// CU-Datos (lote 1.4): tus datos y el estado de cada verificación. Lo sensible se ve solo con los últimos números; el
// domicilio ni se muestra (queda cifrado, «solo vos»). Cargar ≠ verificar: el estado lo pone el equipo de verificación.
import { api } from '@handyx/origen-datos';
import { RUTAS } from '../../app/rutas.ts';
import { Cargando, ErrorCaja } from '../../components/Estados.tsx';
import type { EstadoDocumento } from '../../contracts/maquinas.ts';
import type { RegistroEspecialista } from '../../contracts/registro.ts';
import { useCarga } from '../../hooks/useCarga.ts';
import { diaMes, ultimosEnmascarados } from '../../lib/cuenta.ts';
import { DOCUMENTO } from '../../lib/etiquetas.ts';
import { Chip } from '../../ui/atomos/Texto.tsx';
import { BotonEnlace } from '../../ui/atomos/Boton.tsx';
import { ChipEtiqueta } from '../../ui/moleculas/ChipEtiqueta.tsx';
import { FilaDato, GrupoAjustes } from '../../ui/moleculas/Ajustes.tsx';
import { FilaIcono } from '../../ui/moleculas/Tarjeta.tsx';
import { AccionFija } from '../../ui/organismos/Acciones.tsx';
import { BarraCompacta } from '../../ui/organismos/Cabeceras.tsx';
import { PantallaSecundaria } from '../../ui/plantillas/Plantillas.tsx';

/** Si varios documentos van juntos (selfie y DNI), vale el estado más atrasado. */
const ORDEN: readonly EstadoDocumento[] = ['faltante', 'rechazado', 'vencido', 'cargado', 'en_revision', 'verificado'];
const peor = (...e: EstadoDocumento[]): EstadoDocumento => e.reduce((a, b) => (ORDEN.indexOf(b) < ORDEN.indexOf(a) ? b : a));

function detalleAntecedentes(a: RegistroEspecialista['antecedentes']): string {
  if (a.estado === 'verificado') return `Verificados${a.verificadoEn ? ` el ${diaMes(a.verificadoEn)}` : ''}${a.archivoBorrado ? ' · el archivo ya se borró' : ''}`;
  if (a.estado === 'faltante') return 'Todavía no los cargaste';
  if (a.estado === 'rechazado' || a.estado === 'vencido') return 'Hay que volver a cargarlos';
  return 'Cargados · solo los ve el equipo de verificación';
}

export function DatosPersonales() {
  const c = useCarga(() => api.datosYVerificacion(), []);
  if (c.fallo && !c.datos) return <ErrorCaja pantalla fallo={c.fallo} onReintentar={() => void c.recargar()} />;
  if (!c.datos) return <Cargando />;
  const r = c.datos;
  const nombre = [r.datos.nombre, r.datos.apellido].filter(Boolean).join(' ') || 'Sin cargar';
  const dni = peor(r.dni.frente, r.dni.dorso);
  const selfieYDni = peor(r.selfie, dni);
  const verificados = r.certificados.filter((x) => x.estado === 'verificado').length;
  const corregible = r.estadoAlta === 'borrador' || r.estadoAlta === 'requiere_correccion';

  return (
    <PantallaSecundaria
      barra={<BarraCompacta titulo="Datos y verificación" hrefVolver={RUTAS.cuenta.ruta} />}
      accion={
        corregible ? (
          <AccionFija>
            <BotonEnlace href={RUTAS.alta.ruta} icono="editar">
              Corregir mi alta
            </BotonEnlace>
          </AccionFija>
        ) : undefined
      }
    >
      <GrupoAjustes etiqueta="Tus datos">
        <FilaDato rotulo="Nombre" valor={nombre} estado={<ChipEtiqueta e={DOCUMENTO[dni]} texto={dni === 'verificado' ? 'Verificado' : undefined} />} />
        <FilaDato rotulo="Email" valor={r.datos.emailEnmascarado} />
        <FilaDato rotulo="Teléfono" valor={r.datos.telefonoEnmascarado ?? 'Sin cargar'} />
        <FilaDato rotulo="DNI" valor={ultimosEnmascarados(r.dni.ultimos)} estado={<ChipEtiqueta e={DOCUMENTO[dni]} texto={dni === 'verificado' ? 'Verificado' : undefined} />} />
        <FilaDato rotulo="CUIT o CUIL" valor={ultimosEnmascarados(r.cuitCuil.ultimos, ['••', '•••••••'])} estado={<ChipEtiqueta e={DOCUMENTO[r.cuitCuil.estado]} texto={r.cuitCuil.estado === 'verificado' ? 'Verificado' : undefined} />} />
        <FilaDato
          rotulo="Domicilio"
          valor={r.domicilio.cargado ? `${r.domicilio.barrio ?? 'Cargado'} · cifrado` : 'Sin cargar'}
          estado={
            r.domicilio.cargado ? (
              <Chip tono="gris" icono="candado">
                Solo vos
              </Chip>
            ) : undefined
          }
        />
      </GrupoAjustes>

      <GrupoAjustes etiqueta="Documentos">
        <FilaIcono icono="camara" titulo="Selfie y DNI" detalle={selfieYDni === 'verificado' ? 'Verificados' : DOCUMENTO[selfieYDni].texto} derecha={<ChipEtiqueta e={DOCUMENTO[selfieYDni]} texto={selfieYDni === 'verificado' ? 'Verificados' : undefined} />} />
        <FilaIcono icono="escudo" titulo="Antecedentes penales" detalle={detalleAntecedentes(r.antecedentes)} />
        <FilaIcono icono="documento" titulo="Certificados y matrículas" detalle={`${r.certificados.length} cargados · ${verificados} verificados`} href={RUTAS.alta.ruta} />
      </GrupoAjustes>
      {r.motivoRevision ? <p className="ui-nota">{r.motivoRevision}</p> : null}
      <p className="ui-nota">Mostramos solo los últimos números. Para cambiar un dato verificado te pedimos el documento de nuevo.</p>
    </PantallaSecundaria>
  );
}
