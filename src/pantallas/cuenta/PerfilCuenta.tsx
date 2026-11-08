'use client';
// CU-Perfil (lote 1.4): lo que ven los clientes de vos. Foto o iniciales, sello (solo si lo dice el servidor), rubros
// habilitados, tu presentación, tres datos y las matrículas verificadas; lo que cargaste y todavía se revisa se ve
// aparte, como «En revisión». Editás la foto y la presentación en una hoja.
import { api } from '@handyx/origen-datos';
import { useRef, useState, type FormEvent } from 'react';
import { RUTAS } from '../../app/rutas.ts';
import { Cargando, ErrorCaja } from '../../components/Estados.tsx';
import type { PerfilPropio } from '../../contracts/cuenta.ts';
import { NOMBRE_RUBRO } from '../../contracts/rubros.ts';
import { useAccion } from '../../hooks/useAccion.ts';
import { useCarga } from '../../hooks/useCarga.ts';
import { mesYAnio, venceMesAnio } from '../../lib/cuenta.ts';
import { prepararFoto } from '../../taller/privacidad.ts';
import { Boton } from '../../ui/atomos/Boton.tsx';
import { AreaTexto } from '../../ui/atomos/AreaTexto.tsx';
import { Chip } from '../../ui/atomos/Texto.tsx';
import { FilaIcono } from '../../ui/moleculas/Tarjeta.tsx';
import { GrupoAjustes } from '../../ui/moleculas/Ajustes.tsx';
import { AccionFija } from '../../ui/organismos/Acciones.tsx';
import { BarraCompacta } from '../../ui/organismos/Cabeceras.tsx';
import { Hoja } from '../../ui/organismos/Hoja.tsx';
import { TarjetaPerfil } from '../../ui/organismos/CuentaPiezas.tsx';
import { PantallaSecundaria } from '../../ui/plantillas/Plantillas.tsx';

const MAXIMO = 280;

export function PerfilCuenta() {
  const c = useCarga(() => api.perfilPropio(), []);
  const [editando, setEditando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  if (c.fallo && !c.datos) return <ErrorCaja pantalla fallo={c.fallo} onReintentar={() => void c.recargar()} />;
  if (!c.datos) return <Cargando />;
  const p = c.datos;
  const rubros = p.rubros.filter((r) => r.habilitado).map((r) => NOMBRE_RUBRO[r.rubro]);

  return (
    <PantallaSecundaria
      barra={<BarraCompacta titulo="Tu perfil" subtitulo="Así te ven los clientes" hrefVolver={RUTAS.cuenta.ruta} />}
      accion={
        <AccionFija>
          <Boton icono="editar" onClick={() => setEditando(true)}>
            Editar foto y presentación
          </Boton>
        </AccionFija>
      }
    >
      {aviso ? (
        <p role="status" className="ui-aviso-ok">
          {aviso}
        </p>
      ) : null}
      <TarjetaPerfil
        nombre={p.nombrePublico ?? 'Tu nombre'}
        iniciales={p.iniciales}
        foto={p.foto}
        verificado={p.verificado}
        rubros={rubros}
        presentacion={p.presentacion}
        datos={[
          { valor: String(p.trabajosVerificados), rotulo: p.trabajosVerificados === 1 ? 'trabajo verificado' : 'trabajos verificados' },
          { valor: String(p.certificadosVerificados), rotulo: p.certificadosVerificados === 1 ? 'certificado' : 'certificados' },
          { valor: mesYAnio(p.enHandyxDesde), rotulo: 'en Handyx' },
        ]}
      />
      {p.matriculas.length > 0 ? (
        <GrupoAjustes>
          {p.matriculas.map((m) => (
            <FilaIcono
              key={m.rubro}
              icono="escudo"
              titulo={`Matrícula de ${NOMBRE_RUBRO[m.rubro]}`}
              detalle={m.estado === 'verificada' ? `Verificada${m.venceEn ? ` · vence ${venceMesAnio(m.venceEn)}` : ''}` : 'Cargada · la estamos revisando'}
              derecha={
                m.estado === 'verificada' ? (
                  <Chip tono="exito" icono="check">
                    Verificada
                  </Chip>
                ) : (
                  <Chip tono="amarillo" icono="reloj">
                    En revisión
                  </Chip>
                )
              }
            />
          ))}
        </GrupoAjustes>
      ) : null}
      <p className="ui-nota">Los clientes ven solo lo verificado. Lo que cargaste y se está revisando lo ves solo vos, como «En revisión».</p>
      <HojaEdicion
        abierta={editando}
        perfil={p}
        onCerrar={() => setEditando(false)}
        onGuardado={async (texto) => {
          await c.recargar();
          setAviso(texto);
          setEditando(false);
        }}
      />
    </PantallaSecundaria>
  );
}

function HojaEdicion({ abierta, perfil, onCerrar, onGuardado }: { abierta: boolean; perfil: PerfilPropio; onCerrar(): void; onGuardado(texto: string): Promise<void> }) {
  const [texto, setTexto] = useState(perfil.presentacion ?? '');
  const archivo = useRef<HTMLInputElement>(null);
  const guardar = useAccion();
  const foto = useAccion();

  async function enviar(e: FormEvent) {
    e.preventDefault();
    const r = await guardar.ejecutar(() => api.guardarPresentacion({ presentacion: texto.trim() === '' ? null : texto.trim(), version: perfil.version }));
    if (r.ok) await onGuardado('Guardamos tu presentación.');
  }
  async function elegirFoto(f: File | undefined) {
    if (!f) return;
    // Se achica y se vuelve a codificar en el teléfono: así se borran los metadatos (ubicación, modelo, fecha).
    const r = await foto.ejecutar(async () => api.cambiarFotoPerfil(await prepararFoto(f)));
    if (archivo.current) archivo.current.value = '';
    if (r.ok) await onGuardado('Cambiaste tu foto de perfil.');
  }

  return (
    <Hoja
      abierta={abierta}
      titulo="Editar foto y presentación"
      onCerrar={onCerrar}
      pie={
        <Boton type="submit" form="form-presentacion" ocupado={guardar.pendiente} textoOcupado="Guardando…">
          Guardar presentación
        </Boton>
      }
    >
      <div className="ui-edicion">
        <p>Tu foto es pública: la ven los clientes. No es la selfie de verificación, esa nunca se muestra.</p>
        <Boton variante="contorno" icono="camara" ocupado={foto.pendiente} textoOcupado="Subiendo la foto…" onClick={() => archivo.current?.click()}>
          Elegir otra foto
        </Boton>
        <input ref={archivo} type="file" accept="image/jpeg,image/png,image/webp" className="visualmente-oculto" tabIndex={-1} aria-hidden="true" onChange={(e) => void elegirFoto(e.target.files?.[0])} />
        {foto.fallo ? <ErrorCaja fallo={foto.fallo} /> : null}
        <form id="form-presentacion" onSubmit={(e) => void enviar(e)} noValidate>
          <AreaTexto etiqueta="Tu presentación" valor={texto} onCambio={setTexto} maximo={MAXIMO} ayuda="Contá en pocas palabras qué hacés y cómo trabajás. No pongas teléfono ni dirección." />
        </form>
        {guardar.fallo ? <ErrorCaja fallo={guardar.fallo} /> : null}
      </div>
    </Hoja>
  );
}
