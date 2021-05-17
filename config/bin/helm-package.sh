#!/usr/bin/env sh
if [ -f "$GPG_PRIVATE_KEY" ]; then
  apk add gnupg
  gpg --import "$GPG_PRIVATE_KEY"
  gpg --export-secret-keys > ~/.gnupg/pubring.gpg
  helm package --sign --key Appsemble "$@"
else
  helm package "$@"
fi
