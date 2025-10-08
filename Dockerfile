FROM node:20-bookworm-slim AS development
WORKDIR /app

# Enable pnpm via corepack (recommended)
ENV PNPM_HOME=/usr/local/share/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable

# Install dependencies first for better caching
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Copy the rest of the source
COPY . .

CMD ["pnpm", "dev"]