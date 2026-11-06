#!/bin/sh
set -e

# Render says which port to listen on (10000 by default)
PORT="${PORT:-10000}"
sed -ri "s/Listen 80/Listen ${PORT}/" /etc/apache2/ports.conf
sed -ri "s/<VirtualHost \*:80>/<VirtualHost *:${PORT}>/" /etc/apache2/sites-available/000-default.conf

cd /var/www/html

# read the settings once, then bring the database up to date
php artisan config:cache
php artisan migrate --force

chown -R www-data:www-data storage bootstrap/cache

exec apache2-foreground