'use client';
// D6-Recuperar, primera parte (lote 1.1): se pide el enlace para crear una contraseña nueva con el email o el teléfono.
// El enlace va siempre al email de la cuenta, vence en 30 minutos y sirve una vez. La respuesta es neutra: no dice si
// la cuenta existe. El enlace del email abre la segunda parte (RecuperarNueva).
import { api, ayudasPrueba } from '@handyx/origen-datos';
import { useState } from 'react';
import { RUTAS } from '../../app/rutas.ts';
import { useAccion } from '../../hooks/useAccion.ts';
import { enfocarPrimerError } from '../../lib/foco.ts';
import { Bajada, EnlaceTexto } from '../../ui/atomos/Bajada.tsx';
import { Boton, BotonEnlace } from '../../ui/atomos/Boton.tsx';
import { Campo } from '../../ui/atomos/Controles.tsx';
import { Chip } from '../../ui/atomos/Texto.tsx';
import { AvisoCaja } from '../../ui/moleculas/AvisoCaja.tsx';
import { Encabezado } from '../../ui/moleculas/Encabezado.tsx';
import { Formulario } from '../../ui/moleculas/Formulario.tsx';
import { FilaIcono, Tarjeta } from '../../ui/moleculas/Tarjeta.tsx';
import { AccionFija } from '../../ui/organismos/Acciones.tsx';
import { BarraCompacta } from '../../ui/organismos/Cabeceras.tsx';
import { PantallaSecundaria } from '../../ui/plantillas/Plantillas.tsx';
import { mensajeAcceso } from './mensajes.ts';
import { guardarAcceso, leerAcceso } from './memoria.ts';

const FORM = 'form-recuperar';

export function Recuperar() {
  const { pendiente, fallo, ejecutar } = useAccion({ publica: true });
  const [identificador, setIdentificador] = useState(() => leerAcceso().identificador);
  const [error, setError] = useState<string | null>(null);
  const [enviado, setEnviado] = useState(false);

  async function enviar() {
    const id = identificador.trim();
    setError(id.length < 6 ? 'Escribí tu email o tu teléfono.' : null);
    if (id.length < 6) return enfocarPrimerError(document);
    guardarAcceso({ identificador: id });
    const r = await ejecutar(() => api.pedirRecuperacion({ identificador: id }));
    if (r.ok) setEnviado(true);
  }

  const barra = <BarraCompacta titulo="Recuperar la contraseña" hrefVolver={RUTAS.acceso.ruta} />;

  if (enviado) {
    return (
      <PantallaSecundaria
        barra={barra}
        accion={
          <AccionFija>
            <BotonEnlace href={RUTAS.acceso.ruta}>Volver a entrar</BotonEnlace>
          </AccionFija>
        }
      >
        <Encabezado etiqueta="Te ayudamos" antes="Revisá tu " marcado="email" bajada="Si hay una cuenta con esos datos, le mandamos un enlace para crear una contraseña nueva. Vence en 30 minutos y sirve una sola vez." />
        <Tarjeta>
          <FilaIcono icono="sobre" titulo="Abrí el enlace del email" detalle="Si no llega, mirá en «correo no deseado»" derecha={<Chip tono="exito" icono="check">Enviado</Chip>} borde={false} />
        </Tarjeta>
        <Bajada chica>Por seguridad no te decimos si la cuenta existe. Al crear la contraseña nueva cerramos las sesiones abiertas en otros teléfonos.</Bajada>
        <EnlaceTexto onClick={() => setEnviado(false)}>Mandar otro enlace</EnlaceTexto>
        {ayudasPrueba ? (
          <AvisoCaja tono="prueba" titulo="Vista previa con datos de prueba">
            No se manda ningún email. Si los datos son de una cuenta, abrí el enlace desde acá:
            <EnlaceTexto href={`${RUTAS.recuperarNueva.ruta}?token=${ayudasPrueba.tokenRecuperacion}`}>Abrir el enlace del email</EnlaceTexto>
            <EnlaceTexto href={`${RUTAS.recuperarNueva.ruta}?token=${ayudasPrueba.tokenVencido}`}>Probar un enlace vencido</EnlaceTexto>
          </AvisoCaja>
        ) : null}
      </PantallaSecundaria>
    );
  }

  return (
    <PantallaSecundaria
      barra={barra}
      accion={
        <AccionFija>
          <Boton type="submit" form={FORM} ocupado={pendiente} textoOcupado="Mandando…">
            Mandarme el enlace
          </Boton>
        </AccionFija>
      }
    >
      <Encabezado etiqueta="Te ayudamos" antes="Creá una " marcado="nueva" bajada="Te mandamos un enlace al email de tu cuenta para elegir otra contraseña. Vence en 30 minutos y sirve una sola vez." />
      <Formulario id={FORM} etiqueta="Pedir el enlace" onEnviar={() => void enviar()}>
        {fallo ? <AvisoCaja tono="error">{mensajeAcceso(fallo, 'recuperar')}</AvisoCaja> : null}
        <Campo
          etiqueta="Email o teléfono"
          icono="sobre"
          type="text"
          inputMode="email"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          value={identificador}
          onChange={(e) => setIdentificador(e.target.value)}
          ayuda="Aunque escribas el teléfono, el enlace va al email de tu cuenta."
          error={error}
          required
        />
      </Formulario>
    </PantallaSecundaria>
  );
}
