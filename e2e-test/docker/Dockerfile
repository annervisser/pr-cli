FROM docker.io/debian:bookworm-slim@sha256:2bc5c236e9b262645a323e9088dfa3bb1ecb16cc75811daf40a23a824d665be9

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
    git \
    tini \
    curl

# Deno
COPY --from=docker.io/denoland/deno:bin-1.36.4@sha256:fa16fb8d2620aea62396929b7cdb2bd7abb2d1d38335567f95789d077f2c4523 /deno /usr/bin/deno

# Gum
COPY --from=docker.io/charmcli/gum:v0.13@sha256:54dd18742e0bc16b603c0dd87088d0fb3fd49d82a5c97c258f3753f7b257939a /usr/local/bin/gum /usr/bin/gum

# ttyd
COPY --from=docker.io/tsl0922/ttyd:1.7.4@sha256:70cfe40bf8a2897a38a39f51c29ec4709d4f6dc40d9f0ce75e1857da4087cd84 /usr/bin/ttyd /usr/bin/ttyd

RUN useradd --uid 1000 --user-group --create-home docker

USER docker
WORKDIR /home/docker

COPY ./run.sh ./

HEALTHCHECK --start-period=30s --interval=300ms \
    CMD ["curl", "--fail", "http://localhost:7681/"]

ENTRYPOINT ["/usr/bin/tini", "--"]
