#!/bin/sh
set -e

# Render says which port to listen on (10000 by default)
PORT="${PORT:-10000}"
sed -ri "s/Listen 80/Listen ${PORT}/" /etc/apache2/ports.conf
sed -ri "s/<VirtualHost \*:80>/<VirtualHost *:${PORT}>/" /etc/apache2/sites-available/000-default.conf

cd /var/www/html

# make the CA readable by www-data (Apache runs as www-data)
mkdir -p /var/www/certs
cp /etc/secrets/ca.pem /var/www/certs/ca.pem
chown www-data:www-data /var/www/certs/ca.pem
chmod 640 /var/www/certs/ca.pem
export MYSQL_ATTR_SSL_CA=/var/www/certs/ca.pem

# diagnostics (shows in Render logs)
ls -la /etc/secrets/
head -n 1 /var/www/certs/ca.pem
tail -n 1 /var/www/certs/ca.pem
su -s /bin/sh www-data -c 'test -r /var/www/certs/ca.pem && echo CA_READABLE || echo CA_NOT_READABLE'

# read the settings once, then bring the database up to date
php artisan config:clear
php artisan config:cache
php artisan migrate --force

chown -R www-data:www-data storage bootstrap/cache

exec apache2-foreground