'use client';
// F-Cuenta (lote 1.4): todo lo tuyo en un lugar. Cabecera azul con tu nombre, el sello (solo si lo dice el servidor) y lo que
// hiciste; los mosaicos de ingresos, taller, presupuestos y equipamiento (cierre de la ola 2); tu trabajo, tu cuenta, cómo
// ves la app (letra más grande, guardada en el servidor) y ayuda. Los mosaicos del Camino y de la ferretería llegan con
// sus lotes (3.4 y 4.1). Las cifras de los mosaicos son un extra: si no llegan, el mosaico igual lleva a su pantalla.
import { api } from '@handyx/origen-datos';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { RUTAS } from '../app/rutas.ts';
import { Cargando, ErrorCaja } from '../components/Estados.tsx';
import { usePerfil } from '../components/GuardiaApp.tsx';
import { NOMBRE_RUBRO } from '../contracts/rubros.ts';
import { useAccion } from '../hooks/useAccion.ts';
import { useCarga } from '../hooks/useCarga.ts';
import { mesDe, nombreMes } from '../lib/agendaTaller.ts';
import { cuerpoPreferencias } from '../lib/cuenta.ts';
import { ALTA } from '../lib/etiquetas.ts';
import { diaLocal } from '../lib/formato.ts';
import { FilaIcono } from '../ui/moleculas/Tarjeta.tsx';
import { FilaAjuste, GrupoAjustes, ResumenTarjeta } from '../ui/moleculas/Ajustes.tsx';
import { CabeceraCuenta } from '../ui/organismos/CuentaPiezas.tsx';
import { PantallaRaiz } from '../ui/plantillas/Plantillas.tsx';
import { aplicarLetraGrande } from '../ui/letra.tsx';

export function Cuenta() {
  const router = useRouter();
  const { perfil } = usePerfil();
  const mes = mesDe(diaLocal(api.ahora().toISOString()));
  const c = useCarga(async () => {
    const [propio, preferencias, ingresos, abiertos, equipo] = await Promise.all([
      api.perfilPropio(),
      api.preferencias(),
      api.resumenIngresos(mes).catch(() => null),
      api.presupuestos('abiertos').catch(() => null),
      api.equipamiento().catch(() => null),
    ]);
    return { propio, preferencias, ingresos, abiertos, equipo };
  }, [mes]);
  const salida = useAccion();
  const letra = useAccion();
  // La preferencia que se acaba de guardar, mientras la pantalla se vuelve a cargar.
  const [letraGrande, setLetraGrande] = useState<boolean | null>(null);

  if (c.fallo && !c.datos) return <ErrorCaja pantalla fallo={c.fallo} onReintentar={() => void c.recargar()} />;
  if (!c.datos) return <Cargando />;
  const { propio, preferencias, ingresos, abiertos, equipo } = c.datos;
  const nombreDelMes = nombreMes(mes).split(' ')[0]?.toLowerCase() ?? 'este mes';
  const cuantosAbiertos = abiertos?.items.length ?? 0;
  const herramientas = equipo ? equipo.categorias.reduce((n, x) => n + x.cantidad, 0) : 0;
  const nombre = propio.nombrePublico ?? ([perfil.nombre, perfil.apellido].filter(Boolean).join(' ') || 'Tu cuenta');
  const rubros = propio.rubros.filter((r) => r.habilitado).map((r) => NOMBRE_RUBRO[r.rubro]);
  const grande = letraGrande ?? preferencias.letraGrande === true;

  async function cambiarLetra(v: boolean) {
    const r = await letra.ejecutar(async () => {
      await api.guardarPreferencias(cuerpoPreferencias(preferencias, { letraGrande: v }));
      await c.recargar();
    });
    if (r.ok) {
      setLetraGrande(v);
      aplicarLetraGrande(v);
    }
  }
  async function salir() {
    const r = await salida.ejecutar(() => api.salir());
    if (!r.ok) return;
    aplicarLetraGrande(false);
    router.replace(RUTAS.acceso.ruta);
  }

  return (
    <PantallaRaiz
      cabecera={
        <CabeceraCuenta
          nombre={nombre}
          iniciales={propio.iniciales}
          verificado={propio.verificado}
          rubros={rubros}
          hrefPerfil={RUTAS.cuentaPerfil.ruta}
          datos={[{ valor: String(propio.trabajosVerificados), rotulo: propio.trabajosVerificados === 1 ? 'trabajo verificado' : 'trabajos verificados' }]}
        />
      }
    >
      <div className="ui-resumenes">
        {ingresos?.neto ? (
          <ResumenTarjeta icono="billete" titulo="Tus ingresos" centavos={ingresos.neto.centavos} detalle={`Neto de ${nombreDelMes}`} href={RUTAS.ingresos.ruta} tono="noche" />
        ) : (
          <ResumenTarjeta icono="billete" titulo="Tus ingresos" detalle={ingresos ? 'Este mes gastaste más de lo que cobraste' : 'Lo que cobraste y lo que gastaste'} href={RUTAS.ingresos.ruta} tono="noche" />
        )}
        <ResumenTarjeta icono="herramienta" titulo="Tu taller" detalle="Agenda y herramientas de tu oficio" href={RUTAS.taller.ruta} />
        <ResumenTarjeta
          icono="ticket"
          titulo="Presupuestos y precios"
          detalle={cuantosAbiertos > 0 ? `${cuantosAbiertos} ${cuantosAbiertos === 1 ? 'presupuesto abierto' : 'presupuestos abiertos'}${abiertos?.siguienteCursor ? ' o más' : ''}` : 'Tu lista de precios y mano de obra'}
          href={RUTAS.precios.ruta}
        />
        <ResumenTarjeta
          icono="caja"
          titulo="Tu equipamiento"
          detalle={herramientas > 0 ? `${herramientas} ${herramientas === 1 ? 'herramienta' : 'herramientas'}${equipo && equipo.listaCompras > 0 ? ` · ${equipo.listaCompras} para comprar` : ''}` : 'Tus herramientas y dónde están'}
          href={RUTAS.equipamiento.ruta}
        />
      </div>

      <GrupoAjustes etiqueta="Tu trabajo">
        <FilaIcono icono="cuenta" titulo="Tu perfil" detalle="Cómo te ven los clientes" href={RUTAS.cuentaPerfil.ruta} />
        <FilaIcono icono="pin" titulo="Disponibilidad y zonas" detalle="Días, horarios y zonas" href={RUTAS.disponibilidad.ruta} />
        <FilaIcono icono="ticket" titulo="Tus cobros" detalle="Verificados y por verificar. El pago va directo a vos" href={RUTAS.caja.ruta} />
        <FilaIcono icono="billete" titulo="Medios de cobro" detalle="Mercado Pago, efectivo o transferencia" href={RUTAS.cuentaCobros.ruta} />
        <FilaIcono icono="chat" titulo="Contactos" detalle="Los profesionales que agregaste" href={RUTAS.contactos.ruta} />
      </GrupoAjustes>

      <GrupoAjustes etiqueta="Tu cuenta">
        <FilaIcono icono="escudo" titulo="Datos y verificación" detalle={ALTA[perfil.estadoAlta].texto} href={RUTAS.cuentaDatos.ruta} />
        <FilaIcono icono="llave" titulo="Seguridad" detalle="Contraseña y segunda verificación" href={RUTAS.cuentaSeguridad.ruta} />
        <FilaIcono icono="campana" titulo="Avisos" detalle="Qué te llega y cuándo" href={RUTAS.cuentaNotificaciones.ruta} />
        <FilaIcono icono="candado" titulo="Privacidad y baja" detalle="Tus datos y tu cuenta" href={RUTAS.cuentaPrivacidad.ruta} />
      </GrupoAjustes>

      <GrupoAjustes etiqueta="Cómo ves la app">
        <FilaAjuste titulo="Letra más grande" detalle="Agranda todos los textos de la app. Se guarda en tu cuenta." encendido={grande} deshabilitado={letra.pendiente} onCambio={(v) => void cambiarLetra(v)} />
        {letra.fallo ? <ErrorCaja fallo={letra.fallo} /> : null}
      </GrupoAjustes>

      <GrupoAjustes etiqueta="Ayuda">
        <FilaIcono icono="pregunta" titulo="Centro de ayuda" detalle="Preguntas y soporte" href={RUTAS.soporte.ruta} />
        <FilaIcono icono="salir" titulo="Cerrar sesión" detalle="En este teléfono" onClick={() => void salir()} />
        {salida.fallo ? <ErrorCaja fallo={salida.fallo} /> : null}
      </GrupoAjustes>

      <p className="ui-pie-cuenta">Handyx para especialistas · versión 1.0</p>
    </PantallaRaiz>
  );
}
