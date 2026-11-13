'use client';
// Piezas de seguridad (lote 1.4): la hoja que pide la contraseña (o un código) antes de un cambio sensible y la lista
// de códigos de respaldo, que se muestra una sola vez. Nada de esto se guarda en el navegador.
import { useEffect, useId, useState, type FormEvent } from 'react';
import { Boton } from '../atomos/Boton.tsx';
import { Campo } from '../atomos/Controles.tsx';
import { CampoCodigo } from '../moleculas/CampoCodigo.tsx';
import { Hoja } from './Hoja.tsx';
import './cuenta.css';

export interface Reauth {
  password: string | null;
  codigo: string | null;
}

/** Pide la contraseña (o, si la app autenticadora está activa, un código de 6 números) y la manda con `onConfirmar`. */
export function HojaReautenticar({ abierta, titulo, texto, textoBoton, textoOcupado, permiteCodigo, ocupado, error, onConfirmar, onCerrar }: { abierta: boolean; titulo: string; texto: string; textoBoton: string; textoOcupado: string; permiteCodigo: boolean; ocupado: boolean; error: string | null; onConfirmar(r: Reauth): void; onCerrar(): void }) {
  const id = useId();
  const [modo, setModo] = useState<'password' | 'codigo'>('password');
  const [password, setPassword] = useState('');
  const [codigo, setCodigo] = useState('');
  const [local, setLocal] = useState<string | null>(null);

  useEffect(() => {
    if (!abierta) {
      setPassword('');
      setCodigo('');
      setLocal(null);
      setModo('password');
    }
  }, [abierta]);

  function enviar(e: FormEvent) {
    e.preventDefault();
    if (modo === 'password') {
      if (password.length === 0) return setLocal('Escribí tu contraseña.');
      onConfirmar({ password, codigo: null });
    } else {
      if (codigo.length !== 6) return setLocal('Escribí los 6 números que muestra la app.');
      onConfirmar({ password: null, codigo });
    }
    setLocal(null);
  }

  return (
    <Hoja
      abierta={abierta}
      titulo={titulo}
      onCerrar={onCerrar}
      pie={
        <Boton type="submit" form={id} ocupado={ocupado} textoOcupado={textoOcupado}>
          {textoBoton}
        </Boton>
      }
    >
      <form id={id} className="ui-reauth" onSubmit={enviar} noValidate>
        <p>{texto}</p>
        {modo === 'password' ? (
          <Campo etiqueta="Tu contraseña" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} error={local ?? error} />
        ) : (
          <CampoCodigo valor={codigo} onCambio={setCodigo} etiqueta="Código de tu app autenticadora" error={local ?? error} />
        )}
        {permiteCodigo ? (
          <Boton variante="texto" bloque={false} onClick={() => { setModo(modo === 'password' ? 'codigo' : 'password'); setLocal(null); }}>
            {modo === 'password' ? 'Prefiero usar el código de mi app' : 'Prefiero escribir mi contraseña'}
          </Boton>
        ) : null}
      </form>
    </Hoja>
  );
}

/** Los 10 códigos de respaldo: cada uno sirve una sola vez. Se muestran ahora y no se pueden volver a ver. */
export function ListaCodigos({ codigos }: { codigos: readonly string[] }) {
  const [copiado, setCopiado] = useState<'si' | 'no' | null>(null);
  async function copiar() {
    try {
      await navigator.clipboard.writeText(codigos.join('\n'));
      setCopiado('si');
    } catch {
      setCopiado('no');
    }
  }
  return (
    <div className="ui-codigos">
      <ol className="ui-codigos__lista" aria-label="Tus códigos de respaldo">
        {codigos.map((c) => (
          <li key={c}>{c}</li>
        ))}
      </ol>
      <Boton variante="contorno" icono="copiar" onClick={() => void copiar()}>
        Copiar los códigos
      </Boton>
      <p role="status" className="ui-codigos__estado">
        {copiado === 'si' ? 'Copiados. Pegalos en un lugar seguro.' : copiado === 'no' ? 'No pudimos copiarlos. Anotalos a mano.' : ''}
      </p>
    </div>
  );
}
