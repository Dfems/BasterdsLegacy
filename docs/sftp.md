# SFTP a livello OS

Non integrare un server SFTP in Node. Usa OpenSSH del sistema con utente dedicato e chroot nella cartella del server.

## Linux (Debian/Ubuntu)
1) Installa OpenSSH e crea gruppo/utente:
	- `sudo apt-get install openssh-server`
	- `sudo groupadd mcserver`
	- `sudo useradd -m -G mcserver -s /usr/sbin/nologin mc`
2) Imposta chroot su `/opt/mc` (o tua `MC_DIR`) e permessi:
	- `sudo mkdir -p /opt/mc`
	- `sudo chown root:root /opt/mc`
	- `sudo chmod 755 /opt/mc`
	- `sudo mkdir -p /opt/mc/data`
	- `sudo chown mc:mcserver /opt/mc/data`
3) Configura `/etc/ssh/sshd_config` (Match block):
	- `Subsystem sftp internal-sftp`
	- `Match User mc`
	  - `ChrootDirectory /opt/mc`
	  - `ForceCommand internal-sftp`
	  - `AllowTCPForwarding no`
	  - `X11Forwarding no`
4) Riavvia sshd: `sudo systemctl restart sshd`
5) Connettiti via SFTP con utente `mc` (root visibile: `/`, scrivibile: `/data`).

## Windows
- Usa OpenSSH Server (Feature opzionale di Windows)
- Crea un utente non amministratore dedicato
- Limita l'accesso con ACL NTFS alla cartella del server (`MC_DIR`)
