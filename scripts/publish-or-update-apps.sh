#!/bin/sh
set -e
[ -z "$GPG_PRIVATE_KEY" ] && echo "GPG_PRIVATE_KEY is required" && exit 1
[ -z "$GITLAB_ACCESS_TOKEN" ] && echo "GITLAB_ACCESS_TOKEN is required" && exit 1
# parse flags
for arg in "$@"; do
  case "$arg" in
  --push-to-main)
    REMOTE_BRANCH=main
    shift
    ;;
  --help)
    echo "Usage: ${0##*/} [--push-to-main] [context]"
    echo "  --push-to-main: push to main instead of set-<context>-app-ids"
    echo "  context: the context to use, defaults to development"
    exit
    ;;
  --*)
    echo "Unknown flag $arg"
    exit 1
    ;;
  *)
    break # stop parsing flags after first positional
    ;;
  esac
done
CONTEXT=${1:-development}
REMOTE_BRANCH="${REMOTE_BRANCH:-set-$CONTEXT-app-ids}"

ANY_PUBLISHED=""

apps="$(find apps/ -mindepth 1 -maxdepth 1 -type d)"
for app in $apps; do
  app_name="$(basename "$app")"
  context_id=$(yq -e ".context.$CONTEXT.id" "$app/.appsemblerc.yaml" 2>/dev/null || true)

  if npm run appsemble -- -vv app update --force "$app"; then
    echo "Successful update on app $app_name"
  else
    if [ -n "$context_id" ] && [ "$context_id" != "null" ]; then
      echo "App with $CONTEXT id $context_id does not exist, publishing instead of updating"
    else
      echo "App $app_name has no $CONTEXT id, publishing instead of updating"
    fi

    file_before="$(mktemp)"
    cp "$app/.appsemblerc.yaml" "$file_before"
    npm run appsemble -- -vv app publish --modify-context "$app"
    ANY_PUBLISHED="true"
    git diff --no-index --patch "$file_before" "$app/.appsemblerc.yaml" |
      # change the --- a to match the filename of +++ b
      sed "s/--- a.*$/--- a\/apps\/$app_name\/.appsemblerc.yaml/" |
      git apply --cached
    rm "$file_before"
  fi
done

[ -z "$ANY_PUBLISHED" ] && echo "No apps were published or updated" && exit 0
# prepack eslint config
npm --workspace @appsemble/eslint-plugin run prepack
# make an MR
gpg --import "$GPG_PRIVATE_KEY"
git config user.email bot@appsemble.com
git config user.name Appsemble
git commit --message "Set $CONTEXT app IDs" --gpg-sign --cleanup whitespace

git push "https://appsemble-bot:$GITLAB_ACCESS_TOKEN@gitlab.com/appsemble/appsemble" "HEAD:refs/heads/$REMOTE_BRANCH" \
  -o merge_request.create \
  -o merge_request.label=Chore \
  -o merge_request.remove_source_branch
