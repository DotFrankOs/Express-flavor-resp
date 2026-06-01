FROM node:20-slim

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY server/backend/package*.json ./
RUN npm install

COPY server/backend/prisma ./prisma/
RUN npx prisma generate

COPY server/backend/src ./src/

EXPOSE 3000

CMD ["node", "src/server.js"]