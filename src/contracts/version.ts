// Versión del contrato compartido entre api-usuario, api-especialista, las dos PWA y el portal.
// Dueño: handyx-client-be (dueño único del esquema y las migraciones). Ver docs/contracts.md.
// Mientras ese repo no tenga su copia, este directorio es el BORRADOR a transferir; después se
// copia byte a byte desde allá y `HANDYX_CONTRATOS=<ruta> npm test` verifica la sincronía.
// Tiene que coincidir con `info.version` de docs/api/openapi.yaml (lo prueba openapi.test.ts).
export const CONTRATO_VERSION = '0.5.0';
