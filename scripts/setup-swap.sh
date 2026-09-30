#!/bin/bash
set -euo pipefail

SWAPFILE=/swapfile
SIZE=2G

echo "=== current swap ==="
swapon --show || true
free -h

if swapon --show | grep -q "$SWAPFILE"; then
  echo "Swap already active at $SWAPFILE"
else
  if [[ ! -f "$SWAPFILE" ]]; then
    echo "Creating $SWAPFILE ($SIZE)..."
    fallocate -l "$SIZE" "$SWAPFILE" || dd if=/dev/zero of="$SWAPFILE" bs=1M count=2048 status=progress
    chmod 600 "$SWAPFILE"
    mkswap "$SWAPFILE"
  fi
  swapon "$SWAPFILE"
fi

if ! grep -qE "^${SWAPFILE}\\s" /etc/fstab; then
  echo "Persisting swap in /etc/fstab..."
  echo "$SWAPFILE none swap sw 0 0" >> /etc/fstab
fi

# Prefer RAM; use swap only under pressure
sysctl -w vm.swappiness=10
if ! grep -q '^vm.swappiness=' /etc/sysctl.conf 2>/dev/null; then
  echo 'vm.swappiness=10' >> /etc/sysctl.conf
elif grep -q '^vm.swappiness=' /etc/sysctl.conf; then
  sed -i 's/^vm.swappiness=.*/vm.swappiness=10/' /etc/sysctl.conf
fi

echo "=== swap after ==="
swapon --show
free -h
