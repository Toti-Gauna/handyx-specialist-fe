'use client';
// Verificar el email (lote 4.2): el código de 6 números que mandó el servidor. Se verifica solo al completar el código,
// se puede pedir otro cuando pasa la espera, y "Cambiar el email" vuelve a empezar (la cuenta sin verificar vence sola).
import { api, ayudasPrueba } from '@handyx/origen-datos';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { RUTAS } from '../app/rutas.ts';
import { CuentaCreada, Escena } from '../components/Cuenta.tsx';
import { Cargando, ErrorCaja } from '../components/Estados.tsx';
import { Aviso } from '../components/ui.tsx';
import { useAccion } from '../hooks/useAccion.ts';
import { useAhora } from '../hooks/useAhora.ts';
import { useCarga } from '../hooks/useCarga.ts';
import { CampoCodigo, LARGO_CODIGO } from '../kit/CampoCodigo.tsx';
import { enfocarPrimerError } from '../lib/foco.ts';

function espera(hasta: string, ahora: Date): string | null {
  const s = Math.ceil((Date.parse(hasta) - ahora.getTime()) / 1000);
  if (s <= 0) return null;
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export function Verificar() {
  const router = useRouter();
  const c = useCarga(() => api.estadoVerificacion(), []);
  const verificar = useAccion();
  const reenvio = useAccion();
  const ahora = useAhora();
  const [codigo, setCodigo] = useState('');
  const [listo, setListo] = useState(false);

  async function enviar(v: string) {
    const r = await verificar.ejecutar(() => api.verificarEmail({ codigo: v }));
    if (r.ok) setListo(true);
    else {
      setCodigo('');
      verificar.nueva();
      await c.recargar(); // intentos que quedan
      enfocarPrimerError(document.querySelector('.hx-codigo'));
    }
  }

  async function otroCodigo() {
    const r = await reenvio.ejecutar(async () => {
      await api.reenviarCodigo();
      await c.recargar();
    });
    if (r.ok) {
      setCodigo('');
      verificar.limpiar();
    }
  }

  async function cambiarEmail() {
    await api.salir();
    router.replace(RUTAS.registro.ruta);
  }

  // Sin sesión o ya verificada: la Puerta sabe a dónde ir.
  const otraParte = c.fallo?.tipo === 'sesion' || c.fallo?.tipo === 'conflicto';
  useEffect(() => {
    if (otraParte) router.replace(RUTAS.puerta.ruta);
  }, [otraParte, router]);

  if (listo) return <CuentaCreada />;
  if (otraParte) return <Cargando />;
  if (c.fallo && !c.datos) return <ErrorCaja fallo={c.fallo} onReintentar={() => void c.recargar()} />;
  if (!c.datos) return <Cargando />;

  const v = c.datos;
  const falta = espera(v.reenviarDesde, ahora);
  const error = verificar.fallo ? (verificar.fallo.detalle?.mensaje ?? 'No pudimos verificar el código. Probá de nuevo.') : null;
  const bloqueado = v.intentosRestantes === 0 || verificar.fallo?.tipo === 'limite';

  return (
    <>
      <Escena tono="azul" handy="lamparita" alto={150} iconos={['enviar', 'candado', 'check']} />
      <div className="cu-cabecera">
        <h1 className="hx-titulo cu-titulo">
          Revisá tu <span className="hx-marca">email</span>
        </h1>
        <p className="cu-bajada">
          Te mandamos un código de 6 números a <strong>{v.emailEnmascarado}</strong>. Vence en 10 minutos.
        </p>
      </div>

      <CampoCodigo valor={codigo} onCambio={setCodigo} onCompleto={(x) => void enviar(x)} error={error} deshabilitado={bloqueado} />
      <button type="button" className="boton boton--bloque" disabled={codigo.length < LARGO_CODIGO || verificar.pendiente || bloqueado} onClick={() => void enviar(codigo)}>
        {verificar.pendiente ? 'Verificando…' : 'Verificar'}
      </button>

      <p className="cu-reenvio" aria-live="polite">
        {falta ? (
          <span>Podés pedir otro código en {falta}.</span>
        ) : (
          <button type="button" className="boton boton--fantasma" disabled={reenvio.pendiente} onClick={() => void otroCodigo()}>
            {reenvio.pendiente ? 'Mandando…' : 'Mandarme otro código'}
          </button>
        )}
        {reenvio.fallo ? <span role="alert">{reenvio.fallo.detalle?.mensaje ?? 'No pudimos mandar otro código.'}</span> : null}
        <button type="button" className="boton boton--fantasma" onClick={() => void cambiarEmail()}>
          Cambiar el email
        </button>
      </p>

      {ayudasPrueba ? (
        <Aviso tono="aviso" titulo="Vista previa con datos de prueba">
          No se manda ningún email. El código de prueba es <strong className="codigo">{ayudasPrueba.codigoEmail}</strong>.
        </Aviso>
      ) : null}
    </>
  );
}
