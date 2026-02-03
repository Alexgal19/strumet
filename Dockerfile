# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci

# Copy source
COPY . .

# Build app
RUN npm run build

# Runtime stage
FROM node:18-alpine

WORKDIR /app

# Copy from builder
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY public ./public

EXPOSE 3000

ENV NODE_ENV=production

CMD ["npm", "start"]
