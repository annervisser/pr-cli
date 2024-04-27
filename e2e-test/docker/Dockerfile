FROM docker.io/debian:bookworm-slim@sha256:155280b00ee0133250f7159b567a07d7cd03b1645714c3a7458b2287b0ca83cb

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
COPY --from=docker.io/tsl0922/ttyd:1.7.7@sha256:9a058c087bca6df456cb728514eafe778ea384369a622b3604c8b5256b67237d /usr/bin/ttyd /usr/bin/ttyd

RUN useradd --uid 1000 --user-group --create-home docker

USER docker
WORKDIR /home/docker

COPY ./run.sh ./

HEALTHCHECK --start-period=30s --interval=300ms \
    CMD ["curl", "--fail", "http://localhost:7681/"]

ENTRYPOINT ["/usr/bin/tini", "--"]
