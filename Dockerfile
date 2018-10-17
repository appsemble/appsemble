# Build the frontend
FROM node:10 AS build
RUN apt-get update \
 && apt-get install --yes nasm
WORKDIR /build
COPY . .
RUN yarn --frozen-lockfile \
 && yarn build

# Setup the real docker image.
FROM node:10-slim
ENV NODE_ENV production
WORKDIR /app
COPY --from=build /build/dist dist
COPY api api
COPY packages/utils packages/utils
COPY package.json package.json
COPY yarn.lock yarn.lock
RUN npm uninstall --global npm \
 && yarn --frozen-lockfile --production \
 && yarn cache clean \
 && rm -r yarn.lock /opt/yarn*
USER node
ENTRYPOINT ["node", "-r", "esm", "api/server.js"]
EXPOSE 9999
