#!/usr/bin/env bash
# Publie main + le dossier dist sur la branche gh-pages.
set -e
cd "$(dirname "$0")/.."
REMOTE=https://github.com/hugoboiarsky7-create/projet-x.git
npx tsc --noEmit && npx vite build
git remote get-url origin >/dev/null 2>&1 || git remote add origin "$REMOTE"
git push -u origin main
cd dist && touch .nojekyll && rm -rf .git && git init -q -b gh-pages && git add -A \
  && git -c user.name="$(git -C .. config user.name)" -c user.email="$(git -C .. config user.email)" commit -q -m "Projet X" \
  && git push -f "$REMOTE" gh-pages && rm -rf .git
