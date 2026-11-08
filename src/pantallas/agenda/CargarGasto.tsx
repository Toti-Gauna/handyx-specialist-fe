'use client';
// H0-Gasto (lote 2.1): cargar un gasto con la foto del ticket o a mano. Se puede registrar como gasto (baja tu neto), cobrárselo
// al cliente (va como adicional y él lo acepta en el chat) o las dos. La foto se achica en el teléfono y se manda sin
// metadatos; el importe lo escribís vos (la app no lo lee de la foto). Antes de mandarle algo al cliente, se pide confirmar.
import { api, camaraPrueba } from '@handyx/origen-datos';
import { useRouter, useSearchParams } from 'next/navigation';
import { useRef, useState, type ChangeEvent } from 'react';
import { RUTAS } from '../../app/rutas.ts';
import { Cargando, ErrorCaja } from '../../components/Estados.tsx';
import { CATEGORIAS_GASTO, type CategoriaGasto, type NuevoGasto } from '../../contracts/ingresos.ts';
import { monto } from '../../contracts/dinero.ts';
import { NOMBRE_RUBRO } from '../../contracts/rubros.ts';
import { useAccion } from '../../hooks/useAccion.ts';
import { useCarga } from '../../hooks/useCarga.ts';
import { mesDe, NOMBRE_CATEGORIA } from '../../lib/agendaTaller.ts';
import { enfocarPrimerError } from '../../lib/foco.ts';
import { centavosDesdeTexto, diaLocal, pesosDesdeCentavos } from '../../lib/formato.ts';
import { prepararFoto } from '../../taller/privacidad.ts';
import { Boton } from '../../ui/atomos/Boton.tsx';
import { Casilla, Campo } from '../../ui/atomos/Controles.tsx';
import { Icono } from '../../ui/atomos/Icono.tsx';
import { Seleccion } from '../../ui/atomos/Seleccion.tsx';
import { Chip } from '../../ui/atomos/Texto.tsx';
import { AvisoCaja } from '../../ui/moleculas/AvisoCaja.tsx';
import { Formulario } from '../../ui/moleculas/Formulario.tsx';
import { PastillasOpcion } from '../../ui/moleculas/Opciones.tsx';
import { AccionFija } from '../../ui/organismos/Acciones.tsx';
import { BarraCompacta } from '../../ui/organismos/Cabeceras.tsx';
import { Hoja } from '../../ui/organismos/Hoja.tsx';
import { PantallaSecundaria } from '../../ui/plantillas/Plantillas.tsx';
import { Fallo } from './piezas.tsx';

const simulada = camaraPrueba !== null;
/** Un JPEG mínimo de prueba: con datos de prueba no se abre la cámara (igual que en el registro). */
const FOTO_SIMULADA = () => new Blob([new Uint8Array([0xff, 0xd8, 0xff, 0xd9])], { type: 'image/jpeg' });

/** «Cambio del cartucho de la canilla…» → «Cambio del cartucho de la canilla» (el primer tramo, corto). */
const tituloCorto = (alcance: string): string => {
  const t = alcance.split(/[.,;]/)[0]?.trim() ?? alcance;
  return t.length > 44 ? `${t.slice(0, 41).trimEnd()}…` : t;
};

export function CargarGasto() {
  const router = useRouter();
  const hoy = diaLocal(api.ahora().toISOString());
  const pedido = useSearchParams().get('trabajo');
  const cuerpo = useRef<HTMLDivElement>(null);
  const entradaFoto = useRef<HTMLInputElement>(null);
  const [importe, setImporte] = useState('');
  const [trabajoId, setTrabajoId] = useState(pedido ?? '');
  const [categoria, setCategoria] = useState<CategoriaGasto>('materiales');
  const [descripcion, setDescripcion] = useState('');
  const [fecha, setFecha] = useState(hoy);
  const [registrar, setRegistrar] = useState(true);
  const [cobrar, setCobrar] = useState(false);
  const [foto, setFoto] = useState<Blob | null>(null);
  const [errorFoto, setErrorFoto] = useState<string | null>(null);
  const [errorImporte, setErrorImporte] = useState<string | null>(null);
  const [errorOpciones, setErrorOpciones] = useState<string | null>(null);
  const [confirmar, setConfirmar] = useState(false);
  const guardar = useAccion();
  const trabajos = useCarga(() => api.trabajos('activos'), []);

  const lista = trabajos.datos?.items ?? [];
  const elegido = lista.find((t) => t.id === trabajoId) ?? null;
  // Cobrárselo al cliente se puede con el trabajo en curso (así lo pide el servidor para los adicionales).
  const puedeCobrar = elegido?.estado === 'en_curso';

  if (trabajos.fallo && !trabajos.datos) return <Fallo fallo={trabajos.fallo} onReintentar={() => void trabajos.recargar()} />;
  if (!trabajos.datos) return <Cargando />;

  async function elegirFoto(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    setErrorFoto(null);
    try {
      setFoto(await prepararFoto(f));
    } catch {
      setErrorFoto('No pudimos leer esa foto. Probá con otra o cargá el gasto sin foto.');
    }
  }

  function revisar() {
    const centavos = centavosDesdeTexto(importe);
    const sinImporte = centavos === null || centavos <= 0;
    setErrorImporte(sinImporte ? 'Escribí cuánto gastaste, por ejemplo 13.000.' : null);
    const sinCasilla = !registrar && !(cobrar && puedeCobrar);
    setErrorOpciones(sinCasilla ? 'Elegí al menos una: registrarlo como gasto o cobrárselo al cliente.' : null);
    if (sinImporte || sinCasilla) return enfocarPrimerError(cuerpo.current);
    // Lo que le llega al cliente se confirma antes de mandarlo.
    if (cobrar && puedeCobrar) return setConfirmar(true);
    void enviar();
  }

  async function enviar() {
    const centavos = centavosDesdeTexto(importe);
    if (centavos === null || centavos <= 0) return;
    const nuevo: NuevoGasto = {
      monto: monto(centavos),
      categoria,
      descripcion: descripcion.trim() === '' ? null : descripcion.trim(),
      fecha,
      trabajoId: elegido ? elegido.id : null,
      registrarGasto: registrar,
      cobrarAlCliente: cobrar && puedeCobrar,
    };
    const r = await guardar.ejecutar(() => api.cargarGasto(nuevo, foto, guardar.clave()));
    if (r.ok) router.replace(`${RUTAS.ingresos.ruta}?guardado=1&mes=${mesDe(fecha)}`);
    else setConfirmar(false);
  }

  const centavosAhora = centavosDesdeTexto(importe);
  const barra = <BarraCompacta titulo="Cargar un gasto" hrefVolver={RUTAS.ingresos.ruta} />;
  const accion = (
    <AccionFija nota="Tus gastos son tuyos: el cliente no los ve. Sirven para calcular tu neto.">
      <Boton ocupado={guardar.pendiente} textoOcupado="Guardando…" type="submit" form="form-gasto">
        Guardar gasto
      </Boton>
    </AccionFija>
  );

  return (
    <PantallaSecundaria barra={barra} accion={accion}>
      <div className="ui-ticket">
        <span className="ui-ticket__papel" aria-hidden="true">
          <svg viewBox="0 0 106 116" focusable="false">
            <rect x="0" y="4" width="62" height="8" rx="4" fill="#E6E9EF" />
            <rect x="0" y="22" width="96" height="6" rx="3" fill="#F5F59A" />
            <rect x="0" y="36" width="88" height="6" rx="3" fill="#F5F59A" />
            <rect x="0" y="50" width="70" height="6" rx="3" fill="#E6E9EF" />
            <rect x="40" y="98" width="66" height="10" rx="5" fill="#F5F59A" />
          </svg>
        </span>
        {foto ? (
          <span className="ui-ticket__chip">
            <Chip tono="exito" icono="check">
              Foto lista · queda privada
            </Chip>
          </span>
        ) : null}
      </div>
      <div className="ui-ticket__acciones">
        <Boton variante={foto ? 'contorno' : 'primaria'} icono="camara" onClick={() => (simulada ? setFoto(FOTO_SIMULADA()) : entradaFoto.current?.click())}>
          {foto ? 'Sacar otra foto' : 'Sacar una foto del ticket'}
        </Boton>
        {foto ? (
          <Boton variante="texto" onClick={() => setFoto(null)}>
            Sacar la foto de acá
          </Boton>
        ) : null}
      </div>
      {simulada ? null : (
        <input
          ref={entradaFoto}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          capture="environment"
          className="visualmente-oculto"
          tabIndex={-1}
          aria-hidden="true"
          onChange={(e) => void elegirFoto(e)}
        />
      )}
      {errorFoto ? <AvisoCaja tono="error">{errorFoto}</AvisoCaja> : null}
      <p className="ui-nota">La foto se achica en tu teléfono y se guarda sin la ubicación. La podés saltear: el gasto se carga igual.</p>

      <div ref={cuerpo} className="ui-gasto-form">
        <Formulario
          id="form-gasto"
          etiqueta="Datos del gasto"
          onEnviar={(e) => {
            e.preventDefault();
            revisar();
          }}
        >
          <div className="ui-gasto-form__fila">
            <Campo
              etiqueta="Monto"
              prefijo="$"
              inputMode="numeric"
              autoComplete="off"
              value={importe}
              error={errorImporte}
              placeholder="13.000"
              onChange={(e) => {
                setImporte(e.target.value);
                setErrorImporte(null);
              }}
            />
            <Seleccion
              etiqueta="Trabajo"
              value={elegido ? trabajoId : ''}
              onChange={(e) => {
                setTrabajoId(e.target.value);
                setCobrar(false);
              }}
            >
              <option value="">Ninguno (gasto general)</option>
              {lista.map((t) => (
                <option key={t.id} value={t.id}>{`${NOMBRE_RUBRO[t.rubro]} · ${tituloCorto(t.acuerdo.alcance)}`}</option>
              ))}
            </Seleccion>
          </div>
          <PastillasOpcion<CategoriaGasto>
            leyenda="Qué tipo de gasto es"
            opciones={CATEGORIAS_GASTO.map((c) => ({
              valor: c,
              texto: NOMBRE_CATEGORIA[c],
            }))}
            valores={[categoria]}
            onCambio={(v) => v[0] && setCategoria(v[0])}
          />
          <div className="ui-gasto-form__fila">
            <Campo etiqueta="Qué compraste (si querés)" maxLength={200} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
            <Campo etiqueta="Fecha" type="date" max={hoy} value={fecha} onChange={(e) => setFecha(e.target.value || hoy)} />
          </div>
          <fieldset className="ui-gasto-form__marcas">
            <legend className="visualmente-oculto">Qué hacer con este gasto</legend>
            <Casilla
              checked={registrar}
              onChange={(e) => {
                setRegistrar(e.target.checked);
                setErrorOpciones(null);
              }}
              ayuda="Suma a tus gastos y baja tu neto"
            >
              Registrarlo como gasto
            </Casilla>
            <Casilla
              checked={cobrar && puedeCobrar}
              disabled={!puedeCobrar}
              onChange={(e) => {
                setCobrar(e.target.checked);
                setErrorOpciones(null);
              }}
              ayuda={puedeCobrar ? 'Va como adicional: el cliente lo acepta en el chat' : 'Se puede cobrar con un trabajo en curso: elegilo arriba'}
            >
              Cobrárselo al cliente
            </Casilla>
            {errorOpciones ? (
              <p className="ui-campo__error" role="alert">
                <Icono nombre="alerta" tam="chico" /> {errorOpciones}
              </p>
            ) : null}
          </fieldset>
        </Formulario>
      </div>

      {guardar.fallo ? <ErrorCaja fallo={guardar.fallo} onReintentar={() => void enviar()} /> : null}

      <Hoja
        abierta={confirmar}
        titulo="¿Se lo cobrás al cliente?"
        onCerrar={() => setConfirmar(false)}
        pie={
          <div className="ui-pie-columna">
            <Boton ocupado={guardar.pendiente} textoOcupado="Mandando…" onClick={() => void enviar()}>
              Sí, mandárselo
            </Boton>
            <Boton variante="texto" onClick={() => setConfirmar(false)}>
              Todavía no
            </Boton>
          </div>
        }
      >
        <p>
          Le mandamos al cliente {centavosAhora ? pesosDesdeCentavos(centavosAhora) : 'el importe'} como un adicional de «{elegido ? tituloCorto(elegido.acuerdo.alcance) : 'tu trabajo'}». No suma al
          precio hasta que lo acepte en el chat.
        </p>
        {registrar ? <p className="ui-nota">{`También queda en tus gastos como ${NOMBRE_CATEGORIA[categoria].toLowerCase()}.`}</p> : null}
        {guardar.fallo ? <ErrorCaja fallo={guardar.fallo} /> : null}
      </Hoja>
    </PantallaSecundaria>
  );
}
