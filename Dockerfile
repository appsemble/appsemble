FROM node:10-slim

ENV NODE_ENV production
WORKDIR /app
COPY . .
RUN yarn --frozen-lockfile --production && yarn cache clean && rm yarn.lock
CMD ["node", "-r", "esm", "api/server.js"]
EXPOSE 9999
