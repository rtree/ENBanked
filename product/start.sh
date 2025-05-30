#!/bin/bash

SESSION="vault-miniapp"
PROJECT_DIR="$HOME/ENBanked"  # 任意のパスに変更可

# セッションが存在しない場合に作成
tmux has-session -t "$SESSION" 2>/dev/null
if [ $? != 0 ]; then
  tmux new-session -d -s "$SESSION" -n dev -c "$PROJECT_DIR"
  tmux split-window -h -c "$PROJECT_DIR"
  tmux split-window -v -t "$SESSION":0.0 -c "$PROJECT_DIR"
  tmux split-window -v -t "$SESSION":0.1 -c "$PROJECT_DIR"
fi

# ペインごとにコマンド実行
# Top-left: dev server
tmux send-keys -t "$SESSION":0.0 "cd $PROJECT_DIR/produc/frontend && pnpm install && pnpm run dev" C-m

# Top-right: ngrok（installが終わるまで10秒待機）
tmux send-keys -t "$SESSION":0.1 "cd $PROJECT_DIR/produc/frontend && sleep 10 && ngrok start frontend --config ./ngrok.yml" C-m

# Bottom-left: interactive shell
tmux send-keys -t "$SESSION":0.2 "cd $PROJECT_DIR" C-m

# Bottom-right: git pull loop
tmux send-keys -t "$SESSION":0.3 "cd $PROJECT_DIR && while true; do git pull -v; sleep 5; done" C-m

# セッションを表示
tmux attach-session -t "$SESSION"
