FROM node:18-alpine

WORKDIR /app

# Install basic dependencies
RUN apk add --no-cache curl

# Copy package files
COPY package.json ./

# Install dependencies
RUN npm install

# Copy application code
COPY . .

# Create directories
RUN mkdir -p database exports logs public/static

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1

# Start application
CMD ["node", "src/server.js"]
