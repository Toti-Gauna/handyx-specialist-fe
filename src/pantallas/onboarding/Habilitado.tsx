'use client';
// OB-Aprobado · ¡Estás habilitado! (lote 1.2). Aparece sola, una vez, cuando el equipo de verificación te habilita: el
// escudo de verificado (solo con el estado del servidor), los rubros que se activaron y el kit de bienvenida.
// «Empezar» la marca como vista y sigue con los permisos.
import { api } from '@handyx/origen-datos';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { RUTAS } from '../../app/rutas.ts';
import { Cargando, ErrorCaja } from '../../components/Estados.tsx';
import { usePerfil } from '../../components/GuardiaApp.tsx';
import { useAccion } from '../../hooks/useAccion.ts';
import { useCarga } from '../../hooks/useCarga.ts';
import { nombresRubros, plural } from '../../lib/registro.ts';
import { Boton } from '../../ui/atomos/Boton.tsx';
import { Chip } from '../../ui/atomos/Texto.tsx';
import { EscudoVerificado, Remera } from '../../ui/ilustraciones/Estados.tsx';
import { Papelitos } from '../../ui/ilustraciones/Registro.tsx';
import { FilaIcono, Tarjeta } from '../../ui/moleculas/Tarjeta.tsx';
import { AccionFija } from '../../ui/organismos/Acciones.tsx';
import { FalloPaso } from '../registro/comunes.tsx';
import './onboarding.css';

export function Habilitado() {
  const router = useRouter();
  const { perfil } = usePerfil();
  const habilitada = perfil.estadoAlta === 'habilitada';
  const c = useCarga(async () => (habilitada ? Promise.all([api.onboarding(), api.registro()]) : null), [habilitada]);
  const { pendiente, fallo, ejecutar } = useAccion();

  // Sin el estado del servidor no hay sello: si no está habilitado, vuelve a su alta.
  useEffect(() => {
    if (!habilitada) router.replace(RUTAS.alta.ruta);
  }, [habilitada, router]);

  if (c.fallo && !c.datos) return <ErrorCaja pantalla fallo={c.fallo} onReintentar={() => void c.recargar()} />;
  if (!habilitada || !c.datos) return <Cargando />;
  const [ob, r] = c.datos;

  async function empezar() {
    const x = await ejecutar(async () => (ob.bienvenidaVista ? ob : api.marcarOnboarding({ bienvenidaVista: true, version: ob.version })));
    if (x.ok) router.push(RUTAS.obPermisos.ruta);
  }

  return (
    <div className="ui-pantalla ui-pantalla--con-accion ob">
      <div className="ob-festejo">
        <Papelitos />
        <span className="ob-festejo__escudo">
          <EscudoVerificado armar tam="grande" />
        </span>
        <Chip icono="escudo" tono="blanco">
          Verificado por Handyx
        </Chip>
        <h1 className="ui-titulo ui-titulo--grande ob-festejo__titulo">¡Estás habilitado{perfil.nombre ? `, ${perfil.nombre}` : ''}!</h1>
      </div>
      <div className="ui-pantalla__contenido">
        <p className="ob-texto">
          Ya podés recibir pedidos de {nombresRubros(ob.rubrosHabilitados) || 'tus rubros'} en {r.zonas.length ? `tus ${plural(r.zonas.length, 'barrio', 'barrios')}` : 'tus zonas'}. Te armamos tres pasos cortos para arrancar bien.
        </p>
        {r.rubros.some((x) => x.estado !== 'habilitado') ? (
          <p className="ob-nota">
            {nombresRubros(r.rubros.filter((x) => x.estado !== 'habilitado').map((x) => x.rubro))}: se activa cuando verifiquemos la matrícula.
          </p>
        ) : null}
        <Tarjeta>
          <div className="ob-kit">
            <span className="ob-kit__ilu">
              <Remera tam="chico" />
            </span>
            <FilaIcono icono="regalo" titulo="Tu kit de bienvenida" detalle="Remera y manual. Te avisamos cuando puedas elegir el talle." derecha={<Chip icono="estrella" tono="amarillo">Nuevo</Chip>} borde={false} />
          </div>
        </Tarjeta>
        <FalloPaso fallo={fallo} />
      </div>
      <AccionFija>
        <Boton ocupado={pendiente} textoOcupado="Un momento…" onClick={() => void empezar()}>
          Empezar
        </Boton>
      </AccionFija>
    </div>
  );
}
