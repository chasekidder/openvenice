#!/bin/sh
set -e

RUNTIME_CONFIG="/usr/share/nginx/html/runtime-config.js"
SECRET_FILE="/run/secrets/venice_api_key"

if [ -f "$SECRET_FILE" ]; then
  API_KEY=$(cat "$SECRET_FILE")
  API_KEY_ESCAPED=$(printf '%s' "$API_KEY" | sed 's/["\]//g')
  cat > "$RUNTIME_CONFIG" <<EOF
window.__RUNTIME_CONFIG__ = {
  VENICE_API_KEY: "${API_KEY_ESCAPED}"
};
EOF
fi

exec "$@"