# Deploying Folio

This guide puts Folio online using three free services:

```
Browser  ->  Vercel (the React website)  ->  Render (the Laravel API, in Docker)  ->  Aiven (MySQL)
```

| Part | Service | Why |
| --- | --- | --- |
| Website (`frontend/`) | Vercel | A Vite build is just static files, and Vercel serves them for free |
| API (`backend/`) | Render, as a **Docker** service | Render has no built-in PHP runtime, so a Laravel app needs a `Dockerfile` |
| Database | Aiven (MySQL) | Render's own database is PostgreSQL, and Folio uses MySQL |

**Why not InfinityFree for the API?** Free InfinityFree accounts run a JavaScript check in front of
requests. A website on another domain (your Vercel site) is blocked from calling the API with a CORS
error, and there is no terminal for `php artisan`. It only works when the website and the API share one domain.

Free plans and dashboards change. If a screen here doesn't match, check the provider's current docs.

---

## 0. Before you start

1. Make accounts on **GitHub**, **Aiven**, **Render**, and **Vercel**. Sign up for Render and Vercel with GitHub.
2. **Check that the code will build on Linux.** Windows ignores capital letters in file names and the
   servers don't, so an import like `./Field` for a file called `field.jsx` works on your computer and
   fails online. Run:

   ```bash
   cd frontend
   npm run build
   npm run check:imports

   cd ../backend
   composer dump-autoload --optimize --strict-psr
   ```

   Fix anything these report. If you ever rename a file only by changing capital letters, use
   `git mv OldName.jsx NewName.jsx`, otherwise git keeps the old spelling.
3. **Commit everything.** `git status` must NOT list `backend/.env`, `backend/vendor`, or
   `frontend/node_modules`. `composer.lock` and `package-lock.json` MUST be committed. Then `git push`.
4. **Make a production app key.** It only prints the key, and changes nothing:

   ```bash
   cd backend
   php artisan key:generate --show
   ```

   Copy the `base64:...` value. Never commit it.

---

## 1. The database (Aiven)

1. Create a **MySQL** service on Aiven's free plan. Check its current free-plan terms: it may power off when idle.
2. **Pick the region closest to where the API will run.** Folio makes several database calls for every
   request, so a database far from the API makes everything slow. Singapore is the closest to the
   Philippines. You'll pick the same region for Render in step 3.
3. Open the service's **Overview** and note the **host, port, user, password, and database name** (usually `defaultdb`).
4. Download the **CA certificate** (`ca.pem`). Aiven only accepts encrypted connections.

---

## 2. The backend files (already in the repo)

| File | What it does |
| --- | --- |
| `backend/Dockerfile` | The recipe for the server: PHP 8.3, Apache, and Laravel's packages |
| `backend/docker/entrypoint.sh` | Runs at every start: sets the port, reads settings, runs migrations (retrying if the database is asleep), starts Apache |
| `backend/.dockerignore` | Keeps `.env`, `vendor`, and logs out of the image |
| `backend/bootstrap/app.php` | Trusts Render's proxy so rate limits see each visitor's real address |
| `backend/config/cors.php` | Lets only your website call the API (reads `CORS_ALLOWED_ORIGINS`) |

Don't run `php artisan route:cache` anywhere: `routes/api.php` has closure routes, which can't be cached.

---

## 3. Deploy the API on Render

1. In Render choose **New**, then **Web Service**, and pick your repository.
2. Settings:

   | Setting | Value |
   | --- | --- |
   | Language | **Docker** |
   | Root Directory | `backend` (Render builds from inside this folder, and only redeploys when files in it change) |
   | Region | The same one as the database (Singapore, if available). It can't be changed later |
   | Instance type | Free |
   | Health Check Path | `/up` |

3. **Environment variables:**

   ```env
   APP_NAME=Folio
   APP_ENV=production
   APP_DEBUG=false
   APP_KEY=base64:...                      (from step 0)
   APP_URL=https://YOUR-SERVICE.onrender.com
   APP_TIMEZONE=Asia/Manila

   LOG_CHANNEL=stderr
   LOG_LEVEL=warning

   DB_CONNECTION=mysql
   DB_HOST=...                             (from Aiven)
   DB_PORT=...
   DB_DATABASE=defaultdb
   DB_USERNAME=...
   DB_PASSWORD=...
   MYSQL_ATTR_SSL_CA=/etc/secrets/ca.pem

   CACHE_STORE=database
   SESSION_DRIVER=array
   QUEUE_CONNECTION=sync
   CORS_ALLOWED_ORIGINS=http://localhost:5173
   ```

   `CACHE_STORE` must not be `array`: rate limits are counted in the cache, and `array` forgets everything on every request.

4. **Secret Files:** add a file named `ca.pem` with the contents of Aiven's certificate. Render makes it
   available at `/etc/secrets/ca.pem`. If your dashboard puts it somewhere else, set `MYSQL_ATTR_SSL_CA`
   to that path. As a fallback, delete the secret file and paste the certificate text into an environment
   variable called `DB_SSL_CA_PEM`. The container then writes the file itself.
5. Click **Create Web Service** and watch the logs. A healthy start shows the migrations running, then Apache starting.
   The first build takes several minutes.
6. Open `https://YOUR-SERVICE.onrender.com/up` (a page saying the app is up), then `/api/hello`
   (`{"message":"Hello from Laravel"}`).

---

## 4. Deploy the website on Vercel

1. The file `frontend/vercel.json` must exist. It makes refreshing on `/notes` or `/login` work instead of showing a 404:

   ```json
   {
     "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
   }
   ```

2. In Vercel choose **Add New**, then **Project**, and import the repository. Settings:

   | Setting | Value |
   | --- | --- |
   | Root Directory | `frontend` |
   | Framework Preset | Vite (detected automatically: build `npm run build`, output `dist`) |
   | Environment Variable | `VITE_API_URL` = `https://YOUR-SERVICE.onrender.com` (**no trailing slash**) |

3. Deploy, and note your address, such as `https://folio-xxxx.vercel.app`.

Vite bakes `VITE_API_URL` in when it builds, so after changing it you must redeploy.
If the build says Vite needs a newer Node, set the Node.js version in the project's General settings.
Vercel's free Hobby plan is meant for personal, non-commercial projects.

---

## 5. Connect the two

In Render, change `CORS_ALLOWED_ORIGINS` to your exact Vercel address: `https`, no trailing slash.
For more than one address (a custom domain, for example), separate them with commas. Saving restarts the service.

Vercel's **preview** deployments (other branches) have different addresses, so they get CORS errors
unless you add them. Test on the production address.

---

## 6. Test the live site

1. Open your Vercel address. The landing page loads. The first API request after a quiet period can take up
   to a minute, and the loading screen says so.
2. **Register** with a password that isn't a common one. In production, Laravel also rejects passwords
   found in known data breaches.
3. Create a board, add a story, drag it, then refresh. It stayed.
4. Open `/notes` directly, and refresh. No 404. Write a note, wait for **Saved**, reload, and reopen it.
5. **Download** a note. A `.txt` file arrives.
6. **Manage account**, then **Appearance**: switch to Dark and back. **Security**: the Devices list shows your
   browser (this proves the newest migration ran). Change the password, then log in with the new one.
7. Make a second account, invite it to a board, and share a note. Both notifications arrive and can be accepted.
8. Enter a wrong password six times for one email. A countdown appears (this proves rate limits work
   through Render's proxy).
9. Open the browser console (`F12`): no CORS errors.
10. In Render's **Logs**, look for red errors. There shouldn't be any.

---

## 7. Updating the live site

Push to GitHub. Both services redeploy by themselves. Render only rebuilds when files inside `backend/` change.
New migrations run automatically at the next start. Changing an environment variable redeploys that service.

---

## 8. Free-tier realities

- **The API sleeps after about 15 minutes without traffic.** The next visit waits for it to wake. Paid instances stay on.
- **No scheduler.** Free Render has no cron, so the scheduled jobs don't run: the hourly notification re-check,
  closing expired shared notes, and deleting expired login tokens. The app mostly covers for this: notifications
  re-sync whenever the bell loads, shared notes close when anyone opens them, and expired tokens simply stop working.
  Old rows just stay in the database a little longer.
- **No disk.** Files written inside the container disappear at each restart. Nothing important is stored there,
  and logs go to Render's dashboard.
- **Aiven may power off** an idle free database. The API then fails with a connection error until you turn it back on.
  The container retries for about a minute at start, which covers a normal wake-up.

---

## 9. Troubleshooting

| Problem | Fix |
| --- | --- |
| Vercel: `Could not resolve "./Something"` | A capital-letter mismatch, or a file that was never committed. Run `npm run check:imports` and `git status` |
| Render build: `does not comply with psr-4 autoloading standard` | A PHP file name doesn't match its class name, including capital letters. Rename it with `git mv` |
| Render logs: `The database did not answer after 6 tries` | Wrong `DB_*` values, or the Aiven service is off |
| Render logs: SSL or certificate errors | The `ca.pem` secret file is missing or empty, or `MYSQL_ATTR_SSL_CA` has the wrong path |
| `entrypoint.sh: not found` | The file must be exactly `backend/docker/entrypoint.sh`. (The Dockerfile already fixes Windows line endings) |
| Browser: `No 'Access-Control-Allow-Origin'` | `CORS_ALLOWED_ORIGINS` doesn't exactly match the Vercel address. Check `https` and the trailing slash |
| The site loads but every action fails | `VITE_API_URL` is missing, has a trailing slash, or was added after the build. Fix it and redeploy |
| Refreshing `/notes` gives a 404 | `frontend/vercel.json` is missing, or isn't inside `frontend/` |
| Everyone gets rate-limited together | `trustProxies` is missing from `bootstrap/app.php` |
| Login works, but pages give `500` | Open Render's Logs. The line above the error names the cause |
| Notes lose their spaces | `bootstrap/app.php` must still exclude `api/notes/*` from `trimStrings` and `convertEmptyStringsToNull` |

---

## 10. Before real users

- `APP_DEBUG` stays `false`, and the production `APP_KEY` is never committed.
- **Email verification** is still missing. Invitations and shared notes are matched by email, and nothing proves
  someone owns the address they signed up with.
- Delete the `/api/hello` route, and run `composer audit` and `npm audit` now and then.
- Check the free plans' current terms before relying on them for anything important.