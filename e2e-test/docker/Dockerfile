FROM docker.io/debian:bookworm-slim@sha256:ad86386827b083b3d71139050b47ffb32bbd9559ea9b1345a739b14fec2d9ecf

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
    git \
    tini \
    curl

# Deno
COPY --from=docker.io/denoland/deno:bin-1.46.3@sha256:d8dc561047fea7ab181557a69cd90012409ee137a626d8bc08efa642387d3a2e /deno /usr/bin/deno

# Gum
COPY --from=docker.io/charmcli/gum:v0.14@sha256:e9dce17af022adaea2d8f2ee43ced9bec88a9c23790cc9a641dc8ff82679cc2d /usr/local/bin/gum /usr/bin/gum

# ttyd
COPY --from=docker.io/tsl0922/ttyd:1.7.7@sha256:9a058c087bca6df456cb728514eafe778ea384369a622b3604c8b5256b67237d /usr/bin/ttyd /usr/bin/ttyd

RUN useradd --uid 1000 --user-group --create-home docker

USER docker
WORKDIR /home/docker

COPY ./run.sh ./

HEALTHCHECK --start-period=30s --interval=300ms \
    CMD ["curl", "--fail", "http://localhost:7681/"]

ENTRYPOINT ["/usr/bin/tini", "--"]
