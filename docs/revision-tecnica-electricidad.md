# Revisión técnica · Taller de Electricidad

Para el profesional evaluador y para Legal (LEG). Mientras esta revisión no esté hecha, la app muestra en cada cálculo
«Valores de referencia en revisión técnica» (`REVISION` en `src/taller/electricidad.ts`). Al aprobar, se pasa
`REVISION.estado` a `'revisado'`, se cita la norma con su versión y se ajustan los valores que haga falta (cada uno
tiene su prueba en `src/taller/*.test.ts`).

No se copiaron tablas de la Reglamentación AEA 90364 ni de normas IRAM (tienen derechos): los valores salen de
bibliografía técnica pública (IEC 60364-5-52) y de criterios de uso común. Hay que decidir si se licencian o si se
mantienen valores propios revisados.

## 1. Sección de conductores y caída de tensión (`electricidad.ts`)

| Qué | Valor que usa la app | Revisar |
|---|---|---|
| Corriente admisible, cobre/PVC en cañería embutida, 30 °C, 2 conductores cargados (A) | 1,5 → 16,5 · 2,5 → 23 · 4 → 30 · 6 → 38 · 10 → 52 · 16 → 69 · 25 → 83 · 35 → 103 | Contra la tabla AEA que corresponda al método de instalación |
| Ídem, 3 conductores cargados (A) | 1,5 → 15 · 2,5 → 20 · 4 → 27 · 6 → 34 · 10 → 46 · 16 → 62 · 25 → 80 · 35 → 99 | Ídem |
| Factor por temperatura (PVC) | 25 °C 1,06 · 30 °C 1 · 35 °C 0,94 · 40 °C 0,87 · 45 °C 0,79 · 50 °C 0,71 | |
| Factor por circuitos en el mismo caño | 1 → 1 · 2 → 0,8 · 3 → 0,7 · 4 → 0,65 · 5 → 0,6 · 6 o más → 0,57 | |
| Resistividad del cobre en servicio | 0,0225 Ω·mm²/m | |
| Fórmula de caída | ΔU = k·L·I·ρ·cos φ / S, k = 2 (mono) o √3 (tri), sin reactancia (≤ 35 mm²) | |
| Caída máxima por tipo de circuito | Iluminación 3 % · Tomas y uso especial 5 % · Seccional y principal 1 % | Criterio AEA vigente (desde el origen o por tramo) |
| Sección mínima por tipo | Iluminación 1,5 · Tomas 2,5 · Especial 2,5 · Seccional 2,5 · Principal 4 mm² | |
| Calibre máximo por tipo | Iluminación 16 A · Tomas 20 A | |
| Regla de protección | Ib ≤ In ≤ Iz (curva C, I2 = 1,45 In) | |

## 2. Planificador de vivienda

| Qué | Valor | Revisar |
|---|---|---|
| Grado por superficie | Mínima ≤ 60 m² · Media ≤ 130 · Elevada ≤ 200 · Superior > 200 | |
| Demanda por grado | 3,7 · 7 · 11 · más de 11 kVA | |
| Circuitos por grado (IUG/TUG/libre elección) | 1/1/0 · 1/1/1 · 2/2/1 · 2/2/2 | |
| Bocas mínimas | Living: 1 luz cada 18 m², 1 toma cada 6 m² (mín. 2) · Dormitorio 1/3 · Cocina 2/3 · Baño 1/1 · Pasillo 1/1 · Lavadero 1/2 · Garage 1/1 · Exterior 1/1 | |

## 3. Iluminación

Lux por uso: dormitorio 150 · living 200 · cocina 300 · baño 200 · pasillo 100 · escritorio 500 · taller 500 ·
local 500. Rendimiento del local 0,6 × 0,8.

## 4. Informe eléctrico (`informe.ts`)

| Medición | Bien | Para revisar | Hay que corregir |
|---|---|---|---|
| Puesta a tierra | ≤ 10 Ω | ≤ 40 Ω | > 40 Ω |
| Disparo del diferencial a IΔn | ≤ 300 ms | — | > 300 ms |
| Aislación a 500 V | ≥ 1 MΩ | ≥ 0,5 MΩ | < 0,5 MΩ |
| Tensión fase-neutro | 209 a 231 V | 198 a 242 V | fuera de rango |

Revisar también los textos de las recomendaciones y de los puntos del tablero.

## 5. Recorrido de caños (`canalizacion.ts`) y dictado (`dictado.ts`)

- Alturas: tablero 1,6 m · tomas 0,3 m · llaves 1,1 m. Recorrido por el techo. Cable: fase, neutro y tierra más 0,3 m
  por boca. Caño en tiras de 3 m. Tres curvas o conectores por boca.
- Dictado: cantidades estimadas por tarea (por ejemplo, 9 m de cable de 2,5 mm² y 3 m de caño por toma; horas por
  tarea). Son una base para editar, no un cómputo.

## 6. Checklists (`checklists.ts`)

Revisar que los pasos de seguridad y de cierre de cada tipo de trabajo sean los correctos y estén completos.
