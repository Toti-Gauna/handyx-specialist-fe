import assert from 'node:assert/strict';
import { it } from 'node:test';
import type { DatosAlta, Disponibilidad, PerfilEspecialista } from '../contracts/dto.ts';
import { bloquesDesdeFranjas, esPasoAlta, franjasDesdeBloques, itemsAlta, progresoAlta, siguientePaso } from './alta.ts';

const perfil = (p: Partial<PerfilEspecialista> = {}): PerfilEspecialista => ({
  id: '00000000-0000-4000-8000-000000000001',
  email: 'especialista@example.test',
  nombre: 'Especialista',
  apellido: 'De Prueba',
  estadoAlta: 'borrador',
  motivoRevision: null,
  documentos: { dni: 'cargado', cuitCuil: 'cargado', fotoCara: 'cargado' },
  antecedentes: 'pendiente_cita',
  citaAntecedentes: null,
  rubros: [{ rubro: 'plomeria', estado: 'elegido', matricula: null }],
  faltantesEnvio: [],
  baja: null,
  version: 1,
  ...p,
});
const datos: DatosAlta = { nombre: 'Especialista', apellido: 'De Prueba', fechaNacimiento: '1988-04-12', nacionalidad: 'Argentina', genero: 'prefiero_no_decir', ciudad: 'Mar del Plata', barrio: null, dniUltimos: '••••222', cuitCuilUltimos: '••••2229', version: 1 };
const disp = (z: string[], f = 1): Disponibilidad => ({ urgentesAhora: false, urgentesCambiadoEn: null, programados: false, franjas: Array.from({ length: f }, () => ({ dia: 1, desde: '08:00', hasta: '12:00' })), zonas: z, version: 1 });
const fecha = (iso: string) => `F(${iso})`;
const estado = (items: ReturnType<typeof itemsAlta>, paso: string) => items.find((i) => i.paso === paso)?.estado;

it('alta completa: todo listo salvo lo opcional (zonas y turno)', () => {
  const items = itemsAlta(perfil(), datos, disp([]), fecha);
  assert.deepEqual(items.map((i) => i.estado), ['listo', 'listo', 'listo', 'listo', 'opcional', 'opcional']);
  assert.deepEqual(progresoAlta(items), { hechos: 4, total: 6 });
  assert.equal(siguientePaso(items), null);
});

it('lo que falta sale del servidor y lo rechazado se marca para corregir antes que lo faltante', () => {
  const items = itemsAlta(perfil({ faltantesEnvio: ['datos', 'dni'], documentos: { dni: 'rechazado', cuitCuil: 'cargado', fotoCara: 'faltante' } }), datos, null, fecha);
  assert.equal(estado(items, 'datos'), 'falta');
  assert.equal(estado(items, 'identidad'), 'corregir');
  assert.equal(siguientePaso(items), 'identidad');
});

it('matrícula, zonas y turno', () => {
  const p = perfil({
    rubros: [{ rubro: 'gas', estado: 'en_revision', matricula: 'en_revision' }],
    antecedentes: 'cita_coordinada',
    citaAntecedentes: { turnoId: '00000000-0000-4000-8000-000000006000', inicio: '2026-11-18T13:00:00.000Z', fin: '2026-11-18T13:30:00.000Z', lugar: 'Oficina' },
  });
  const items = itemsAlta(p, datos, disp(['Centro', 'Güemes'], 2), fecha);
  assert.equal(estado(items, 'rubros'), 'revision');
  assert.equal(items.find((i) => i.paso === 'zonas')?.detalle, '2 barrios · 2 franjas');
  assert.equal(items.find((i) => i.paso === 'antecedentes')?.detalle, 'Turno: F(2026-11-18T13:00:00.000Z)');
  assert.equal(estado(itemsAlta(perfil({ antecedentes: 'no_asistio' }), datos, null, fecha), 'antecedentes'), 'falta');
});

it('solo los pasos conocidos', () => {
  assert.equal(esPasoAlta('selfie'), true);
  assert.equal(esPasoAlta('resumen'), false);
  assert.equal(esPasoAlta(null), false);
});

it('horarios: los bloques seguidos se unen y una franja ancha marca los bloques que cubre', () => {
  const marcados = new Set(['1:manana', '1:tarde', '3:noche', '0:manana']);
  assert.deepEqual(franjasDesdeBloques(marcados), [
    { dia: 1, desde: '08:00', hasta: '17:00' },
    { dia: 3, desde: '17:00', hasta: '21:00' },
    { dia: 0, desde: '08:00', hasta: '12:00' },
  ]);
  assert.deepEqual([...bloquesDesdeFranjas([{ dia: 5, desde: '08:00', hasta: '13:00' }])], ['5:manana']);
  assert.deepEqual([...bloquesDesdeFranjas(franjasDesdeBloques(marcados))].sort(), [...marcados].sort());
});
