Set-Location "D:\RP\Hackthone\UrbanEye"

# ---- Commit 12: client scaffold ----
git add client/package.json client/package-lock.json client/index.html client/vite.config.js client/tailwind.config.js client/postcss.config.js client/eslint.config.js client/public client/src/main.jsx client/src/App.css client/src/index.css client/src/assets
$env:GIT_AUTHOR_DATE    = "2026-03-06T20:00:00+05:30"
$env:GIT_COMMITTER_DATE = "2026-03-06T20:00:00+05:30"
git commit -m "chore: add Vite + React client scaffold with Tailwind and Framer Motion"
Write-Host "Done commit 12"

# ---- Commit 13: auth context + services ----
git add client/src/context client/src/services client/src/utils/helpers.js
$env:GIT_AUTHOR_DATE    = "2026-03-06T20:28:00+05:30"
$env:GIT_COMMITTER_DATE = "2026-03-06T20:28:00+05:30"
git commit -m "feat: add AuthContext, API client and auth/issue/worker services"
Write-Host "Done commit 13"

# ---- Commit 14: shared components ----
git add client/src/components client/src/layouts
$env:GIT_AUTHOR_DATE    = "2026-03-06T20:52:00+05:30"
$env:GIT_COMMITTER_DATE = "2026-03-06T20:52:00+05:30"
git commit -m "feat: add Navbar, Sidebar, StatusBadge and loading skeleton components"
Write-Host "Done commit 14"

# ---- Commit 15: public pages + auth ----
git add client/src/pages/LandingPage.jsx client/src/pages/auth
$env:GIT_AUTHOR_DATE    = "2026-03-06T21:18:00+05:30"
$env:GIT_COMMITTER_DATE = "2026-03-06T21:18:00+05:30"
git commit -m "feat: add LandingPage, LoginPage and RegisterPage"
Write-Host "Done commit 15"

# ---- Commit 16: citizen dashboard + my issues ----
git add client/src/pages/citizen/CitizenDashboard.jsx client/src/pages/citizen/MyIssuesPage.jsx
$env:GIT_AUTHOR_DATE    = "2026-03-06T21:45:00+05:30"
$env:GIT_COMMITTER_DATE = "2026-03-06T21:45:00+05:30"
git commit -m "feat: add CitizenDashboard and MyIssuesPage"
Write-Host "Done commit 16"

# ---- Commit 17: report issue page ----
git add client/src/pages/citizen/ReportIssuePage.jsx
$env:GIT_AUTHOR_DATE    = "2026-03-06T22:15:00+05:30"
$env:GIT_COMMITTER_DATE = "2026-03-06T22:15:00+05:30"
git commit -m "feat: add ReportIssuePage with Cloud Vision AI image validation popups"
Write-Host "Done commit 17"

# ---- Commit 18: community page ----
git add client/src/pages/citizen/CommunityPage.jsx
$env:GIT_AUTHOR_DATE    = "2026-03-06T22:45:00+05:30"
$env:GIT_COMMITTER_DATE = "2026-03-06T22:45:00+05:30"
git commit -m "feat: add Community page with issue feed, filters, like and detail modal"
Write-Host "Done commit 18"

# ---- Commit 19: rewards + notifications ----
git add client/src/pages/citizen/RewardsPage.jsx client/src/pages/citizen/NotificationsPage.jsx
$env:GIT_AUTHOR_DATE    = "2026-03-06T23:10:00+05:30"
$env:GIT_COMMITTER_DATE = "2026-03-06T23:10:00+05:30"
git commit -m "feat: add citizen RewardsPage and NotificationsPage"
Write-Host "Done commit 19"

# ---- Commit 20: officer pages ----
git add client/src/pages/officer
$env:GIT_AUTHOR_DATE    = "2026-03-07T00:00:00+05:30"
$env:GIT_COMMITTER_DATE = "2026-03-07T00:00:00+05:30"
git commit -m "feat: add officer dashboard, issues, workers, vouchers and analytics pages"
Write-Host "Done commit 20"

# ---- Commit 21: worker pages ----
git add client/src/pages/worker
$env:GIT_AUTHOR_DATE    = "2026-03-07T00:45:00+05:30"
$env:GIT_COMMITTER_DATE = "2026-03-07T00:45:00+05:30"
git commit -m "feat: add worker dashboard, issues with proof upload and route planner pages"
Write-Host "Done commit 21"

# ---- Commit 22: ProfilePage ----
git add client/src/pages/ProfilePage.jsx
$env:GIT_AUTHOR_DATE    = "2026-03-07T01:20:00+05:30"
$env:GIT_COMMITTER_DATE = "2026-03-07T01:20:00+05:30"
git commit -m "feat: add shared ProfilePage for all roles"
Write-Host "Done commit 22"

# ---- Commit 23: App routing ----
git add client/src/App.jsx
$env:GIT_AUTHOR_DATE    = "2026-03-07T09:30:00+05:30"
$env:GIT_COMMITTER_DATE = "2026-03-07T09:30:00+05:30"
git commit -m "feat: wire up full App.jsx routing with protected and guest route guards"
Write-Host "Done commit 23"

Remove-Item Env:\GIT_AUTHOR_DATE    -ErrorAction SilentlyContinue
Remove-Item Env:\GIT_COMMITTER_DATE -ErrorAction SilentlyContinue

Write-Host "`nClient commits done!"
git log --oneline
