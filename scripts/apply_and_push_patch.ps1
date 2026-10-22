param(
  [string]$PatchPath = ".\users_changes_patch.diff",
  [string]$BranchName = "alexcprado10-agregar-3-tools-analitica",
  [string]$CommitAuthorName = "",
  [string]$CommitAuthorEmail = ""
)

function Exec([string]$cmd) {
  Write-Host "> $cmd"
  $r = & cmd /c $cmd
  if ($LASTEXITCODE -ne 0) { throw "Command failed: $cmd" }
  return $r
}

try {
  # Ensure running inside a git repo
  & git rev-parse --is-inside-work-tree 2>$null
  if ($LASTEXITCODE -ne 0) { throw "Not a git repository. Run this script inside the repository root." }

  # Ensure user identity
  $curName = (& git config user.name) -join ''
  $curEmail = (& git config user.email) -join ''
  if (-not $curName -and $CommitAuthorName) { Exec "git config user.name \"$CommitAuthorName\""; $curName = $CommitAuthorName }
  if (-not $curEmail -and $CommitAuthorEmail) { Exec "git config user.email \"$CommitAuthorEmail\""; $curEmail = $CommitAuthorEmail }
  if (-not $curName -or -not $curEmail) { Write-Host "Warning: git user.name or user.email not set. Commits will use repository defaults if available." -ForegroundColor Yellow }

  # Fetch and create / checkout branch
  Exec "git fetch origin"
  $exists = (& git ls-remote --heads origin $BranchName) -join ''
  if ($exists) {
    Exec "git checkout $BranchName"
    Exec "git pull origin $BranchName"
  } else {
    Exec "git checkout -b $BranchName"
  }

  # Ensure artifacts/ ignored
  if (-not (Test-Path .gitignore)) { New-Item -Path .gitignore -ItemType File -Force | Out-Null }
  $ign = Get-Content .gitignore -ErrorAction SilentlyContinue
  if ($ign -notcontains 'artifacts/') {
    Add-Content -Path .gitignore -Value "`n# Ignore artifacts produced by validator/tests`nartifacts/"
    Exec "git add .gitignore"
  }

  # Apply patch if present
  if (Test-Path $PatchPath) {
    Write-Host "Applying patch: $PatchPath"
    Exec "git apply --verbose --whitespace=fix `"$PatchPath`""
  } else {
    Write-Host "Patch not found at $PatchPath — skipping git apply" -ForegroundColor Yellow
  }

  # Stage relevant files (conservative: add all, .gitignore prevents artifacts being added)
  Exec "git add -A"

  # Commit if there are staged changes
  $status = (& git diff --cached --name-only) -join "`n"
  if (-not [string]::IsNullOrWhiteSpace($status)) {
    $msg = "feat(analytics): add 3 tools, validation & artifacts listing docs`n`nCo-authored-by: Copilot App <223556219+Copilot@users.noreply.github.com>"
    Exec "git commit -m \"$msg\""
  } else {
    Write-Host "No changes to commit." -ForegroundColor Yellow
  }

  # Push
  Write-Host "Pushing branch to origin..."
  $pushCmd = "git push --set-upstream origin $BranchName"
  $pushResult = & cmd /c $pushCmd 2>&1
  if ($LASTEXITCODE -ne 0) {
    Write-Host "Push failed. You might not have permission to push to the upstream repo." -ForegroundColor Red
    Write-Host "Suggested next steps:" -ForegroundColor Cyan
    Write-Host "1) Fork the repository on GitHub, add your fork as 'origin' and push there; then open a PR to the original repo." -ForegroundColor Cyan
    Write-Host "2) Or run: git remote add fork <your-fork-url>; git push --set-upstream fork $BranchName" -ForegroundColor Cyan
    throw "Push failed"
  }

  Write-Host "Success: branch '$BranchName' pushed. Create a PR from this branch to the upstream repository." -ForegroundColor Green
  exit 0
} catch {
  Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
  exit 1
}
