'use client';
// CU-Disponibilidad (lote 1.4): tus días, horarios y zonas, y si aceptás urgencias. Declarás vos cuándo y dónde querés
// pedidos: no hay obligación de aceptar ninguno y nunca deducimos que estás disponible por tener la app abierta.
// Cada interruptor se guarda al instante; horarios y zonas se editan en una hoja y se guardan con un botón.
import { api } from '@handyx/origen-datos';
import Link from 'next/link';
import { useState } from 'react';
import { RUTAS } from '../app/rutas.ts';
import { Cargando, ErrorCaja } from '../components/Estados.tsx';
import { usePerfil } from '../components/GuardiaApp.tsx';
import type { Disponibilidad as Disp } from '../contracts/dto.ts';
import { NOMBRE_RUBRO } from '../contracts/rubros.ts';
import { useAccion } from '../hooks/useAccion.ts';
import { useCarga } from '../hooks/useCarga.ts';
import { ZONAS } from '../lib/etiquetas.ts';
import { Boton } from '../ui/atomos/Boton.tsx';
import { Campo, Casilla } from '../ui/atomos/Controles.tsx';
import { Chip } from '../ui/atomos/Texto.tsx';
import { FilaAjuste, GrupoAjustes } from '../ui/moleculas/Ajustes.tsx';
import { FilaIcono } from '../ui/moleculas/Tarjeta.tsx';
import { BarraCompacta } from '../ui/organismos/Cabeceras.tsx';
import { Hoja } from '../ui/organismos/Hoja.tsx';
import { PantallaSecundaria } from '../ui/plantillas/Plantillas.tsx';

/** De lunes a domingo, con el número de día del contrato (0 = domingo). */
const DIAS = [
  { dia: 1, corto: 'Lun', largo: 'lunes' },
  { dia: 2, corto: 'Mar', largo: 'martes' },
  { dia: 3, corto: 'Mié', largo: 'miércoles' },
  { dia: 4, corto: 'Jue', largo: 'jueves' },
  { dia: 5, corto: 'Vie', largo: 'viernes' },
  { dia: 6, corto: 'Sáb', largo: 'sábado' },
  { dia: 0, corto: 'Dom', largo: 'domingo' },
] as const;

const horas = (f: { desde: string; hasta: string }) => `${f.desde.replace(/^0/, '')} a ${f.hasta.replace(/^0/, '')}`;

export function Disponibilidad() {
  const { perfil } = usePerfil();
  const c = useCarga(() => api.disponibilidad(), []);
  const habilitada = perfil.estadoAlta === 'habilitada';
  const guardado = useAccion();
  const [dia, setDia] = useState<number | null>(null);
  const [zonas, setZonas] = useState(false);

  if (c.fallo && !c.datos) return <ErrorCaja pantalla fallo={c.fallo} onReintentar={() => void c.recargar()} />;
  if (!c.datos) return <Cargando />;
  const d = c.datos;
  const habilitados = perfil.rubros.filter((r) => r.estado === 'habilitado').map((r) => NOMBRE_RUBRO[r.rubro]);

  /** El refresco va dentro de la acción: hasta tener la versión nueva no se puede cambiar otra cosa (evita el 409). */
  async function guardar(cambio: Partial<Pick<Disp, 'urgentesAhora' | 'programados' | 'franjas' | 'zonas'>>) {
    return guardado.ejecutar(async () => {
      await api.actualizarDisponibilidad({ urgentesAhora: d.urgentesAhora, programados: d.programados, franjas: d.franjas, zonas: d.zonas, ...cambio, version: d.version });
      await c.recargar();
    });
  }

  return (
    <PantallaSecundaria barra={<BarraCompacta titulo="Disponibilidad y zonas" hrefVolver={RUTAS.cuenta.ruta} />}>
      {!habilitada ? (
        <p className="ui-nota">
          Vas a poder recibir pedidos cuando tu alta esté habilitada. <Link href={RUTAS.alta.ruta}>Ver mi alta</Link>. Mientras tanto, podés dejar cargados tus horarios y zonas.
        </p>
      ) : null}
      {guardado.fallo ? <ErrorCaja fallo={guardado.fallo} /> : null}

      <GrupoAjustes>
        <FilaAjuste titulo="Urgentes ahora" detalle="Solo cuando prendés Disponible en el Inicio. Apagarlo no tiene ninguna consecuencia." encendido={d.urgentesAhora} deshabilitado={!habilitada || guardado.pendiente} onCambio={(v) => void guardar({ urgentesAhora: v })} />
        <FilaAjuste titulo="Pedidos programados" detalle="Te llegan para otro día, dentro de tus horarios. No tenés obligación de aceptar." encendido={d.programados} deshabilitado={!habilitada || guardado.pendiente} onCambio={(v) => void guardar({ programados: v })} />
      </GrupoAjustes>

      <GrupoAjustes etiqueta="Horarios">
        {DIAS.map(({ dia: n, corto, largo }) => {
          const f = d.franjas.find((x) => x.dia === n);
          return (
            <div key={n} className="ui-horario">
              <strong>{corto}</strong>
              <span>{f ? horas(f) : 'No trabajo'}</span>
              <Boton variante="contorno" chico bloque={false} icono={f ? 'reloj' : 'mas'} onClick={() => setDia(n)} aria-label={`${f ? 'Editar' : 'Agregar'} el horario del ${largo}`}>
                {f ? 'Editar' : 'Agregar'}
              </Boton>
            </div>
          );
        })}
        <p className="ui-nota ui-horario__nota">Los horarios son una declaración tuya: nunca te imponemos uno.</p>
      </GrupoAjustes>

      <GrupoAjustes>
        <FilaIcono icono="pin" titulo="Zonas" detalle={d.zonas.length > 0 ? d.zonas.join(', ') : 'Todavía no elegiste ninguna'} onClick={() => setZonas(true)} />
        <FilaIcono
          icono="herramienta"
          titulo="Rubros"
          detalle={habilitados.length > 0 ? habilitados.join(' y ') : 'Ninguno habilitado todavía'}
          derecha={perfil.rubros.some((r) => r.estado === 'requiere_matricula') ? <Chip tono="amarillo" icono="alerta">Falta una matrícula</Chip> : undefined}
        />
      </GrupoAjustes>

      <HojaHorario abierta={dia !== null} dia={dia} disp={d} ocupado={guardado.pendiente} onCerrar={() => setDia(null)} onGuardar={async (franjas) => {
        const r = await guardar({ franjas });
        if (r.ok) setDia(null);
      }} />
      <HojaZonas abierta={zonas} elegidas={d.zonas} ocupado={guardado.pendiente} onCerrar={() => setZonas(false)} onGuardar={async (z) => {
        const r = await guardar({ zonas: z });
        if (r.ok) setZonas(false);
      }} />
    </PantallaSecundaria>
  );
}

function HojaHorario({ abierta, dia, disp, ocupado, onCerrar, onGuardar }: { abierta: boolean; dia: number | null; disp: Disp; ocupado: boolean; onCerrar(): void; onGuardar(f: Disp['franjas']): Promise<void> }) {
  const info = DIAS.find((x) => x.dia === dia);
  const actual = disp.franjas.find((f) => f.dia === dia);
  // Se arma de nuevo cada vez que se abre (la hoja se monta con `key`).
  return abierta && info ? <FormHorario key={info.dia} info={info} actual={actual} disp={disp} ocupado={ocupado} onCerrar={onCerrar} onGuardar={onGuardar} /> : <Hoja abierta={false} titulo="Horario" onCerrar={onCerrar}>{null}</Hoja>;
}

function FormHorario({ info, actual, disp, ocupado, onCerrar, onGuardar }: { info: (typeof DIAS)[number]; actual: Disp['franjas'][number] | undefined; disp: Disp; ocupado: boolean; onCerrar(): void; onGuardar(f: Disp['franjas']): Promise<void> }) {
  const [trabaja, setTrabaja] = useState(actual !== undefined);
  const [desde, setDesde] = useState(actual?.desde ?? '08:00');
  const [hasta, setHasta] = useState(actual?.hasta ?? '17:00');
  const [error, setError] = useState<string | null>(null);

  async function guardar() {
    if (trabaja && desde >= hasta) return setError('La hora de inicio tiene que ser anterior a la de fin.');
    setError(null);
    const otras = disp.franjas.filter((f) => f.dia !== info.dia);
    await onGuardar(trabaja ? [...otras, { dia: info.dia, desde, hasta }] : otras);
  }

  return (
    <Hoja abierta titulo={`Horario del ${info.largo}`} onCerrar={onCerrar} pie={<Boton ocupado={ocupado} textoOcupado="Guardando…" onClick={() => void guardar()}>Guardar horario</Boton>}>
      <div className="ui-edicion">
        <Casilla checked={trabaja} onChange={(e) => setTrabaja(e.target.checked)}>
          Trabajo este día
        </Casilla>
        {trabaja ? (
          <>
            <Campo etiqueta="Desde" type="time" value={desde} onChange={(e) => setDesde(e.target.value)} />
            <Campo etiqueta="Hasta" type="time" value={hasta} onChange={(e) => setHasta(e.target.value)} error={error} />
          </>
        ) : (
          <p>Ese día no te vamos a ofrecer pedidos programados.</p>
        )}
      </div>
    </Hoja>
  );
}

function HojaZonas({ abierta, elegidas, ocupado, onCerrar, onGuardar }: { abierta: boolean; elegidas: string[]; ocupado: boolean; onCerrar(): void; onGuardar(z: string[]): Promise<void> }) {
  return abierta ? <FormZonas elegidas={elegidas} ocupado={ocupado} onCerrar={onCerrar} onGuardar={onGuardar} /> : <Hoja abierta={false} titulo="Zonas" onCerrar={onCerrar}>{null}</Hoja>;
}

function FormZonas({ elegidas, ocupado, onCerrar, onGuardar }: { elegidas: string[]; ocupado: boolean; onCerrar(): void; onGuardar(z: string[]): Promise<void> }) {
  const [z, setZ] = useState<string[]>(elegidas);
  return (
    <Hoja abierta titulo="Zonas que cubrís" onCerrar={onCerrar} pie={<Boton ocupado={ocupado} textoOcupado="Guardando…" onClick={() => void onGuardar(z)}>Guardar zonas</Boton>}>
      <div className="ui-edicion">
        <p>Solo ves pedidos de las zonas que marques. No usamos la ubicación del teléfono para esto.</p>
        {ZONAS.map((nombre) => (
          <Casilla key={nombre} checked={z.includes(nombre)} onChange={(e) => setZ(e.target.checked ? [...z, nombre] : z.filter((x) => x !== nombre))}>
            {nombre}
          </Casilla>
        ))}
      </div>
    </Hoja>
  );
}
