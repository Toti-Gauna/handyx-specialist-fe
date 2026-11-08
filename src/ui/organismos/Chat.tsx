'use client';
// Lista de chat con los mensajes pegados abajo (como un chat de verdad: lo último queda junto a la entrada) y la entrada
// con adjuntar foto y mandar. Los mensajes seguidos del mismo autor se agrupan (logica.ts). Lo nuevo se anuncia con
// role="log". Enter manda; Mayús+Enter hace un renglón.
import { useId, useState } from 'react';
import { BotonIcono } from '../atomos/Boton.tsx';
import { agruparMensajes, type MensajeChat } from '../logica.ts';
import { Burbuja } from '../moleculas/Burbuja.tsx';

export function ListaChat({ mensajes, etiqueta }: { mensajes: readonly MensajeChat[]; etiqueta: string }) {
  return (
    <div className="ui-chat" role="log" aria-label={etiqueta} aria-live="polite">
      <div className="ui-chat__mensajes">
        {agruparMensajes(mensajes).map((m) => (
          <Burbuja key={m.id} m={m} primero={m.primero} ultimo={m.ultimo} />
        ))}
      </div>
    </div>
  );
}

export function EntradaChat({ onMandar, onAdjuntar, ocupado = false, etiqueta = 'Escribí un mensaje' }: { onMandar(texto: string): void; onAdjuntar?: () => void; ocupado?: boolean; etiqueta?: string }) {
  const [texto, setTexto] = useState('');
  const id = useId();
  const mandar = () => {
    const t = texto.trim();
    if (!t || ocupado) return;
    onMandar(t);
    setTexto('');
  };
  return (
    <form
      className="ui-entrada-chat"
      onSubmit={(e) => {
        e.preventDefault();
        mandar();
      }}
    >
      {onAdjuntar ? <BotonIcono icono="camara" etiqueta="Mandar una foto" onClick={onAdjuntar} /> : null}
      <label htmlFor={id} className="visualmente-oculto">
        {etiqueta}
      </label>
      <textarea
        id={id}
        className="ui-entrada-chat__texto"
        rows={1}
        value={texto}
        placeholder={etiqueta}
        enterKeyHint="send"
        onChange={(e) => setTexto(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            mandar();
          }
        }}
      />
      <BotonIcono type="submit" icono="enviar" tono="azul" etiqueta="Mandar" disabled={!texto.trim() || ocupado} />
    </form>
  );
}
