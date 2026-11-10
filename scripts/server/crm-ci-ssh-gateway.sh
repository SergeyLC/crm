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

# Legacy scp sink (client must use `scp -O`).
# CI copies multiple files into a directory → remote argv is often:
#   scp -d -t /tmp/crm-deploy-<id>/
# Optional -v; optional "--" before path; optional quotes/trailing slash.
if [[ "$cmd" =~ ^scp[[:space:]]+ ]] && [[ "$cmd" =~ -t ]] && [[ "$cmd" =~ /tmp/crm-deploy-([0-9]+) ]]; then
  run_id="${BASH_REMATCH[1]}"
  # Reject anything that isn't clearly an scp transfer into that run dir.
  if [[ ! "$cmd" =~ ^scp([[:space:]]+-[vd])*[[:space:]]+-t([[:space:]]+--[[:space:]]+|[[:space:]]+)\'?/tmp/crm-deploy-${run_id}/?\'?$ ]]; then
    echo "crm-ci-ssh-gateway: unexpected scp argv denied" >&2
    exit 1
  fi
  mkdir -p "/tmp/crm-deploy-${run_id}"
  flags=()
  [[ " $cmd " == *" -v "* ]] && flags+=(-v)
  [[ " $cmd " == *" -d "* ]] && flags+=(-d)
  exec /usr/bin/scp "${flags[@]}" -t "/tmp/crm-deploy-${run_id}"
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

if [[ "$cmd" == *sftp-server* ]]; then
  echo "crm-ci-ssh-gateway: SFTP denied; CI must use scp -O (legacy protocol)" >&2
  exit 1
fi

echo "crm-ci-ssh-gateway: command denied" >&2
exit 1
