FROM docker.io/debian:bookworm-slim@sha256:24c92a69df28b21676d721fe18c0bf64138bfc69b486746ad935b49cc31b0b91

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
    git \
    tini \
    curl

# Deno
COPY --from=docker.io/denoland/deno:bin-1.36.4@sha256:fa16fb8d2620aea62396929b7cdb2bd7abb2d1d38335567f95789d077f2c4523 /deno /usr/bin/deno

# Gum
COPY --from=docker.io/charmcli/gum:v0.11@sha256:47b05d17425e608f617495fda0edc7fcea1aea62fc91a6f0cc3efca2f3cb51b2 /usr/local/bin/gum /usr/bin/gum

# ttyd
COPY --from=docker.io/tsl0922/ttyd:1.7.3@sha256:569b087cfa3b4002c37e913643a46a6ccd1232267d4abef9fbe7a3710038a64f /usr/bin/ttyd /usr/bin/ttyd

RUN useradd --uid 1000 --user-group --create-home docker

USER docker
WORKDIR /home/docker

COPY ./run.sh ./

HEALTHCHECK --start-period=30s --interval=300ms \
    CMD ["curl", "--fail", "http://localhost:7681/"]

ENTRYPOINT ["/usr/bin/tini", "--"]
