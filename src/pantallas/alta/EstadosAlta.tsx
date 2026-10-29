'use client';
// Alta enviada o en revisión, rechazada y habilitada (lote 4.4). La celebración solo cuando se ve el cambio a habilitada.
import Link from 'next/link';
import { useEffect } from 'react';
import { RUTAS } from '../../app/rutas.ts';
import { Handy } from '../../components/Handy.tsx';
import { Icono } from '../../components/Icono.tsx';
import { Aviso, Chip } from '../../components/ui.tsx';
import type { PerfilEspecialista } from '../../contracts/dto.ts';
import { NOMBRE_RUBRO } from '../../contracts/rubros.ts';
import { ALTA, RUBRO_ESTADO } from '../../lib/etiquetas.ts';
import { fechaHora } from '../../lib/formato.ts';
import { useConfeti } from '../../kit/Efectos.tsx';
import { BarraSuperior } from '../../kit/Navegacion.tsx';
import { BotonFijo, LineaDeTiempo, Tilde, type EstadoPaso } from '../../kit/Piezas.tsx';
import { useIrA } from './comunes.tsx';

const ayuda = (
  <Link className="hx-circulo" href={RUTAS.soporte.ruta} aria-label="Ayuda">
    <Icono nombre="pregunta" />
  </Link>
);

export function AltaEnRevision({ perfil }: { perfil: PerfilEspecialista }) {
  const ir = useIrA();
  const docsOk = (['dni', 'cuitCuil', 'fotoCara'] as const).every((k) => perfil.documentos[k] === 'verificado');
  const a = perfil.antecedentes;
  const cita = perfil.citaAntecedentes;
  const estadoDocs: EstadoPaso = docsOk ? 'hecho' : 'actual';
  const estadoAnt: EstadoPaso = a === 'aprobada' ? 'hecho' : docsOk || cita ? 'actual' : 'pendiente';
  const puedeElegirTurno = a === 'pendiente_cita' || a === 'no_asistio' || a === 'cita_coordinada';
  return (
    <div className="al-estado">
      <BarraSuperior titulo="Tu alta" acciones={ayuda} />
      <div className="hx-vacio">
        <Handy nombre="lamparita" alto={110} />
        <h2 className="hx-titulo hx-vacio__titulo">
          Estamos revisando tu <span className="hx-marca">alta</span>
        </h2>
        <p>{ALTA[perfil.estadoAlta].detalle} Suele tardar 1 o 2 días hábiles. Te avisamos por la app.</p>
      </div>
      <LineaDeTiempo
        pasos={[
          { titulo: 'Enviaste tu alta', estado: 'hecho' },
          { titulo: 'Operations revisa tus documentos', detalle: docsOk ? 'Verificados' : 'DNI, CUIT o CUIL, foto y matrícula', estado: estadoDocs },
          {
            titulo: 'Verificación de antecedentes en persona',
            detalle: a === 'aprobada' ? 'Aprobada' : cita ? `Turno: ${fechaHora(cita.inicio)}` : a === 'no_asistio' ? 'No pudiste ir: elegí otro turno' : 'Elegí un turno',
            estado: estadoAnt,
          },
          { titulo: 'Alta habilitada', estado: 'pendiente' },
        ]}
      />
      {puedeElegirTurno ? (
        <button type="button" className="boton boton--claro boton--bloque" onClick={() => ir('antecedentes')}>
          <Icono nombre="calendario" /> {cita ? 'Ver o cambiar mi turno' : 'Elegir mi turno de antecedentes'}
        </button>
      ) : null}
      <Aviso tono="neutro" icono="candado">
        Mientras la revisamos no podés editar tu alta. Si necesitás cambiar algo, escribinos desde <Link href={RUTAS.soporte.ruta}>Ayuda</Link>.
      </Aviso>
    </div>
  );
}

export function AltaRechazada({ perfil }: { perfil: PerfilEspecialista }) {
  return (
    <div className="al-estado">
      <BarraSuperior titulo="Tu alta" acciones={ayuda} />
      <div className="hx-vacio">
        <Handy nombre="llave-rota" alto={110} />
        <h2 className="hx-titulo hx-vacio__titulo">{perfil.estadoAlta === 'suspendida' ? 'Tu alta está suspendida' : 'No pudimos habilitar tu alta'}</h2>
        <p>{perfil.motivoRevision ?? ALTA[perfil.estadoAlta].detalle}</p>
      </div>
      <BotonFijo>
        <Link className="boton boton--bloque" href={RUTAS.soporte.ruta}>
          Escribir a Ayuda
        </Link>
      </BotonFijo>
    </div>
  );
}

/** ¡Tu alta está habilitada! Con `celebrar` (el cambio se vio en esta pantalla) hay confeti; después, el inicio con el fee 0 %. */
export function AltaHabilitada({ perfil, celebrar }: { perfil: PerfilEspecialista; celebrar: boolean }) {
  const confeti = useConfeti();
  const { lanzar } = confeti;
  useEffect(() => {
    if (celebrar) lanzar();
  }, [celebrar, lanzar]);
  const habilitados = perfil.rubros.filter((r) => r.estado === 'habilitado');
  return (
    <div className="al-estado">
      {confeti.capa}
      <BarraSuperior titulo="Tu alta" atras={RUTAS.inicio.ruta} textoAtras="Ir al inicio" acciones={ayuda} />
      <div className="hx-vacio">
        <Tilde />
        <h2 className="hx-titulo hx-vacio__titulo">
          ¡Tu alta está <span className="hx-marca">habilitada</span>!
        </h2>
        <p>Operations verificó tus datos y tus antecedentes. Ya podés recibir pedidos de tus rubros en tus zonas.</p>
      </div>
      <ul className="al-rubros-ok" aria-label="Rubros habilitados">
        {perfil.rubros.map((r) => (
          <li key={r.rubro}>
            <span>{NOMBRE_RUBRO[r.rubro]}</span>
            <Chip e={RUBRO_ESTADO[r.estado]} />
          </li>
        ))}
      </ul>
      {habilitados.length < perfil.rubros.length ? (
        <Aviso tono="aviso" icono="alerta">
          Un rubro todavía no tiene la matrícula verificada: hasta entonces no recibís pedidos de ese rubro.
        </Aviso>
      ) : null}
      <BotonFijo nota="En el inicio activás tu disponibilidad. Elegís vos qué pedidos tomar.">
        <Link className="boton boton--bloque" href={RUTAS.inicio.ruta}>
          Empezar
        </Link>
      </BotonFijo>
    </div>
  );
}
