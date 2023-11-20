# Build production files
FROM node:18-bookworm-slim AS build
WORKDIR /app
COPY . .
RUN npm ci
RUN npx playwright install --with-deps chromium
RUN npm run scripts build
RUN npm --workspace @appsemble/types run prepack
RUN npm --workspace @appsemble/sdk run prepack
RUN npm --workspace @appsemble/utils run prepack
RUN npm --workspace @appsemble/node-utils run prepack
RUN npm --workspace @appsemble/server run prepack

# Install production dependencies
FROM node:18-bookworm-slim AS prod
WORKDIR /app
COPY --from=build /app/packages/node-utils packages/node-utils
COPY --from=build /app/packages/sdk packages/sdk
COPY --from=build /app/packages/server packages/server
COPY --from=build /app/packages/types packages/types
COPY --from=build /app/packages/utils packages/utils
COPY --from=build /app/package.json package.json
COPY --from=build /app/package-lock.json package-lock.json
RUN npm install --omit=dev
RUN npm prune
RUN find . -name '*.ts' -delete
RUN rm -r package-lock.json

# Setup the production docker image.
FROM node:18-bookworm-slim
ARG version=0.23.4
ARG date

COPY --from=prod /app /app
COPY --from=build /app/dist /app/dist
COPY i18n /app/i18n
RUN ln -s /app/packages/server/bin.js /usr/bin/appsemble-server
WORKDIR /app
# By default colors aren’t detected within a Docker container. Let’s assume at least simple colors
# are supported by those who inspect the logs.
# https://www.npmjs.com/package/chalk#chalksupportscolor
ENV FORCE_COLOR 1
ENV NODE_ENV production
USER node
ENTRYPOINT ["appsemble-server"]
CMD ["start"]
HEALTHCHECK CMD ["appsemble-server", "health"]
EXPOSE 9999
LABEL io.artifacthub.package.alternative-locations registry.gitlab.com/appsemble/appsemble:${version}
LABEL io.artifacthub.package.keywords app,apps,appsemble,framework,low-code,lowcode
LABEL io.artifacthub.package.license LGPL-3.0-only
LABEL io.artifacthub.package.logo-url https://charts.appsemble.com/icon.svg
LABEL io.artifacthub.package.readme-url https://gitlab.com/appsemble/appsemble/-/raw/${version}/packages/server/README.md
LABEL org.opencontainers.image.created ${date}
LABEL org.opencontainers.image.description The open source low-code app building platform
LABEL org.opencontainers.image.documentation https://appsemble.app/docs
LABEL org.opencontainers.image.source https://gitlab.com/appsemble/appsemble/-/tree/${version}
LABEL org.opencontainers.image.title Appsemble
LABEL org.opencontainers.image.vendor Appsemble
LABEL org.opencontainers.image.version ${version}
