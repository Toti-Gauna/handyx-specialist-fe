// Organismos de Cuenta (lote 1.4): la cabecera azul de F-Cuenta y la tarjeta de perfil de CU-Perfil.
// El sello «Verificado por Handyx» solo se muestra con `verificado` (lo dice el servidor), nunca por defecto.
import Link from 'next/link';
import { Icono } from '../atomos/Icono.tsx';
import { Chip } from '../atomos/Texto.tsx';
import './cuenta.css';

export interface DatoCabecera {
  valor: string;
  rotulo: string;
}

export function CabeceraCuenta({ nombre, iniciales, verificado, rubros, hrefPerfil, datos }: { nombre: string; iniciales: string; verificado: boolean; rubros: readonly string[]; hrefPerfil: string; datos: readonly DatoCabecera[] }) {
  return (
    <header className="ui-cab-cuenta">
      <div className="ui-cab-cuenta__fila">
        <h1 className="ui-cab-cuenta__etiqueta">Tu cuenta</h1>
        <Link href={hrefPerfil} className="ui-cab-cuenta__perfil">
          <Icono nombre="usuario" /> Ver mi perfil
        </Link>
      </div>
      <div className="ui-cab-cuenta__persona">
        <span className="ui-cab-cuenta__avatar" aria-hidden="true">
          {iniciales}
        </span>
        <div className="ui-cab-cuenta__nombre">
          <p className="ui-cab-cuenta__titulo">{nombre}</p>
          <div className="ui-cab-cuenta__chips">
            {verificado ? (
              <Chip tono="blanco" icono="verificado">
                Verificado por Handyx
              </Chip>
            ) : null}
            {rubros.map((r) => (
              <Chip key={r} tono="tinte" icono="herramienta">
                {r}
              </Chip>
            ))}
          </div>
        </div>
      </div>
      {datos.length > 0 ? (
        <ul className="ui-cab-cuenta__datos">
          {datos.map((d) => (
            <li key={d.rotulo}>
              <strong>{d.valor}</strong>
              <span>{d.rotulo}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </header>
  );
}

/** Lo que ven los clientes de vos: banner azul, foto o iniciales, nombre, sello, rubros, presentación y tres datos. */
export function TarjetaPerfil({ nombre, iniciales, foto, verificado, rubros, presentacion, datos }: { nombre: string; iniciales: string; foto: string | null; verificado: boolean; rubros: readonly string[]; presentacion: string | null; datos: readonly DatoCabecera[] }) {
  return (
    <section className="ui-perfil" aria-label="Tu perfil como lo ven los clientes">
      <div className="ui-perfil__banner" aria-hidden="true" />
      <div className="ui-perfil__cuerpo">
        <span className="ui-perfil__avatar" aria-hidden="true">
          {foto ? <img src={foto} alt="" width={84} height={84} /> : iniciales}
        </span>
        <p className="ui-perfil__nombre">{nombre}</p>
        <div className="ui-perfil__chips">
          {verificado ? (
            <Chip tono="exito" icono="verificado">
              Verificado por Handyx
            </Chip>
          ) : (
            <Chip tono="gris" icono="reloj">
              Todavía sin verificar
            </Chip>
          )}
          {rubros.map((r) => (
            <Chip key={r} tono="gris" icono="herramienta">
              {r}
            </Chip>
          ))}
        </div>
        {presentacion ? <p className="ui-perfil__frase">«{presentacion}»</p> : <p className="ui-perfil__frase ui-perfil__frase--vacia">Todavía no escribiste tu presentación.</p>}
        <ul className="ui-perfil__datos">
          {datos.map((d) => (
            <li key={d.rotulo}>
              <strong>{d.valor}</strong>
              <span>{d.rotulo}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
