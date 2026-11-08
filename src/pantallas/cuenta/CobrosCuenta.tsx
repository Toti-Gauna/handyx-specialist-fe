'use client';
// CU-Cobros (lote 1.4): cómo te paga el cliente. Mercado Pago, efectivo y transferencia (el alias o CBU se guarda cifrado y
// vuelve enmascarado). La plata va directo a vos: Handyx no la recibe ni te cobra comisión, nunca. Lo que informás queda
// «por verificar» hasta que se confirma el pago. Handyx nunca te pide la clave de Mercado Pago.
import { api } from '@handyx/origen-datos';
import { useState } from 'react';
import { RUTAS } from '../../app/rutas.ts';
import { Cargando, ErrorCaja } from '../../components/Estados.tsx';
import { AliasCobroSchema, type GuardarMediosCobro, type MediosCobro } from '../../contracts/dto.ts';
import { useAccion } from '../../hooks/useAccion.ts';
import { useCarga } from '../../hooks/useCarga.ts';
import { Boton } from '../../ui/atomos/Boton.tsx';
import { Campo } from '../../ui/atomos/Controles.tsx';
import { Chip } from '../../ui/atomos/Texto.tsx';
import { FilaIcono } from '../../ui/moleculas/Tarjeta.tsx';
import { GrupoAjustes } from '../../ui/moleculas/Ajustes.tsx';
import { AccionFija } from '../../ui/organismos/Acciones.tsx';
import { BarraCompacta } from '../../ui/organismos/Cabeceras.tsx';
import { Hoja } from '../../ui/organismos/Hoja.tsx';
import { PantallaSecundaria } from '../../ui/plantillas/Plantillas.tsx';

type Medio = 'mercadoPago' | 'efectivo' | 'transferencia';

const estado = (activo: boolean) =>
  activo ? (
    <Chip tono="exito" icono="check">
      Activo
    </Chip>
  ) : (
    <Chip tono="gris" icono="mas">
      Agregar
    </Chip>
  );

export function CobrosCuenta() {
  const c = useCarga(() => api.mediosCobro(), []);
  const [medio, setMedio] = useState<Medio | null>(null);
  if (c.fallo && !c.datos) return <ErrorCaja pantalla fallo={c.fallo} onReintentar={() => void c.recargar()} />;
  if (!c.datos) return <Cargando />;
  const m = c.datos;
  const transf = m.transferencia?.activa === true;

  return (
    <PantallaSecundaria
      barra={<BarraCompacta titulo="Medios de cobro" hrefVolver={RUTAS.cuenta.ruta} />}
      accion={
        !transf ? (
          <AccionFija>
            <Boton icono="mas" onClick={() => setMedio('transferencia')}>
              Agregar transferencia
            </Boton>
          </AccionFija>
        ) : undefined
      }
    >
      <p className="ui-banda ui-banda--exito" role="note">
        El cliente te paga directo a vos. Handyx no recibe la plata ni te cobra comisión.
      </p>
      <GrupoAjustes>
        <FilaIcono
          icono="billete"
          titulo="Mercado Pago"
          detalle={m.cuentaMercadoPago.estado === 'vinculada' ? `Cuenta vinculada${m.cuentaMercadoPago.etiqueta ? ` · ${m.cuentaMercadoPago.etiqueta}` : ''}` : 'Cuenta sin vincular'}
          derecha={estado(m.mercadoPago)}
          onClick={() => setMedio('mercadoPago')}
        />
        <FilaIcono icono="billete" titulo="Efectivo" detalle="Lo informás al terminar cada trabajo" derecha={estado(m.efectivo)} onClick={() => setMedio('efectivo')} />
        <FilaIcono icono="documento" titulo="Transferencia" detalle={transf ? `Alias o CBU · ${m.transferencia?.aliasEnmascarado ?? ''}` : 'Alias que le mostrás al cliente'} derecha={estado(transf)} onClick={() => setMedio('transferencia')} />
      </GrupoAjustes>
      <p className="ui-nota">Lo que informás queda «por verificar» hasta que se confirma el pago. Handyx nunca te pide la contraseña de Mercado Pago.</p>
      {medio ? <HojaMedio key={medio} medio={medio} m={m} onCerrar={() => setMedio(null)} alGuardar={async () => { await c.recargar(); setMedio(null); }} /> : null}
    </PantallaSecundaria>
  );
}

const TITULO: Record<Medio, string> = { mercadoPago: 'Mercado Pago', efectivo: 'Efectivo', transferencia: 'Transferencia' };
const TEXTO: Record<Medio, string> = {
  mercadoPago: 'El cliente te paga desde su app a tu cuenta. Se verifica solo cuando Mercado Pago lo confirma. La cuenta se vincula desde Mercado Pago, nunca con tu contraseña.',
  efectivo: 'Lo cobrás en mano al terminar. Lo informás vos y queda «reportado» hasta que se verifica.',
  transferencia: 'Le mostrás tu alias o CBU al cliente después de que te contrate. Se guarda cifrado y acá solo ves las primeras y las últimas letras.',
};

function HojaMedio({ medio, m, onCerrar, alGuardar }: { medio: Medio; m: MediosCobro; onCerrar(): void; alGuardar(): Promise<void> }) {
  const { pendiente, fallo, ejecutar } = useAccion();
  const activo = medio === 'transferencia' ? m.transferencia?.activa === true : m[medio];
  const [alias, setAlias] = useState('');
  const [errorAlias, setErrorAlias] = useState<string | null>(null);
  const otrosActivos = (medio !== 'mercadoPago' && m.mercadoPago) || (medio !== 'efectivo' && m.efectivo) || (medio !== 'transferencia' && m.transferencia?.activa === true);

  async function aplicar(encender: boolean) {
    if (!encender && !otrosActivos) return setErrorAlias('Dejá al menos una forma de cobro: si no, el cliente no tiene cómo pagarte.');
    const cuerpo: GuardarMediosCobro = { efectivo: m.efectivo, mercadoPago: m.mercadoPago, version: m.version };
    if (medio === 'mercadoPago') cuerpo.mercadoPago = encender;
    if (medio === 'efectivo') cuerpo.efectivo = encender;
    if (medio === 'transferencia') {
      if (encender && alias.trim() !== '') {
        if (!AliasCobroSchema.safeParse(alias.trim()).success) return setErrorAlias('Escribí un alias de 6 a 20 letras o números, o un CBU de 22 números.');
        cuerpo.transferencia = { activa: true, alias: alias.trim() };
      } else if (encender && m.transferencia?.aliasEnmascarado) cuerpo.transferencia = { activa: true };
      else if (encender) return setErrorAlias('Escribí tu alias o tu CBU.');
      else cuerpo.transferencia = { activa: false };
    }
    setErrorAlias(null);
    // El refresco va dentro de la acción: el botón se libera con la versión nueva.
    const r = await ejecutar(async () => {
      await api.guardarMediosCobro(cuerpo);
      await alGuardar();
    });
    if (!r.ok && r.fallo.tipo === 'conflicto') await alGuardar();
  }

  return (
    <Hoja
      abierta
      titulo={TITULO[medio]}
      onCerrar={onCerrar}
      pie={
        activo ? (
          <Boton variante="peligro" ocupado={pendiente} textoOcupado="Guardando…" onClick={() => void aplicar(false)}>
            Dejar de usar {TITULO[medio]}
          </Boton>
        ) : (
          <Boton ocupado={pendiente} textoOcupado="Guardando…" onClick={() => void aplicar(true)}>
            Usar {TITULO[medio]}
          </Boton>
        )
      }
    >
      <div className="ui-edicion">
        <p>{TEXTO[medio]}</p>
        {medio === 'transferencia' ? (
          <Campo etiqueta={activo ? 'Cambiar el alias o CBU (opcional)' : 'Tu alias o CBU'} value={alias} onChange={(e) => setAlias(e.target.value)} autoComplete="off" inputMode="text" error={errorAlias} ayuda={m.transferencia?.aliasEnmascarado ? `Guardado: ${m.transferencia.aliasEnmascarado}` : undefined} />
        ) : errorAlias ? (
          <p role="alert" className="ui-campo__error">{errorAlias}</p>
        ) : null}
        {fallo ? <ErrorCaja fallo={fallo} /> : null}
      </div>
    </Hoja>
  );
}
