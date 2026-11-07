# Despliegue en Hostinger (workers.handyx.pro)

La app es un export estático de Next (`out/`). En cada push a `main`, `.github/workflows/hostinger.yml` corre lint,
typecheck y tests, compila, sube el sitio por SSH a una carpeta temporal y `scripts/hostinger-publish.sh` hace un
respaldo y copia los archivos. Después `scripts/hostinger-smoke.sh` prueba el sitio público (index, script, rutas, 404,
cabeceras, HTTPS) y, si algo falla, restaura el respaldo. En los pull requests solo se compila. Es el mismo método que el
portal interno y la app de usuario.

- **Solo publica en `/home/<usuario>/domains/workers.handyx.pro/public_html`.** El script se niega a escribir en cualquier otra carpeta.
- **Modo de la app:** sin la variable `API_BASE_URL` sale la vista previa (`npm run build`: datos ficticios con el banner
  "Datos de prueba"). Con `API_BASE_URL` (origen HTTPS de `api-especialista`, sin barra final) sale producción
  (`npm run build:hostinger`: solo el adaptador HTTP, y falla si el bundle trae fixtures o el banner).
- **Cabeceras:** `deploy/hostinger.htaccess` (HTTPS, `frame-ancestors`, `nosniff`, `no-store` en HTML, `noindex`, MIME del
  manifest). `deploy/hostinger-static.htaccess` cachea `_next/static` un año.
- **`.htaccess` ajeno:** si la carpeta ya tiene uno que no es de este despliegue (por ejemplo el de Hostinger), la primera
  publicación se detiene: revisalo y borralo a mano.

## Alta única (Settings → Secrets and variables → Actions de *este* repo)

| Tipo     | Nombre                                               | Valor                                                             |
| -------- | ---------------------------------------------------- | ----------------------------------------------------------------- |
| Secret   | `HOSTINGER_SSH_KEY`                                  | Clave **privada** Ed25519 de despliegue, completa (BEGIN/END)     |
| Secret   | `HOSTINGER_KNOWN_HOSTS`                              | Salida de `ssh-keygen -F '[HOST]:PUERTO' -f ~/.ssh/known_hosts`   |
| Variable | `HOSTINGER_HOST`, `HOSTINGER_PORT`, `HOSTINGER_USER` | Los del SSH de Hostinger                                          |
| Variable | `HOSTINGER_PATH`                                     | `/home/<usuario>/domains/workers.handyx.pro/public_html`          |
| Variable | `API_BASE_URL`                                       | Vacía hasta que el backend esté arriba; después su origen HTTPS   |
| Variable | `HOSTINGER_DEPLOY_ENABLED`                           | `true`, **solo cuando** estén los secrets y la carpeta verificada |

Antes de la primera corrida, la carpeta del dominio tiene que ser legible por el servidor web (`chmod 755` en
`domains/workers.handyx.pro`); si queda en `700` el sitio responde 404.

## Rollback manual

```sh
ssh -p PUERTO -i ~/.ssh/CLAVE -o IdentitiesOnly=yes USUARIO@HOST \
  'bash -s -- rollback /home/USUARIO/domains/workers.handyx.pro/public_html IDENTIFICADOR_DE_RELEASE' \
  < scripts/hostinger-publish.sh
```

El identificador está en el log de la corrida. Los respaldos viven en `domains/workers.handyx.pro/.handyx-deploy/backups/`.
