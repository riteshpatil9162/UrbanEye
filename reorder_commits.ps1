Set-Location "D:\RP\Hackthone\UrbanEye"

# Correct chronological order of commit hashes
$commits = @(
    @{ hash = "a5e896d783ef519914b7575f42d838709141b093"; date = "2026-03-06T16:00:00+05:30" },
    @{ hash = "2eb77c9f839231d3839ca03416d638732e116578"; date = "2026-03-06T16:18:00+05:30" },
    @{ hash = "30331f9390c2e1ac316a635ff8237b3d67735673"; date = "2026-03-06T16:35:00+05:30" },
    @{ hash = "1707f77f6d6adaffb589e1581a9b265133a0fd37"; date = "2026-03-06T16:52:00+05:30" },
    @{ hash = "ce6c23d3922c8868be1c25aaad70ac3cfe1b7634"; date = "2026-03-06T17:10:00+05:30" },
    @{ hash = "cce2e90f146464ff1f25c06e9a8ce27e7bc3c311"; date = "2026-03-06T17:28:00+05:30" },
    @{ hash = "7aeb0dc8d408ab337a158790685fb654d6ff7da0"; date = "2026-03-06T17:50:00+05:30" },
    @{ hash = "b793c46a055c732c20e9bf62777a53c719743946"; date = "2026-03-06T18:12:00+05:30" },
    @{ hash = "b857e73582ee2aedeb37d19c541b09ff2335d45b"; date = "2026-03-06T18:35:00+05:30" },
    @{ hash = "54c6c69286dd3575702bedc857df53020de57796"; date = "2026-03-06T18:58:00+05:30" },
    @{ hash = "ae0ad066162eb63d75e0b5131292dd0ed8c5c1fb"; date = "2026-03-06T19:22:00+05:30" },
    @{ hash = "75384881027e53f018de1fd1efb29aa0e1672933"; date = "2026-03-06T20:00:00+05:30" },
    @{ hash = "9175ed70da921ddbdc7938447cac3acd159b4bea"; date = "2026-03-06T20:28:00+05:30" },
    @{ hash = "9436600bebd1643ad42d29dbcf4fbfd8b50e7071"; date = "2026-03-06T20:52:00+05:30" },
    @{ hash = "92ff35ddb235acb5ddb11b5288ed2221ebe32284"; date = "2026-03-06T21:18:00+05:30" },
    @{ hash = "a12798b24fee40d49cca10c273b18f1230fdc553"; date = "2026-03-06T21:45:00+05:30" },
    @{ hash = "c78dec28244bc0027fd5f4fd86f492b8a1270616"; date = "2026-03-06T22:15:00+05:30" },
    @{ hash = "978cb9969d28c2347e14560bdfdd8fe0cff552d4"; date = "2026-03-06T22:45:00+05:30" },
    @{ hash = "83d15068d3a47c474ed6ad934ff35c2a58e5d7eb"; date = "2026-03-06T23:10:00+05:30" },
    @{ hash = "49214bead97fc775f17042e2de779b0e86db3645"; date = "2026-03-07T00:00:00+05:30" },
    @{ hash = "1b50542b8be1f8a0e96c9372c276530eb0171cd4"; date = "2026-03-07T00:45:00+05:30" },
    @{ hash = "d180ad6ec8ddfe1b9be3475cba89ba4fe11b2504"; date = "2026-03-07T01:20:00+05:30" },
    @{ hash = "51480788e6bf96caff4c09632ac6e6ce7244f45d"; date = "2026-03-07T09:30:00+05:30" },
    @{ hash = "7eef13fd42b4f579daefc4756d8bbc945423888d"; date = "2026-03-07T14:00:00+05:30" },
    @{ hash = "3b8785902497897b6a44dd8ccc4521b4cf87b564"; date = "2026-03-07T17:30:00+05:30" }
)

# Create orphan branch
git checkout --orphan reordered
git rm -rf . --quiet
Write-Host "Orphan branch created, working tree cleared"

# Cherry-pick each commit in correct chronological order
foreach ($c in $commits) {
    $env:GIT_AUTHOR_DATE    = $c.date
    $env:GIT_COMMITTER_DATE = $c.date
    $msg = git log -1 --format="%s" $c.hash
    $tree = git log -1 --format="%T" $c.hash

    # Create new commit with same tree and message but correct date
    $parent = git rev-parse HEAD 2>$null
    if ($LASTEXITCODE -ne 0) {
        # First commit (no parent)
        $newHash = git commit-tree $tree -m $msg
    } else {
        $newHash = git commit-tree $tree -p $parent -m $msg
    }

    git reset --hard $newHash | Out-Null
    Write-Host "Committed: $msg [$($c.date)]"
}

Remove-Item Env:\GIT_AUTHOR_DATE    -ErrorAction SilentlyContinue
Remove-Item Env:\GIT_COMMITTER_DATE -ErrorAction SilentlyContinue

Write-Host "`nDone! Final log:"
git log --format="%ai %s"
