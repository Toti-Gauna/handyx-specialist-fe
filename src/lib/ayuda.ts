// Centro de ayuda (lote 4.8): preguntas frecuentes por tema. Cada respuesta repite una regla que la app ya cumple
// (pagos directos, fee 0 % de la demo, sin obligación de aceptar, verificación por Operations, llegada, adicionales…).
// Si una regla cambia, se cambia acá también.
import type { NombreIcono } from '../components/Icono.tsx';

export interface TemaAyuda {
  id: string;
  texto: string;
  icono: NombreIcono;
  preguntas: readonly { pregunta: string; respuesta: string }[];
}

export const TEMAS_AYUDA: readonly TemaAyuda[] = [
  {
    id: 'cobros',
    texto: 'Cobros',
    icono: 'billetera',
    preguntas: [
      { pregunta: '¿Quién me paga?', respuesta: 'El cliente, directo a vos: por Mercado Pago o en efectivo. Handyx no recibe, guarda ni te transfiere ese dinero.' },
      { pregunta: '¿Cuánto cobra Handyx?', respuesta: 'Durante la demo, del 10/11 al 10/12/2026, Handyx no te cobra tarifa: 0 %. Cualquier tarifa futura se te avisa en la app antes de que rija.' },
      { pregunta: '¿Qué quiere decir “reportado, sin verificar”?', respuesta: 'Que el cobro lo informaste vos. Queda verificado cuando lo confirma Mercado Pago u Operations: informarlo no lo verifica.' },
      { pregunta: '¿Handyx me puede pedir la clave de Mercado Pago?', respuesta: 'No, nunca. Si alguien te la pide en nombre de Handyx, no la des y avisanos desde un caso.' },
    ],
  },
  {
    id: 'pedidos',
    texto: 'Pedidos',
    icono: 'lupa',
    preguntas: [
      { pregunta: '¿Estoy obligado a aceptar pedidos?', respuesta: 'No. Handyx no te asigna trabajos: vos elegís a qué pedidos mandarles tu precio. Un aviso solo te muestra el pedido; nunca acepta nada por vos.' },
      { pregunta: '¿Qué es “Disponible”?', respuesta: 'Es para recibir pedidos urgentes. Lo prendés cuando podés salir y lo apagás cuando quieras, sin ninguna consecuencia.' },
      { pregunta: '¿Qué es “Handyx sugiere”?', respuesta: 'Una referencia de precio por rubro y tipo de pedido. El precio lo ponés vos.' },
      { pregunta: '¿Cuánto vale mi propuesta?', respuesta: 'En los urgentes, 5 minutos. En los programados y las obras, el plazo que figura en tu propuesta. Si vence, no te resta nada.' },
    ],
  },
  {
    id: 'trabajos',
    texto: 'Trabajos y obras',
    icono: 'maletin',
    preguntas: [
      { pregunta: '¿Cómo se marca que llegué?', respuesta: 'Sola, cuando entrás en la cuadra con la app abierta y compartiendo tu ubicación. Si la ubicación anda mal o no la compartís, avisás con «Ya llegué».' },
      { pregunta: '¿Y si aparece algo que no estaba acordado?', respuesta: 'Agregalo como repuesto o mano de obra. El cliente lo acepta o no; mientras tanto rige el precio acordado. Hacelo después de que lo acepte.' },
      { pregunta: '¿Cómo funciona una obra de varios días?', respuesta: 'Se hace por etapas. Cada etapa se termina y se cobra por separado; podés pedir otro día para una jornada sin mover las demás.' },
      { pregunta: '¿Puedo cancelar un trabajo?', respuesta: 'Sí, antes de empezarlo y con un motivo. Handyx no aplica penalizaciones automáticas. Con el trabajo empezado, lo cancela Operations: escribinos.' },
    ],
  },
  {
    id: 'cuenta',
    texto: 'Cuenta y verificación',
    icono: 'verificado',
    preguntas: [
      { pregunta: '¿Quién verifica mis documentos?', respuesta: 'Operations. Cargar un documento no lo verifica: el estado cambia cuando lo revisan.' },
      { pregunta: '¿Cómo se verifican los antecedentes?', respuesta: 'En persona, con un turno que elegís en el alta. Nunca se suben archivos ni capturas de los antecedentes.' },
      { pregunta: '¿Qué ve el cliente de mí?', respuesta: 'Tu nombre, tus rubros habilitados y el sello si Handyx verificó tu alta. Tus documentos y tu ubicación real los ve solo el personal autorizado.' },
      { pregunta: '¿Cómo doy de baja mi cuenta?', respuesta: 'Desde Cuenta › Privacidad y baja. Es una baja real: se borran tus datos, salvo los registros de trabajos y pagos que la ley obliga a conservar.' },
    ],
  },
  {
    id: 'seguridad',
    texto: 'Seguridad',
    icono: 'escudo',
    preguntas: [
      { pregunta: '¿Qué hago si no me siento a salvo en un trabajo?', respuesta: 'Si corrés peligro, alejate del lugar y llamá al 911. Después contanos qué pasó desde un caso.' },
      { pregunta: '¿Por qué no veo el teléfono del cliente?', respuesta: 'Para cuidar a los dos. Hablan por el chat del pedido o con la llamada por la app, que usa un número de Handyx.' },
    ],
  },
];
