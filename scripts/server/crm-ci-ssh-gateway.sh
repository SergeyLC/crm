#!/bin/bash
# Forced SSH command for the GitHub Actions deploy key (authorized_keys command=).
# Allows only: mkdir/scp into /tmp/crm-deploy-<runId>, and running crm-ci-deploy.sh from that dir.
set -euo pipefail

LOG_DIR="${HOME}/logs"
LOG_FILE="${LOG_DIR}/ci-ssh-gateway.log"
mkdir -p "$LOG_DIR" 2>/dev/null || true
echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) user=$(id -un) cmd=${SSH_ORIGINAL_COMMAND-}" >>"$LOG_FILE" 2>/dev/null || true

cmd="${SSH_ORIGINAL_COMMAND-}"
if [[ -z "$cmd" ]]; then
  echo "crm-ci-ssh-gateway: interactive/empty command denied" >&2
  exit 1
fi

# mkdir -p /tmp/crm-deploy-<digits>  (optional single quotes)
if [[ "$cmd" =~ ^mkdir[[:space:]]+-p[[:space:]]+\'?/tmp/crm-deploy-([0-9]+)\'?$ ]]; then
  exec mkdir -p "/tmp/crm-deploy-${BASH_REMATCH[1]}"
fi

# scp sink: scp [-v] -t /tmp/crm-deploy-<digits>[/]
if [[ "$cmd" =~ ^scp([[:space:]]+-v)?[[:space:]]+-t[[:space:]]+\'?/tmp/crm-deploy-([0-9]+)/?\'?$ ]]; then
  run_id="${BASH_REMATCH[2]}"
  mkdir -p "/tmp/crm-deploy-${run_id}"
  # Prefer argv form; fall back to matching verbosity flag from client.
  if [[ "$cmd" == *"-v"* ]]; then
    exec /usr/bin/scp -v -t "/tmp/crm-deploy-${run_id}"
  fi
  exec /usr/bin/scp -t "/tmp/crm-deploy-${run_id}"
fi

# Forced deploy entrypoint (absolute bash + script inside the scp target)
if [[ "$cmd" =~ ^(/bin/bash|/usr/bin/bash)[[:space:]]+/tmp/crm-deploy-([0-9]+)/crm-ci-deploy\.sh$ ]]; then
  bash_bin="${BASH_REMATCH[1]}"
  run_id="${BASH_REMATCH[2]}"
  script="/tmp/crm-deploy-${run_id}/crm-ci-deploy.sh"
  if [[ ! -f "$script" ]]; then
    echo "crm-ci-ssh-gateway: missing $script (scp bundle first)" >&2
    exit 1
  fi
  exec "$bash_bin" "$script"
fi

echo "crm-ci-ssh-gateway: command denied" >&2
exit 1
