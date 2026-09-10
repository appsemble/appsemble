# syntax=docker/dockerfile:1.27-labs
# Build the image libraries with HEVC decoding support.
FROM node:24-trixie-slim AS image-libraries

RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
  --mount=type=cache,target=/var/lib/apt/lists,sharing=locked \
  rm -f /etc/apt/apt.conf.d/docker-clean \
  && apt-get update \
  && apt-get install --yes --no-install-recommends \
    build-essential cmake meson ninja-build pkg-config python3 \
    libaom-dev libarchive-dev libcgif-dev libde265-dev libexif-dev libexpat1-dev \
    libfontconfig-dev libglib2.0-dev libhwy-dev libimagequant-dev libjpeg62-turbo-dev \
    liblcms2-dev libpango1.0-dev libpng-dev librsvg2-dev libtiff-dev \
    libwebp-dev zlib1g-dev

ARG LIBHEIF_VERSION=1.23.4
ADD --checksum=sha256:d0c02b4b0e978f34a1974b6f3eea7975a537bf7a9195ffeea38e7242ff316fdd \
  https://github.com/strukturag/libheif/releases/download/v${LIBHEIF_VERSION}/libheif-${LIBHEIF_VERSION}.tar.gz /tmp/libheif.tar.gz
RUN mkdir /tmp/libheif \
  && tar -xf /tmp/libheif.tar.gz -C /tmp/libheif --strip-components=1 \
  && cmake -S /tmp/libheif -B /tmp/libheif/build \
    -DCMAKE_BUILD_TYPE=Release -DCMAKE_INSTALL_LIBDIR=lib \
    -DBUILD_TESTING=OFF -DBUILD_DOCUMENTATION=OFF -DWITH_EXAMPLES=OFF \
    -DWITH_GDK_PIXBUF=OFF -DENABLE_PLUGIN_LOADING=OFF \
    -DWITH_LIBDE265=ON -DWITH_X265=OFF -DWITH_X264=OFF -DWITH_OpenH264_DECODER=OFF \
    -DWITH_AOM_DECODER=ON -DWITH_AOM_ENCODER=ON \
  && cmake --build /tmp/libheif/build --parallel "$(nproc)" \
  && cmake --install /tmp/libheif/build \
  && rm -rf /tmp/libheif /tmp/libheif.tar.gz

ARG VIPS_VERSION=8.18.6
ADD --checksum=sha256:3c41e1d5458081bfa4a5bc54e116c46259c75c6760a18027764555632b9dda3e \
  https://github.com/libvips/libvips/releases/download/v${VIPS_VERSION}/vips-${VIPS_VERSION}.tar.xz /tmp/vips.tar.xz
RUN mkdir /tmp/vips \
  && tar -xf /tmp/vips.tar.xz -C /tmp/vips --strip-components=1 \
  && meson setup /tmp/vips/build /tmp/vips --buildtype=release --libdir=lib \
    --auto-features=disabled -Dexamples=false -Dmodules=disabled \
    -Darchive=enabled -Dcgif=enabled -Dexif=enabled -Dfontconfig=enabled \
    -Dheif=enabled -Dhighway=enabled -Dimagequant=enabled -Djpeg=enabled \
    -Dlcms=enabled -Dpangocairo=enabled -Dpng=enabled -Drsvg=enabled \
    -Dtiff=enabled -Dwebp=enabled -Dzlib=enabled \
  && meson compile -C /tmp/vips/build \
  && meson install -C /tmp/vips/build \
  && ldconfig \
  && rm -rf /tmp/vips /tmp/vips.tar.xz

# Build production files
FROM image-libraries AS build
WORKDIR /app

RUN --mount=type=cache,target=/root/.npm \
  npm install --global node-addon-api@8.9.2 node-gyp@13.0.2

COPY package-lock.json package-lock.json
COPY package.json package.json

# this statement requires experimental syntax, declared at the top of the file
COPY --parents packages/**/package.json .

RUN --mount=type=cache,target=/root/.npm SHARP_IGNORE_GLOBAL_LIBVIPS=1 npm ci
RUN NODE_PATH="$(npm root --global)" npm explore sharp -- npm run build

COPY . .

RUN npm run scripts -- build
RUN npm --workspace @appsemble/types run prepack
RUN npm --workspace @appsemble/sdk run prepack
RUN npm --workspace @appsemble/lang-sdk run prepack
RUN npm --workspace @appsemble/utils run prepack
RUN npm --workspace @appsemble/node-utils run prepack
RUN npm --workspace @appsemble/eslint-plugin run prepack
RUN npm --workspace @appsemble/server run prepack

# Install production dependencies
FROM node:24-trixie-slim AS prod
WORKDIR /app
COPY --from=build /app/packages/node-utils packages/node-utils
COPY --from=build /app/packages/sdk packages/sdk
COPY --from=build /app/packages/lang-sdk packages/lang-sdk
COPY --from=build /app/packages/server packages/server
COPY --from=build /app/packages/types packages/types
COPY --from=build /app/packages/utils packages/utils
COPY --from=build /app/packages/eslint-plugin packages/eslint-plugin
COPY --from=build /app/package.json package.json
COPY --from=build /app/package-lock.json package-lock.json
COPY --from=build /app/trainings trainings
RUN npm install --omit=dev
RUN npm prune
COPY --from=build /app/node_modules/sharp/src/build/Release /app/node_modules/sharp/src/build/Release
RUN find . -name '*.ts' -delete
RUN rm -r package-lock.json

# Setup the production docker image.
FROM node:24-trixie-slim

# Install postgresql-client for pg_dump (used by backup-production-data command)
RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
  --mount=type=cache,target=/var/lib/apt/lists,sharing=locked \
  rm -f /etc/apt/apt.conf.d/docker-clean \
  && apt-get update \
  && apt-get install --yes --no-install-recommends postgresql-client \
    libaom3 libarchive13t64 libcgif0 libde265-0 libexif12 libexpat1 libfontconfig1 \
    libglib2.0-0t64 libhwy1t64 libimagequant0 libjpeg62-turbo liblcms2-2 \
    libpango-1.0-0 libpangocairo-1.0-0 libpng16-16t64 librsvg2-2 \
    libtiff6 libwebp7 libwebpdemux2 libwebpmux3 zlib1g

COPY --from=image-libraries /usr/local/lib/libheif.so* /usr/local/lib/libvips*.so* /usr/local/lib/
RUN ldconfig

COPY --from=prod /app /app
COPY --from=build /app/dist /app/dist
COPY i18n /app/i18n
RUN ln -s /app/packages/server/bin.js /usr/bin/appsemble-server
WORKDIR /app
# By default colors aren’t detected within a Docker container. Let’s assume at least simple colors
# are supported by those who inspect the logs.
# https://www.npmjs.com/package/chalk#chalksupportscolor
ENV FORCE_COLOR="1"
ENV NODE_ENV="production"
ENV NODE_OPTIONS="--enable-source-maps --import /app/packages/server/instrumentation.mjs"
USER node
ENTRYPOINT ["appsemble-server"]
CMD ["start"]
HEALTHCHECK CMD ["appsemble-server", "health"]
EXPOSE 9999
ARG version=0.38.2-test.0
ARG date
LABEL io.artifacthub.package.alternative-locations="registry.gitlab.com/appsemble/appsemble:${version}"
LABEL io.artifacthub.package.keywords="app,apps,appsemble,framework,low-code,lowcode"
LABEL io.artifacthub.package.license="LGPL-3.0-only"
LABEL io.artifacthub.package.logo-url="https://charts.appsemble.com/icon.svg"
LABEL io.artifacthub.package.readme-url="https://gitlab.com/appsemble/appsemble/-/raw/${version}/packages/server/README.md"
LABEL org.opencontainers.image.created="${date}"
LABEL org.opencontainers.image.description="The open source low-code app building platform"
LABEL org.opencontainers.image.documentation="https://appsemble.app/docs"
LABEL org.opencontainers.image.source="https://gitlab.com/appsemble/appsemble/-/tree/${version}"
LABEL org.opencontainers.image.title="Appsemble"
LABEL org.opencontainers.image.vendor="Appsemble"
LABEL org.opencontainers.image.version="${version}"
