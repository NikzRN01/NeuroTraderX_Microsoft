# Frontend (Vite/React)
# Uses Bun because this repo includes bun.lockb
FROM oven/bun:1 AS build

WORKDIR /app

# Install dependencies (cached layer)
COPY package.json bun.lockb ./
RUN bun install

# Copy app source and build
COPY . .
RUN bun run build

EXPOSE 4173

# Serve the built site (Vite preview)
CMD ["bun", "run", "preview", "--", "--host", "0.0.0.0", "--port", "4173"]
