#!/usr/bin/env bash
# MealMate launcher (Linux). Starts the app in the browser.
#
# Usage:
#   mealmate-linux.sh         Build, start the app, open the browser.
#   mealmate-linux.sh stop    Shut down a running instance.
#
# The script stays alive while the app is running, so it behaves like a
# normal desktop app: launch it (terminal, double-click, or file-manager
# "Run as Program") and it serves until closed. There is no detached or
# orphaned background process.
#
# Works no matter where the project lives and assumes nothing is installed:
#   - If Node.js isn't found (or is < 20), a local copy is downloaded
#     (curl or wget) into the user's data dir and used just for this app.
#   - Missing xdg-open just prints the URL instead of opening the browser.
#   - Every tool is checked before use; nothing is assumed.
#
# It looks for the project root by walking upward until it finds package.json,
# so this file can live anywhere inside (or next to) the project folder.

set -euo pipefail

# ---- Locate project root (walk up to find package.json) -------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$SCRIPT_DIR"
while [ ! -f "$APP_DIR/package.json" ] && [ "$APP_DIR" != "/" ]; do
  APP_DIR="$(dirname "$APP_DIR")"
done
if [ ! -f "$APP_DIR/package.json" ]; then
  echo "Could not find the MealMate project (no package.json found upward from $SCRIPT_DIR)." >&2
  exit 1
fi

has() { command -v "$1" >/dev/null 2>&1; }

URL_HOST="127.0.0.1"
PORT=4173
URL="http://$URL_HOST:$PORT"

# ---- Per-user runtime & Node storage (keeps the project folder pristine) --
RUNTIME_DIR="${XDG_STATE_HOME:-$HOME/.local/state}/mealmate"
NODE_DIR="${XDG_DATA_HOME:-$HOME/.local/share}/mealmate/node"
LOG="$RUNTIME_DIR/mealmate-server.log"
PIDFILE="$RUNTIME_DIR/mealmate-server.pid"
NODE_VERSION="22.20.0"
mkdir -p "$RUNTIME_DIR" "$NODE_DIR"
cd "$APP_DIR"

# ---- Ensure Node.js 20+ is available --------------------
need_node_bootstrap=0
if ! has node || [ "$(node -p 'process.versions.node.split(".")[0]' 2>/dev/null || echo 0)" -lt 20 ]; then
  need_node_bootstrap=1
fi

if [ "$need_node_bootstrap" -eq 1 ]; then
  if [ -x "$NODE_DIR/bin/node" ] && [ "$("$NODE_DIR/bin/node" -p 'process.versions.node.split(".")[0]')" -ge 20 ]; then
    export PATH="$NODE_DIR/bin:$PATH"
  else
    echo "Node.js not found (or too old). Downloading Node.js $NODE_VERSION locally — one time only."
    case "$(uname -s)" in Linux) OS=linux ;; *) echo "Unsupported OS." >&2; exit 1 ;; esac
    case "$(uname -m)" in x86_64|amd64) ARCH=x64 ;; aarch64|arm64) ARCH=arm64 ;; *) echo "Unsupported architecture." >&2; exit 1 ;; esac
    DL="https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-${OS}-${ARCH}.tar.xz"
    mkdir -p "$NODE_DIR"
    TMP="$(mktemp -d)"
    trap 'rm -rf "$TMP"' EXIT
    if has curl; then
      curl -fsSL "$DL" -o "$TMP/node.tar.xz"
    elif has wget; then
      wget -q "$DL" -O "$TMP/node.tar.xz"
    else
      echo "Neither curl nor wget is installed — cannot download Node.js." >&2
      exit 1
    fi
    tar -xJf "$TMP/node.tar.xz" -C "$TMP"
    cp -a "$TMP/node-v${NODE_VERSION}-${OS}-${ARCH}/." "$NODE_DIR/"
    export PATH="$NODE_DIR/bin:$PATH"
  fi
fi

has node || { echo "Node.js could not be made available." >&2; exit 1; }
has npm  || { echo "npm not found alongside Node.js." >&2; exit 1; }

# ---- "stop" mode: shut the app down without needing a terminal --------------
if [ "${1:-}" = "stop" ]; then
  STOPPED=0
  if [ -f "$PIDFILE" ]; then
    OLD_PID="$(cat "$PIDFILE" 2>/dev/null || true)"
    if [ -n "$OLD_PID" ] && kill -0 "$OLD_PID" 2>/dev/null; then
      kill "$OLD_PID" 2>/dev/null || true
      STOPPED=1
    fi
    rm -f "$PIDFILE"
  fi
  if has pkill; then
    pkill -f "$APP_DIR/node_modules/.bin/vite" 2>/dev/null || true
  fi
  if has fuser; then
    fuser -k -TERM "${PORT}/tcp" 2>/dev/null || true
  elif has lsof; then
    lsof -ti tcp:"$PORT" 2>/dev/null | xargs -r kill 2>/dev/null || true
  fi
  sleep 1
  if [ "$STOPPED" -eq 1 ]; then
    echo "MealMate stopped."
  else
    echo "MealMate is not running."
  fi
  exit 0
fi

# ---- Install dependencies if missing --------------------------------------
if [ ! -d "$APP_DIR/node_modules" ]; then
  echo "Installing dependencies (first run only)..."
  npm ci
fi

# ---- Stop any previous MealMate server ------------------------------------
# The saved PID is npm's, not the vite child it spawns, so also stop anything
# bound to the port. Uses whatever is available (pkill/fuser/lsof) and only
# if it exists.
if [ -f "$PIDFILE" ]; then
  OLD_PID="$(cat "$PIDFILE" 2>/dev/null || true)"
  if [ -n "$OLD_PID" ] && kill -0 "$OLD_PID" 2>/dev/null; then
    kill "$OLD_PID" 2>/dev/null || true
  fi
  rm -f "$PIDFILE"
fi
if has pkill; then
  pkill -f "$APP_DIR/node_modules/.bin/vite" 2>/dev/null || true
fi
if has fuser; then
  fuser -k -TERM "${PORT}/tcp" 2>/dev/null || true
elif has lsof; then
  lsof -ti tcp:"$PORT" 2>/dev/null | xargs -r kill 2>/dev/null || true
fi
sleep 1

# ---- Build & run the preview server ----------------------------------------
npm run build
# Run the server as a child of THIS script, then wait on it. The script stays
# alive exactly as long as the app is running — like a normal desktop app — so
# even a file-manager "Run" launch keeps everything alive with no orphaned or
# detached background process. Stopping the app is just stopping this script.
npm run preview -- --host "$URL_HOST" --port "$PORT" --strictPort >"$LOG" 2>&1 &
SERVER_PID=$!
echo $SERVER_PID >"$PIDFILE"

# ---- Wait for it to answer, then open the browser ---------------------------
probe() {
  if has curl; then
    curl -fs -o /dev/null "$URL"
  elif has wget; then
    wget -q -O /dev/null "$URL"
  else
    bash -c "exec 3<>/dev/tcp/$URL_HOST/$PORT" 2>/dev/null
  fi
}

i=0
while [ "$i" -lt 40 ]; do
  if probe; then break; fi
  sleep 0.5
  i=$((i + 1))
done

if probe; then
  if has xdg-open; then
    if xdg-open "$URL" 2>/dev/null; then
      echo "MealMate is running at $URL (opened in your browser)."
    else
      echo "MealMate is running at $URL. Click the link to open it."
    fi
  else
    echo "MealMate is running at $URL. Click the link to open it."
  fi
  echo "Close this window (or press Ctrl+C) to stop the server."
  wait "$SERVER_PID"
  exit $?
fi

kill "$SERVER_PID" 2>/dev/null || true
echo "MealMate failed to start. See the log: $LOG" >&2
exit 1