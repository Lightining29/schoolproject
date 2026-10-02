# Stage 1: Build the React frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage 2: Build the backend and run the unified app
FROM node:20-alpine
WORKDIR /app
COPY backend/package*.json ./backend/
RUN cd backend && npm ci --only=production
COPY backend/ ./backend/

# Copy built frontend assets to the backend container
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Expose port (Render automatically maps PORT env var)
EXPOSE 5000

# Set environment to production
ENV NODE_ENV=production
ENV PORT=5000

# Start the Express server
WORKDIR /app/backend
CMD ["npm", "start"]
