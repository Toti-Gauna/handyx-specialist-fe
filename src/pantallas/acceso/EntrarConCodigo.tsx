'use client';
// D6-Acceso (lote 1.1): entrar sin contraseña. Se escribe el email o el teléfono y se elige cómo recibir un código de
// 6 números: por email (el más usado) o por SMS. La respuesta es la misma exista o no la cuenta. Sin proveedor de SMS
// autorizado, el servidor responde 503 y se ofrece el email. También Google o Apple.
import { api } from '@handyx/origen-datos';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { RUTAS } from '../../app/rutas.ts';
import type { CanalCodigo } from '../../contracts/seguridad.ts';
import { useAccion } from '../../hooks/useAccion.ts';
import { enfocarPrimerError } from '../../lib/foco.ts';
import { Boton } from '../../ui/atomos/Boton.tsx';
import { Campo } from '../../ui/atomos/Controles.tsx';
import { Chip } from '../../ui/atomos/Texto.tsx';
import { pareceEmail } from '../../ui/logicaAcceso.ts';
import { AvisoCaja } from '../../ui/moleculas/AvisoCaja.tsx';
import { Encabezado } from '../../ui/moleculas/Encabezado.tsx';
import { Formulario } from '../../ui/moleculas/Formulario.tsx';
import { OpcionesIcono } from '../../ui/moleculas/OpcionesIcono.tsx';
import { AccionFija } from '../../ui/organismos/Acciones.tsx';
import { EscenaCiudad } from '../../ui/organismos/EscenaCiudad.tsx';
import { PantallaAcceso } from '../../ui/plantillas/PantallaAcceso.tsx';
import { AyudaPrueba } from './AyudaPrueba.tsx';
import { mensajeAcceso } from './mensajes.ts';
import { guardarAcceso, leerAcceso } from './memoria.ts';
import { Proveedores } from './Proveedores.tsx';

const FORM = 'form-entrar-con-codigo';

export function EntrarConCodigo() {
  const router = useRouter();
  const { pendiente, fallo, ejecutar } = useAccion({ publica: true });
  const [identificador, setIdentificador] = useState(() => leerAcceso().identificador);
  const [canal, setCanal] = useState<CanalCodigo>(() => (leerAcceso().identificador && !pareceEmail(leerAcceso().identificador) ? 'sms' : 'email'));
  const [error, setError] = useState<string | null>(null);

  async function enviar() {
    const id = identificador.trim();
    setError(id.length < 6 ? 'Escribí tu email o tu teléfono.' : null);
    if (id.length < 6) return enfocarPrimerError(document);
    guardarAcceso({ identificador: id });
    const r = await ejecutar(() => api.pedirCodigoIngreso({ identificador: id, canal }));
    if (r.ok) {
      guardarAcceso({ codigo: r.valor });
      router.push(RUTAS.accesoCodigoVerificar.ruta);
    }
  }

  const smsCaido = fallo?.status === 503 && canal === 'sms';

  return (
    <PantallaAcceso
      escena={<EscenaCiudad hrefVolver={RUTAS.acceso.ruta} icono="llave2" />}
      accion={
        <AccionFija>
          <Boton type="submit" form={FORM} ocupado={pendiente} textoOcupado="Mandando…">
            Mandarme el código
          </Boton>
        </AccionFija>
      }
    >
      <Encabezado etiqueta="Entrar a Handyx" antes="¿Cómo " marcado="entrás" despues="?" bajada="Sin contraseña: te mandamos un código de 6 números." centrado />
      <Formulario id={FORM} etiqueta="Pedir un código para entrar" onEnviar={() => void enviar()}>
        {fallo ? (
          <AvisoCaja tono="error" accion={smsCaido ? <button type="button" className="ui-enlace" onClick={() => setCanal('email')}>Usar el email</button> : undefined}>
            {mensajeAcceso(fallo, 'pedido')}
          </AvisoCaja>
        ) : null}
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
          error={error}
          required
        />
        <OpcionesIcono<CanalCodigo>
          etiqueta="¿Cómo querés recibir el código?"
          etiquetaVisible
          valor={canal}
          onCambio={setCanal}
          opciones={[
            { valor: 'email', icono: 'sobre', titulo: 'Código por email', detalle: 'Te llega al email de tu cuenta', pastilla: <Chip tono="blanco">Más usado</Chip> },
            { valor: 'sms', icono: 'telefono', titulo: 'Código por SMS', detalle: 'Te llega en un mensaje al teléfono de tu cuenta' },
          ]}
        />
      </Formulario>
      <Proveedores separador="o entrá con" />
      <AyudaPrueba que="codigo" />
    </PantallaAcceso>
  );
}
