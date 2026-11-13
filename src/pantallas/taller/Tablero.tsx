'use client';
// T-Tablero y T-TableroPared (fase H1, pasados al kit v3 y al visor y la AR comunes de src/tres en el lote 2.4): agregás
// protecciones, se encastran en el riel DIN en 3D y sale el gabinete, la lista de materiales y las etiquetas. La vista
// 3D se mueve con gestos **o** con botones; la lista es la representación accesible del tablero. «Ver en la pared»: AR
// en tamaño real (WebXR en Android, Quick Look en iPhone); sin ninguna de las dos, el botón no aparece.
// Inspirado en los configuradores de ABB, Schneider y Hager.
import { useMemo, useRef, useState } from 'react';
import { RUTAS } from '../../app/rutas.ts';
import { useIsla } from '../../kit/Efectos.tsx';
import { armarTablero, DISPOSITIVO, etiquetas, materialesTablero, tableroInicial, TIPOS_DISPOSITIVO, type Dispositivo, type TipoDispositivo } from '../../taller/tablero.ts';
import { escenaTablero } from '../../taller/tablero3d.ts';
import { tomarParaTablero } from '../../taller/traspaso.ts';
import { BotonAr } from '../../tres/BotonAr.tsx';
import { Visor3D, type ManejoVisor } from '../../tres/Visor3D.tsx';
import { Boton, BotonEnlace, BotonIcono } from '../../ui/atomos/Boton.tsx';
import { Campo } from '../../ui/atomos/Controles.tsx';
import { Seleccion } from '../../ui/atomos/Seleccion.tsx';
import { Chip, Etiqueta } from '../../ui/atomos/Texto.tsx';
import { AvisoCaja } from '../../ui/moleculas/AvisoCaja.tsx';
import { AvisoRevisionTecnica } from '../../ui/moleculas/Herramientas.tsx';
import { Tarjeta } from '../../ui/moleculas/Tarjeta.tsx';
import { AccionFija } from '../../ui/organismos/Acciones.tsx';
import { BarraCompacta } from '../../ui/organismos/Cabeceras.tsx';
import { PantallaSecundaria } from '../../ui/plantillas/Plantillas.tsx';
import './electricidad.css';

export function Tablero() {
  // Si venís de la foto con IA, arranca con lo que confirmaste; si no, con un tablero de casa típico.
  const [dispositivos, setDispositivos] = useState<Dispositivo[]>(() => tomarParaTablero() ?? tableroInicial());
  const [siguiente, setSiguiente] = useState(10);
  const [nuevoTipo, setNuevoTipo] = useState<TipoDispositivo>('termica_1p');
  const [nuevos, setNuevos] = useState<ReadonlySet<string>>(new Set());
  const vista = useRef<ManejoVisor>(null);
  const isla = useIsla();
  const a = armarTablero(dispositivos);
  const materiales = materialesTablero(dispositivos);
  const textos = etiquetas(dispositivos);
  const montar = useMemo(() => escenaTablero(dispositivos, nuevos), [dispositivos, nuevos]);
  const circuitos = dispositivos.filter((d) => d.tipo.startsWith('termica')).length;
  const resumen = a.gabinete ? `Gabinete de ${a.gabinete} módulos · usás ${a.modulosUsados} + ${a.reserva} de reserva` : `${a.modulosUsados} módulos: hace falta un tablero a medida`;

  const cambiar = (id: string, parcial: Partial<Dispositivo>) => setDispositivos((ds) => ds.map((d) => (d.id === id ? { ...d, ...parcial } : d)));
  const quitar = (id: string) => setDispositivos((ds) => ds.filter((d) => d.id !== id));
  function mover(id: string, paso: -1 | 1) {
    setDispositivos((ds) => {
      const i = ds.findIndex((d) => d.id === id);
      const j = i + paso;
      const x = ds[i];
      const y = ds[j];
      if (!x || !y) return ds;
      const copia = [...ds];
      copia[i] = y;
      copia[j] = x;
      return copia;
    });
  }
  function agregar(tipo: TipoDispositivo = nuevoTipo) {
    const calibres = DISPOSITIVO[tipo].calibres;
    const id = `d${siguiente}`;
    setDispositivos((ds) => [...ds, { id, tipo, calibre: calibres.includes(16) ? 16 : (calibres[0] ?? null), circuito: '' }]);
    setNuevos(new Set([id]));
    setSiguiente((n) => n + 1);
  }

  async function compartir() {
    const png = await vista.current?.imagen();
    const texto = `Tablero de ${a.gabinete ?? 'más de 48'} módulos\n${textos.map((t, i) => `${i + 1}. ${t}`).join('\n')}`;
    try {
      const archivo = png ? new File([png], 'tablero.png', { type: 'image/png' }) : null;
      if (archivo && navigator.canShare?.({ files: [archivo] })) await navigator.share({ files: [archivo], text: texto, title: 'Tablero' });
      else if (navigator.share) await navigator.share({ text: texto, title: 'Tablero' });
      else {
        await navigator.clipboard.writeText(texto);
        isla({ titulo: 'Copiamos el detalle del tablero', texto: 'Pegalo en el chat con tu cliente.', icono: 'check', tono: 'exito' });
      }
    } catch {
      // Cancelar el menú de compartir no es un error.
    }
  }

  return (
    <PantallaSecundaria
      barra={<BarraCompacta titulo="Tablero 3D" subtitulo={`Vivienda · ${circuitos} ${circuitos === 1 ? 'circuito' : 'circuitos'}`} hrefVolver={RUTAS.tallerElectricidad.ruta} />}
      accion={
        <AccionFija>
          <div className="el-acciones">
            <Boton variante="contorno" icono="enviar" onClick={() => void compartir()}>
              Compartir
            </Boton>
            {/* AR: en Android, en la app con WebXR; en iPhone, con AR Quick Look. El tablero se dibuja en decímetros. */}
            <BotonAr key={dispositivos.map((d) => `${d.tipo}${d.calibre ?? ''}`).join()} crear={() => vista.current?.objeto() ?? null} escala={0.1} superficie="pared" texto="Ver en la pared" miniatura={() => vista.current?.imagen() ?? Promise.resolve(null)} instruccion="Mostrale al cliente cómo queda en su pared: apuntá, esperá el círculo amarillo y tocá para ubicarlo en tamaño real." />
          </div>
        </AccionFija>
      }
    >
      <section className="el-escena" aria-label="El tablero en 3D">
        <Visor3D ref={vista} montar={montar} fondo="noche" descripcion={`${resumen}. ${textos.map((t, i) => `${i + 1}. ${t}`).join('. ')}`} descripcionVisible={false} />
        <p className="el-escena__pie">
          <Chip tono="amarillo" icono="cubo">
            3D
          </Chip>
          <span>{resumen}</span>
        </p>
      </section>
      <div className="el-atajos">
        <Boton variante="contorno" chico bloque={false} icono="mas" onClick={() => agregar('termica_1p')}>
          Térmica
        </Boton>
        <Boton variante="contorno" chico bloque={false} icono="escudo" onClick={() => agregar('diferencial_2p')}>
          Diferencial
        </Boton>
        <BotonEnlace variante="contorno" chico bloque={false} icono="camara" href={RUTAS.tallerEtiquetas.ruta}>
          Leer de una foto
        </BotonEnlace>
      </div>
      {a.avisos.map((t) => (
        <AvisoCaja key={t} tono="error">
          {t}
        </AvisoCaja>
      ))}

      <Tarjeta como="section" etiqueta="Protecciones, de izquierda a derecha">
        <Etiqueta como="h2">Protecciones, de izquierda a derecha</Etiqueta>
        <ol className="el-disps">
          {dispositivos.map((d, i) => {
            const t = DISPOSITIVO[d.tipo];
            return (
              <li key={d.id} className="el-disp">
                <div className="el-disp__cab">
                  <strong>
                    {i + 1}. {t.corto}
                  </strong>
                  <span>
                    {t.modulos} {t.modulos === 1 ? 'módulo' : 'módulos'}
                  </span>
                </div>
                <div className="el-disp__campos">
                  {t.calibres.length ? (
                    <Seleccion etiqueta="Calibre" value={d.calibre ?? ''} onChange={(e) => cambiar(d.id, { calibre: Number(e.target.value) })}>
                      {t.calibres.map((c) => (
                        <option key={c} value={c}>
                          {c} A
                        </option>
                      ))}
                    </Seleccion>
                  ) : null}
                  <Campo etiqueta="Qué protege" value={d.circuito} placeholder="Ej.: Tomas cocina" maxLength={40} onChange={(e) => cambiar(d.id, { circuito: e.target.value })} />
                </div>
                <div className="el-disp__botones">
                  <BotonIcono icono="izquierda" etiqueta={`Mover ${t.corto} ${i + 1} a la izquierda`} disabled={i === 0} onClick={() => mover(d.id, -1)} />
                  <BotonIcono icono="derecha" etiqueta={`Mover ${t.corto} ${i + 1} a la derecha`} disabled={i === dispositivos.length - 1} onClick={() => mover(d.id, 1)} />
                  <BotonIcono icono="tacho" etiqueta={`Quitar ${t.corto} ${i + 1}`} onClick={() => quitar(d.id)} />
                </div>
              </li>
            );
          })}
        </ol>
        <div className="el-agregar">
          <Seleccion etiqueta="Agregar al tablero" value={nuevoTipo} onChange={(e) => setNuevoTipo(e.target.value as TipoDispositivo)}>
            {TIPOS_DISPOSITIVO.map((t) => (
              <option key={t} value={t}>
                {DISPOSITIVO[t].texto}
              </option>
            ))}
          </Seleccion>
          <Boton variante="contorno" icono="mas" onClick={() => agregar()}>
            Agregar
          </Boton>
        </div>
      </Tarjeta>

      <Tarjeta como="section" etiqueta="Lista de materiales">
        <Etiqueta como="h2">Lista de materiales</Etiqueta>
        <ul className="el-lista">
          {materiales.map((m) => (
            <li key={m.descripcion}>
              <span>{m.descripcion}</span>
              <strong>× {m.cantidad}</strong>
            </li>
          ))}
        </ul>
        <p className="el-nota">Pronto: pasar esta lista al presupuesto con tus precios.</p>
      </Tarjeta>

      <Tarjeta como="section" etiqueta="Etiquetas">
        <div className="el-imprimible">
          <Etiqueta como="h2">Etiquetas</Etiqueta>
          <ol className="el-etiquetas">
            {textos.map((t, i) => (
              <li key={`${dispositivos[i]?.id}`}>{t}</li>
            ))}
          </ol>
        </div>
        <Boton variante="contorno" icono="ticket" onClick={() => window.print()}>
          Imprimir etiquetas
        </Boton>
      </Tarjeta>
      <AvisoRevisionTecnica>El tablero es una ayuda para armar y presupuestar: no reemplaza la norma ni tu criterio.</AvisoRevisionTecnica>
    </PantallaSecundaria>
  );
}
