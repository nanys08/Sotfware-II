# Runbook DevOps — Sistema de Inventario

Guía para **levantar todo el stack** y **capturar las pruebas** que van en los
Anexos del informe (`docs/Informe_DevOps_Inventario.docx`).

> Requisitos: **Docker Desktop** instalado y corriendo. Para correr las pruebas
> y el build fuera de Docker: **JDK 17** y **Node 20**.

---

## 1. Levantar el stack completo (backend + Prometheus + Grafana)

Desde la raíz del repositorio:

```bash
docker compose up -d --build
```

Esto construye la imagen del backend y arranca 3 contenedores. Espera ~1–2 min
a que el backend termine de iniciar.

| Servicio    | URL                                            | Credenciales      |
|-------------|------------------------------------------------|-------------------|
| Backend     | http://localhost:8080/actuator/health          | —                 |
| Métricas    | http://localhost:8080/actuator/prometheus      | —                 |
| Prometheus  | http://localhost:9090                          | —                 |
| Grafana     | http://localhost:3000                          | admin / admin     |

Ver estado de los contenedores:

```bash
docker compose ps
```

Apagar todo:

```bash
docker compose down
```

---

## 2. Anexo B — Capturas de monitoreo

### 2.1 Grafana (dashboard)
1. Abre http://localhost:3000 → entra con `admin` / `admin`.
2. Menú izquierdo → **Dashboards** → carpeta **Sistema de Inventario** →
   **Sistema de Inventario - Observabilidad DevOps**.
3. El dashboard ya viene cargado (datasource y paneles provisionados).
4. **Genera tráfico** para que las gráficas se mueven (en otra terminal):
   ```bash
   for i in $(seq 1 200); do curl -s http://localhost:8080/actuator/health > /dev/null; done
   ```
   En PowerShell:
   ```powershell
   1..200 | ForEach-Object { Invoke-WebRequest http://localhost:8080/actuator/health -UseBasicParsing | Out-Null }
   ```
5. Captura el dashboard con los paneles poblados → **Anexo B**.

### 2.2 Prometheus (targets en verde)
1. Abre http://localhost:9090/targets
2. Verifica que el target `inventario-backend` esté en estado **UP** (verde).
3. Captura → **Anexo B**.

---

## 3. Anexo A — Pipeline en verde

### Opción 1: Jenkins (recomendada para el informe)
1. En Jenkins: **New Item → Pipeline** (o *Multibranch Pipeline*).
2. Configura el repositorio Git y deja que use el `Jenkinsfile` de la raíz.
3. (CI por Webhook) En GitHub → *Settings → Webhooks* añade la URL
   `http://TU-JENKINS/github-webhook/`.
4. Ejecuta **Build Now**. Captura la **Stage View** con todas las etapas en
   verde y el **Test Result** (16 pruebas OK) → **Anexo A**.

> Nota: el agente de Jenkins necesita `docker`, `JDK 17` y `Node 20` disponibles.
> En Windows, cambia en el `Jenkinsfile` los pasos `sh '...'` por `bat '...'`.

### Opción 2: Azure Pipelines
Ya existe `azure-pipelines.yml`. Conecta el repo en Azure DevOps y captura la
ejecución con los jobs **Backend** y **Frontend** en verde.

---

## 4. Correr solo las pruebas (sin Docker)

Las pruebas unitarias de reglas de negocio **no necesitan base de datos**:

```bash
cd backend/backend
./mvnw test -Dtest=ValidadorDatosTest
```

Para todas las pruebas (la prueba `contextLoads` sí intenta conectar a la BD):

```bash
./mvnw test
```

En Windows usa `mvnw.cmd` en lugar de `./mvnw`.

---

## 5. Regenerar el informe Word

Si editas textos del informe, regéralo con:

```bash
py docs/generar_informe.py
```

Genera `docs/Informe_DevOps_Inventario.docx` (Arial 12, interlineado 1.5, APA).

---

## 6. Confidencialidad (importante)

- En `application.properties` hay credenciales reales de la base de datos.
  Antes de publicar el repo o el informe, **externalízalas a variables de
  entorno** (`DB_URL`, `DB_USER`, `DB_PASSWORD`) y **rota la contraseña**.
- El informe ya usa una empresa ficticia (*TecnoSoluciones del Caribe S.A.S.*)
  y credenciales sanitizadas en los anexos.
