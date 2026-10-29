import {
  GuardarDatosAltaSchema,
  TIPOS_DOCUMENTO,
  type DatosAlta,
  type PerfilEspecialista,
  type PerfilPublico,
  type TipoDocumento,
} from '../../contracts/dto.ts';
import { faltantesParaHabilitar } from '../../contracts/maquinas.ts';
import { RUBROS, requiereMatricula, type Rubro } from '../../contracts/rubros.ts';
import { FalloApi } from '../errores.ts';
import { fallo, iso, ahoraMs, idNuevo, type EstadoMock } from './estado.ts';
import { altaEditable, calcularFaltantes, nombrePublico, recalcular } from './reglas.ts';
import { zodAFallo } from './validacion.ts';

const ultimos = (v: string | null, n: number): string | null => (v ? `••••${v.slice(-n)}` : null);

function vistaDatos(s: EstadoMock): DatosAlta {
  return { ...s.alta.datos, dniUltimos: ultimos(s.alta.dni, 3), cuitCuilUltimos: ultimos(s.alta.cuitCuil, 4), version: s.alta.version };
}

function exigirEditable(s: EstadoMock): void {
  if (!altaEditable(s)) {
    throw fallo('conflicto', 409, 'transicion_invalida', 'Tu alta ya está enviada: no se puede editar mientras la revisamos.');
  }
}

export const alta = (s: EstadoMock) => ({
  perfil: (): PerfilEspecialista => s.perfil,
  perfilPublico(): PerfilPublico {
    const verificado = s.perfil.estadoAlta === 'habilitada' && faltantesParaHabilitar({
      dni: s.perfil.documentos.dni,
      cuitCuil: s.perfil.documentos.cuitCuil,
      fotoCara: s.perfil.documentos.fotoCara,
      antecedentes: s.perfil.antecedentes,
      rubrosHabilitados: s.perfil.rubros.filter((r) => r.estado === 'habilitado').length,
    }).length === 0;
    return {
      nombrePublico: nombrePublico(s),
      rubrosHabilitados: s.perfil.rubros.filter((r) => r.estado === 'habilitado').map((r) => r.rubro),
      verificado,
    };
  },
  datosAlta: (): DatosAlta => vistaDatos(s),
  guardarDatosAlta(datos: unknown): DatosAlta {
    exigirEditable(s);
    const ok = GuardarDatosAltaSchema.safeParse(datos);
    if (!ok.success) throw zodAFallo(ok.error);
    const { version, dni, cuitCuil, ...resto } = ok.data;
    if (version !== s.alta.version) throw fallo('conflicto', 409, 'conflicto_version', 'Tus datos cambiaron desde otra pantalla. Volvé a cargarlos.');
    Object.assign(s.alta.datos, resto);
    if (dni !== undefined) s.alta.dni = dni;
    if (cuitCuil !== undefined) s.alta.cuitCuil = cuitCuil;
    s.alta.version += 1;
    recalcular(s);
    return vistaDatos(s);
  },
  // El mock nunca lee ni guarda el archivo: solo registra que se cargó.
  cargarDocumento(tipo: TipoDocumento, rubro?: Rubro): PerfilEspecialista {
    // Antecedentes no existen como documento: se verifican en persona con Operations.
    if (!(TIPOS_DOCUMENTO as readonly string[]).includes(tipo)) {
      throw new FalloApi('validacion', 415, { codigo: 'tipo_archivo_prohibido', mensaje: 'Ese tipo de archivo no se acepta.', requestId: 'req-prueba-0001' });
    }
    exigirEditable(s);
    if (tipo === 'matricula') {
      const r = s.perfil.rubros.find((x) => x.rubro === rubro);
      if (!r || !requiereMatricula(r.rubro)) throw fallo('validacion', 400, 'validacion', 'Ese rubro no pide matrícula.');
      if (r.matricula === 'en_revision' || r.matricula === 'verificado') throw fallo('conflicto', 409, 'transicion_invalida', 'Esa matrícula ya está en revisión.');
      r.matricula = 'cargado';
      r.estado = 'elegido';
    } else {
      const clave = tipo === 'dni' ? 'dni' : tipo === 'cuit_cuil' ? 'cuitCuil' : 'fotoCara';
      const actual = s.perfil.documentos[clave];
      if (actual === 'en_revision' || actual === 'verificado') throw fallo('conflicto', 409, 'transicion_invalida', 'Ese documento ya está en revisión.');
      s.perfil.documentos[clave] = 'cargado';
    }
    recalcular(s);
    return s.perfil;
  },
  elegirRubros(rubros: Rubro[]): PerfilEspecialista {
    exigirEditable(s);
    const validos = rubros.filter((r) => (RUBROS as readonly string[]).includes(r));
    if (validos.length !== rubros.length) throw fallo('validacion', 400, 'validacion', 'Hay un rubro que no existe.');
    s.perfil.rubros = validos.map((rubro) => {
      const previo = s.perfil.rubros.find((r) => r.rubro === rubro);
      if (previo) return previo;
      return requiereMatricula(rubro)
        ? { rubro, estado: 'requiere_matricula' as const, matricula: 'faltante' as const }
        : { rubro, estado: 'elegido' as const, matricula: null };
    });
    recalcular(s);
    return s.perfil;
  },
  enviarAlta(): PerfilEspecialista {
    exigirEditable(s);
    const faltan = calcularFaltantes(s);
    if (faltan.length > 0) {
      throw new FalloApi('validacion', 400, {
        codigo: 'validacion',
        mensaje: 'Todavía faltan datos para enviar tu alta.',
        requestId: 'req-prueba-0001',
        campos: faltan.map((campo) => ({ campo, codigo: 'faltante' })),
      });
    }
    s.perfil.estadoAlta = 'enviada';
    s.perfil.motivoRevision = null;
    s.perfil.rubros = s.perfil.rubros.map((r) => ({ ...r, estado: 'en_revision' as const }));
    s.avisos.unshift({
      id: idNuevo(s),
      tipo: 'cuenta',
      titulo: 'Recibimos tu alta',
      cuerpo: 'Operations la va a revisar. Te avisamos cuando haya novedades.',
      creadoEn: iso(ahoraMs(s)),
      leido: false,
      destino: { ruta: 'alta', id: null },
    });
    recalcular(s);
    return s.perfil;
  },
});
