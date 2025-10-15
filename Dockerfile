# ---- Build minimal runtime image ----
FROM node:20-alpine

# System deps for canvas/pdfkit if needed
RUN apk add --no-cache build-base cairo-dev pango-dev jpeg-dev giflib-dev

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including tsx for TypeScript runtime)
RUN npm ci

# Copy application code
COPY . .

# Security: default to non-root user
RUN addgroup -S app && adduser -S app -G app
RUN chown -R app:app /app
USER app

# Environment
ENV NODE_ENV=production
ENV PORT=5000
EXPOSE 5000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://127.0.0.1:5000/health || exit 1

# Start server with tsx for TypeScript runtime
CMD ["npx", "tsx", "server/index.ts"]
