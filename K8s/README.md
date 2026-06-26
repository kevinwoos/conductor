# Conductor 3.30.2 `/conductor` K8s Runtime

This manifest set runs the rebuilt Conductor server plus ui-next image at the external `/conductor` path through Ingress without rewrite annotations.

The default manifest pulls:

```text
kevinwoo/conducto:3.30.2-conductor-context-src
```

## Build

From `conductor-3.30.2`:

```powershell
docker build -t conductor:3.30.2-conductor-context-src -f docker/server/Dockerfile.next --build-arg INDEXING_BACKEND=postgres --build-arg VITE_PUBLIC_URL=/conductor/ .
```

For a faster rebuild after local Gradle and ui-next builds, copy `server/build/libs/*-boot.jar` to `docker/server/libs/conductor-server.jar` and add `--build-arg PREBUILT=true`.

## Deploy

From the repository root:

```powershell
kubectl apply -k .\K8s
kubectl -n platform rollout status statefulset/conductor-postgres --timeout=180s
kubectl -n platform rollout status deploy/conductor --timeout=300s
```

## Verify

```powershell
curl.exe -I http://localhost/conductor/
curl.exe -I http://localhost/conductor/api/metadata/workflow
curl.exe -I http://localhost/conductor/swagger-ui/index.html
curl.exe -I http://localhost/api/metadata/workflow
```

Expected result: `/conductor/...` returns `200`, while the root `/api/...` path is not exposed by this Ingress.
