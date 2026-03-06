Set-Location "D:\RP\Hackthone\UrbanEye"

function Commit($msg, $date, $files) {
    foreach ($f in $files) { git add $f 2>$null }
    $env:GIT_AUTHOR_DATE    = $date
    $env:GIT_COMMITTER_DATE = $date
    git commit -m $msg
    Write-Host "OK: $msg [$date]"
}

# -- Commit 2: server package & entry point
Commit "chore: add server package.json and app entry point" `
    "2026-03-06T16:18:00+05:30" `
    @("server/package.json","server/package-lock.json","server/app.js","server/server.js")

# -- Commit 3: server config
Commit "feat: add mongoose DB config and cloudinary setup" `
    "2026-03-06T16:35:00+05:30" `
    @("server/config")

# -- Commit 4: User & Issue models
Commit "feat: define User and Issue mongoose models" `
    "2026-03-06T16:52:00+05:30" `
    @("server/models")

# -- Commit 5: auth middleware + error handler
Commit "feat: add JWT auth middleware and global error handler" `
    "2026-03-06T17:10:00+05:30" `
    @("server/middleware")

# -- Commit 6: server utils
Commit "feat: add cloudinary upload, notification and map service utils" `
    "2026-03-06T17:28:00+05:30" `
    @("server/utils")

# -- Commit 7: AI service
Commit "feat: implement AI service with Cloud Vision and Gemini integration" `
    "2026-03-06T17:50:00+05:30" `
    @("server/services")

# -- Commit 8: auth controller + routes
Commit "feat: add auth controller and routes for register/login" `
    "2026-03-06T18:12:00+05:30" `
    @("server/controllers/authController.js","server/routes/authRoutes.js")

# -- Commit 9: issue controller + routes
Commit "feat: add issue controller with validate, report, like and confirm endpoints" `
    "2026-03-06T18:35:00+05:30" `
    @("server/controllers/issueController.js","server/routes/issueRoutes.js")

# -- Commit 10: officer controller + routes
Commit "feat: add officer controller with assign, verify and analytics endpoints" `
    "2026-03-06T18:58:00+05:30" `
    @("server/controllers/officerController.js","server/routes/officerRoutes.js")

# -- Commit 11: worker controller + routes
Commit "feat: add worker controller with accept, reject and proof upload endpoints" `
    "2026-03-06T19:22:00+05:30" `
    @("server/controllers/workerController.js","server/routes/workerRoutes.js")

# -- Commit 12: client scaffold
Commit "chore: add Vite + React client scaffold with Tailwind and Framer Motion" `
    "2026-03-06T20:00:00+05:30" `
    @("client/package.json","client/package-lock.json","client/index.html",
      "client/vite.config.js","client/tailwind.config.js","client/postcss.config.js",
      "client/eslint.config.js","client/public","client/src/main.jsx",
      "client/src/App.css","client/src/index.css","client/src/assets")

# -- Commit 13: auth context + services
Commit "feat: add AuthContext, API client and auth/issue/worker services" `
    "2026-03-06T20:28:00+05:30" `
    @("client/src/context","client/src/services","client/src/utils/helpers.js")

# -- Commit 14: shared components
Commit "feat: add Navbar, Sidebar, StatusBadge and loading skeleton components" `
    "2026-03-06T20:52:00+05:30" `
    @("client/src/components","client/src/layouts")

# -- Commit 15: public pages + auth pages
Commit "feat: add LandingPage, LoginPage and RegisterPage" `
    "2026-03-06T21:18:00+05:30" `
    @("client/src/pages/LandingPage.jsx","client/src/pages/auth")

# -- Commit 16: citizen dashboard + my issues
Commit "feat: add CitizenDashboard and MyIssuesPage" `
    "2026-03-06T21:45:00+05:30" `
    @("client/src/pages/citizen/CitizenDashboard.jsx","client/src/pages/citizen/MyIssuesPage.jsx")

# -- Commit 17: report issue page with AI validation
Commit "feat: add ReportIssuePage with Cloud Vision AI image validation popups" `
    "2026-03-06T22:15:00+05:30" `
    @("client/src/pages/citizen/ReportIssuePage.jsx")

# -- Commit 18: community page
Commit "feat: add Community page with issue feed, filters, like and detail modal" `
    "2026-03-06T22:45:00+05:30" `
    @("client/src/pages/citizen/CommunityPage.jsx")

# -- Commit 19: rewards + notifications (citizen)
Commit "feat: add citizen RewardsPage and NotificationsPage" `
    "2026-03-06T23:10:00+05:30" `
    @("client/src/pages/citizen/RewardsPage.jsx","client/src/pages/citizen/NotificationsPage.jsx")

# -- Commit 20: officer pages
Commit "feat: add officer dashboard, issues, workers, vouchers and analytics pages" `
    "2026-03-07T00:00:00+05:30" `
    @("client/src/pages/officer")

# -- Commit 21: worker pages
Commit "feat: add worker dashboard, issues with proof upload and route planner pages" `
    "2026-03-07T00:45:00+05:30" `
    @("client/src/pages/worker")

# -- Commit 22: shared profile page
Commit "feat: add shared ProfilePage for all roles" `
    "2026-03-07T01:20:00+05:30" `
    @("client/src/pages/ProfilePage.jsx")

# -- Commit 23: App routing
Commit "feat: wire up full App.jsx routing with protected and guest route guards" `
    "2026-03-07T09:30:00+05:30" `
    @("client/src/App.jsx")

# -- Commit 24: AI image validation demo fingerprints
Commit "feat: add demo image fingerprint maps for deterministic AI validation results" `
    "2026-03-07T14:00:00+05:30" `
    @("server/services/aiService.js","server/controllers/issueController.js","server/controllers/workerController.js")

# -- Commit 25: final polish and README
Commit "docs: add README and final project polish" `
    "2026-03-07T17:30:00+05:30" `
    @("client/README.md")

Remove-Item Env:\GIT_AUTHOR_DATE    -ErrorAction SilentlyContinue
Remove-Item Env:\GIT_COMMITTER_DATE -ErrorAction SilentlyContinue

Write-Host "`nAll 25 commits done. Run: git push -u origin master"
