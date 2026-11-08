'use client';
// Lista de compras de tu equipamiento (lote 2.4): lo que quedó poco o ya no tenés. Se suma a mano o al decir «Ya no la
// tengo». Comprar en una ferretería adherida llega con la ferretería en la app (ola 4): por ahora es tu lista.
import { api } from '@handyx/origen-datos';
import { useId, useState, type FormEvent } from 'react';
import { ErrorCaja } from '../../components/Estados.tsx';
import type { ItemCompra } from '../../contracts/equipamiento.ts';
import { useAccion } from '../../hooks/useAccion.ts';
import { Boton, BotonIcono } from '../../ui/atomos/Boton.tsx';
import { Campo } from '../../ui/atomos/Controles.tsx';
import { Stepper } from '../../ui/moleculas/Controles.tsx';
import { Hoja } from '../../ui/organismos/Hoja.tsx';

const UNIDAD: Record<ItemCompra['unidad'], [string, string]> = {
  unidad: ['unidad', 'unidades'],
  metro: ['metro', 'metros'],
  rollo: ['rollo', 'rollos'],
  caja: ['caja', 'cajas'],
  bolsa: ['bolsa', 'bolsas'],
  kg: ['kg', 'kg'],
  litro: ['litro', 'litros'],
};

export function HojaCompras({ abierta, lista, onCerrar, onCambio }: { abierta: boolean; lista: readonly ItemCompra[]; onCerrar(): void; onCambio(): Promise<void> }) {
  const [nombre, setNombre] = useState('');
  const [cantidad, setCantidad] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const sumar = useAccion();
  const sacar = useAccion();
  const idForm = useId();

  async function enviar(e: FormEvent) {
    e.preventDefault();
    if (!nombre.trim()) return setError('Escribí qué tenés que comprar.');
    setError(null);
    const r = await sumar.ejecutar(async () => {
      await api.sumarListaCompras({ nombre: nombre.trim(), cantidad, unidad: 'unidad' });
      await onCambio();
    });
    if (r.ok) {
      setNombre('');
      setCantidad(1);
    }
  }

  return (
    <Hoja
      abierta={abierta}
      titulo="Lista de compras"
      onCerrar={onCerrar}
      pie={
        <Boton variante="contorno" onClick={onCerrar}>
          Listo
        </Boton>
      }
    >
      <div className="eq-hoja">
        {lista.length ? (
          <ul className="eq-compras">
            {lista.map((c) => (
              <li key={c.id} className="eq-compras__item">
                <span className="eq-compras__texto">
                  <strong>{c.nombre}</strong>
                  <span>
                    {c.cantidad} {UNIDAD[c.unidad][c.cantidad === 1 ? 0 : 1]}
                  </span>
                </span>
                <BotonIcono icono="tacho" etiqueta={`Sacar ${c.nombre} de la lista`} disabled={sacar.pendiente} onClick={() => void sacar.ejecutar(async () => { await api.sacarListaCompras(c.id); await onCambio(); })} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="ui-nota">Tu lista está vacía.</p>
        )}
        {sacar.fallo ? <ErrorCaja fallo={sacar.fallo} /> : null}
        <form id={idForm} className="eq-hoja" onSubmit={(e) => void enviar(e)} noValidate>
          <Campo etiqueta="Sumar a la lista" placeholder="Ej.: tarugos 8 mm" value={nombre} onChange={(e) => setNombre(e.target.value)} error={error} maxLength={120} autoComplete="off" />
          <Stepper etiqueta="Cantidad" valor={cantidad} onCambio={setCantidad} min={1} max={1000} />
          <Boton type="submit" icono="mas" ocupado={sumar.pendiente} textoOcupado="Sumando…">
            Sumar a la lista
          </Boton>
        </form>
        {sumar.fallo ? <ErrorCaja fallo={sumar.fallo} /> : null}
        <p className="ui-nota">Pronto vas a poder pedirla en una ferretería adherida y comparar precios. Handyx no cobra nada por eso.</p>
      </div>
    </Hoja>
  );
}
