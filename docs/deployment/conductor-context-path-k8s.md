# Conductor `/conductor` Context Path Build and K8s Deployment

This document records the local Conductor 3.30.2 source changes, image build, Docker Hub image location, and Kubernetes manifests used to run Conductor engine and ui-next through Ingress at `/conductor`.

The implementation is source-built. It does not depend on nginx text substitution to rewrite built UI assets, and it does not require an Ingress rewrite annotation to strip `/conductor`.

## Source and Artifact Locations

| Purpose | Location |
| --- | --- |
| Source root | `conductor-3.30.2` |
| Docker image build file | `docker/server/Dockerfile.next` |
| nginx runtime config | `docker/server/nginx/nginx.conf` |
| Spring runtime config | `docker/server/config/config-postgres-conductor.properties` |
| UI Vite config | `ui-next/vite.config.ts` |
| UI HTML entry | `ui-next/index.html` |
| UI context helper | `ui-next/src/utils/contextPath.ts` |
| UI router | `ui-next/src/routes/router.tsx` |
| UI API fetch helper | `ui-next/src/plugins/fetch.ts` |
| Server sample initializer | `rest/src/main/java/com/netflix/conductor/rest/startup/KitchenSinkInitializer.java` |
| Kubernetes manifests | `K8s/` |

## Docker Image

Published image:

```text
docker.io/kevinwoo/conducto:3.30.2-conductor-context-src
```

Digest observed after push:

```text
sha256:500973422ddf040a9479ba8cff8c32d4a3a405ea124c50248a49ac83db286f8e
```

Build command from `conductor-3.30.2`:

```powershell
docker build -t kevinwoo/conducto:3.30.2-conductor-context-src -f docker/server/Dockerfile.next --build-arg INDEXING_BACKEND=postgres --build-arg VITE_PUBLIC_URL=/conductor/ .
```

Push command:

```powershell
docker push kevinwoo/conducto:3.30.2-conductor-context-src
```

## Kubernetes Layout

`K8s/` contains the deployable manifest set:

| File | Purpose |
| --- | --- |
| `K8s/kustomization.yaml` | Kustomize entry point |
| `K8s/namespace.yaml` | Creates `platform` namespace |
| `K8s/secret.yaml` | Postgres database credentials for the PoC |
| `K8s/postgres.yaml` | Postgres StatefulSet and Service |
| `K8s/conductor.yaml` | Conductor Deployment and Service |
| `K8s/ingress.yaml` | nginx Ingress for `/conductor` |
| `K8s/README.md` | Short runbook |

The manifest currently references:

```text
kevinwoo/conducto:3.30.2-conductor-context-src
```

Apply from `conductor-3.30.2`:

```powershell
kubectl apply -k .\K8s
kubectl -n platform rollout status statefulset/conductor-postgres --timeout=180s
kubectl -n platform rollout status deploy/conductor --timeout=300s
```

## Runtime URLs

Expected external URLs through Ingress:

```text
http://localhost/conductor/
http://localhost/conductor/taskQueue
http://localhost/conductor/api/metadata/workflow
http://localhost/conductor/swagger-ui/index.html
```

The root API path is intentionally not exposed by this Ingress:

```text
http://localhost/api/metadata/workflow
```

## Major Source Changes

### UI Context Path

- `ui-next/vite.config.ts` reads `VITE_PUBLIC_URL` and sets Vite `base`.
- `ui-next/index.html` loads `context.js` from the Vite base path.
- `ui-next/src/utils/contextPath.ts` centralizes `contextPath`, `withContextPath`, `appOrigin`, and `apiBaseUrl`.
- `ui-next/src/routes/router.tsx` uses the context path as the router basename.
- `ui-next/src/plugins/fetch.ts` prefixes API calls with `/conductor/api` for normal builds.
- API modal and sample-code files were updated to avoid hard-coded root `/api`, `/swagger-ui`, and UI paths.

### Server Context Path

- `docker/server/config/config-postgres-conductor.properties` sets `server.servlet.context-path=/conductor`.
- The same config selects Postgres persistence, queue, external payload storage, and indexing.
- `KitchenSinkInitializer` now prepends `server.servlet.context-path` to its internal localhost API calls, so `loadSample=true` still works when the server is mounted at `/conductor`.

### Docker Image

- `docker/server/Dockerfile.next` accepts `ARG VITE_PUBLIC_URL=/`.
- The Docker build passes `VITE_PUBLIC_URL` to `pnpm build`.
- The final image serves ui-next assets from `/usr/share/nginx/html/conductor`.

### nginx

- `docker/server/nginx/nginx.conf` serves UI assets under `/conductor/`.
- `/conductor/api`, `/conductor/health`, `/conductor/actuator`, `/conductor/swagger-ui`, `/conductor/api-docs`, and `/conductor/v3/api-docs` are proxied to the Spring Boot server without stripping the prefix.
- `/` returns `404` and `/conductor` redirects to `/conductor/`.

### Ingress

- `K8s/ingress.yaml` routes `path: /conductor` with `pathType: Prefix` to the Conductor UI service port.
- It intentionally does not use `nginx.ingress.kubernetes.io/rewrite-target`.

## Verification Commands

Run after deployment:

```powershell
curl.exe -I http://localhost/conductor/
curl.exe -I http://localhost/conductor/taskQueue
curl.exe -I http://localhost/conductor/api/metadata/workflow
curl.exe -I http://localhost/conductor/swagger-ui/index.html
curl.exe -I http://localhost/api/metadata/workflow
```

Expected result:

- `/conductor/...` UI and API URLs return `200`.
- `/api/...` is not exposed from the Ingress root.
- Server logs show Tomcat running with context path `/conductor`.

For manifest-only validation:

```powershell
kubectl kustomize .\K8s
```

For UI config syntax validation:

```powershell
node --check ui-next\vite.config.ts
```

## GitHub Source

The source shape was pushed to:

```text
https://github.com/kevinwoos/conductor.git
```

Branch:

```text
dev
```

Commit containing the `/conductor` source and K8s deployment:

```text
bf17a34c1d4e6873188824ad9763e591e228f7ce
```
