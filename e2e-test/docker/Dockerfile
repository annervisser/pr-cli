FROM docker.io/debian:bookworm-slim@sha256:4b50eb66f977b4062683ff434ef18ac191da862dbe966961bc11990cf5791a8d

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
    git \
    tini \
    curl

# Deno
COPY --from=docker.io/denoland/deno:bin-2.0.0@sha256:6ca6e1911c8b1c6f06305b903ec8993bab47ac34234bb3329c708e00609901ce /deno /usr/bin/deno

# Gum
COPY --from=docker.io/charmcli/gum:v0.16@sha256:d01ee664c8ee92b91da98c493163554cf89ede995c079d4d006ee53e51207b04 /usr/local/bin/gum /usr/bin/gum

# ttyd
COPY --from=docker.io/tsl0922/ttyd:1.7.7@sha256:9a058c087bca6df456cb728514eafe778ea384369a622b3604c8b5256b67237d /usr/bin/ttyd /usr/bin/ttyd

RUN useradd --uid 1000 --user-group --create-home docker

USER docker
WORKDIR /home/docker

COPY ./run.sh ./

HEALTHCHECK --start-period=30s --interval=300ms \
    CMD ["curl", "--fail", "http://localhost:7681/"]

ENTRYPOINT ["/usr/bin/tini", "--"]
