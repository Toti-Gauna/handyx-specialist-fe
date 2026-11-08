// Centro de ayuda (D6-Ayuda, lote 1.4): preguntas frecuentes por tema, en palabras simples y sin siglas. Cada respuesta
// repite una regla que la app ya cumple (pagos directos, sin comisión al especialista, sin obligación de aceptar,
// verificación por el equipo, llegada, adicionales…). Si una regla cambia, se cambia acá también.
import type { NombreIconoUi } from '../ui/atomos/Icono.tsx';

export interface PreguntaAyuda {
  pregunta: string;
  respuesta: string;
  /** Sale en «Lo más consultado». */
  destacada?: boolean;
}

export interface TemaAyuda {
  id: string;
  texto: string;
  icono: NombreIconoUi;
  preguntas: readonly PreguntaAyuda[];
}

export const TEMAS_AYUDA: readonly TemaAyuda[] = [
  {
    id: 'cobros',
    texto: 'Cobros',
    icono: 'billete',
    preguntas: [
      { pregunta: '¿Cuánto me cobra Handyx?', respuesta: 'Nada. Recibís el 100 % de tu precio y el cliente te paga directo a vos, por Mercado Pago o en efectivo. Handyx no te cobra comisión.', destacada: true },
      { pregunta: '¿Quién me paga?', respuesta: 'El cliente, directo a vos. Handyx no recibe, no guarda ni te transfiere ese dinero.' },
      { pregunta: '¿Qué quiere decir «por verificar»?', respuesta: 'Que el cobro lo informaste vos. Queda verificado cuando lo confirma Mercado Pago o el equipo de Handyx: informarlo no alcanza para verificarlo.' },
      { pregunta: '¿Handyx me puede pedir la contraseña de Mercado Pago?', respuesta: 'No, nunca. Si alguien te la pide en nombre de Handyx, no la des y avisanos desde un caso.' },
    ],
  },
  {
    id: 'pedidos',
    texto: 'Pedidos',
    icono: 'herramienta',
    preguntas: [
      { pregunta: '¿Qué pasa si no acepto un pedido?', respuesta: 'No pasa nada. No tenés obligación de aceptar ninguno y Handyx no te asigna trabajos: vos elegís a cuáles mandarles tu precio.', destacada: true },
      { pregunta: '¿Qué es «Disponible»?', respuesta: 'Es para recibir pedidos urgentes. Lo prendés cuando podés salir y lo apagás cuando quieras, sin ninguna consecuencia.' },
      { pregunta: '¿Qué es el precio que sugiere Handyx?', respuesta: 'Una referencia por rubro y tipo de pedido. El precio lo ponés vos: Handyx sugiere, nunca impone.' },
      { pregunta: '¿Cuánto dura mi propuesta?', respuesta: 'En los pedidos urgentes, 5 minutos. En los programados y las obras, el plazo que figura en tu propuesta. Si vence, no te resta nada.' },
      { pregunta: '¿Un aviso acepta el pedido por mí?', respuesta: 'No. Un aviso solo te muestra el pedido. Aceptar o mandar tu precio lo hacés vos, en la pantalla del pedido.' },
    ],
  },
  {
    id: 'obras',
    texto: 'Obras y equipo',
    icono: 'edificio',
    preguntas: [
      { pregunta: '¿Cómo funciona una obra de varios días?', respuesta: 'Se hace por etapas. Cada etapa se termina y se cobra por separado, y podés pedir otro día para una jornada sin mover las demás.' },
      { pregunta: '¿Cómo se marca que llegué?', respuesta: 'Se marca sola cuando entrás en la cuadra con la app abierta y compartiendo tu ubicación. Si la ubicación anda mal, avisás con «Ya llegué».' },
      { pregunta: '¿Y si aparece algo que no estaba acordado?', respuesta: 'Agregalo como repuesto o mano de obra. El cliente lo acepta o no; mientras tanto rige el precio acordado.' },
      { pregunta: '¿Puedo cancelar un trabajo?', respuesta: 'Sí, antes de empezarlo y con un motivo. Handyx no aplica castigos automáticos. Con el trabajo empezado, escribinos desde un caso.' },
    ],
  },
  {
    id: 'verificacion',
    texto: 'Verificación',
    icono: 'escudo',
    preguntas: [
      { pregunta: '¿Quién verifica mis documentos?', respuesta: 'El equipo de verificación de Handyx. Cargar un documento no lo verifica: el estado cambia cuando lo revisan.', destacada: true },
      { pregunta: '¿Qué pasa con mis antecedentes penales?', respuesta: 'Los subís en foto o PDF. Se guardan cifrados, los ve solo el equipo de verificación, nunca una inteligencia artificial, y se borran apenas se verifican.' },
      { pregunta: '¿Por qué me piden la matrícula?', respuesta: 'En Gas y en Aire acondicionado hace falta la matrícula verificada para habilitar el rubro. En los demás es opcional y suma a tu perfil.' },
      { pregunta: '¿Qué significa «Verificado por Handyx»?', respuesta: 'Que el equipo revisó y aprobó tu alta completa. El sello lo pone Handyx, nunca lo podés poner vos.' },
    ],
  },
  {
    id: 'cuenta',
    texto: 'Cuenta',
    icono: 'usuario',
    preguntas: [
      { pregunta: '¿Qué ve el cliente de mí?', respuesta: 'Tu nombre, tu foto, tu presentación, tus rubros habilitados y el sello si estás verificado. Tus documentos y tu dirección los ve solo el personal autorizado.' },
      { pregunta: '¿Cómo agrando la letra?', respuesta: 'En Cuenta, prendé «Letra más grande». Se guarda en tu cuenta y vale en toda la app.' },
      { pregunta: '¿Cómo me doy de baja?', respuesta: 'Desde Cuenta › Privacidad y baja. Es una baja real: se borran tus datos, salvo los registros de trabajos y pagos que la ley obliga a conservar.' },
    ],
  },
  {
    id: 'seguridad',
    texto: 'Seguridad',
    icono: 'candado',
    preguntas: [
      { pregunta: '¿Para qué sirve la segunda verificación?', respuesta: 'Para que, aunque alguien sepa tu contraseña, no pueda entrar a tu cuenta desde otro teléfono. Es opcional y la activás en Cuenta › Seguridad.' },
      { pregunta: '¿Qué hago si pierdo el teléfono?', respuesta: 'Entrá con uno de tus códigos de respaldo y, desde Seguridad, cerrá la sesión del teléfono perdido. Si no los guardaste, escribinos desde un caso.' },
      { pregunta: '¿Qué hago si no me siento a salvo en un trabajo?', respuesta: 'Si corrés peligro, alejate del lugar y llamá al 911. Después contanos qué pasó desde un caso.' },
      { pregunta: '¿Por qué no veo el teléfono del cliente?', respuesta: 'Para cuidar a los dos. Hablan por el chat del pedido o con la llamada por la app, que usa un número de Handyx.' },
    ],
  },
];

/** Las más consultadas, de todos los temas. */
export const MAS_CONSULTADAS: readonly PreguntaAyuda[] = TEMAS_AYUDA.flatMap((t) => t.preguntas.filter((q) => q.destacada));

/** Sin mayúsculas ni tildes, para que «matricula» encuentre «matrícula». */
export const normalizar = (t: string): string => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

/** Las preguntas que contienen todas las palabras buscadas (en la pregunta o en la respuesta). */
export function buscarPreguntas(texto: string, temas: readonly TemaAyuda[] = TEMAS_AYUDA): PreguntaAyuda[] {
  const palabras = normalizar(texto).split(/\s+/).filter(Boolean);
  if (palabras.length === 0) return [];
  return temas.flatMap((t) => t.preguntas).filter((q) => {
    const pajar = normalizar(`${q.pregunta} ${q.respuesta}`);
    return palabras.every((p) => pajar.includes(p));
  });
}
