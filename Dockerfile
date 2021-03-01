# Build production files
FROM node:14-slim AS build
WORKDIR /app
COPY . .
RUN yarn --frozen-lockfile
RUN yarn scripts build
RUN yarn workspace @appsemble/types prepack
RUN yarn workspace @appsemble/sdk prepack
RUN yarn workspace @appsemble/utils prepack
RUN yarn workspace @appsemble/node-utils prepack
RUN yarn workspace @appsemble/server prepack

# Install production dependencies
FROM node:14-slim AS prod
WORKDIR /app
COPY --from=build /app/packages/node-utils packages/node-utils
COPY --from=build /app/packages/sdk packages/sdk
COPY --from=build /app/packages/server packages/server
COPY --from=build /app/packages/types packages/types
COPY --from=build /app/packages/utils packages/utils
COPY --from=build /app/package.json package.json
COPY --from=build /app/yarn.lock yarn.lock
RUN yarn --frozen-lockfile --production
RUN find . -name '*.ts' -delete
RUN rm -r yarn.lock

# Setup the production docker image.
FROM node:14-slim
COPY --from=prod /app /app
COPY --from=build /app/dist /app/dist
COPY translations /app/translations
WORKDIR /app
# By default colors aren’t detected within a Docker container. Let’s assume at least simple colors
# are supported by those who inspect the logs.
# https://www.npmjs.com/package/chalk#chalksupportscolor
ENV FORCE_COLOR 1
ENV NODE_ENV production
USER node
ENTRYPOINT ["node", "packages/server/dist"]
CMD ["start"]
HEALTHCHECK CMD ["node", "packages/server/dist", "health"]
EXPOSE 9999
