'use client';
// D6-Codigo (lote 1.1): los 6 números que llegaron por email o SMS para entrar sin contraseña. Si no llegó, se pide
// otro cuando termina la espera, o se prueba por el otro camino. Si la cuenta tiene la segunda verificación, sigue
// el paso 2 de 2. La solicitud del servidor vive solo en memoria: si se recargó la página, se pide otro código.
import { api } from '@handyx/origen-datos';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { RUTAS } from '../../app/rutas.ts';
import type { CanalCodigo, CodigoEnviado } from '../../contracts/seguridad.ts';
import { useAccion } from '../../hooks/useAccion.ts';
import { destinoCuenta } from '../../lib/destino.ts';
import { enfocarPrimerError } from '../../lib/foco.ts';
import { EnlaceTexto } from '../../ui/atomos/Bajada.tsx';
import { Boton, BotonEnlace } from '../../ui/atomos/Boton.tsx';
import { AvisoCaja } from '../../ui/moleculas/AvisoCaja.tsx';
import { CampoCodigo } from '../../ui/moleculas/CampoCodigo.tsx';
import { Encabezado } from '../../ui/moleculas/Encabezado.tsx';
import { Formulario } from '../../ui/moleculas/Formulario.tsx';
import { ReenviarCodigo } from '../../ui/moleculas/ReenviarCodigo.tsx';
import { AccionFija } from '../../ui/organismos/Acciones.tsx';
import { EscenaCiudad } from '../../ui/organismos/EscenaCiudad.tsx';
import { PantallaAcceso } from '../../ui/plantillas/PantallaAcceso.tsx';
import { AyudaPrueba } from './AyudaPrueba.tsx';
import { mensajeAcceso } from './mensajes.ts';
import { guardarAcceso, leerAcceso, olvidarAcceso } from './memoria.ts';

const FORM = 'form-codigo-ingreso';

export function Codigo() {
  const [inicial] = useState(() => leerAcceso().codigo);
  if (!inicial) {
    return (
      <PantallaAcceso
        escena={<EscenaCiudad hrefVolver={RUTAS.accesoCodigo.ruta} icono="sobre" />}
        accion={
          <AccionFija>
            <BotonEnlace href={RUTAS.accesoCodigo.ruta}>Pedir un código</BotonEnlace>
          </AccionFija>
        }
      >
        <Encabezado antes="Pedí un " marcado="código" bajada="Por seguridad, el código que pediste no queda guardado en el teléfono. Pedí uno nuevo." centrado />
      </PantallaAcceso>
    );
  }
  return <EscribirCodigo inicial={inicial} />;
}

function EscribirCodigo({ inicial }: { inicial: CodigoEnviado }) {
  const router = useRouter();
  const entrar = useAccion({ publica: true });
  const pedido = useAccion({ publica: true });
  const [enviado, setEnviado] = useState(inicial);
  const [codigo, setCodigo] = useState('');
  const [error, setError] = useState<string | null>(null);
  const otro: CanalCodigo = enviado.canal === 'email' ? 'sms' : 'email';
  const agotado = entrar.fallo?.tipo === 'limite';

  async function pedirOtro(canal: CanalCodigo) {
    const r = await pedido.ejecutar(() => api.pedirCodigoIngreso({ identificador: leerAcceso().identificador, canal }));
    if (r.ok) {
      guardarAcceso({ codigo: r.valor });
      setEnviado(r.valor);
      setCodigo('');
      setError(null);
      entrar.limpiar();
    }
  }

  async function enviar() {
    setError(/^\d{6}$/.test(codigo) ? null : 'El código tiene 6 números.');
    if (!/^\d{6}$/.test(codigo)) return enfocarPrimerError(document);
    const r = await entrar.ejecutar(async () => {
      const res = await api.ingresarConCodigo({ solicitud: enviado.solicitud, codigo, recordarDispositivo: leerAcceso().recordar });
      if (res.estado === 'segunda_verificacion') {
        guardarAcceso({ desafio: res.desafio, codigo: null });
        return RUTAS.accesoVerificacion.ruta;
      }
      olvidarAcceso();
      return destinoCuenta();
    });
    if (r.ok) {
      if (r.valor === RUTAS.accesoVerificacion.ruta) router.push(r.valor);
      else router.replace(r.valor);
    } else setCodigo('');
  }

  const porEmail = enviado.canal === 'email';
  return (
    <PantallaAcceso
      escena={<EscenaCiudad hrefVolver={RUTAS.accesoCodigo.ruta} icono={porEmail ? 'sobre' : 'telefono'} />}
      accion={
        <AccionFija>
          <Boton type="submit" form={FORM} ocupado={entrar.pendiente} textoOcupado="Entrando…" disabled={agotado}>
            Entrar
          </Boton>
        </AccionFija>
      }
    >
      <Encabezado
        etiqueta="Código para entrar"
        antes={porEmail ? 'Revisá tu ' : 'Revisá tus '}
        marcado={porEmail ? 'email' : 'mensajes'}
        bajada={`Mandamos 6 números a ${enviado.destinoEnmascarado}. Sirven por 10 minutos.`}
        centrado
      />
      <Formulario id={FORM} etiqueta="Escribir el código" onEnviar={() => void enviar()}>
        {entrar.fallo ? <AvisoCaja tono="error">{mensajeAcceso(entrar.fallo, 'codigo')}</AvisoCaja> : null}
        {pedido.fallo ? <AvisoCaja tono="error">{mensajeAcceso(pedido.fallo, 'pedido')}</AvisoCaja> : null}
        <CampoCodigo valor={codigo} onCambio={setCodigo} error={error} deshabilitado={agotado} />
        <ReenviarCodigo
          desde={enviado.reenviarDesde}
          ahora={api.ahora}
          onReenviar={() => void pedirOtro(enviado.canal)}
          ocupado={pedido.pendiente}
          alternativa={
            <EnlaceTexto onClick={() => void pedirOtro(otro)} deshabilitado={pedido.pendiente}>
              {otro === 'sms' ? 'Probar con SMS' : 'Probar con el email'}
            </EnlaceTexto>
          }
        />
      </Formulario>
      <AvisoCaja tono="info" icono="escudo">
        {porEmail ? 'Si no llega, mirá en «correo no deseado». ' : ''}Si activaste la segunda verificación, después te pedimos ese código.
      </AvisoCaja>
      <AyudaPrueba que="codigo" />
    </PantallaAcceso>
  );
}
