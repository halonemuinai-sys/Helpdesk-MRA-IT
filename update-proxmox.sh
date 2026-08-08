#!/bin/bash
# update-proxmox.sh — Proxmox VE Update Script
# Jalankan sebagai root: bash update-proxmox.sh

set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
log()  { echo -e "${GREEN}[✓]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
err()  { echo -e "${RED}[✗]${NC} $1"; exit 1; }
info() { echo -e "${BLUE}[→]${NC} $1"; }

# ── Cek root ──────────────────────────────────────────────────────────────────
[[ $EUID -ne 0 ]] && err "Script ini harus dijalankan sebagai root."

echo ""
echo -e "${BLUE}╔══════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     Proxmox VE — Update Script           ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════╝${NC}"
echo ""

PVE_VERSION=$(pveversion 2>/dev/null | head -1 || echo "Unknown")
info "Versi sekarang : $PVE_VERSION"
info "Hostname       : $(hostname)"
info "Tanggal        : $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

# ── Nonaktifkan repo enterprise (kalau tidak ada subscription) ────────────────
ENTERPRISE_REPO="/etc/apt/sources.list.d/pve-enterprise.list"
if [[ -f "$ENTERPRISE_REPO" ]]; then
  if grep -q "^deb" "$ENTERPRISE_REPO" 2>/dev/null; then
    warn "Enterprise repo aktif — menonaktifkan (tanpa subscription key)..."
    sed -i 's/^deb/#deb/' "$ENTERPRISE_REPO"
    log "Enterprise repo dinonaktifkan."
  fi
fi

# Nonaktifkan ceph enterprise repo jika ada
CEPH_ENTERPRISE="/etc/apt/sources.list.d/ceph.list"
if [[ -f "$CEPH_ENTERPRISE" ]]; then
  if grep -qE "^deb.*enterprise" "$CEPH_ENTERPRISE" 2>/dev/null; then
    sed -i 's|^deb https://enterprise.proxmox.com|#deb https://enterprise.proxmox.com|g' "$CEPH_ENTERPRISE"
    log "Ceph enterprise repo dinonaktifkan."
  fi
fi

# ── Pastikan no-subscription repo ada ─────────────────────────────────────────
NOSUB_REPO="/etc/apt/sources.list.d/pve-no-subscription.list"
PVE_CODENAME=$(grep VERSION_CODENAME /etc/os-release | cut -d= -f2)

if [[ ! -f "$NOSUB_REPO" ]]; then
  warn "No-subscription repo belum ada, menambahkan..."
  echo "deb http://download.proxmox.com/debian/pve ${PVE_CODENAME} pve-no-subscription" > "$NOSUB_REPO"
  log "No-subscription repo ditambahkan (codename: ${PVE_CODENAME})."
fi

# ── apt update ────────────────────────────────────────────────────────────────
info "Mengambil daftar package terbaru..."
apt-get update -qq
log "apt update selesai."

# ── Tampilkan package yang akan di-upgrade ────────────────────────────────────
UPGRADABLE=$(apt list --upgradable 2>/dev/null | grep -v "Listing" | wc -l)
if [[ $UPGRADABLE -eq 0 ]]; then
  log "Semua package sudah up-to-date. Tidak ada yang perlu di-upgrade."
  echo ""
  pveversion
  exit 0
fi

warn "${UPGRADABLE} package akan di-upgrade:"
apt list --upgradable 2>/dev/null | grep -v "Listing" | awk -F/ '{print "  •", $1}'
echo ""

# ── Konfirmasi ────────────────────────────────────────────────────────────────
read -rp "Lanjutkan upgrade? [y/N] " CONFIRM
[[ "${CONFIRM,,}" != "y" ]] && { warn "Update dibatalkan."; exit 0; }
echo ""

# ── Catat kernel sebelum update ───────────────────────────────────────────────
KERNEL_BEFORE=$(uname -r)

# ── Jalankan upgrade ──────────────────────────────────────────────────────────
info "Menjalankan apt-get dist-upgrade..."
DEBIAN_FRONTEND=noninteractive apt-get dist-upgrade -y \
  -o Dpkg::Options::="--force-confdef" \
  -o Dpkg::Options::="--force-confold"
log "dist-upgrade selesai."

# ── Bersihkan package tidak terpakai ─────────────────────────────────────────
info "Membersihkan package lama..."
apt-get autoremove -y -qq
apt-get autoclean -qq
log "Cleanup selesai."

# ── Cek apakah ada kernel baru ───────────────────────────────────────────────
KERNEL_LATEST=$(ls /boot/vmlinuz-* 2>/dev/null | sort -V | tail -1 | sed 's|/boot/vmlinuz-||')
echo ""
info "Kernel sebelum  : $KERNEL_BEFORE"
info "Kernel terbaru  : ${KERNEL_LATEST:-tidak diketahui}"

if [[ -n "$KERNEL_LATEST" && "$KERNEL_BEFORE" != "$KERNEL_LATEST" ]]; then
  warn "Kernel baru terdeteksi!"
  echo ""
  pveversion
  echo ""
  read -rp "Reboot sekarang untuk menerapkan kernel baru? [y/N] " REBOOT_NOW
  if [[ "${REBOOT_NOW,,}" == "y" ]]; then
    warn "Reboot dalam 5 detik... (Ctrl+C untuk membatalkan)"
    sleep 5
    reboot
  else
    warn "Reboot ditunda. Kernel baru akan aktif setelah reboot manual."
  fi
else
  echo ""
  log "Tidak ada kernel baru. Reboot tidak diperlukan."
  echo ""
  pveversion
fi

echo ""
log "Update Proxmox VE selesai."
