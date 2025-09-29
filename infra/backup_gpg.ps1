# OrbitalOS: Secure Postgres DB and .env backup with GPG encryption (PowerShell)
# Usage: .\backup_gpg.ps1 -RecipientEmail <email>
# Requires: pg_dump, gpg, tar

param(
    [Parameter(Mandatory=$true)]
    [string]$RecipientEmail
)

$DATE = Get-Date -Format 'yyyy-MM-dd_HH-mm-ss'
$BACKUP_DIR = "orbitalos_backup_$DATE"
New-Item -ItemType Directory -Path $BACKUP_DIR | Out-Null

# Dump Postgres DB (edit connection string as needed)
$env:PGPASSWORD = $env:POSTGRES_PASSWORD
pg_dump -h localhost -U orbitalos orbitalos > "$BACKUP_DIR\db.sql"

# Copy .env (if exists)
if (Test-Path "..\.env") {
    Copy-Item "..\.env" "$BACKUP_DIR\.env"
}

# Archive and encrypt
$TAR_FILE = "$BACKUP_DIR.tar.gz"
$ENCRYPTED_FILE = "$TAR_FILE.gpg"
tar -czf $TAR_FILE $BACKUP_DIR
& gpg --yes --encrypt --recipient $RecipientEmail -o $ENCRYPTED_FILE $TAR_FILE

# Clean up
Remove-Item -Recurse -Force $BACKUP_DIR
Remove-Item $TAR_FILE
Write-Host "Backup complete: $ENCRYPTED_FILE"
