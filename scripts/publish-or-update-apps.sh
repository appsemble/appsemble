#!/bin/sh
[ -z "$GPG_PRIVATE_KEY" ] && echo "GPG_PRIVATE_KEY is required" && exit 1
[ -z "$GITLAB_ACCESS_TOKEN" ] && echo "GITLAB_ACCESS_TOKEN is required" && exit 1
CONTEXT=${1:-development}
apt-get update
apt-get install --yes git gnupg yq

find apps/ -mindepth 1 -maxdepth 1 -type d | while read -r app; do
  if yq -e ".context.$CONTEXT.id" "$app/.appsemblerc.yaml" > /dev/null; then
    npm run appsemble -- -vv app update --force "$app";
  else
    echo "App $app has no $CONTEXT id, publishing instead of updating";
    npm run appsemble -- -vv app publish --modify-context "$app";
  fi
done
# make an MR
gpg --import "$GPG_PRIVATE_KEY"
git config user.email bot@appsemble.com
git config user.name Appsemble
git add apps/*/.appsemblerc.yaml
git commit --message "Set $CONTEXT app IDs" --gpg-sign --cleanup whitespace
git push "https://appsemble-bot:$GITLAB_ACCESS_TOKEN@gitlab.com/appsemble/appsemble" "HEAD:set-$CONTEXT-app-ids" \
  -o merge_request.create \
  -o merge_request.label=Chore \
  -o merge_request.remove_source_branch
  # -o merge_request.merge_when_pipeline_succeeds # NUH-UH
