Set-Location "D:\RP\Hackthone\UrbanEye"

# Current commits in correct chronological order with NEW timestamps
$commits = @(
    @{ hash = "a8081fb408adc1a7b765511b4c844c1499f15f18"; date = "2026-03-06T16:00:00+05:30" },
    @{ hash = "a941c87ebf2808718529b39d5633b0913f6e7cc0"; date = "2026-03-06T16:24:00+05:30" },
    @{ hash = "f1b48b95a8798714d71873ed80ea9ac55673971c"; date = "2026-03-06T16:48:00+05:30" },
    @{ hash = "e2adf20157f3d4bfcab50f49ecb7eace4d07fbee"; date = "2026-03-06T17:12:00+05:30" },
    @{ hash = "7d64fdd33a26bc0559efa8bbc6c2ae6fe80696f9"; date = "2026-03-06T17:36:00+05:30" },
    @{ hash = "f3775be34b217600ea376f3c60095455bf1b9aa6"; date = "2026-03-06T18:00:00+05:30" },
    @{ hash = "a4c77edbab58da18ce8f261e7fccdb5af58a76d4"; date = "2026-03-06T18:24:00+05:30" },
    @{ hash = "b3338d7f57e27dc3da33eba917c89f67e3761d93"; date = "2026-03-06T18:48:00+05:30" },
    @{ hash = "1c042b98044a935bbbb0c1fc057499137f171ab7"; date = "2026-03-06T19:12:00+05:30" },
    @{ hash = "377ed9bd5ce16d687bafc7851acef1354dc34307"; date = "2026-03-06T19:36:00+05:30" },
    @{ hash = "4b642890eca9c468cdcff1341198feb26fc3adb5"; date = "2026-03-06T20:00:00+05:30" },
    @{ hash = "0a830282e3e5646f4a820b9d6713fceda4005733"; date = "2026-03-06T20:24:00+05:30" },
    @{ hash = "37dadb8f9ab6f2f4db23fc560c9c9991f8bc6fe1"; date = "2026-03-06T20:48:00+05:30" },
    @{ hash = "e9dcb66b8b6803f646f9b123e7f1cd0c8c20a662"; date = "2026-03-06T21:12:00+05:30" },
    @{ hash = "093f2da49b185394f4d557c7aa9bd7c2e83896c2"; date = "2026-03-06T21:36:00+05:30" },
    @{ hash = "677dcecbb990a4c33aa23497192d3b1afdd84b7e"; date = "2026-03-06T22:00:00+05:30" },
    @{ hash = "19ed7b9c4f1021e7abf27b5e84eebb2cd038639c"; date = "2026-03-06T22:24:00+05:30" },
    @{ hash = "3beb7e0e53d505cc12a71e61d283f21ad2fedeb4"; date = "2026-03-06T22:48:00+05:30" },
    @{ hash = "67985cbef703034c556e39c8a31451ff6b056cc5"; date = "2026-03-06T23:12:00+05:30" },
    @{ hash = "f93820c392bf15b25be1f90e7b89285c64e8d64b"; date = "2026-03-06T23:36:00+05:30" },
    @{ hash = "5e3d10afd2e34c75756faea0c45949e948a50707"; date = "2026-03-07T00:00:00+05:30" },
    @{ hash = "c08a9e7860fdb19fb1a164a62f9c52e76cc0fd49"; date = "2026-03-07T00:24:00+05:30" },
    @{ hash = "8d4ccb40489f3865b50a1f7b5d5654974cccfcae"; date = "2026-03-07T00:48:00+05:30" },
    @{ hash = "507508b88513b3bd094e7208c11593e9cf8e0b69"; date = "2026-03-07T01:12:00+05:30" },
    @{ hash = "29973f14e38513e78d00ca0e50dedbb722558dbf"; date = "2026-03-07T01:36:00+05:30" }
)

# Delete old reordered branch if exists
git branch -D reordered2 2>$null

# Create fresh orphan branch
git checkout --orphan reordered2
git rm -rf . --quiet
Write-Host "Orphan branch created and working tree cleared"

foreach ($c in $commits) {
    $env:GIT_AUTHOR_DATE    = $c.date
    $env:GIT_COMMITTER_DATE = $c.date
    $msg  = git log -1 --format="%s" $c.hash
    $tree = git log -1 --format="%T" $c.hash

    $parent = git rev-parse HEAD 2>$null
    if ($LASTEXITCODE -ne 0) {
        $newHash = git commit-tree $tree -m $msg
    } else {
        $newHash = git commit-tree $tree -p $parent -m $msg
    }

    git reset --hard $newHash | Out-Null
    Write-Host "  $($c.date)  $msg"
}

Remove-Item Env:\GIT_AUTHOR_DATE    -ErrorAction SilentlyContinue
Remove-Item Env:\GIT_COMMITTER_DATE -ErrorAction SilentlyContinue

Write-Host "`nAll 25 commits rebuilt. Final log:"
git log --format="%ai %s"
