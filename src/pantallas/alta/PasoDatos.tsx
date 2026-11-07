'use client';
// Paso 1 · Tus datos (lote 4.4): una pregunta por pantalla, con el teclado y el autocompletado de cada dato. Cada
// "Siguiente" guarda ese dato: se puede dejar en cualquier momento y seguir después.
import { api } from '@handyx/origen-datos';
import { useRef, useState, type FormEvent } from 'react';
import { ErrorCaja } from '../../components/Estados.tsx';
import { Aviso, Campo } from '../../components/ui.tsx';
import { GENEROS, GuardarDatosAltaSchema, type DatosAlta } from '../../contracts/dto.ts';
import { useAccion } from '../../hooks/useAccion.ts';
import { en } from '../../lib/geo.ts';
import { GENERO } from '../../lib/etiquetas.ts';
import { BotonFijo } from '../../kit/Piezas.tsx';
import { MarcoPaso, type PropsPaso } from './comunes.tsx';

type Clave = 'nombre' | 'apellido' | 'fechaNacimiento' | 'nacionalidad' | 'genero' | 'ciudad' | 'barrio';

interface Pregunta {
  clave: Clave;
  pregunta: string;
  etiqueta: string;
  opcional?: boolean;
  ayuda?: string;
  props?: Record<string, string>;
}

const PREGUNTAS: Pregunta[] = [
  { clave: 'nombre', pregunta: '¿Cómo te llamás?', etiqueta: 'Nombre', props: { autoComplete: 'given-name', autoCapitalize: 'words' } },
  { clave: 'apellido', pregunta: '¿Y tu apellido?', etiqueta: 'Apellido', props: { autoComplete: 'family-name', autoCapitalize: 'words' } },
  { clave: 'fechaNacimiento', pregunta: '¿Cuándo naciste?', etiqueta: 'Fecha de nacimiento', ayuda: 'Para trabajar con Handyx tenés que ser mayor de edad.', props: { type: 'date', autoComplete: 'bday', min: '1930-01-01', max: '2008-12-31' } },
  { clave: 'nacionalidad', pregunta: '¿Cuál es tu nacionalidad?', etiqueta: 'Nacionalidad', props: { autoComplete: 'country-name' } },
  { clave: 'genero', pregunta: '¿Con qué género te identificás?', etiqueta: 'Género', ayuda: 'Es un dato de tu perfil. Podés elegir no decirlo.' },
  { clave: 'ciudad', pregunta: '¿En qué ciudad vivís?', etiqueta: 'Ciudad', props: { autoComplete: 'address-level2' } },
  { clave: 'barrio', pregunta: '¿En qué barrio?', etiqueta: 'Barrio (opcional)', opcional: true, ayuda: 'No hace falta la dirección: solo el barrio.' },
];

const valorDe = (d: DatosAlta, k: Clave): string => d[k] ?? '';

export function PasoDatos({ datos, recargar, alTerminar }: PropsPaso) {
  // Arranca en la primera pregunta sin responder.
  const [i, setI] = useState(() => Math.max(0, PREGUNTAS.findIndex((p) => !p.opcional && !valorDe(datos, p.clave))));
  const p = en(PREGUNTAS, i);
  // Lo ya respondido en esta pantalla (para volver con "Anterior" sin esperar a que se recargue el alta).
  const [respuestas, setRespuestas] = useState<Record<Clave, string>>(() => Object.fromEntries(PREGUNTAS.map((q) => [q.clave, valorDe(datos, q.clave)])) as Record<Clave, string>);
  const [valor, setValor] = useState(() => respuestas[p.clave]);
  const [error, setError] = useState<string | null>(null);
  const { pendiente, fallo, ejecutar } = useAccion();
  const entrada = useRef<HTMLInputElement>(null);
  const enfocar = () => entrada.current?.focus();

  function irA(n: number) {
    const q = PREGUNTAS[n];
    if (!q) return alTerminar();
    setI(n);
    setValor(respuestas[q.clave]);
    setError(null);
  }

  async function siguiente(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const v = valor.trim();
    if (!v) {
      if (p.opcional) return irA(i + 1);
      setError(p.clave === 'genero' ? 'Elegí una opción (podés elegir no decirlo).' : `Completá tu ${p.etiqueta.toLowerCase()}.`);
      return enfocar();
    }
    const cuerpo = { [p.clave]: v, version: datos.version };
    const ok = GuardarDatosAltaSchema.safeParse(cuerpo);
    if (!ok.success) {
      setError('Revisá este dato.');
      return enfocar();
    }
    if (v === valorDe(datos, p.clave)) return irA(i + 1);
    setRespuestas((r) => ({ ...r, [p.clave]: v }));
    // El refresco va dentro de la acción: el siguiente dato se guarda con la versión nueva.
    const r = await ejecutar(async () => {
      await api.guardarDatosAlta(ok.data);
      await recargar();
    });
    if (r.ok) irA(i + 1);
    else if (r.fallo.detalle?.campos?.length) {
      setError('Revisá este dato.');
      enfocar();
    }
  }

  return (
    <MarcoPaso paso="datos" titulo="Tus datos">
      <form className="al-pregunta" onSubmit={(e) => void siguiente(e)} noValidate>
        <p className="al-pregunta__n">
          Pregunta {i + 1} de {PREGUNTAS.length}
        </p>
        <div className="al-pregunta__barra" aria-hidden="true">
          <span className={`al-pregunta__lleno al-pregunta__lleno--${i + 1}`} />
        </div>
        <h2 className="hx-titulo al-pregunta__titulo">{p.pregunta}</h2>
        {p.clave === 'ciudad' ? (
          <Aviso tono="neutro" icono="info">
            Por ahora Handyx solo opera en Mar del Plata. Si vivís en otra ciudad podés dejar tus datos, pero eso no significa que haya cobertura.
          </Aviso>
        ) : null}
        {fallo && !error ? <ErrorCaja fallo={fallo} /> : null}
        {p.clave === 'genero' ? (
          <fieldset className="al-opciones" aria-describedby={error ? 'al-genero-e' : 'al-genero-a'}>
            <legend className="visualmente-oculto">{p.etiqueta}</legend>
            {GENEROS.map((g, n) => (
              <label key={g} className="al-opcion">
                <input ref={n === 0 ? entrada : undefined} type="radio" name="genero" value={g} checked={valor === g} onChange={() => setValor(g)} aria-invalid={error ? true : undefined} />
                <span>{GENERO[g]}</span>
              </label>
            ))}
            {error ? (
              <p id="al-genero-e" className="campo__error">
                {error}
              </p>
            ) : (
              <p id="al-genero-a" className="campo__ayuda">
                {p.ayuda}
              </p>
            )}
          </fieldset>
        ) : (
          <Campo key={p.clave} ref={entrada} etiqueta={p.etiqueta} value={valor} onChange={(e) => setValor(e.target.value)} error={error ?? undefined} ayuda={p.ayuda} autoFocus {...p.props} />
        )}
        <BotonFijo>
          <div className="botones botones--fila">
            {i > 0 ? (
              <button type="button" className="boton boton--claro" onClick={() => irA(i - 1)}>
                Anterior
              </button>
            ) : null}
            <button type="submit" className="boton" disabled={pendiente}>
              {pendiente ? 'Guardando…' : i === PREGUNTAS.length - 1 ? 'Listo' : p.opcional && !valor.trim() ? 'Saltear' : 'Siguiente'}
            </button>
          </div>
        </BotonFijo>
      </form>
    </MarcoPaso>
  );
}
