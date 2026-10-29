'use client';
import { api } from '@handyx/origen-datos';
import { useEffect, useState, type FormEvent } from 'react';
import { monto } from '../contracts/dinero.ts';
import type { Trabajo } from '../contracts/dto.ts';
import { useAccion } from '../hooks/useAccion.ts';
import { enfocarPrimerError } from '../lib/foco.ts';
import { aInputLocal, centavosDesdeTexto, deInputLocal, pesos } from '../lib/formato.ts';
import { ErrorCaja } from './Estados.tsx';
import { Hoja } from './Hoja.tsx';
import { Aviso, AreaTexto, Campo } from './ui.tsx';

/**
 * Proponer una fecha alternativa (y, si hace falta, otro importe o alcance). Es una PROPUESTA: el acuerdo vigente
 * no cambia hasta que la otra parte la acepte, y el historial queda guardado.
 */
export function FormCambio({ abierta, onCerrar, trabajo, onEnviada }: { abierta: boolean; onCerrar(): void; trabajo: Trabajo; onEnviada(): void }) {
  const { pendiente, fallo, ejecutar, clave, nueva, limpiar } = useAccion();
  const [inicio, setInicio] = useState('');
  const [importe, setImporte] = useState('');
  const [alcance, setAlcance] = useState('');
  const [errores, setErrores] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!abierta) return;
    setInicio(aInputLocal(new Date(Date.parse(trabajo.acuerdo.horario.inicio) + 24 * 3_600_000).toISOString()));
    setImporte(String(trabajo.acuerdo.monto.centavos / 100));
    setAlcance(trabajo.acuerdo.alcance);
    setErrores({});
    limpiar();
    nueva();
  }, [abierta, trabajo, limpiar, nueva]);

  async function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const err: Record<string, string> = {};
    const horario = deInputLocal(inicio);
    const centavos = centavosDesdeTexto(importe);
    if (!horario || Date.parse(horario) <= api.ahora().getTime()) err.inicio = 'Elegí una fecha y una hora a futuro.';
    if (centavos === null || centavos <= 0) err.importe = 'Escribí un importe en pesos.';
    if (!alcance.trim()) err.alcance = 'Contá qué incluye.';
    setErrores(err);
    if (Object.keys(err).length > 0 || !horario || centavos === null) return enfocarPrimerError(form);
    const igual = centavos === trabajo.acuerdo.monto.centavos;
    const r = await ejecutar(() => api.proponerCambio(trabajo.id, { horario: { inicio: horario, fin: null }, alcance: alcance.trim(), monto: igual ? null : monto(centavos) }, clave()));
    if (r.ok) onEnviada();
  }

  return (
    <Hoja abierta={abierta} titulo="Proponer otra fecha" onCerrar={onCerrar}>
      <form className="pila" onSubmit={(e) => void enviar(e)} noValidate>
        <Aviso tono="neutro" icono="info">
          Acuerdo vigente: {pesos(trabajo.acuerdo.monto)}. Sigue valiendo hasta que el usuario acepte tu propuesta; si la rechaza, no cambia nada.
        </Aviso>
        {fallo ? <ErrorCaja fallo={fallo} /> : null}
        <Campo etiqueta="Nueva fecha y hora" type="datetime-local" value={inicio} onChange={(e) => setInicio(e.target.value)} error={errores.inicio} ayuda="Hora de Mar del Plata." />
        <Campo etiqueta="Importe (en pesos)" inputMode="decimal" value={importe} onChange={(e) => setImporte(e.target.value)} error={errores.importe} ayuda="Dejalo igual si solo cambia la fecha." />
        <AreaTexto etiqueta="Qué incluye" value={alcance} onChange={(e) => setAlcance(e.target.value)} error={errores.alcance} maxLength={2000} />
        <button type="submit" className="boton boton--bloque" disabled={pendiente}>
          {pendiente ? 'Enviando…' : 'Enviar propuesta de cambio'}
        </button>
      </form>
    </Hoja>
  );
}
