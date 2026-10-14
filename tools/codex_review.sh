#!/usr/bin/env bash
# Helper script for Claude Code (or developers) to delegate code review / execution to Codex
# Usage: ./scripts/codex_review.sh [custom prompt]

set -euo pipefail

PROMPT="${1:-review the recent changes in src/ and write findings to .agents/BOARD.md}"
BOARD_FILE=".agents/BOARD.md"

echo "🤖 Multi-Agent Orchestrator: Invoking Codex..."
echo "📋 Instruction: $PROMPT"

if ! command -v codex &> /dev/null; then
    echo "⚠️ 'codex' command not found in PATH."
    echo "Please ensure the Codex CLI is installed and available in your environment."
    echo "Example: npm install -g @openai/codex (or whichever package supplies your codex CLI)"
    exit 1
fi

echo "🚀 Executing: codex exec \"$PROMPT\""
codex exec "$PROMPT"
echo "✅ Codex execution completed. Check $BOARD_FILE for updates."

