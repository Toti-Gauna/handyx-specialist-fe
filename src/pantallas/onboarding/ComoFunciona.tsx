'use client';
// OB-Tour · Cómo funciona (lote 1.2). Tres láminas cortas: te llega un pedido (la ilustración arma el arreglo de tu
// rubro), vos ponés el precio y cobrás directo, sin comisión. No pasan solas: Siguiente, Anterior y Saltar.
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { RUTAS } from '../../app/rutas.ts';
import { usePerfil } from '../../components/GuardiaApp.tsx';
import { Marcador } from '../../ui/atomos/Texto.tsx';
import { ArregloRubro } from '../../ui/ilustraciones/Arreglos.tsx';
import { TelefonoIso } from '../../ui/ilustraciones/Registro.tsx';
import { Diapositivas, type Lamina } from '../../ui/organismos/Diapositivas.tsx';
import './onboarding.css';

export function ComoFunciona() {
  const router = useRouter();
  const { perfil } = usePerfil();
  const [i, setI] = useState(0);
  const rubro = perfil.rubros.find((r) => r.estado === 'habilitado')?.rubro ?? perfil.rubros[0]?.rubro ?? 'plomeria';
  const laminas: Lamina[] = [
    {
      ilustracion: <ArregloRubro rubro={rubro} armar tam="grande" />,
      titulo: (
        <>
          Te llega un <Marcador>pedido</Marcador>
        </>
      ),
      texto: 'Ves qué hay que arreglar y la zona aproximada. Abrirlo no te compromete a nada: vos decidís si te interesa.',
    },
    {
      ilustracion: <TelefonoIso pantalla="precio" armar tam="grande" />,
      titulo: (
        <>
          Vos <Marcador>ponés el precio</Marcador>
        </>
      ),
      texto: 'Handyx te sugiere uno para cada pedido, pero el que manda es el tuyo. El cliente acepta tu propuesta o no.',
    },
    {
      ilustracion: <TelefonoIso pantalla="cobro" armar tam="grande" />,
      titulo: (
        <>
          Cobrás <Marcador>directo</Marcador>
        </>
      ),
      texto: 'El cliente te paga a vos, por Mercado Pago o en efectivo. Handyx no te cobra comisión, nunca.',
    },
  ];
  const terminar = () => router.push(RUTAS.obPrimerosPasos.ruta);
  return (
    <div className="ui-pantalla ob">
      <Diapositivas
        laminas={laminas}
        indice={i}
        onCambio={setI}
        onTerminar={terminar}
        textoFinal="Ver los primeros pasos"
        saltar={
          <Link className="ob-saltar" href={RUTAS.obPrimerosPasos.ruta}>
            Saltar
          </Link>
        }
      />
    </div>
  );
}
