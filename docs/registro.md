# Registro y onboarding (lote 1.2, fases V.2–V.4)

Pantallas del lienzo RG-1 a RG-10, D6-Alta, OB-Aprobado, OB-Permisos, OB-Tour y OB-PrimerosPasos, con el kit v3 y el
contrato 0.11 (`src/contracts/registro.ts`). Recorrido `RC-Onboarding` en `e2e/recorridos/RC-Onboarding.cjs`.

## Rutas

| Ruta | Pantalla | Qué hace |
|---|---|---|
| `/registro/` | RG-1 | Crea la cuenta con lo mínimo (nombre, apellido, celular, email, contraseña de 12 o más). Casilla de los textos sin tildar. Respuesta neutra; una cuenta nueva sigue en `/verificar/` (código al email, lote 1.1). |
| `/alta/` | RG-2 a RG-10, D6-Alta | Sin `?paso=` retoma en `pasoActual` (lo decide el servidor). `?paso=` abre un paso hasta el primero sin completar: no se saltean pasos. Mandada, muestra el estado; solo se pueden sumar certificados o cargar los antecedentes que faltaban. Con una corrección pedida se abre cualquier paso. |
| `/alta/habilitado/` | OB-Aprobado | Aparece sola una vez (`onboarding.bienvenidaVista`): desde `/alta/` o el aviso «¡Estás habilitado!». El escudo solo con el estado del servidor. |
| `/alta/permisos/` | OB-Permisos | Avisos (se activan acá) y ubicación (se pide recién al ir a un trabajo). Se puede seguir sin darlos. |
| `/alta/como-funciona/` | OB-Tour | Tres láminas con botones (no pasan solas); la primera arma el arreglo del rubro. |
| `/alta/primeros-pasos/` | OB-PrimerosPasos | Ninguno es obligatorio; «Hecho» lo dice el servidor. |

Las rutas viven en el grupo `src/app/(registro)/` (sin cabecera ni pestañas); `/alta/*` pasa por `GuardiaApp`.

## Reglas

- Cada paso se guarda en el servidor apenas se completa (con `version`; un 409 pide volver a abrir el paso). Nada
  queda en el navegador; las fotos y los PDF viven en memoria hasta mandarse.
- Domicilio, DNI, CUIT/CUIL, selfie y antecedentes van cifrados. La app nunca recibe el domicilio ni los números
  completos (solo el barrio y los últimos dígitos).
- Cargar ≠ verificar: los estados se dicen con ícono y texto («Cargado · falta revisar», «En revisión»,
  «Verificado»). Solo el equipo de verificación (Operations, en el mock el Panel de prueba) verifica y habilita.
- Matrícula obligatoria en Gas y Aire acondicionado: sin cargarla no se pasa del paso 8 ni se manda el alta; sin
  verificarla, el rubro no se habilita.
- Antecedentes por foto o PDF: dato sensible, lo ve solo el equipo de verificación, nunca va a una IA y se borra al
  verificarlo (queda la constancia). Se puede seguir sin cargarlo; hasta entonces no hay pedidos.
- Accesibilidad: «Paso N de 10» escrito y en el `progressbar`, errores con texto y el foco al primer campo marcado,
  todo gesto con botón (la cámara y las láminas), texto al 200 % sin desbordes.

## Piezas

- Kit (`src/ui`, estilos en `src/ui/registro.css` hasta que el cierre los reparta por nivel): `CabeceraPasos`,
  `CamaraGuia`, `Diapositivas` (organismos); `OpcionMosaico`, `GrillaOpciones`, `PastillasOpcion`, `AvisoPrivado`,
  `AvisoCaja`, `CargaArchivo`, `FilaTarea`, `TarjetaPermiso` (moléculas); `MapaBarrios`, `CarpetaRevision`,
  `TelefonoIso`, `Papelitos` (ilustraciones).
- Lógica pura: `src/lib/registro.ts` (pasos, celular, CUIT, estados en palabras, resumen del alta) con pruebas.
- Datos: `src/data/api/alta.ts` (+ `http/alta.ts`), mock en `src/data/mock/alta-registro.ts` con sus pruebas.
