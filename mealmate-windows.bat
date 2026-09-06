@echo off
setlocal EnableExtensions EnableDelayedExpansion

REM Locate the app directory by searching upward for package.json,
REM so this script keeps working no matter which subfolder it's placed in
REM (previously this assumed a fixed "one level up" layout).
set "APP_DIR=%~dp0"
if "%APP_DIR:~-1%"=="\" set "APP_DIR=%APP_DIR:~0,-1%"
:findroot
if exist "%APP_DIR%\package.json" goto foundroot
for %%I in ("%APP_DIR%\..") do set "PARENT=%%~fI"
if /I "%PARENT%"=="%APP_DIR%" (
  echo package.json not found >&2
  exit /b 1
)
set "APP_DIR=%PARENT%"
goto findroot
:foundroot

set "PORT=4173"
set "RUNTIME_DIR=%LOCALAPPDATA%\MealMate"
set "LOG=%RUNTIME_DIR%\mealmate-server.log"
set "ERRLOG=%RUNTIME_DIR%\mealmate-server.err.log"
set "PIDFILE=%RUNTIME_DIR%\mealmate-server.pid"
set "NODE_DIR=%RUNTIME_DIR%\node"
set "NODE_VERSION=22.20.0"
set "NODE_URL=https://nodejs.org/dist/v%NODE_VERSION%/node-v%NODE_VERSION%-x64.msi"

if not exist "%RUNTIME_DIR%" mkdir "%RUNTIME_DIR%" >nul 2>&1
cd /d "%APP_DIR%" || exit /b 1

REM Ensure Node.js 20+ is available. If node is missing (or too old), use a
REM local copy downloaded into the user's AppData dir — not installed system-wide.
set "NODE_OK=1"
where node >nul 2>&1
if errorlevel 1 (
  set "NODE_OK=0"
) else (
  for /f "tokens=1 delims=." %%A in ('node -p "process.versions.node" 2^>nul') do if %%A LSS 20 set "NODE_OK=0"
)
if "!NODE_OK!"=="0" (
  echo Node.js 20+ not found. Downloading a local copy (one time only)...
  if exist "%NODE_DIR%\node.exe" (
    set "PATH=%NODE_DIR%;%PATH%"
  ) else (
    where powershell >nul 2>&1 || (echo PowerShell is required on first run to download Node.js. & exit /b 1)
    where msiexec >nul 2>&1 || (echo Windows Installer (msiexec) is required on first run. & exit /b 1)
    set "INSTALLER=%TEMP%\mealmate-node.msi"
    powershell -NoProfile -ExecutionPolicy Bypass -Command "Invoke-WebRequest -Uri '%NODE_URL%' -OutFile '%INSTALLER%'"
    if errorlevel 1 exit /b 1
    msiexec /i "%INSTALLER%" /qn /norestart INSTALLDIR="%NODE_DIR%"
    if errorlevel 1 exit /b 1
    del /q "%INSTALLER%" >nul 2>&1
    set "PATH=%NODE_DIR%;%PATH%"
  )
)
where node >nul 2>&1 || (echo Node.js could not be made available. & exit /b 1)
for /f "tokens=1 delims=." %%A in ('node -p "process.versions.node"') do set "NODE_MAJOR=%%A"
if !NODE_MAJOR! LSS 20 (echo MealMate requires Node.js 20 or newer. & exit /b 1)
where npm >nul 2>&1 || (echo npm not found alongside Node.js. & exit /b 1)
if not exist "%APP_DIR%\node_modules" (
  call npm ci
  if errorlevel 1 exit /b 1
)
call npm run build
if errorlevel 1 exit /b 1

REM Stop any previous MealMate server before starting a new one.
REM The old batch had no PID tracking at all here, so a relaunch would
REM just fail silently against --strictPort while the old server kept
REM running invisibly. We now: (1) kill the tracked PID if still alive,
REM and (2) sweep for any leftover node/vite process tied to this app dir,
REM since npm.cmd's own PID isn't the same as the vite child it spawns.
if exist "%PIDFILE%" (
  set /p OLDPID=<"%PIDFILE%"
  if defined OLDPID (
    powershell -NoProfile -Command "try { Stop-Process -Id !OLDPID! -Force -ErrorAction SilentlyContinue } catch {}"
  )
  del /q "%PIDFILE%" >nul 2>&1
)
powershell -NoProfile -Command "Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -and $_.CommandLine -like '*%APP_DIR%*' -and $_.CommandLine -like '*vite*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }"
timeout /t 1 /nobreak >nul

REM Launch the preview server via PowerShell's Start-Process instead of a
REM nested "cmd /c ... > log 2>&1" string. The old version closed and
REM reopened a quoted string mid-command to embed the log path, which is
REM fragile and breaks outright once %LOCALAPPDATA% contains a space
REM (e.g. "C:\Users\John Doe\..."), which it commonly does. Start-Process
REM also hands us the real PID directly, instead of npm's wrapper PID.
powershell -NoProfile -Command ^
  "$p = Start-Process -FilePath 'npm.cmd' -ArgumentList 'run','preview','--','--host','127.0.0.1','--port','%PORT%','--strictPort' -WorkingDirectory '%APP_DIR%' -RedirectStandardOutput '%LOG%' -RedirectStandardError '%ERRLOG%' -WindowStyle Hidden -PassThru; $p.Id | Out-File -FilePath '%PIDFILE%' -Encoding ascii"

powershell -NoProfile -ExecutionPolicy Bypass -Command "$ok=$false; for($i=0;$i -lt 30;$i++){try{$r=Invoke-WebRequest 'http://127.0.0.1:%PORT%' -UseBasicParsing -TimeoutSec 1;if($r.StatusCode -eq 200){$ok=$true;break}}catch{};Start-Sleep -Milliseconds 500};if(-not $ok){exit 1}"
if errorlevel 1 (
  echo MealMate failed to start. Log: %LOG% 1>&2
  exit /b 1
)
start "" "http://127.0.0.1:%PORT%"
exit /b 0