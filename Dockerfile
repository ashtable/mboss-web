FROM node:24.18.0-slim

WORKDIR /app

# Telemetry off image-wide, because the
# entrypoint execs the `next` binary directly
# and so never sees package.json's own prefix.
# Above the install, so `npm ci` is covered too.
ENV NEXT_TELEMETRY_DISABLED=1

# The nested submodules are consumed as raw
# TypeScript, so they have to be in place before
# `npm ci` and before anything imports them.
COPY package.json package-lock.json ./
COPY mboss-zod ./mboss-zod
COPY mboss-core ./mboss-core
RUN npm ci

COPY . .

EXPOSE 3000
ENTRYPOINT ["./docker-entrypoint.sh"]
