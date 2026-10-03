FROM docker.io/debian:bookworm-slim@sha256:3783cc01769c7b2b1b83a5c5ad96c815348e28ed7da68e2e3687004faa906251

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
    git \
    tini \
    curl

# Deno
COPY --from=docker.io/denoland/deno:bin-2.0.0@sha256:6ca6e1911c8b1c6f06305b903ec8993bab47ac34234bb3329c708e00609901ce /deno /usr/bin/deno

# Gum
COPY --from=docker.io/charmcli/gum:v2.0@sha256:c8aaf7c36e3cbe4cde6ca32d1246724da25c21f2f96e0ab3d2883d0379b544cd /usr/local/bin/gum /usr/bin/gum

# ttyd
COPY --from=docker.io/tsl0922/ttyd:1.7.8@sha256:07b31849387b0824f3e6fbf7932ea9923a64fb10335a1451e205d42433666d07 /usr/bin/ttyd /usr/bin/ttyd

RUN useradd --uid 1000 --user-group --create-home docker

USER docker
WORKDIR /home/docker

COPY ./run.sh ./

HEALTHCHECK --start-period=30s --interval=300ms \
    CMD ["curl", "--fail", "http://localhost:7681/"]

ENTRYPOINT ["/usr/bin/tini", "--"]
