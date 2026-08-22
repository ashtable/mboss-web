FROM node:24.18.0-slim

WORKDIR /app

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
