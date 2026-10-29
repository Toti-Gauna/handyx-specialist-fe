'use client';
// Contraseña nueva (lote 4.2), la abre el enlace del email (?token=…). El token se guarda en memoria y se saca de la
// barra de direcciones apenas se lee: no queda en el historial ni viaja como referer. El servidor dice si el enlace
// sirve; uno vencido, usado o desconocido se ve igual ("venció"), sin revelar nada.
import { api } from '@handyx/origen-datos';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import { RUTAS } from '../app/rutas.ts';
import { CampoClave, Escena } from '../components/Cuenta.tsx';
import { Cargando, ErrorCaja } from '../components/Estados.tsx';
import { Aviso } from '../components/ui.tsx';
import { REGLAS_CLAVE } from '../contracts/dto.ts';
import { useAccion } from '../hooks/useAccion.ts';
import { useCarga } from '../hooks/useCarga.ts';
import { Tilde } from '../kit/Piezas.tsx';
import { enfocarPrimerError } from '../lib/foco.ts';

export function RecuperarNueva() {
  const parametro = useSearchParams().get('token') ?? '';
  const [token] = useState(parametro);
  useEffect(() => {
    if (parametro) window.history.replaceState(null, '', window.location.pathname);
  }, [parametro]);

  const estado = useCarga(() => (token ? api.estadoRecuperacion(token) : Promise.resolve({ estado: 'vencido' as const })), [token]);
  const { pendiente, fallo, ejecutar } = useAccion();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [listo, setListo] = useState(false);

  async function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const err = password.length < REGLAS_CLAVE.minimo ? `Usá al menos ${REGLAS_CLAVE.minimo} caracteres.` : undefined;
    setError(err);
    if (err) return enfocarPrimerError(form);
    const r = await ejecutar(() => api.restablecer({ token, password }));
    if (r.ok) setListo(true);
  }

  if (listo) {
    return (
      <div className="pila">
        <div className="hx-vacio">
          <Tilde />
          <h1 className="hx-titulo cu-titulo">
            Tu contraseña <span className="hx-marca">cambió</span>
          </h1>
          <p>Por seguridad cerramos las sesiones abiertas. Entrá con tu contraseña nueva.</p>
        </div>
        <Link className="boton boton--bloque" href={RUTAS.acceso.ruta}>
          Entrar
        </Link>
      </div>
    );
  }
  if (estado.fallo && !estado.datos) return <ErrorCaja fallo={estado.fallo} onReintentar={() => void estado.recargar()} />;
  if (!estado.datos) return <Cargando />;

  if (estado.datos.estado !== 'valido' || fallo?.tipo === 'conflicto') {
    return (
      <>
        <Escena tono="clara" handy="llave-rota" alto={150} iconos={['reloj', 'candado', 'enviar']} />
        <div className="cu-cabecera">
          <h1 className="hx-titulo cu-titulo">
            El enlace <span className="hx-marca">venció</span>
          </h1>
          <p className="cu-bajada">Los enlaces sirven una sola vez y duran 30 minutos. Pedí otro y abrilo desde el último email que te llegue.</p>
        </div>
        <Link className="boton boton--bloque" href={RUTAS.recuperar.ruta}>
          Pedir otro enlace
        </Link>
        <Link className="boton boton--claro boton--bloque" href={RUTAS.acceso.ruta}>
          Volver a Entrar
        </Link>
      </>
    );
  }

  return (
    <>
      <Escena tono="azul" handy="llave" alto={140} iconos={['candado', 'check', 'escudo']} />
      <form className="cu-form" onSubmit={(e) => void enviar(e)} noValidate>
        <div className="cu-cabecera">
          <h1 className="hx-titulo cu-titulo">
            Elegí una contraseña <span className="hx-marca">nueva</span>
          </h1>
          <p className="cu-bajada">Mínimo {REGLAS_CLAVE.minimo} caracteres. Al cambiarla se cierran las sesiones abiertas.</p>
        </div>
        {fallo ? (
          <Aviso tono="error" icono="alerta" role="alert">
            {fallo.tipo === 'red' || fallo.tipo === 'timeout' ? 'No pudimos conectarnos. Revisá tu conexión y probá de nuevo.' : 'No pudimos cambiar la contraseña. Probá de nuevo.'}
          </Aviso>
        ) : null}
        <CampoClave etiqueta="Contraseña nueva" valor={password} onCambio={setPassword} nueva error={error} />
        <button type="submit" className="boton boton--bloque" disabled={pendiente}>
          {pendiente ? 'Guardando…' : 'Guardar la contraseña'}
        </button>
      </form>
    </>
  );
}
