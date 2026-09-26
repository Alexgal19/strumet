#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
STATE_DIR="$PROJECT_DIR/.local-voice/tailscale"
SOCKET="$STATE_DIR/tailscaled.sock"
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
cd "$PROJECT_DIR"

require_command() {
  command -v "$1" >/dev/null || { echo "Brakuje narzędzia: $1" >&2; exit 1; }
}

start_network() {
  require_command tailscale
  require_command tailscaled
  mkdir -p "$STATE_DIR"
  chmod 700 "$STATE_DIR"
  if ! tailscale --socket="$SOCKET" version --daemon >/dev/null 2>&1; then
    nohup tailscaled --tun=userspace-networking --statedir="$STATE_DIR" \
      --socket="$SOCKET" --port=0 >"$STATE_DIR/daemon.log" 2>&1 &
    for attempt in {1..30}; do
      if tailscale --socket="$SOCKET" version --daemon >/dev/null 2>&1; then return; fi
      sleep 1
    done
    echo "Nie udało się uruchomić Tailscale. Sprawdź $STATE_DIR/daemon.log" >&2
    exit 1
  fi
}

case "${1:-start}" in
  start)
    require_command node
    require_command caffeinate
    if [[ ! -f .next/BUILD_ID ]]; then
      echo "Najpierw wykonaj npm run build w folderze projektu." >&2
      exit 1
    fi
    require_command curl
    if ! curl --fail --silent --max-time 2 http://127.0.0.1:11434/api/tags >/dev/null; then
      open -a Ollama
      for attempt in {1..20}; do
        if curl --fail --silent --max-time 2 http://127.0.0.1:11434/api/tags >/dev/null; then break; fi
        sleep 1
      done
      if ! curl --fail --silent --max-time 2 http://127.0.0.1:11434/api/tags >/dev/null; then
        echo "Ollama nie odpowiada. Uruchom Ollama i spróbuj ponownie." >&2
        exit 1
      fi
    fi
    # Restore the already paired private network after a Mac restart.
    if [[ -f "$STATE_DIR/tailscaled.state" ]]; then start_network; fi
    echo "Strumet: http://localhost:3100 — pozostaw to okno otwarte. Ctrl+C zatrzymuje serwer."
    exec caffeinate -i node node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port 3100
    ;;
  connect)
    start_network
    tailscale --socket="$SOCKET" up --accept-dns=false --hostname=strumet-mac
    tailscale --socket="$SOCKET" serve --bg http://127.0.0.1:3100
    ;;
  status)
    tailscale --socket="$SOCKET" status
    tailscale --socket="$SOCKET" serve status
    ;;
  disconnect)
    tailscale --socket="$SOCKET" serve reset
    tailscale --socket="$SOCKET" down
    ;;
  *)
    echo "Użycie: bash scripts/local-voice-mac.sh [start|connect|status|disconnect]" >&2
    exit 2
    ;;
esac
