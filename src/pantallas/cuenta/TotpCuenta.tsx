'use client';
// D6-TOTP (lote 1.4): activar la app autenticadora en tres pasos cortos. 1) confirmás que sos vos con tu contraseña;
// 2) escaneás el QR (se dibuja en el teléfono, sin servicios externos) o copiás la clave y escribís el código que muestra la
// app; 3) guardás los 10 códigos de respaldo. La clave y los códigos se ven UNA vez y quedan solo en la memoria de esta
// pantalla: nunca en el navegador (ni almacenamiento ni cookies).
import { api } from '@handyx/origen-datos';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { RUTAS } from '../../app/rutas.ts';
import { ErrorCaja } from '../../components/Estados.tsx';
import type { AltaTotp } from '../../contracts/seguridad.ts';
import { useAccion } from '../../hooks/useAccion.ts';
import { mensajeReauth } from '../../lib/cuenta.ts';
import { Boton } from '../../ui/atomos/Boton.tsx';
import { Campo } from '../../ui/atomos/Controles.tsx';
import { CampoCodigo } from '../../ui/moleculas/CampoCodigo.tsx';
import { AccionFija } from '../../ui/organismos/Acciones.tsx';
import { BarraCompacta } from '../../ui/organismos/Cabeceras.tsx';
import { Qr } from '../../ui/organismos/PantallaEscritorio.tsx';
import { ListaCodigos } from '../../ui/organismos/Seguridad.tsx';
import { PantallaSecundaria } from '../../ui/plantillas/Plantillas.tsx';
import { textoPaso } from '../../ui/logica.ts';

export function TotpCuenta() {
  const router = useRouter();
  // Una contraseña o un código equivocados no son una sesión vencida.
  const accion = useAccion({ publica: true });
  const [alta, setAlta] = useState<AltaTotp | null>(null);
  const [codigos, setCodigos] = useState<readonly string[] | null>(null);
  const [password, setPassword] = useState('');
  const [codigo, setCodigo] = useState('');
  const [local, setLocal] = useState<string | null>(null);

  const paso = codigos ? 3 : alta ? 2 : 1;
  const volver = paso === 1 ? RUTAS.cuentaSeguridad.ruta : undefined;

  async function empezar(e: FormEvent) {
    e.preventDefault();
    if (password.length === 0) return setLocal('Escribí tu contraseña.');
    setLocal(null);
    const r = await accion.ejecutar(() => api.iniciarTotp({ password, codigo: null }));
    setPassword(''); // la contraseña no se queda en pantalla
    if (r.ok) setAlta(r.valor);
  }
  async function activar(e?: FormEvent) {
    e?.preventDefault();
    if (!alta) return;
    if (codigo.length !== 6) return setLocal('Escribí los 6 números que muestra la app.');
    setLocal(null);
    const r = await accion.ejecutar(() => api.confirmarTotp({ alta: alta.alta, codigo }));
    if (r.ok) {
      setCodigos(r.valor.codigos);
      setAlta(null); // la clave ya no se vuelve a mostrar
      setCodigo('');
    }
  }
  const msg = mensajeReauth(accion.fallo);

  return (
    <PantallaSecundaria
      barra={<BarraCompacta titulo="App autenticadora" subtitulo={textoPaso(paso, 3)} hrefVolver={volver} onVolver={volver ? undefined : () => router.push(RUTAS.cuentaSeguridad.ruta)} />}
      accion={
        <AccionFija>
          {paso === 1 ? (
            <Boton type="submit" form="totp-clave" ocupado={accion.pendiente} textoOcupado="Un momento…">
              Seguir
            </Boton>
          ) : paso === 2 ? (
            <Boton type="submit" form="totp-codigo" ocupado={accion.pendiente} textoOcupado="Activando…">
              Activar
            </Boton>
          ) : (
            <Boton onClick={() => router.replace(RUTAS.cuentaSeguridad.ruta)}>Ya los guardé</Boton>
          )}
        </AccionFija>
      }
    >
      {paso === 1 ? (
        <form id="totp-clave" className="ui-edicion" onSubmit={(e) => void empezar(e)} noValidate>
          <p>Vas a usar una app en tu teléfono (Google Authenticator, Microsoft Authenticator u otra) que te da un código cada 30 segundos. Funciona sin señal.</p>
          <Campo etiqueta="Tu contraseña" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} ayuda="La pedimos para cuidar tu cuenta." error={local ?? msg} />
        </form>
      ) : null}

      {paso === 2 && alta ? (
        <form id="totp-codigo" className="ui-edicion" onSubmit={(e) => void activar(e)} noValidate>
          <section className="ui-totp" aria-labelledby="totp-escanear">
            <Qr texto={alta.otpauthUri} etiqueta="Código QR para tu app autenticadora" />
            <div>
              <h2 id="totp-escanear">Escaneá con tu app</h2>
              <p>¿Estás en el mismo teléfono? Copiá la clave:</p>
              <p className="ui-totp__clave">{alta.claveTexto}</p>
            </div>
          </section>
          <CampoCodigo valor={codigo} onCambio={setCodigo} etiqueta="Escribí el código que muestra la app" error={local ?? msg} />
          <p className="ui-nota">La clave se ve solo ahora y queda en el servidor, nunca en tu navegador. El código cambia cada 30 segundos.</p>
        </form>
      ) : null}

      {paso === 3 && codigos ? (
        <div className="ui-edicion">
          <p>
            <strong>¡Listo! La app autenticadora quedó activa.</strong>
          </p>
          <p>Estos 10 códigos sirven si perdés el teléfono. Cada uno vale una sola vez. Guardalos en un lugar seguro: no los vas a poder ver de nuevo.</p>
          <ListaCodigos codigos={codigos} />
        </div>
      ) : null}
      {accion.fallo && accion.fallo.tipo !== 'validacion' && accion.fallo.tipo !== 'sesion' ? <ErrorCaja fallo={accion.fallo} /> : null}
    </PantallaSecundaria>
  );
}
