"use client";
// D6-Login (lote 1.1): entrar con el email o el teléfono y la contraseña, con Google o Apple, o sin contraseña con un
// código. «Recordar este teléfono» (sin tildar: lo elige la persona) evita la segunda verificación acá por 30 días.
// El error nunca dice si la cuenta existe. Si la cuenta tiene la segunda verificación, sigue el paso 2 de 2.
import { api } from "@handyx/origen-datos";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { RUTAS } from "../../app/rutas.ts";
import { DIAS_DISPOSITIVO_RECORDADO } from "../../contracts/seguridad.ts";
import { useAccion } from "../../hooks/useAccion.ts";
import { destinoCuenta } from "../../lib/destino.ts";
import { enfocarPrimerError } from "../../lib/foco.ts";
import { EnlaceTexto } from "../../ui/atomos/Bajada.tsx";
import { Boton } from "../../ui/atomos/Boton.tsx";
import { Campo, Casilla } from "../../ui/atomos/Controles.tsx";
import { AvisoCaja } from "../../ui/moleculas/AvisoCaja.tsx";
import { CampoClave } from "../../ui/moleculas/CampoClave.tsx";
import { Encabezado } from "../../ui/moleculas/Encabezado.tsx";
import { Formulario } from "../../ui/moleculas/Formulario.tsx";
import { EscenaCiudad } from "../../ui/organismos/EscenaCiudad.tsx";
import { PantallaAcceso } from "../../ui/plantillas/PantallaAcceso.tsx";
import { AyudaPrueba } from "./AyudaPrueba.tsx";
import { mensajeAcceso } from "./mensajes.ts";
import { guardarAcceso, leerAcceso, olvidarAcceso } from "./memoria.ts";
import { Proveedores } from "./Proveedores.tsx";

export function Login() {
  const router = useRouter();
  const { pendiente, fallo, ejecutar } = useAccion({ publica: true });
  const [identificador, setIdentificador] = useState(
    () => leerAcceso().identificador,
  );
  const [password, setPassword] = useState("");
  const [recordar, setRecordar] = useState(() => leerAcceso().recordar);
  const [errores, setErrores] = useState<{
    identificador?: string;
    password?: string;
  }>({});

  async function enviar() {
    const id = identificador.trim();
    const e = {
      identificador:
        id.length < 6 ? "Escribí tu email o tu teléfono." : undefined,
      password: password ? undefined : "Escribí tu contraseña.",
    };
    setErrores(e);
    if (e.identificador || e.password) return enfocarPrimerError(document);
    guardarAcceso({ identificador: id, recordar });
    // El destino se calcula dentro de la acción: el botón se libera con la cuenta ya resuelta.
    const r = await ejecutar(async () => {
      const res = await api.ingresarConClave({
        identificador: id,
        password,
        recordarDispositivo: recordar,
      });
      if (res.estado === "segunda_verificacion") {
        guardarAcceso({ desafio: res.desafio });
        return RUTAS.accesoVerificacion.ruta;
      }
      olvidarAcceso();
      return destinoCuenta();
    });
    if (r.ok) {
      if (r.valor === RUTAS.accesoVerificacion.ruta) router.push(r.valor);
      else router.replace(r.valor);
    } else setPassword("");
  }

  return (
    <PantallaAcceso
      escena={<EscenaCiudad hrefVolver={RUTAS.bienvenida.ruta} marca />}
    >
      {/* Solo el encabezado lee la URL: el resto sale en el HTML exportado y se ve antes de que cargue el JS. */}
      <Suspense fallback={<EncabezadoLogin deNuevo={false} />}>
        <EncabezadoSegunUrl />
      </Suspense>
      <Formulario
        etiqueta="Entrar con tu contraseña"
        onEnviar={() => void enviar()}
      >
        {fallo ? (
          <AvisoCaja tono="error">{mensajeAcceso(fallo, "clave")}</AvisoCaja>
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
          error={errores.identificador}
          required
        />
        <CampoClave
          valor={password}
          onCambio={setPassword}
          error={errores.password}
        />
        <Casilla
          checked={recordar}
          onChange={(e) => setRecordar(e.target.checked)}
          ayuda={`Si usás la segunda verificación, no te la pedimos en este teléfono por ${DIAS_DISPOSITIVO_RECORDADO} días.`}
        >
          Recordar este teléfono
        </Casilla>
        <EnlaceTexto href={RUTAS.recuperar.ruta}>
          ¿Olvidaste la contraseña?
        </EnlaceTexto>
        <Boton type="submit" ocupado={pendiente} textoOcupado="Entrando…">
          Entrar
        </Boton>
      </Formulario>
      <Proveedores />
      <EnlaceTexto href={RUTAS.accesoCodigo.ruta} centrado>
        Entrar sin contraseña, con un código
      </EnlaceTexto>
      <AyudaPrueba que="clave" />
    </PantallaAcceso>
  );
}

function EncabezadoSegunUrl() {
  return (
    <EncabezadoLogin deNuevo={useSearchParams().get("motivo") === "sesion"} />
  );
}

function EncabezadoLogin({ deNuevo }: { deNuevo: boolean }) {
  return deNuevo ? (
    <Encabezado
      etiqueta="Ya tenés cuenta"
      antes="Hola "
      marcado="de nuevo"
      bajada="Por seguridad cerramos tu sesión. Lo que ya enviaste está guardado."
    />
  ) : (
    <Encabezado
      etiqueta="Ya tenés cuenta"
      marcado="Entrá"
      despues=" a tu cuenta"
    />
  );
}
