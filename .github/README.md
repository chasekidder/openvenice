# CI/CD Setup

## GitHub Secrets Required

| Secret | Description |
|--------|-------------|
| `SIGNING_SECRET` | Cosign private key (PEM-encoded) used to sign container images |

The public key (`cosign.pub` at repo root) is used for verification in CI and by anyone verifying the signed image.

## Runner

The workflow runs on `ubuntu-24.04` (GitHub-hosted). Buildah and podman are provided by the `redhat-actions/buildah-build` action; cosign is installed by `sigstore/cosign-installer`.

## Image Signing

- Images are signed with the cosign private key from `SIGNING_SECRET`
- Signatures are verified against `cosign.pub` during CI
- To verify an image locally:

```bash
cosign verify --key cosign.pub ghcr.io/OWNER/openvenice:latest
```

## Runtime: Podman Secret for API Key

At container runtime, the Venice API key is injected via a podman secret mounted as an environment variable:

```bash
# Create the secret
echo "YOUR_VENICE_API_KEY" | podman secret create venice_api_key -

# Run the container with the secret
podman run \
  --secret venice_api_key \
  -p 8080:80 \
  ghcr.io/OWNER/openvenice:latest
```

The entrypoint reads `/run/secrets/venice_api_key` and writes a `runtime-config.js` file served by nginx, making `VENICE_API_KEY` available to the frontend at `window.__RUNTIME_CONFIG__`.

The user can still manually enter or override the key in the UI — the runtime config is only a fallback.