# Frontend (Vite/React)
# Uses Bun because this repo includes bun.lockb
FROM oven/bun:1 AS build

WORKDIR /app

# Build-time config for the frontend (Vite reads VITE_* at build time)
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

# Install dependencies (cached layer)
COPY package.json bun.lockb ./
RUN bun install

# Copy app source and build
COPY . .
RUN bun run build

EXPOSE 4173

# Serve the built site (Vite preview)
CMD ["bun", "run", "preview", "--", "--host", "0.0.0.0", "--port", "4173"]
