#!/bin/sh
set -e

# The local binary rather than npx, so a container
# start can never reach for the registry.
#
# The port comes from the environment because the
# platform chooses it: Railway injects PORT, then
# routes and healthchecks that port and nothing
# else, so a hardcoded one is refused at the edge
# and every probe fails while the log still says
# the server is ready. Compose sets no PORT and
# publishes 3000, which the default covers.
# `start` serves the build the image already
# carries. It was `dev`, which cost the site its
# hydration once it sat behind a proxy — see the
# Dockerfile — and which sets NODE_ENV to
# development, so src/env.ts's refusal to accept a
# short or default AUTH_SECRET never fired in the
# one place it exists to protect.
exec ./node_modules/.bin/next start \
  --hostname 0.0.0.0 --port "${PORT:-3000}"
