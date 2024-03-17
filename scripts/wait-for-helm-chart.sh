#!/bin/sh

retries=0
found=0
while [ $retries -lt 100 ] && [ $found -ne 1 ]; do
  helm repo update
  if helm search repo appsemble/appsemble --version "$CI_COMMIT_TAG" --fail-on-no-result; then
    echo "Chart found!"
    found=1
  else
    echo "Chart version $CI_COMMIT_TAG not found, retrying in 5 seconds..."
    sleep 5
    retries=$((retries + 1))
  fi
done

if [ $found -ne 1 ]; then
  echo "Maximum number of attempts reached. Chart not found."
  exit 1
fi

