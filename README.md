# Folio

**Your kanban and noting ally.** Folio combines drag-and-drop kanban boards with rich-text notes,
and lets you share both with the people you work with.

- **Boards:** four columns (BackLog, To do, In Progress, Done), drag and drop, priorities,
  categories, due dates, progress, assignees, search, and filters.
- **Sharing:** invite people to a board by email. They accept, and then can edit its stories.
- **Notes:** rich-text notes in folders, with autosave, search, and a date filter.
  Share a note, and the recipient accepts it to get their own copy.
- **Notifications:** invitations, shared notes, deadlines, and assignments.
- **Accounts:** profile, light/dark theme, password change, signed-in devices, and account deletion.

| Part     | Technology                                                                        |
| -------- | --------------------------------------------------------------------------------- |
| Backend  | Laravel 12 (PHP 8.2+), Sanctum token login, MySQL                                 |
| Frontend | React + Vite (JavaScript), Tailwind CSS v4, React Router, Tiptap, hello-pangea/dnd |

---

## 1. What you need installed

| Tool | Version | Notes |
| --- | --- | --- |
| PHP | 8.2 or newer | With the extensions `pdo_mysql`, `mbstring`, `openssl`, `fileinfo`, `zip` |
| Composer | 2.x | https://getcomposer.org |
| Node.js | A current LTS (20.19+ or 22+) | Includes `npm` |
| MySQL or MariaDB | MySQL 8 / MariaDB 10.4+ | **XAMPP** is the easiest way on Windows |
| Git | Any | |

Check your versions:

```bash
php -v
composer -V
node -v
npm -v
```

**Windows + XAMPP tips**

- Start **MySQL** in the XAMPP Control Panel. Start **Apache** only if you want phpMyAdmin
  (`http://localhost/phpmyadmin`).
- If `php -v` isn't found or is too old, add XAMPP's `php` folder (for example `C:\xampp\php`) to
  your Windows PATH, then open a **new** terminal.
- Extensions are switched on in `php.ini` (in the `php` folder) by removing the `;` in front of
  `extension=pdo_mysql`, `extension=zip`, and the others. Restart the terminal afterwards.

---

## 2. First-time setup

### Get the code

```bash
git clone <your-repository-url>
cd <project-folder>
```

### Create the database

In phpMyAdmin (or any MySQL tool), create an empty database named **`kanban_board`** with the
collation `utf8mb4_unicode_ci`. Or from a terminal:

```bash
mysql -u root -e "CREATE DATABASE kanban_board CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

### Backend

```bash
cd backend

composer install                 # download the PHP packages
cp .env.example .env             # on Windows PowerShell: Copy-Item .env.example .env
php artisan key:generate         # creates the secret APP_KEY inside .env
```

Open `backend/.env` and check these lines (XAMPP's MySQL has the user `root` with an empty password):

```env
APP_TIMEZONE=Asia/Manila

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=kanban_board
DB_USERNAME=root
DB_PASSWORD=

CACHE_STORE=database
CORS_ALLOWED_ORIGINS=http://localhost:5173
```

Then create the tables:

```bash
php artisan migrate
```

### Frontend

```bash
cd frontend
npm install
```

No `.env` file is needed locally: the app talks to `http://localhost:8000` by default.
To point it somewhere else, create `frontend/.env` with `VITE_API_URL=http://your-address`
(no trailing slash), then restart `npm run dev`.

---

## 3. Running the app locally

Open **two terminals** (three if you want the scheduler).

| Terminal | Folder | Command | Address |
| --- | --- | --- | --- |
| 1: API | `backend` | `php artisan serve` | http://localhost:8000 |
| 2: Website | `frontend` | `npm run dev` | http://localhost:5173 |
| 3: Scheduler (optional) | `backend` | `php artisan schedule:work` | |

MySQL must be running too.

Open **http://localhost:5173**, click **Get started**, and create an account. That's it.

The scheduler is optional. It re-checks notifications hourly and cleans up old data. Everything
important also happens when you use the app, so you can skip it while developing.

Stop any of these with `Ctrl+C`.

---

## 4. Handy commands

**Backend** (run in `backend`)

| Command | What it does |
| --- | --- |
| `php artisan migrate` | Apply new database changes |
| `php artisan migrate:status` | See which migrations have run |
| `php artisan route:list --path=api` | List every API route |
| `php artisan tinker` | A console to try code against your database |
| `php artisan notifications:sync` | Record any missing notifications now |
| `php artisan config:clear` | Forget cached settings (use after editing `.env`) |
| `php artisan cache:clear` | Reset rate limits and the cache |
| `composer dump-autoload` | Refresh PHP's class list after adding a file |

> **Never run `php artisan migrate:fresh` on data you care about.** It deletes every table and
> recreates them empty. It's fine for a throwaway development database.

**Frontend** (run in `frontend`)

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Build for production. It also **finds broken imports**, so run it before committing |
| `npm run lint` | Check the code for problems (it also blocks `alert`, `confirm`, and `prompt`) |
| `npm run preview` | Serve the production build locally |

---

## 5. Project layout

```
.
├── backend/                       Laravel API
│   ├── app/
│   │   ├── Console/Commands/      notifications:sync
│   │   ├── Enums/                 StoryStatus, StoryPriority, StoryCategory
│   │   ├── Http/Controllers/      one controller per area (Auth, Board, Story, Note, ...)
│   │   ├── Http/Middleware/       SecurityHeaders
│   │   ├── Models/                the database tables as PHP classes
│   │   ├── Providers/             AppServiceProvider: rate limits and password rules
│   │   ├── Services/Notifier.php  the ONLY place notifications are written
│   │   └── Support/               NoteText, NoteDocument (note content helpers)
│   ├── bootstrap/app.php          middleware and error handling setup
│   ├── config/cors.php            which websites may call the API
│   ├── database/migrations/       the database history
│   └── routes/                    api.php (all endpoints), console.php (scheduled jobs)
│
└── frontend/
    ├── public/favicon.svg
    └── src/
        ├── API/                   one file per area; each function calls one endpoint
        ├── components/            shared pieces (Modal, Field, Sidebar, account/ ...)
        ├── constants/             fixed lists (story columns, priorities)
        ├── hooks/                 reusable logic (useTheme, useDebounced, useCountdown)
        ├── pages/                 one folder per screen
        │   ├── homepage/          the app shell, boards, and their windows
        │   ├── notes/             the notes screen
        │   ├── landingpage/       the public landing page
        │   ├── loginpage/  registerpage/
        ├── utils/                 small pure helpers (dates, filters, text)
        ├── App.jsx                routes and the signed-in user
        ├── index.css              Tailwind setup, colors, dark mode
        └── main.jsx               starts React
```

---

## 6. How the code is organized (for new developers)

### The path of a request

```
Component  ->  src/API/story.js  ->  src/API/api.js  ->  Laravel route  ->  Controller  ->  Model  ->  MySQL
 (screen)      (one function per     (adds the login      (routes/api.php)   (checks &       (table)
                endpoint)             token, handles
                                      errors)
```

- **Components never call `fetch` directly.** They call a function from `src/API/`.
- `api()` in `src/API/api.js` throws an error with `.status` and `.errors` when the server says no.
  A component catches it and shows the message. `parseError(err)` turns it into form-friendly pieces.
- The server **validates everything again**. Never trust the browser alone.

### Conventions

- **Files** that contain JSX end in `.jsx`. Plain logic ends in `.js`.
- **Components** are `PascalCase.jsx`. Hooks start with `use` (`useTheme.js`).
- **Windows (modals)** use `components/Modal.jsx` and its `ModalHeader`. It gives you the backdrop,
  Escape key, focus handling, and accessibility for free. See `RenameBoardModal.jsx` for a short example.
- **Never use `alert()`, `confirm()`, or `prompt()`.** Lint blocks them. Use `ConfirmModal`
  for yes/no questions.
- **Lists that appear in several places** go in `constants/`. The story columns and priorities are
  in `constants/stories.js`. Change them in one place.
- **Keep components small.** If a component grows past a few hundred lines, move its data logic into a
  hook (see `pages/homepage/useBoards.js`) or split out a child component.
- **Comments explain WHY**, not what. Write them for the next person who has never seen the file.

### Colors and dark mode

Colors are named by their job, in `src/index.css`:

| Use | Class |
| --- | --- |
| Page background | `bg-canvas` |
| Cards, inputs, menus | `bg-surface` |
| Backdrop behind a window | `bg-scrim` |
| Tooltip bubble | `bg-tooltip` |
| Text | `text-slate-900` (strongest) down to `text-slate-400` (faintest) |
| Accent | `text-brand`, `bg-brand`, `bg-brand-soft`, `border-brand-muted` |

Dark mode swaps the values of these variables inside `.dark`, so **most components need no dark
styles at all**. Rules:

1. Use the names above. Do **not** use `bg-white` or `bg-slate-900` for backgrounds inside the app.
2. `text-white` is fine on colored buttons: it stays white in both themes.
3. A new color that must follow the theme: define its light value in `@theme` and its dark value in
   the `.dark` block at the bottom of `index.css`.
4. The theme choice is saved in the browser (`hooks/useTheme.js`). Light/Dark/System is picked in
   **Manage account, Appearance**. The landing, login, and register pages stay light.

### Adding a feature: a recipe

1. **Database:** `php artisan make:migration ...` (add a column or table), then `php artisan migrate`.
2. **Backend:** update the model (`$fillable`, `$casts`), add or extend a controller method that
   **validates its input**, and register the route in `routes/api.php`.
3. **API function:** add a small function in the matching file in `frontend/src/API/`.
4. **Screen:** build the component, call the API function, and show loading and error states.
5. **Check:** run `npm run build` and `npm run lint`, then try it in the browser.

### Window events

Components that don't know each other talk through browser events:

| Event | Meaning | Listened to by |
| --- | --- | --- |
| `stories-changed` | A story was added, edited, moved, or deleted | The notification bell |
| `notifications-changed` | The notification list changed | The notification bell |
| `notes-changed` | A shared note was saved to this account | The notes page |
| `auth-expired` | The saved login stopped working | `App.jsx` (sends you to log in) |

---

## 7. Troubleshooting

| Problem | Fix |
| --- | --- |
| `could not find driver` | Enable `extension=pdo_mysql` in `php.ini`, then reopen the terminal |
| `composer install` says the zip extension is missing | Enable `extension=zip` in `php.ini` |
| `Connection refused` or `SQLSTATE[HY000] [2002]` | MySQL isn't running. Start it in XAMPP |
| `Access denied for user 'root'` | Put your MySQL password in `DB_PASSWORD` in `backend/.env`, then `php artisan config:clear` |
| `Unknown database 'kanban_board'` | Create the database (section 2) |
| Port 3306, 8000, or 5173 already in use | Stop the other program, or choose another port |
| `Table ... doesn't exist` or `Unknown column` | Run `php artisan migrate` |
| Red CORS error in the browser console | `CORS_ALLOWED_ORIGINS` in `backend/.env` must match the address of the website exactly. Then `php artisan config:clear` and restart `php artisan serve` |
| `Too many requests` while testing | `php artisan cache:clear` resets the rate limits |
| `Failed to resolve import` (red screen) | A file is missing or its name is misspelled. `npm run build` lists every broken import |
| `JSX syntax is disabled` | A file that contains JSX is named `.js`. Rename it to `.jsx` |
| `Class "App\..." not found` | The PHP file is in the wrong folder or has a typo. Then `composer dump-autoload` |
| Notes lose spaces after saving | Check `bootstrap/app.php` still excludes `api/notes/*` from `trimStrings` and `convertEmptyStringsToNull` |
| `Invalid default value for ...` on a migration | MariaDB (XAMPP) is strict. Use `$table->dateTime(...)` instead of `timestamp(...)` for required date columns |
| `route:cache` fails | Routes with closures can't be cached. Don't use `route:cache` here |
| Signed out for no reason, or stuck on a loading screen | Open DevTools, **Application**, **Local Storage**, and delete the `token` entry |
| Part of the app is still white in dark mode | Search for `bg-white` or `bg-slate-900` in that file and use `bg-surface` / `bg-scrim` instead |

---

## 8. Deploying

The frontend is a static Vite build (good for Vercel). The backend needs PHP, so it runs in a
Docker container (for example on Render) with an external MySQL database. Production
needs: `APP_ENV=production`, `APP_DEBUG=false`, a real `APP_KEY`, `CORS_ALLOWED_ORIGINS` set to the
website's exact address, and `VITE_API_URL` set on the frontend host.