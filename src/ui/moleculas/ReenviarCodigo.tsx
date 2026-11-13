'use client';
// «¿No llegó?» del kit v3 (lote 1.1, D6-Codigo y D6-Login2FA): mientras el servidor no deja pedir otro código, dice
// cuánto falta («Pedí otro en 0:42»); después, el botón «Pedir otro código». La cuenta regresiva no es un límite para
// la persona (el código sigue sirviendo): solo evita mandar diez. El lector no la escucha segundo a segundo: el
// botón aparece y se anuncia una vez. Al lado, una alternativa opcional («Probar con SMS»).
import { useEffect, useState, type ReactNode } from 'react';
import { esperaEnPalabras, segundosHasta, textoEspera } from '../logicaAcceso.ts';

/** Lo que escucha el lector (fijo, para no anunciar cada segundo): el servidor pide esperar un minuto. */
const ESPERA_LEIDA = 60;

export function ReenviarCodigo({ desde, ahora, onReenviar, ocupado = false, alternativa }: { desde: string; ahora(): Date; onReenviar(): void; ocupado?: boolean; alternativa?: ReactNode }) {
  const [faltan, setFaltan] = useState(() => segundosHasta(desde, ahora().getTime()));
  useEffect(() => {
    setFaltan(segundosHasta(desde, ahora().getTime()));
    const t = window.setInterval(() => {
      const f = segundosHasta(desde, ahora().getTime());
      setFaltan(f);
      if (f === 0) window.clearInterval(t);
    }, 1000);
    return () => window.clearInterval(t);
  }, [desde, ahora]);

  return (
    <div className="ui-reenviar">
      <span className="ui-reenviar__estado" aria-live="polite">
        {faltan > 0 ? (
          <span className="ui-reenviar__espera">
            <span aria-hidden="true">¿No llegó? Pedí otro en {textoEspera(faltan)}</span>
            <span className="visualmente-oculto">¿No llegó? En {esperaEnPalabras(ESPERA_LEIDA)} o menos vas a poder pedir otro código.</span>
          </span>
        ) : (
          <button type="button" className="ui-reenviar__boton" disabled={ocupado} aria-busy={ocupado || undefined} onClick={onReenviar}>
            {ocupado ? 'Pidiendo otro…' : 'Pedir otro código'}
          </button>
        )}
      </span>
      {alternativa ? <span className="ui-reenviar__alternativa">{alternativa}</span> : null}
    </div>
  );
}
