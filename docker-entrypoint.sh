#!/bin/sh
set -e

# The local binary rather than npx, so a container
# start can never reach for the registry.
exec ./node_modules/.bin/next dev --webpack --hostname 0.0.0.0 --port 3000
