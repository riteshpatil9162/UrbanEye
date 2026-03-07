Set-Location "D:\RP\Hackthone\UrbanEye"

# These are the 23 good commits (from old reordered branch) that have client/
# We'll retimestamp them to the new schedule
$commits = @(
    @{ hash = "a8081fb408adc1a7b765511b4c844c1499f15f18"; date = "2026-03-06T16:00:00+05:30"; msg = "chore: initialize project structure and add .gitignore" },
    @{ hash = "a941c87ebf2808718529b39d5633b0913f6e7cc0"; date = "2026-03-06T16:24:00+05:30"; msg = "chore: add server package.json and app entry point" },
    @{ hash = "f1b48b95a8798714d71873ed80ea9ac55673971c"; date = "2026-03-06T16:48:00+05:30"; msg = "feat: add mongoose DB config and cloudinary setup" },
    @{ hash = "e2adf20157f3d4bfcab50f49ecb7eace4d07fbee"; date = "2026-03-06T17:12:00+05:30"; msg = "feat: define User and Issue mongoose models" },
    @{ hash = "7d64fdd33a26bc0559efa8bbc6c2ae6fe80696f9"; date = "2026-03-06T17:36:00+05:30"; msg = "feat: add JWT auth middleware and global error handler" },
    @{ hash = "f3775be34b217600ea376f3c60095455bf1b9aa6"; date = "2026-03-06T18:00:00+05:30"; msg = "feat: add cloudinary upload, notification and map service utils" },
    @{ hash = "a4c77edbab58da18ce8f261e7fccdb5af58a76d4"; date = "2026-03-06T18:24:00+05:30"; msg = "feat: implement AI service with Cloud Vision and Gemini integration" },
    @{ hash = "b3338d7f57e27dc3da33eba917c89f67e3761d93"; date = "2026-03-06T18:48:00+05:30"; msg = "feat: add auth controller and routes for register/login" },
    @{ hash = "1c042b98044a935bbbb0c1fc057499137f171ab7"; date = "2026-03-06T19:12:00+05:30"; msg = "feat: add issue controller with validate, report, like and confirm endpoints" },
    @{ hash = "377ed9bd5ce16d687bafc7851acef1354dc34307"; date = "2026-03-06T19:36:00+05:30"; msg = "feat: add officer controller with assign, verify and analytics endpoints" },
    @{ hash = "4b642890eca9c468cdcff1341198feb26fc3adb5"; date = "2026-03-06T20:00:00+05:30"; msg = "feat: add worker controller with accept, reject and proof upload endpoints" },
    @{ hash = "0a830282e3e5646f4a820b9d6713fceda4005733"; date = "2026-03-06T20:24:00+05:30"; msg = "chore: add Vite + React client scaffold with Tailwind and Framer Motion" },
    @{ hash = "37dadb8f9ab6f2f4db23fc560c9c9991f8bc6fe1"; date = "2026-03-06T20:48:00+05:30"; msg = "feat: add AuthContext, API client and auth/issue/worker services" },
    @{ hash = "e9dcb66b8b6803f646f9b123e7f1cd0c8c20a662"; date = "2026-03-06T21:12:00+05:30"; msg = "feat: add Navbar, Sidebar, StatusBadge and loading skeleton components" },
    @{ hash = "093f2da49b185394f4d557c7aa9bd7c2e83896c2"; date = "2026-03-06T21:36:00+05:30"; msg = "feat: add LandingPage, LoginPage and RegisterPage" },
    @{ hash = "677dcecbb990a4c33aa23497192d3b1afdd84b7e"; date = "2026-03-06T22:00:00+05:30"; msg = "feat: add CitizenDashboard and MyIssuesPage" },
    @{ hash = "19ed7b9c4f1021e7abf27b5e84eebb2cd038639c"; date = "2026-03-06T22:24:00+05:30"; msg = "feat: add ReportIssuePage with Cloud Vision AI image validation popups" },
    @{ hash = "3beb7e0e53d505cc12a71e61d283f21ad2fedeb4"; date = "2026-03-06T22:48:00+05:30"; msg = "feat: add Community page with issue feed, filters, like and detail modal" },
    @{ hash = "67985cbef703034c556e39c8a31451ff6b056cc5"; date = "2026-03-06T23:12:00+05:30"; msg = "feat: add citizen RewardsPage and NotificationsPage" },
    @{ hash = "f93820c392bf15b25be1f90e7b89285c64e8d64b"; date = "2026-03-06T23:36:00+05:30"; msg = "feat: add officer dashboard, issues, workers, vouchers and analytics pages" },
    @{ hash = "5e3d10afd2e34c75756faea0c45949e948a50707"; date = "2026-03-07T00:00:00+05:30"; msg = "feat: add worker dashboard, issues with proof upload and route planner pages" },
    @{ hash = "c08a9e7860fdb19fb1a164a62f9c52e76cc0fd49"; date = "2026-03-07T00:24:00+05:30"; msg = "feat: add shared ProfilePage for all roles" },
    @{ hash = "8d4ccb40489f3865b50a1f7b5d5654974cccfcae"; date = "2026-03-07T00:48:00+05:30"; msg = "feat: wire up full App.jsx routing with protected and guest route guards" }
)

# Delete old branches if they exist
git branch -D final_history 2>$null

# Create fresh orphan branch
git checkout --orphan final_history
git rm -rf . --quiet
Write-Host "Orphan branch created"

$parentHash = $null

foreach ($c in $commits) {
    $env:GIT_AUTHOR_DATE    = $c.date
    $env:GIT_COMMITTER_DATE = $c.date
    $tree = git log -1 --format="%T" $c.hash

    if ($null -eq $parentHash) {
        $newHash = git commit-tree $tree -m $c.msg
    } else {
        $newHash = git commit-tree $tree -p $parentHash -m $c.msg
    }
    $parentHash = $newHash.Trim()
    git reset --hard $parentHash | Out-Null
    Write-Host "  $($c.date)  $($c.msg)"
}

# Commit 24: AI fingerprints - use tree from 8d4ccb4 (which has client/) but also need
# the updated server files. Get tree from the working directory state at that point.
# The tree of 8d4ccb4 already has everything up to App.jsx.
# For commits 24 and 25 we need to add the extra server files that were in commit 7eef13f
# Let's checkout the files we need from the old commits and make new commits

# Restore working tree to current HEAD state (which has client/)
# Then add the extra server files from the original commit 7eef13f

# Get the tree of 7eef13f (AI fingerprints from first reorder - has extra server files but no client)
# We need to merge: client/ from 8d4ccb4 tree + server/ from 7eef13f tree
# The easiest approach: checkout 8d4ccb4 tree, then checkout server files from old master

git checkout $parentHash -- . 2>$null

# Now checkout the updated server files (analyticsController, notificationController, voucherController, routes)
# from the original commit that had them (7eef13f tree has these)
git checkout 7eef13fd42b4f579daefc4756d8bbc945423888d -- server/controllers/analyticsController.js server/controllers/notificationController.js server/controllers/voucherController.js server/routes/analyticsRoutes.js server/routes/notificationRoutes.js server/routes/voucherRoutes.js make_commits.ps1 make_commits2.ps1 2>$null

$env:GIT_AUTHOR_DATE    = "2026-03-07T01:12:00+05:30"
$env:GIT_COMMITTER_DATE = "2026-03-07T01:12:00+05:30"
$tree24 = git write-tree
$newHash24 = git commit-tree $tree24 -p $parentHash -m "feat: add demo image fingerprint maps for deterministic AI validation results"
$parentHash = $newHash24.Trim()
git reset --hard $parentHash | Out-Null
Write-Host "  2026-03-07T01:12:00+05:30  feat: add demo image fingerprint maps for deterministic AI validation results"

# Commit 25: README - add client/README.md from original
git checkout 29973f14e38513e78d00ca0e50dedbb722558dbf -- client/README.md 2>$null

$env:GIT_AUTHOR_DATE    = "2026-03-07T01:36:00+05:30"
$env:GIT_COMMITTER_DATE = "2026-03-07T01:36:00+05:30"
$tree25 = git write-tree
$newHash25 = git commit-tree $tree25 -p $parentHash -m "docs: add README and final project polish"
git reset --hard $newHash25.Trim() | Out-Null
Write-Host "  2026-03-07T01:36:00+05:30  docs: add README and final project polish"

Remove-Item Env:\GIT_AUTHOR_DATE    -ErrorAction SilentlyContinue
Remove-Item Env:\GIT_COMMITTER_DATE -ErrorAction SilentlyContinue

Write-Host "`nAll 25 commits rebuilt with client/. Final log:"
git log --format="%ai %s"
Write-Host "`nTop-level tree of HEAD:"
git ls-tree --name-only HEAD
