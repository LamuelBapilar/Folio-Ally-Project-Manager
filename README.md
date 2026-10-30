# Folio Ally Project Manager

A web app for managing your team's projects. Create boards, organise work as story cards on a Kanban-style board, drag cards between columns, assign people, set priorities and due dates, share boards with teammates by invitation, and get notified about invites and deadlines.

---

## Table of Contents

1. [Features](#features)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Prerequisites](#prerequisites)
5. [Local Setup with XAMPP (MySQL)](#local-setup-with-xampp-mysql)
6. [Environment Variables](#environment-variables)
7. [Deploying to a Server (Production)](#deploying-to-a-server-production)
8. [Scheduled Tasks](#scheduled-tasks)
9. [API Overview](#api-overview)
10. [Security Notes](#security-notes)
11. [Troubleshooting](#troubleshooting)

---

## Features

- **Authentication**: register, login and logout with Laravel Sanctum bearer tokens (tokens last 7 days; max 5 logged-in devices per user).
- **Boards**: create, rename and delete boards, and switch between them.
- **Stories (cards)**: title, description, status, priority, category, due date, progress and assignee.
  - Status columns: `backlog`, `todo`, `in_progress`, `done`
  - Priority: `low`, `medium`, `high`
  - Category: `bug`, `feature`, `improvement`, `task`, `design`, `research`, `docs`
- **Drag and drop**: reorder cards and move them between columns.
- **Filtering** of stories on a board.
- **Sharing**: invite teammates by email; they can accept or decline. Owners can cancel invitations and remove members.
- **Notifications**: invitations, plus stories due tomorrow, due today or overdue.
- **Rate limiting** on every API route, and account lockout after repeated failed logins.

## Tech Stack

| Layer    | Technology                                                                 |
|----------|----------------------------------------------------------------------------|
| Frontend | React 19, Vite, React Router 7, Tailwind CSS 4, `@hello-pangea/dnd`, lucide-react |
| Backend  | PHP 8.2+, Laravel 12, Laravel Sanctum                                      |
| Database | MySQL / MariaDB (via XAMPP)                                                |

The frontend and backend are two separate apps. The React app calls the Laravel REST API at `<API_URL>/api/...`.

## Project Structure

```
Folio-Ally-Project-Manager/
├── backend/                         # Laravel 12 REST API
│   ├── app/
│   │   ├── Console/Commands/
│   │   │   └── SyncNotifications.php    # `php artisan notifications:sync`
│   │   ├── Enums/                       # StoryStatus, StoryPriority, StoryCategory
│   │   ├── Http/
│   │   │   ├── Controllers/             # Auth, Board, Story, BoardMember,
│   │   │   │                            # Invitation, Notification
│   │   │   └── Middleware/SecurityHeaders.php
│   │   ├── Models/                      # User, Board, Story, BoardInvitation,
│   │   │                                # UserNotification
│   │   ├── Providers/AppServiceProvider.php   # password rules + rate limiters
│   │   └── Services/Notifier.php        # builds invitation/deadline notifications
│   ├── bootstrap/app.php                # routing, middleware, JSON error handling
│   ├── config/                          # cors.php, sanctum.php, database.php, ...
│   ├── database/
│   │   ├── migrations/                  # all table definitions
│   │   ├── factories/UserFactory.php
│   │   └── seeders/DatabaseSeeder.php   # creates test@example.com
│   ├── public/                          # web root (index.php, .htaccess)
│   ├── routes/
│   │   ├── api.php                      # all API endpoints
│   │   └── console.php                  # scheduled tasks
│   ├── tests/
│   ├── .env.example
│   ├── composer.json
│   └── testapi.http                     # sample API requests (REST Client)
│
├── frontend/                        # React + Vite single-page app
│   ├── public/
│   ├── src/
│   │   ├── API/                         # api.js (fetch wrapper), login, table,
│   │   │                                # story, members, notification
│   │   ├── components/                  # Field, AuthLayout
│   │   ├── hooks/useCountdown.js
│   │   ├── pages/
│   │   │   ├── landingpage/
│   │   │   ├── loginpage/
│   │   │   ├── registerpage/
│   │   │   └── homepage/                # the board UI
│   │   │       └── components/          # Board, Column, StoryCard, modals,
│   │   │                                # NotificationBell, FilterMenu, ...
│   │   ├── utils/                       # categories, filters, due dates, time
│   │   ├── App.jsx                      # routes + auth state
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
└── README.md
```

## Prerequisites

Install these first:

| Tool        | Version                | Notes |
|-------------|------------------------|-------|
| **XAMPP**   | Ships **PHP 8.2 or newer** | Laravel 12 will not run on PHP 8.1 or older. Check with `C:\xampp\php\php.exe -v`. If older, download a newer XAMPP. |
| **Composer**| 2.x                    | <https://getcomposer.org/download/> |
| **Node.js** | 20.19+ (22 LTS recommended) | Needed for the Vite frontend. <https://nodejs.org> |
| **Git**     | any                    | To clone the repo. |

> **Tip (Windows):** add `C:\xampp\php` to your system `PATH` so `php` and `composer` use XAMPP's PHP. Open a new terminal afterwards and confirm with `php -v`.

---

## Local Setup with XAMPP (MySQL)

In this setup XAMPP provides **MySQL**. The Laravel API runs with `php artisan serve` on port 8000 and the React app runs with Vite on port 5173. (Serving through Apache instead is covered under [Production](#deploying-to-a-server-production).)

### 1. Clone the repository

```bash
git clone https://github.com/LamuelBapilar/Folio-Ally-Project-Manager.git
cd Folio-Ally-Project-Manager
```

### 2. Start MySQL in XAMPP

1. Open the **XAMPP Control Panel**.
2. Click **Start** next to **MySQL**. (Apache is optional here.)
3. If MySQL won't start, port 3306 is probably in use. See [Troubleshooting](#troubleshooting).

### 3. Create the database

1. Open <http://localhost/phpmyadmin> (needs Apache running), **or** use the **Shell** button in XAMPP and run `mysql -u root`.
2. Create the database:

   **phpMyAdmin:** *New* → name `kanban_board` → collation `utf8mb4_unicode_ci` → *Create*.

   **SQL:**
   ```sql
   CREATE DATABASE kanban_board CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

### 4. Set up the backend

```bash
cd backend
composer install
copy .env.example .env        # Windows (use `cp` on macOS/Linux)
php artisan key:generate
```

Open `backend/.env` and make these changes. The example file defaults to SQLite, so you **must** switch it to MySQL:

```env
APP_URL=http://localhost:8000

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=kanban_board
DB_USERNAME=root
DB_PASSWORD=

# Frontend origin(s) allowed to call the API (comma-separated)
CORS_ALLOWED_ORIGINS=http://localhost:5173
```

> XAMPP's default MySQL user is `root` with an **empty** password. If you set a password, put it in `DB_PASSWORD`.
>
> A complete, ready-to-copy `.env` is in [Environment Variables](#environment-variables) below.

Create the tables:

```bash
php artisan migrate
```

Optionally create a demo account (`test@example.com` / `password`):

```bash
php artisan db:seed
```

Start the API:

```bash
php artisan serve
```

Check it at <http://localhost:8000/api/hello>. You should see `{"message":"Hello from Laravel"}`. Leave this terminal running.

### 5. Set up the frontend

Open a **second terminal**:

```bash
cd frontend
npm install
```

Create `frontend/.env`. This step is optional locally because it defaults to `http://localhost:8000`, but it is good practice:

```env
VITE_API_URL=http://localhost:8000
```

Start the dev server:

```bash
npm run dev
```

Open <http://localhost:5173>, register an account and start creating boards.

### 6. (Optional) Run scheduled notifications locally

Deadline and invitation notifications are synced hourly by Laravel's scheduler. During development, run this in a third terminal:

```bash
cd backend
php artisan schedule:work
```

Or sync once by hand:

```bash
php artisan notifications:sync
```

### Quick-start cheat sheet

| Terminal | Folder      | Command                    |
|----------|-------------|----------------------------|
| XAMPP    | n/a         | Start **MySQL**            |
| 1        | `backend/`  | `php artisan serve`        |
| 2        | `frontend/` | `npm run dev`              |
| 3 (opt.) | `backend/`  | `php artisan schedule:work`|

---

## Environment Variables

### Backend (`backend/.env`)

| Variable               | Example                        | Purpose |
|------------------------|--------------------------------|---------|
| `APP_ENV`              | `local` / `production`         | Environment name. |
| `APP_DEBUG`            | `true` / `false`               | **Must be `false` in production.** |
| `APP_KEY`              | *(generated)*                  | Run `php artisan key:generate`. |
| `APP_URL`              | `http://localhost:8000`        | Public URL of the API. |
| `APP_TIMEZONE`         | `Asia/Manila`                  | Timezone used for due dates and deadline notifications. Requires the one-line change in [Timezone setup](#timezone-setup). |
| `DB_CONNECTION`        | `mysql`                        | Use `mysql` for XAMPP. |
| `DB_HOST` / `DB_PORT`  | `127.0.0.1` / `3306`           | MySQL host and port. |
| `DB_DATABASE`          | `kanban_board`                   | Database name. |
| `DB_USERNAME` / `DB_PASSWORD` | `root` / *(empty)*      | Database credentials. |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:5173`        | Comma-separated frontend origins allowed to call the API. |
| `SESSION_DRIVER`, `CACHE_STORE`, `QUEUE_CONNECTION` | `database` | Already set in `.env.example`; their tables come from the migrations. |

### Full `backend/.env` example (XAMPP / local)

Copy `backend/.env.example` to `backend/.env`, then make sure your file looks like this. Leave `APP_KEY` empty and let `php artisan key:generate` fill it in. **Never share or reuse a real `APP_KEY`.**

```properties
APP_NAME="Folio Ally"
APP_ENV=local
APP_KEY=
APP_DEBUG=true
APP_URL=http://localhost:8000

APP_LOCALE=en
APP_FALLBACK_LOCALE=en
APP_FAKER_LOCALE=en_US
APP_TIMEZONE=Asia/Manila

# Frontend origin(s) allowed to call the API (comma-separated, no trailing slash)
CORS_ALLOWED_ORIGINS=http://localhost:5173

APP_MAINTENANCE_DRIVER=file
# APP_MAINTENANCE_STORE=database

# PHP_CLI_SERVER_WORKERS=4

BCRYPT_ROUNDS=12

LOG_CHANNEL=stack
LOG_STACK=single
LOG_DEPRECATIONS_CHANNEL=null
LOG_LEVEL=debug

## SQL DB Connection (XAMPP MySQL)
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=kanban_board
DB_USERNAME=root
DB_PASSWORD=

SESSION_DRIVER=database
SESSION_LIFETIME=120
SESSION_ENCRYPT=false
SESSION_PATH=/
SESSION_DOMAIN=null

BROADCAST_CONNECTION=log
FILESYSTEM_DISK=local
QUEUE_CONNECTION=database

CACHE_STORE=database
# CACHE_PREFIX=

MEMCACHED_HOST=127.0.0.1

REDIS_CLIENT=phpredis
REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379

MAIL_MAILER=log
MAIL_SCHEME=null
MAIL_HOST=127.0.0.1
MAIL_PORT=2525
MAIL_USERNAME=null
MAIL_PASSWORD=null
MAIL_FROM_ADDRESS="hello@example.com"
MAIL_FROM_NAME="${APP_NAME}"

AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_DEFAULT_REGION=us-east-1
AWS_BUCKET=
AWS_USE_PATH_STYLE_ENDPOINT=false

VITE_APP_NAME="${APP_NAME}"
```

> Only the `DB_*`, `CORS_ALLOWED_ORIGINS`, `APP_URL` and `APP_TIMEZONE` values usually need changing. Everything else can stay as shown. Mail is set to `log`, so no email is actually sent; messages are written to `storage/logs/laravel.log`.

### Timezone setup

Deadline notifications ("due today", "due tomorrow", "overdue") are calculated using the app's timezone. In `backend/config/app.php`, the timezone is hardcoded to UTC, so `APP_TIMEZONE` is ignored until you change this line:

```php
// backend/config/app.php
'timezone' => env('APP_TIMEZONE', 'UTC'),
```

Then clear the config cache:

```bash
php artisan config:clear
```

### Frontend (`frontend/.env`)

| Variable        | Example                 | Purpose |
|-----------------|-------------------------|---------|
| `VITE_API_URL`  | `http://localhost:8000` | Base URL of the Laravel API **without** `/api` and without a trailing slash. Baked in at build time. |

---

## Deploying to a Server (Production)

The frontend builds to static files and the backend is a standard Laravel app, so you can host them on one machine (for example a VPS or Windows server running XAMPP) or on separate hosts.

### Checklist

- [ ] PHP 8.2+ with extensions: `pdo_mysql`, `mbstring`, `openssl`, `tokenizer`, `xml`, `ctype`, `fileinfo`, `json`
- [ ] MySQL database and user created
- [ ] Composer and Node.js available to build (the server doesn't need Node afterwards)
- [ ] HTTPS enabled (required because the app uses bearer tokens)

### Step 1: Backend

```bash
cd backend
composer install --no-dev --optimize-autoloader
cp .env.example .env
php artisan key:generate
```

Edit `backend/.env` for production:

```env
APP_ENV=production
APP_DEBUG=false
APP_URL=https://api.yourdomain.com

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=kanban_board
DB_USERNAME=folio_user
DB_PASSWORD=use-a-strong-password

CORS_ALLOWED_ORIGINS=https://app.yourdomain.com
```

> In production the app also rejects passwords found in known data breaches, so the server needs outbound internet access for registration to work.

Then run:

```bash
php artisan migrate --force
php artisan config:cache
php artisan route:cache
```

Make sure `storage/` and `bootstrap/cache/` are writable by the web server user.

### Step 2: Serve the backend

**Apache (XAMPP):** point a virtual host at the **`backend/public`** folder, never the project root.

Example `C:\xampp\apache\conf\extra\httpd-vhosts.conf`:

```apache
<VirtualHost *:80>
    ServerName api.folioally.local
    DocumentRoot "C:/xampp/htdocs/Folio-Ally-Project-Manager/backend/public"

    <Directory "C:/xampp/htdocs/Folio-Ally-Project-Manager/backend/public">
        AllowOverride All
        Require all granted
    </Directory>
</VirtualHost>
```

Make sure `mod_rewrite` is enabled (it is by default in XAMPP). The included `public/.htaccess` handles URL rewriting. Add `127.0.0.1 api.folioally.local` to your `hosts` file for local testing, then restart Apache.

**Nginx:** use the standard Laravel configuration with `root /path/to/backend/public;` and `try_files $uri $uri/ /index.php?$query_string;`.

### Step 3: Build the frontend

Set the API address, then build. `VITE_API_URL` is read **at build time**, so rebuild whenever it changes.

```bash
cd frontend
npm install
echo VITE_API_URL=https://api.yourdomain.com > .env.production
npm run build
```

This creates `frontend/dist/`.

### Step 4: Serve the frontend

Upload or copy the contents of `frontend/dist/` to your web root (for example `C:\xampp\htdocs\folio-ally\` or `/var/www/folio-ally/`).

Because the app uses client-side routing (React Router), direct visits to `/login` or `/register` must fall back to `index.html`.

**Apache**: add this `.htaccess` next to `index.html`:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

**Nginx**: use `try_files $uri /index.html;`.

Finally, make sure `CORS_ALLOWED_ORIGINS` in the backend `.env` exactly matches the URL the frontend is served from, including `https://` and with no trailing slash. After changing it, run `php artisan config:cache` again.

### Step 5: Enable the scheduler

See [Scheduled Tasks](#scheduled-tasks) below. Without it, deadline notifications and expired-token cleanup won't run automatically.

### Updating a deployed install

```bash
git pull
cd backend
composer install --no-dev --optimize-autoloader
php artisan migrate --force
php artisan config:cache && php artisan route:cache

cd ../frontend
npm install
npm run build        # then re-upload dist/
```

---

## Scheduled Tasks

`backend/routes/console.php` registers two jobs:

| Job | Frequency | What it does |
|-----|-----------|--------------|
| `notifications:sync` | Hourly | Records missing invitation and due-date notifications for every user. |
| `prune-expired-tokens` | Daily | Deletes login tokens that expired more than a day ago. |

Laravel needs its scheduler triggered **every minute**:

- **Linux:** add this cron entry (`crontab -e`):
  ```
  * * * * * cd /path/to/backend && php artisan schedule:run >> /dev/null 2>&1
  ```
- **Windows / XAMPP:** create a Task Scheduler task that repeats every minute and runs:
  ```
  C:\xampp\php\php.exe C:\xampp\htdocs\Folio-Ally-Project-Manager\backend\artisan schedule:run
  ```
- **Development:** `php artisan schedule:work`

## API Overview

Base URL: `<API_URL>/api`. Everything except `/hello`, `/register` and `/login` requires the header `Authorization: Bearer <token>`.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/hello` | Health check |
| POST | `/register` | Create an account (returns user and token) |
| POST | `/login` | Log in (returns user and token) |
| POST | `/logout` | Revoke the current token |
| GET | `/user` | Current user |
| GET / POST | `/boards` | List / create boards |
| GET / PUT / PATCH / DELETE | `/boards/{board}` | Show / update / delete a board |
| GET / POST | `/boards/{board}/stories` | List / create stories |
| PUT | `/boards/{board}/stories/reorder` | Reorder / move stories |
| PATCH / DELETE | `/stories/{story}` | Update / delete a story |
| GET | `/boards/{board}/members` | List board members |
| POST | `/boards/{board}/invitations` | Invite someone by email |
| DELETE | `/boards/{board}/invitations/{invitation}` | Cancel an invitation |
| DELETE | `/boards/{board}/members/{user}` | Remove a member |
| GET | `/invitations/{invitation}` | View an invitation sent to you |
| POST | `/invitations/{invitation}/accept` | Accept an invitation |
| POST | `/invitations/{invitation}/decline` | Decline an invitation |
| GET | `/notifications` | List notifications |
| POST | `/notifications/read` | Mark notifications as read |

`backend/testapi.http` contains ready-made sample requests (use the VS Code *REST Client* extension).

## Security Notes

- Passwords must be at least 8 characters with upper and lower case letters and a number.
- Login attempts are throttled (5 failures per email and IP, then a 5-minute lockout).
- API routes are rate limited (login, register, writes, creates, invites, notifications).
- Responses include `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy` and `Cache-Control: no-store` headers.
- Never commit `.env` files or real tokens. Keep `APP_DEBUG=false` in production.

## Troubleshooting

| Problem | Fix |
|---------|-----|
| **"Cannot reach the server. Is Laravel running?"** in the browser | The API isn't running, or `VITE_API_URL` is wrong. Open `<API_URL>/api/hello` directly. After changing `.env`, restart `npm run dev` (or rebuild). |
| **CORS error** in the browser console | `CORS_ALLOWED_ORIGINS` must exactly match the frontend URL (scheme, host and port, no trailing slash). Run `php artisan config:clear`. |
| **`could not find driver`** | Enable `extension=pdo_mysql` in `C:\xampp\php\php.ini`, then restart the terminal. |
| **`SQLSTATE[HY000] [1049] Unknown database`** | Create the `kanban_board` database first (step 3) and check `DB_DATABASE`. |
| **`SQLSTATE[HY000] [1045] Access denied`** | Wrong `DB_USERNAME` / `DB_PASSWORD`. XAMPP's default is `root` with an empty password. |
| **`SQLSTATE[HY000] [2002] Connection refused`** | MySQL isn't running in XAMPP, or `DB_PORT` doesn't match (check the port shown in the XAMPP panel). |
| **MySQL won't start in XAMPP** | Port 3306 is in use. Stop any other MySQL service, or change the port in `my.ini` and in `DB_PORT`. |
| **Composer says PHP version doesn't satisfy `^8.2`** | Your XAMPP PHP is too old, or the wrong `php` is first on your `PATH`. Run `php -v`. |
| **`No application encryption key has been specified`** | Run `php artisan key:generate`. |
| **Cache / sessions / rate-limit table not found** | Run `php artisan migrate`; those drivers use database tables. |
| **500 error in production** | Check `backend/storage/logs/laravel.log` and folder permissions on `storage/` and `bootstrap/cache/`. |
| **404 when refreshing `/login` in production** | Add the SPA rewrite rule (see Step 4). |
| **Frontend still calls the old API URL** | `VITE_API_URL` is baked in at build time. Rebuild with `npm run build`. |
| **Changed `.env` but nothing happens in production** | Run `php artisan config:cache` again (or `php artisan config:clear`). |

## License

No license has been specified yet. Add a `LICENSE` file if you intend to share this project publicly.