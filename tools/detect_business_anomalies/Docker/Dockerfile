# syntax=docker/dockerfile:1
# Tool image: shared Node backend + tool-specific Control Room frontend.
ARG NODE_IMAGE=node:22-slim

FROM ${NODE_IMAGE} AS runtime
ENV NODE_ENV=production
WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY src ./src
COPY db ./db
COPY tools/detect_business_anomalies/frontend ./tools/detect_business_anomalies/frontend

ENV PORT=8101
ENV TOOL_ID=detect_business_anomalies
ENV UI_DIST_DIR=/app/tools/detect_business_anomalies/frontend
ENV REQUIRE_CORE_CONNECTION=true
EXPOSE 8101

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||8101)+'/ready').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "src/server.js"]
