# Deploy Fuelogistics en Producción con Docker Compose, MinIO y Nginx Proxy

## 📅 Resumen del Proceso

Desplegamos una aplicación Node.js conectada a MongoDB y usando MinIO como almacenamiento de archivos. Se configuró un entorno de producción con SSL automático usando nginx-proxy + acme-companion.

---

## ⚡ Stack Tecnológico

* Node.js (modo producción)
* MongoDB 7.0
* MinIO como S3
* Docker Compose
* nginxproxy/nginx-proxy
* nginxproxy/acme-companion
* Certificados SSL de Let's Encrypt
* Namecheap para gestión de DNS

---

## 📚 Estructura de Servicios (docker-compose.nginx.yml)

| Servicio       | Rol                                          |
| -------------- | -------------------------------------------- |
| mongo          | Base de datos                                |
| app-prod       | Backend Node.js con configuración para MinIO |
| minio          | Almacenamiento de archivos tipo S3           |
| minio-init     | Inicializa bucket y hace público el acceso   |
| nginx-proxy    | Reverse proxy automático con certificados    |
| acme-companion | Generación automática de certificados SSL    |

---

## 🌐 Configuración de Dominio

* Dominio: `carmonasamuel.lat`
* Subdominios: `www`, `minio`
* DNS (Namecheap):

  * `A` Record para `@` y `www` apuntando a IP pública
  * `A` Record para `minio` apuntando a misma IP

---

## 🛡️ Certificados SSL

Cada contenedor expuesto con dominio necesita:

```env
VIRTUAL_HOST
LETSENCRYPT_HOST
LETSENCRYPT_EMAIL
```

Para MinIO (que escucha en el puerto 9000), fue necesario agregar:

```env
VIRTUAL_PORT=9000
```

---

## 🔹 Comandos Clave Ejecutados

```bash
# Crear red externa
$ docker network create nginx-proxy

# Lanzar el nginx proxy y acme companion
$ docker run -d --name nginx-proxy --restart=always \
  -p 80:80 -p 443:443 \
  -v /etc/nginx/certs:/etc/nginx/certs:ro \
  -v /etc/nginx/vhost.d \
  -v /usr/share/nginx/html \
  -v /var/run/docker.sock:/tmp/docker.sock:ro \
  --network nginx-proxy \
  nginxproxy/nginx-proxy

$ docker run -d --name nginx-proxy-acme --restart=always \
  --volumes-from nginx-proxy \
  -v /var/run/docker.sock:/var/run/docker.sock:ro \
  -v /etc/acme.sh \
  -e DEFAULT_EMAIL=samuel.carmona.rodrigz@gmail.com \
  --network nginx-proxy \
  nginxproxy/acme-companion
```

Luego se levantó el stack:

```bash
$ docker compose -f docker-compose.nginx.yml up -d --build
```

---

## 🔎 Troubleshooting & Soluciones

| Problema                            | Solución                                           |
| ----------------------------------- | -------------------------------------------------- |
| Mixed Content                       | Usar `https://minio.carmonasamuel.lat` en frontend |
| 502 Bad Gateway                     | Agregar `VIRTUAL_PORT=9000` en el contenedor minio |
| ERR\_SSL\_UNRECOGNIZED\_NAME\_ALERT | Certificado mal emitido, se regeneró correctamente |
| `AccessDenied` en MinIO             | Esperado si accedés al root sin auth               |
| Cert no renovado o minio sin proxy  | MinIO no estaba en la red `nginx-proxy`            |

---

## 🚀 Consideraciones para Replicar

### Pre-requisitos

* VM con Docker + Docker Compose
* Dominio registrado (Namecheap, etc.)
* DNS apuntando a la IP

### Pasos Clave

1. Crear red externa `nginx-proxy`
2. Lanzar proxy y companion
3. Crear directorios:

   ```bash
   sudo mkdir -p /etc/nginx/certs /etc/nginx/vhost.d /usr/share/nginx/html /etc/acme.sh
   sudo chown -R 1000:1000 /etc/nginx/certs /etc/acme.sh
   ```
4. Lanzar `docker-compose.nginx.yml`
5. Verificar certificados:

   ```bash
   docker logs nginx-proxy-acme
   ```
6. Subir archivos y verificar en `https://minio.tudominio.com/bucket/archivo.jpg`

---

## 📓 Historial de Comandos

(Extraído del `history`, útil para documentar pasos reales, debugging y reproducibilidad)
Incluye más de 100 comandos: desde `docker compose up`, `docker logs`, `curl`, hasta `nslookup`, `df -h`, `docker inspect`, etc. Útile como log.

---

## 🚫 Pendientes / Recomendaciones

* ✉ Hacer backup de volumen `minio_data`
* 🛋 Migrar sistema al disco de 100 GB si es necesario
* 🔐 Evaluar SSL directo en MinIO (`MINIO_USE_SSL=true` + certificados manuales)
* 🔃 Automatizar deploy con script y validaciones

---

## 🎯 Resultado

✅ App corriendo en `https://carmonasamuel.lat`
✅ Archivos accesibles vía `https://minio.carmonasamuel.lat/bucket-name/archivo.jpg`
✅ Certificados válidos de Let's Encrypt

---

— Documentado por Samuel Carmona
