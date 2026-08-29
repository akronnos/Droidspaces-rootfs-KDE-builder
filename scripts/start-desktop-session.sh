#!/usr/bin/env bash
set -euo pipefail

config="${DROIDSPACES_DESKTOP_CONFIG:-/etc/droidspaces-desktop.conf}"
[[ -r "$config" ]] || { echo "缺少桌面配置文件：$config" >&2; exit 1; }
source "$config"

case "${DESKTOP:-}:${DISPLAY_BACKEND:-}" in
    none:x11) command_line='exit 0' ;;
    kde:x11) command_line='export DISPLAY="${DISPLAY:-:5}"; exec startplasma-x11' ;;
    kde:anland-wayland) command_line='exec startplasma-wayland' ;;
    kde-mobile:anland-wayland) command_line='exec startplasmamobile' ;;
    gnome:anland-wayland) command_line='exec gnome-session --session=gnome' ;;
    armadaos:anland-wayland)
        state_file="/var/home/armada/.config/armada-session-state"
        command_line="
        if [ ! -f \"$state_file\" ]; then
            mkdir -p \"\$(dirname \"$state_file\")\"
            echo \"gamemode\" > \"$state_file\"
            chown armada:armada \"\$(dirname \"$state_file\")\" \"$state_file\" 2>/dev/null || true
        fi
        while true; do
            state=\$(cat \"$state_file\" 2>/dev/null || echo \"gamemode\")
            if [ \"\$state\" = \"desktop\" ]; then
                startplasma-wayland
            else
                gamescope-session-plus steam
            fi
            sleep 1
        done"
        ;;
    *)
        echo "不支持的桌面会话：${DESKTOP:-未设置}/${DISPLAY_BACKEND:-未设置}" >&2
        exit 1
        ;;
esac

if [[ "${DROIDSPACES_SESSION_DRY_RUN:-false}" == true ]]; then
    printf '%s\n' "$command_line"
    exit 0
fi

exec /bin/bash -lc "$command_line"
