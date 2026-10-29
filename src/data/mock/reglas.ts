// Emulación en el mock de la regla de elegibilidad que en producción aplica el SERVIDOR.
// Se testea acá para que el mock no muestre algo que el backend real nunca ofrecería.
import type { Disponibilidad, PedidoElegible, PerfilEspecialista } from '../../contracts/dto.ts';

export function filtrarElegibles(
  pedidos: readonly PedidoElegible[],
  perfil: PerfilEspecialista,
  disp: Disponibilidad,
): PedidoElegible[] {
  if (perfil.estadoAlta !== 'habilitada' || perfil.baja !== null) return [];
  const habilitados = new Set(perfil.rubros.filter((r) => r.estado === 'habilitado').map((r) => r.rubro));
  return pedidos.filter((p) => {
    if (!habilitados.has(p.rubro)) return false;
    if (p.tipo === 'urgente') return disp.urgentesAhora;
    return disp.programados;
  });
}
