'use client';
// D6-Recuperar, segunda parte (lote 1.1): la abre el enlace del email (?token=…). El token se guarda en memoria y se
// saca de la barra de direcciones apenas se lee: no queda en el historial ni viaja como referer. Un enlace vencido,
// usado o desconocido se ve igual («venció»), sin revelar nada. Mínimo de 12 caracteres (REGLAS_CLAVE) con medidor.
// Guardar cierra las sesiones abiertas: después se entra con la contraseña nueva.
import { api } from '@handyx/origen-datos';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { RUTAS } from '../../app/rutas.ts';
import { REGLAS_CLAVE } from '../../contracts/dto.ts';
import { useAccion } from '../../hooks/useAccion.ts';
import { useCarga } from '../../hooks/useCarga.ts';
import { enfocarPrimerError } from '../../lib/foco.ts';
import { Bajada } from '../../ui/atomos/Bajada.tsx';
import { Boton, BotonEnlace } from '../../ui/atomos/Boton.tsx';
import { EscudoVerificado } from '../../ui/ilustraciones/Estados.tsx';
import { AvisoCaja } from '../../ui/moleculas/AvisoCaja.tsx';
import { CampoClave } from '../../ui/moleculas/CampoClave.tsx';
import { Encabezado } from '../../ui/moleculas/Encabezado.tsx';
import { Formulario } from '../../ui/moleculas/Formulario.tsx';
import { AccionesFijas, AccionFija } from '../../ui/organismos/Acciones.tsx';
import { BarraCompacta } from '../../ui/organismos/Cabeceras.tsx';
import { EstadoError } from '../../ui/organismos/EstadosPantalla.tsx';
import { PantallaSecundaria } from '../../ui/plantillas/Plantillas.tsx';
import { mensajeAcceso } from './mensajes.ts';

const FORM = 'form-clave-nueva';
const barra = <BarraCompacta titulo="Contraseña nueva" hrefVolver={RUTAS.acceso.ruta} />;
const VENCIDO = ['Pedir otro enlace', 'Volver a entrar'] as const;

export function RecuperarNueva() {
  const parametro = useSearchParams().get('token') ?? '';
  const [token] = useState(parametro);
  useEffect(() => {
    if (parametro) window.history.replaceState(null, '', window.location.pathname);
  }, [parametro]);

  const estado = useCarga(() => (token ? api.estadoRecuperacion(token) : Promise.resolve({ estado: 'vencido' as const })), [token]);
  const { pendiente, fallo, ejecutar } = useAccion({ publica: true });
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [listo, setListo] = useState(false);

  async function enviar() {
    const err = password.length < REGLAS_CLAVE.minimo ? `Usá al menos ${REGLAS_CLAVE.minimo} caracteres.` : null;
    setError(err);
    if (err) return enfocarPrimerError(document);
    const r = await ejecutar(() => api.restablecer({ token, password }));
    if (r.ok) setListo(true);
  }

  if (listo) {
    return (
      <PantallaSecundaria
        barra={barra}
        accion={
          <AccionFija>
            <BotonEnlace href={RUTAS.acceso.ruta}>Entrar</BotonEnlace>
          </AccionFija>
        }
      >
        <div className="ui-encabezado ui-encabezado--centrado">
          <EscudoVerificado tam="chico" />
        </div>
        <Encabezado antes="Tu contraseña " marcado="cambió" bajada="Por seguridad cerramos las sesiones abiertas en otros teléfonos. Entrá con tu contraseña nueva." centrado />
      </PantallaSecundaria>
    );
  }
  if (estado.fallo && !estado.datos) {
    return (
      <PantallaSecundaria barra={barra}>
        <EstadoError tipo={estado.fallo.tipo === 'red' || estado.fallo.tipo === 'timeout' ? 'sin_conexion' : 'servidor'} codigo={estado.fallo.requestId} onReintentar={() => void estado.recargar()} />
      </PantallaSecundaria>
    );
  }
  if (!estado.datos) {
    return (
      <PantallaSecundaria barra={barra}>
        <p className="ui-bajada" role="status">
          Revisando el enlace…
        </p>
      </PantallaSecundaria>
    );
  }
  if (estado.datos.estado !== 'valido' || fallo?.tipo === 'conflicto') {
    return (
      <PantallaSecundaria
        barra={barra}
        accion={
          <AccionesFijas textos={VENCIDO}>
            <BotonEnlace href={RUTAS.recuperar.ruta}>{VENCIDO[0]}</BotonEnlace>
            <BotonEnlace variante="contorno" href={RUTAS.acceso.ruta}>
              {VENCIDO[1]}
            </BotonEnlace>
          </AccionesFijas>
        }
      >
        <Encabezado antes="El enlace " marcado="venció" bajada="Los enlaces sirven una sola vez y duran 30 minutos. Pedí otro y abrilo desde el último email que te llegue." />
      </PantallaSecundaria>
    );
  }

  return (
    <PantallaSecundaria
      barra={barra}
      accion={
        <AccionFija>
          <Boton type="submit" form={FORM} ocupado={pendiente} textoOcupado="Guardando…">
            Guardar la contraseña
          </Boton>
        </AccionFija>
      }
    >
      <Encabezado etiqueta="Te ayudamos" antes="Creá una " marcado="nueva" bajada={`Mínimo ${REGLAS_CLAVE.minimo} caracteres. Una frase que recuerdes es más fácil y más segura.`} />
      <Formulario id={FORM} etiqueta="Elegir la contraseña nueva" onEnviar={() => void enviar()}>
        {fallo ? <AvisoCaja tono="error">{mensajeAcceso(fallo, 'recuperar')}</AvisoCaja> : null}
        <CampoClave etiqueta="Contraseña nueva" valor={password} onCambio={setPassword} nueva error={error} />
      </Formulario>
      <Bajada chica>Por seguridad cerramos las sesiones abiertas en otros teléfonos.</Bajada>
    </PantallaSecundaria>
  );
}
