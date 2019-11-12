# Build the frontend
FROM node:10-slim AS frontend
WORKDIR /app
COPY . .
RUN yarn --frozen-lockfile \
 && yarn build:app \
 && yarn build:studio

# Setup the backend
FROM node:10-slim AS backend
WORKDIR /app
COPY packages/server packages/server
COPY packages/node-utils packages/node-utils
COPY packages/utils packages/utils
COPY packages/types packages/types
COPY package.json package.json
COPY yarn.lock yarn.lock
RUN yarn --frozen-lockfile --production \
 && rm -r yarn.lock

# Setup the production docker image.
FROM node:10-slim
COPY --from=backend /app /app
COPY --from=frontend /app/dist /app/dist
WORKDIR /app
ENV NODE_ENV production
USER node
ENTRYPOINT ["node", "-r", "esm", "packages/server"]
CMD ["start"]
HEALTHCHECK CMD ["node", "-r", "esm", "packages/server", "health"]
EXPOSE 9999
