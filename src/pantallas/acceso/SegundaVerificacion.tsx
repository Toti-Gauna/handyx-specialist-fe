'use client';
// D6-Login2FA (lote 1.1): paso 2 de 2 al entrar con la segunda verificación activa. Por defecto, el código de la app
// autenticadora; también se puede pedir por SMS o email, o usar un código de respaldo (sirve una vez). El desafío del
// servidor vive solo en memoria: si se recargó la página o venció, se vuelve a entrar.
import { api } from '@handyx/origen-datos';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { RUTAS } from '../../app/rutas.ts';
import type { CanalCodigo, CodigoEnviado, DesafioSegundaVerificacion, MetodoDesafio } from '../../contracts/seguridad.ts';
import { useAccion } from '../../hooks/useAccion.ts';
import { destinoCuenta } from '../../lib/destino.ts';
import { enfocarPrimerError } from '../../lib/foco.ts';
import { Boton, BotonEnlace } from '../../ui/atomos/Boton.tsx';
import { Campo } from '../../ui/atomos/Controles.tsx';
import { Mosaico } from '../../ui/moleculas/Mosaico.tsx';
import { normalizarRespaldo } from '../../ui/logicaAcceso.ts';
import { AvisoCaja } from '../../ui/moleculas/AvisoCaja.tsx';
import { CampoCodigo } from '../../ui/moleculas/CampoCodigo.tsx';
import { Encabezado } from '../../ui/moleculas/Encabezado.tsx';
import { Formulario } from '../../ui/moleculas/Formulario.tsx';
import { ReenviarCodigo } from '../../ui/moleculas/ReenviarCodigo.tsx';
import { FilaIcono, Tarjeta } from '../../ui/moleculas/Tarjeta.tsx';
import { AccionFija } from '../../ui/organismos/Acciones.tsx';
import { BarraCompacta } from '../../ui/organismos/Cabeceras.tsx';
import { PantallaSecundaria } from '../../ui/plantillas/Plantillas.tsx';
import { AyudaPrueba } from './AyudaPrueba.tsx';
import { mensajeAcceso } from './mensajes.ts';
import { guardarAcceso, leerAcceso, olvidarAcceso } from './memoria.ts';

const FORM = 'form-segunda-verificacion';
const barra = <BarraCompacta titulo="Segunda verificación" subtitulo="Paso 2 de 2" hrefVolver={RUTAS.acceso.ruta} />;

export function SegundaVerificacion() {
  const [desafio] = useState(() => leerAcceso().desafio);
  if (!desafio) {
    return (
      <PantallaSecundaria barra={barra} accion={<AccionFija><BotonEnlace href={RUTAS.acceso.ruta}>Volver a entrar</BotonEnlace></AccionFija>}>
        <Encabezado antes="Volvé a " marcado="entrar" bajada="Por seguridad, el paso 2 dura unos minutos y no se guarda en el teléfono. Escribí de nuevo tu email o teléfono y tu contraseña." />
      </PantallaSecundaria>
    );
  }
  return <Paso2 desafio={desafio} />;
}

const TEXTOS: Record<MetodoDesafio, { marcado: string; bajada: (e: CodigoEnviado | null) => string }> = {
  totp: { marcado: 'app', bajada: () => 'Abrí tu app autenticadora y escribí los 6 números de Handyx.' },
  sms: { marcado: 'SMS', bajada: (e) => `Te mandamos 6 números a ${e?.destinoEnmascarado ?? 'tu teléfono'}.` },
  email: { marcado: 'email', bajada: (e) => `Te mandamos 6 números a ${e?.destinoEnmascarado ?? 'tu email'}. Si no llega, mirá en «correo no deseado».` },
  respaldo: { marcado: 'respaldo', bajada: () => 'Escribí uno de los códigos que guardaste al activar la segunda verificación. Cada uno sirve una sola vez.' },
};

function Paso2({ desafio }: { desafio: DesafioSegundaVerificacion }) {
  const router = useRouter();
  const entrar = useAccion({ publica: true });
  const envio = useAccion({ publica: true });
  const [metodo, setMetodo] = useState<MetodoDesafio>(desafio.metodos.includes(desafio.preferido) ? desafio.preferido : (desafio.metodos[0] ?? 'totp'));
  const [enviado, setEnviado] = useState<CodigoEnviado | null>(null);
  const [codigo, setCodigo] = useState('');
  const [error, setError] = useState<string | null>(null);
  const vencido = entrar.fallo?.tipo === 'sesion' || envio.fallo?.tipo === 'sesion' || (entrar.fallo?.tipo === 'limite' && metodo !== 'respaldo');

  async function pedir(canal: CanalCodigo) {
    const r = await envio.ejecutar(() => api.enviarCodigoSegundaVerificacion({ desafio: desafio.desafio, canal }));
    if (r.ok) {
      setEnviado(r.valor);
      cambiar(canal);
    }
  }

  function cambiar(m: MetodoDesafio) {
    setMetodo(m);
    setCodigo('');
    setError(null);
    entrar.limpiar();
  }

  async function enviar() {
    const listo = metodo === 'respaldo' ? /^[A-Z0-9]{5}-[A-Z0-9]{5}$/.test(codigo) : /^\d{6}$/.test(codigo);
    setError(listo ? null : metodo === 'respaldo' ? 'El código de respaldo tiene 10 letras y números.' : 'El código tiene 6 números.');
    if (!listo) return enfocarPrimerError(document);
    const r = await entrar.ejecutar(async () => {
      await api.resolverSegundaVerificacion({ desafio: desafio.desafio, metodo, codigo, recordarDispositivo: leerAcceso().recordar });
      return destinoCuenta();
    });
    if (r.ok) {
      olvidarAcceso();
      router.replace(r.valor);
    } else setCodigo('');
  }

  if (vencido) {
    guardarAcceso({ desafio: null });
    return (
      <PantallaSecundaria barra={barra} accion={<AccionFija><BotonEnlace href={RUTAS.acceso.ruta}>Volver a entrar</BotonEnlace></AccionFija>}>
        <Encabezado antes="Volvé a " marcado="entrar" bajada={(entrar.fallo ?? envio.fallo)?.detalle?.mensaje ?? 'Pasó mucho tiempo. Volvé a entrar.'} />
      </PantallaSecundaria>
    );
  }

  const otros: { m: MetodoDesafio; icono: 'telefono' | 'sobre' | 'llave2' | 'escudo'; titulo: string; detalle: string; accion: () => void }[] = [];
  for (const m of desafio.metodos) {
    if (m === metodo) continue;
    if (m === 'sms') otros.push({ m, icono: 'telefono', titulo: 'Mandarme un SMS', detalle: desafio.telefonoEnmascarado ? `Al teléfono que ${desafio.telefonoEnmascarado}` : 'Al teléfono de tu cuenta', accion: () => void pedir('sms') });
    if (m === 'email') otros.push({ m, icono: 'sobre', titulo: 'Mandarme un email', detalle: desafio.emailEnmascarado ? `A ${desafio.emailEnmascarado}` : 'Al email de tu cuenta', accion: () => void pedir('email') });
    if (m === 'totp') otros.push({ m, icono: 'escudo', titulo: 'Usar la app autenticadora', detalle: 'Los 6 números que muestra la app', accion: () => cambiar('totp') });
    if (m === 'respaldo') otros.push({ m, icono: 'llave2', titulo: 'Usar un código de respaldo', detalle: 'Los que guardaste al activarla', accion: () => cambiar('respaldo') });
  }
  const t = TEXTOS[metodo];

  return (
    <PantallaSecundaria
      barra={barra}
      accion={
        <AccionFija>
          <Boton type="submit" form={FORM} ocupado={entrar.pendiente} textoOcupado="Entrando…">
            Entrar
          </Boton>
        </AccionFija>
      }
    >
      <div className="ui-encabezado ui-encabezado--centrado">
        <Mosaico icono={metodo === 'sms' ? 'telefono' : metodo === 'email' ? 'sobre' : metodo === 'respaldo' ? 'llave2' : 'escudo'} tam="grande" tono="azul" />
      </div>
      <Encabezado antes={metodo === 'respaldo' ? 'Código de ' : metodo === 'totp' ? 'Código de tu ' : 'Código del '} marcado={t.marcado} bajada={t.bajada(enviado)} centrado tam="medio" />
      <Formulario id={FORM} etiqueta="Código de la segunda verificación" onEnviar={() => void enviar()}>
        {entrar.fallo ? <AvisoCaja tono="error">{mensajeAcceso(entrar.fallo, 'codigo')}</AvisoCaja> : null}
        {metodo === 'respaldo' ? (
          <Campo
            etiqueta="Código de respaldo"
            icono="llave2"
            autoComplete="one-time-code"
            autoCapitalize="characters"
            spellCheck={false}
            value={codigo}
            onChange={(e) => setCodigo(normalizarRespaldo(e.target.value))}
            ayuda="10 letras y números, por ejemplo ABCDE-12345."
            error={error}
          />
        ) : (
          <CampoCodigo valor={codigo} onCambio={setCodigo} error={error} />
        )}
        {enviado && (metodo === 'sms' || metodo === 'email') ? <ReenviarCodigo desde={enviado.reenviarDesde} ahora={api.ahora} onReenviar={() => void pedir(metodo)} ocupado={envio.pendiente} /> : null}
      </Formulario>
      {envio.fallo ? <AvisoCaja tono="error">{mensajeAcceso(envio.fallo, 'pedido')}</AvisoCaja> : null}
      {otros.length > 0 ? (
        <Tarjeta etiqueta="Otra forma de entrar">
          {otros.map((o, i) => (
            <FilaIcono key={o.m} icono={o.icono} titulo={o.titulo} detalle={o.detalle} borde={i > 0} onClick={envio.pendiente ? undefined : o.accion} />
          ))}
        </Tarjeta>
      ) : null}
      <AyudaPrueba que="segunda" />
    </PantallaSecundaria>
  );
}
