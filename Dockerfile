# Generic container image (Fly.io, Render, Cloud Run, a VM, ...).
#   docker build --build-arg NEXT_PUBLIC_PLATFORM_PRESET=custom -t challenge-platform .
#   docker run -p 3000:3000 --env-file .env.local challenge-platform
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS build
WORKDIR /app
ARG NEXT_PUBLIC_PLATFORM_PRESET=custom
ENV NEXT_PUBLIC_PLATFORM_PRESET=$NEXT_PUBLIC_PLATFORM_PRESET
ENV NEXT_OUTPUT=standalone
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22-alpine AS run
WORKDIR /app
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
USER node
EXPOSE 3000
CMD ["node", "server.js"]
