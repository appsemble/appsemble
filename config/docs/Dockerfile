FROM node:10-slim as build
ARG CI_COMMIT_REF_NAME=dev
ENV CI_COMMIT_REF_NAME $CI_COMMIT_REF_NAME
WORKDIR /build
COPY . .
# The required Debian packages for Puppeteer are taken from
# https://github.com/GoogleChrome/puppeteer/blob/v1.16.0/docs/troubleshooting.md#chrome-headless-doesnt-launch-on-unix
RUN apt-get update \
 && apt-get install --no-install-recommends --yes \
      gconf-service \
      libasound2 \
      libatk1.0-0 \
      libatk-bridge2.0-0 \
      libc6 \
      libcairo2 \
      libcups2 \
      libdbus-1-3 \
      libexpat1 \
      libfontconfig1 \
      libgcc1 \
      libgconf-2-4 \
      libgdk-pixbuf2.0-0 \
      libglib2.0-0 \
      libgtk-3-0 \
      libnspr4 \
      libpango-1.0-0 \
      libpangocairo-1.0-0 \
      libstdc++6 \
      libx11-6 \
      libx11-xcb1 \
      libxcb1 \
      libxcomposite1 \
      libxcursor1 \
      libxdamage1 \
      libxext6 \
      libxfixes3 \
      libxi6 \
      libxrandr2 \
      libxrender1 \
      libxss1 \
      libxtst6 \
      ca-certificates \
      fonts-liberation \
      libappindicator1 \
      libnss3 \
      lsb-release \
      xdg-utils \
      wget \
 && yarn --frozen-lockfile \
 && for input in docs/images/*.mmd; do \
      output=docs/images/$(basename $input .mmd).svg; \
      yarn mmdc -p puppeteer-config.json -i $input -o $output; \
    done \
 && yarn docz build

FROM nginx:1.15-alpine
COPY --from=build /build/.docz/dist /usr/share/nginx/html
COPY config/docs/nginx.conf /etc/nginx/conf.d/default.conf
