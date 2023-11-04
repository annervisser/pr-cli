FROM docker.io/debian:bookworm-slim@sha256:6cc67f78e0e8295b4fbe055eba0356648f149daf15db9179aa51fcfa9cc131cd

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
COPY --from=docker.io/tsl0922/ttyd:1.7.4@sha256:70cfe40bf8a2897a38a39f51c29ec4709d4f6dc40d9f0ce75e1857da4087cd84 /usr/bin/ttyd /usr/bin/ttyd

RUN useradd --uid 1000 --user-group --create-home docker

USER docker
WORKDIR /home/docker

COPY ./run.sh ./

HEALTHCHECK --start-period=30s --interval=300ms \
    CMD ["curl", "--fail", "http://localhost:7681/"]

ENTRYPOINT ["/usr/bin/tini", "--"]
