FROM docker.io/ubuntu:22.04

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
    git \
    tini

# Deno
COPY --from=docker.io/denoland/deno:bin-1.27.0 /deno /usr/bin/deno

# Gum
COPY --from=docker.io/charmcli/gum:v0.8 /usr/local/bin/gum /usr/bin/gum

# ttyd
COPY --from=docker.io/tsl0922/ttyd:1.7.2 /usr/bin/ttyd /usr/bin/ttyd

RUN useradd --uid 1000 --user-group --create-home docker

USER docker
WORKDIR /home/docker

COPY ./run.sh ./

ENTRYPOINT ["/usr/bin/tini", "--"]
