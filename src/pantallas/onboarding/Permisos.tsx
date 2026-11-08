'use client';
// OB-Permisos · Antes de empezar (lote 1.2). Para qué sirven los avisos y la ubicación, y cuándo se usan. Los avisos se
// activan acá si querés; la ubicación se pide recién cuando vas a un trabajo (nunca en segundo plano). Se puede seguir
// sin dar ninguno.
import { api } from '@handyx/origen-datos';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { RUTAS } from '../../app/rutas.ts';
import { useAccion } from '../../hooks/useAccion.ts';
import { useCarga } from '../../hooks/useCarga.ts';
import { Boton } from '../../ui/atomos/Boton.tsx';
import { Chip, Titulo } from '../../ui/atomos/Texto.tsx';
import { TarjetaPermiso } from '../../ui/moleculas/Tareas.tsx';
import { AccionFija } from '../../ui/organismos/Acciones.tsx';
import { BarraCompacta } from '../../ui/organismos/Cabeceras.tsx';
import { PantallaSecundaria } from '../../ui/plantillas/Plantillas.tsx';
import { FalloPaso } from '../registro/comunes.tsx';
import './onboarding.css';

const ESTADO_PUSH = {
  activado: { texto: 'Activados', icono: 'check', tono: 'exito' },
  sin_pedir: { texto: 'Sin activar', icono: 'campana', tono: 'gris' },
  rechazado: { texto: 'Bloqueados en el teléfono', icono: 'alerta', tono: 'amarillo' },
  no_disponible: { texto: 'No disponibles', icono: 'alerta', tono: 'gris' },
} as const;

export function Permisos() {
  const router = useRouter();
  const c = useCarga(() => api.preferencias(), []);
  const { pendiente, fallo, ejecutar } = useAccion();
  const push = c.datos?.push ?? 'sin_pedir';
  const e = ESTADO_PUSH[push];
  const seguir = () => router.push(RUTAS.obComoFunciona.ruta);

  async function permitir() {
    const x = await ejecutar(() => api.activarPush());
    if (x.ok) seguir();
  }

  return (
    <PantallaSecundaria
      barra={<BarraCompacta titulo="Antes de empezar" subtitulo="Paso 1 de 3" hrefVolver={RUTAS.obHabilitado.ruta} />}
      accion={
        <AccionFija>
          {push === 'activado' || push === 'no_disponible' ? (
            <Boton onClick={seguir}>Seguir</Boton>
          ) : (
            <>
              <Boton icono="campana" ocupado={pendiente} textoOcupado="Activando…" onClick={() => void permitir()}>
                Permitir avisos
              </Boton>
              <Boton variante="texto" onClick={seguir}>
                Ahora no
              </Boton>
            </>
          )}
        </AccionFija>
      }
    >
      <Titulo nivel={2} antes="Dos " marcado="permisos" despues=" que te sirven" />
      <TarjetaPermiso
        icono="campana"
        titulo="Avisos"
        activo={push === 'activado'}
        para="Para enterarte de pedidos nuevos, respuestas de los clientes y pagos verificados."
        cuando="Los apagás o elegís cuáles en Cuenta → Notificaciones. Que lleguen no está garantizado: lo importante siempre queda en la app."
        estado={
          <Chip icono={e.icono} tono={e.tono}>
            {e.texto}
          </Chip>
        }
      />
      <TarjetaPermiso
        icono="pin"
        titulo="Ubicación"
        para="Solo mientras vas a un trabajo, para que el cliente sepa cuánto falta."
        cuando="Nunca en segundo plano ni cuando estás No disponible. Te la pedimos recién la primera vez que salgas para un trabajo."
        estado={
          <Chip icono="reloj" tono="gris">
            Se pide después
          </Chip>
        }
      />
      <p className="ob-nota">Podés seguir sin darlos; algunas funciones te lo van a pedir en el momento.</p>
      <FalloPaso fallo={fallo} />
      <p className="ob-nota">
        <Link href={RUTAS.obPrimerosPasos.ruta}>Saltear y ver los primeros pasos</Link>
      </p>
    </PantallaSecundaria>
  );
}
