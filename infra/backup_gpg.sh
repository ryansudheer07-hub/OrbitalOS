#!/bin/bash
# OrbitalOS: Secure Postgres DB and .env backup with GPG encryption
# Usage: ./backup_gpg.sh <recipient-email>
# Requires: pg_dump, gpg, tar

set -e

RECIPIENT="$1"
if [ -z "$RECIPIENT" ]; then
  echo "Usage: $0 <gpg-recipient-email>"
  exit 1
fi

DATE=$(date +%Y-%m-%d_%H-%M-%S)
BACKUP_DIR="orbitalos_backup_$DATE"
mkdir "$BACKUP_DIR"

# Dump Postgres DB (edit connection string as needed)
export PGPASSWORD="${POSTGRES_PASSWORD:-change_this}"
pg_dump -h localhost -U orbitalos orbitalos > "$BACKUP_DIR/db.sql"

# Copy .env (if exists)
if [ -f "../.env" ]; then
  cp ../.env "$BACKUP_DIR/.env"
fi

# Archive and encrypt
TAR_FILE="$BACKUP_DIR.tar.gz"
ENCRYPTED_FILE="$TAR_FILE.gpg"
tar czf "$TAR_FILE" "$BACKUP_DIR"
gpg --yes --encrypt --recipient "$RECIPIENT" -o "$ENCRYPTED_FILE" "$TAR_FILE"

# Clean up
rm -rf "$BACKUP_DIR" "$TAR_FILE"
echo "Backup complete: $ENCRYPTED_FILE"
