FROM node:20-slim AS build

WORKDIR /app

COPY package.json package-lock.json* bun.lockb* ./
RUN npm ci --no-audit --no-fund

COPY . .
RUN npm run build

FROM nginx:1.27-alpine AS runner

COPY ./nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 8080
HEALTHCHECK CMD wget --spider -q localhost:8080 || exit 1

CMD ["nginx", "-g", "daemon off;"]
