# Build the frontend
FROM node:10-slim AS build
WORKDIR /build
COPY . .
RUN yarn --frozen-lockfile \
 && yarn build

# Setup the real docker image.
FROM node:10-slim
ENV NODE_ENV production
WORKDIR /app
COPY --from=build /build/dist dist
COPY server server
COPY packages/utils packages/utils
COPY package.json package.json
COPY yarn.lock yarn.lock
RUN npm uninstall --global npm \
 && yarn --frozen-lockfile --production \
 && yarn cache clean \
 && rm -r yarn.lock /opt/yarn*
USER node
ENTRYPOINT ["node", "-r", "esm", "server/server.js"]
EXPOSE 9999
