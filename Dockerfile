# Build the frontend
FROM node:10-slim AS frontend
WORKDIR /app
COPY . .
RUN yarn --frozen-lockfile \
 && yarn build

# Setup the backend
FROM node:10-slim AS backend
WORKDIR /app
COPY server server
COPY packages/utils packages/utils
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
ENTRYPOINT ["node", "-r", "esm", "server"]
CMD ["start"]
EXPOSE 9999
