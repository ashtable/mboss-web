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
exec ./node_modules/.bin/next dev --webpack \
  --hostname 0.0.0.0 --port "${PORT:-3000}"
