@echo off
cls
setlocal ENABLEDELAYEDEXPANSION
chcp 65001 >nul

rem ============================================================
rem  WebApp Installer
rem    - Lädt Repo-ZIP
rem    - Entpackt
rem    - Kopiert NUR angegebenes SUBDIR nach C:\nodeJS\<SUBDIR>
rem    - Bindet tfWebApp als Junction in <DEST>\frontend\tfWebApp ein
rem    - npm install (+ optional build)
rem    - Installiert/aktualisiert Windows-Dienst via NSSM (backend.js)
rem    - Räumt Temp auf
rem
rem  AUFRUF:
rem    install.bat "<SUBDIR>"
rem  BEISPIEL:
rem    install.bat "prototyp"
rem ============================================================

rem -------- Konfiguration --------
set "GIT_URL=https://github.com/ThomasFerl/JS-4/archive/refs/heads/main.zip"
set "DEST_ROOT=C:\nodeJS"
set "NSSM=C:\nodeJS\ntService\win64\nssm.exe"
set "SERVICE_PREFIX=nodeJS"
set "WINRAR=C:\Program Files\WinRAR\WinRAR.exe"

rem tfWebApp zentral (Junction-Ziel)
set "CENTRAL_TF=C:\nodeJS\sharedLibs\tfWebApp"

rem Node/npm
set "START_JS=backend.js"
set "NODE_ENV=production"
set "NPM_PRODUCTION=1"             rem 1 = dev-Dependencies weglassen (--omit=dev)

rem Trace/Debug
set "VERBOSE=0"                    rem 1 = echo on

rem -------- Parameter --------
set "SUBDIR_RAW=%~1"
if "%SUBDIR_RAW%"=="" (
  echo [ERROR] Bitte SUBDIR ^(relativer Pfad im Repo^) angeben. Beispiel: "prototyp"
  exit /b 1
)

rem -------- Ablauf --------
call :Init           || goto :fail
call :DownloadZip    || goto :fail
call :ExtractZip     || goto :fail
call :CopySubdir     || goto :fail
call :LinkTfWebApp   || goto :fail
call :NpmInstall     || goto :fail
call :ServiceInstall || goto :fail
call :Cleanup ok
goto :eof

:fail
call :Cleanup fail
exit /b 1

rem ============================================================
:Init
if "%VERBOSE%"=="1" (
  echo on
) else (
  echo off
)


rem SUBDIR normalisieren: / -> \ ; führende \ entfernen
set "SUBDIR=%SUBDIR_RAW:/=\%"
:trim_loop
if "%SUBDIR:~0,1%"=="\" set "SUBDIR=%SUBDIR:~1%" & goto :trim_loop

set "ZIP_URL=%GIT_URL%"
set "DEST_PATH=%DEST_ROOT%\%SUBDIR%"

rem Service-Namen aus Subdir ableiten (Backslashes & Leerzeichen -> Unterstrich)
set "SERVICE_NAME=%SERVICE_PREFIX%-%SUBDIR%"
set "SERVICE_NAME=%SERVICE_NAME:\=_%"
set "SERVICE_NAME=%SERVICE_NAME: =_%"
set "SERVICE_DISPLAY=%SERVICE_PREFIX% - %SUBDIR%"

rem Node & npm dynamisch ermitteln
call :ResolveNodeNpm || (echo [ERROR] Konnte Node/npm nicht ermitteln & exit /b 7)

rem Tools prüfen
where curl >nul 2>nul || (echo [ERROR] curl.exe nicht gefunden & exit /b 2)
if not exist "%WINRAR%" (echo [ERROR] WinRAR nicht gefunden: %WINRAR% & exit /b 3)
if "%USE_NSSM%"=="1" if not exist "%NSSM%" (
  echo [ERROR] NSSM nicht gefunden: %NSSM%
  echo Bitte Pfad anpassen oder USE_NSSM=0 setzen.
  exit /b 6
)

echo Arbeitsverzeichnis vorbereiten ...
for /f "tokens=1-4 delims=/:. " %%a in ("%date% %time%") do set TS=%%a%%b%%c_%%d
set "WORK=%TEMP%\repo_tmp_%TS%"
set "ZIP=%WORK%\repo.zip"
set "EXTRACT=%WORK%\unzipped"

mkdir "%WORK%" >nul 2>nul
mkdir "%EXTRACT%" >nul 2>nul

echo [Init] SUBDIR="%SUBDIR%"
echo [Init] DEST ="%DEST_PATH%"
echo [Init] WORK ="%WORK%"
echo [Init] Service: Name="%SERVICE_NAME%"  Display="%SERVICE_DISPLAY%"
exit /b 0

rem ============================================================
:DownloadZip
echo [Download] Lade ZIP: %ZIP_URL%
curl -L -o "%ZIP%" "%ZIP_URL%"
if errorlevel 1 (echo [ERROR] Download fehlgeschlagen & exit /b 10)
exit /b 0

rem ============================================================
:ExtractZip
echo [Extract] Entpacke mit WinRAR …
"%WINRAR%" x -idq -y "%ZIP%" "%EXTRACT%\"
if errorlevel 1 (echo [ERROR] Entpacken fehlgeschlagen & exit /b 11)

echo Top-Level im ZIP ermitteln ...
set "TOPDIR="
for /f "delims=" %%D in ('dir /ad /b "%EXTRACT%"') do if not defined TOPDIR set "TOPDIR=%%D"
if not defined TOPDIR (echo [ERROR] Kein Top-Level-Verzeichnis im Archiv gefunden & exit /b 12)

echo Top-Level-Dir : !TOPDIR! 

rem Quelle = nur der gewünschte Unterordner
set "SRC_SUBDIR=%EXTRACT%\%TOPDIR%\%SUBDIR%"
if not exist "%SRC_SUBDIR%" (
  echo [ERROR] Unterverzeichnis nicht im Archiv gefunden:
  echo         %SRC_SUBDIR%
  exit /b 13
)
echo [Extract] TOPDIR=%TOPDIR%
exit /b 0

rem ============================================================
:CopySubdir
echo kopiere Inhalt von "%SUBDIR%" nach "%DEST_PATH%"
xcopy "%SRC_SUBDIR%" "%DEST_PATH%"\ /E /I /Y >nul
echo Kopiervorgang beendet ...
exit /b 0

rem ============================================================
:LinkTfWebApp
echo verlinke Frontend-Bibliothek aus dem Repo
set "TF_SRC=%EXTRACT%\%TOPDIR%\library\tfWebApp"
set "TF_LINK=%DEST_PATH%\frontend\tfWebApp"

echo Quelle der tfWepApp - Bibiothek : !TF_SRC! 
echo physisches Ziel im lok. System : !CENTRAL_TF!

echo physisches Ziel im lok. System initial befüllen ^(falls nicht vorhanden^)
if not exist "%CENTRAL_TF%" (
  echo !CENTRAL_TF!  existiert nicht und wird jetzt aus dem Repo kopiert...
  echo kopiere Bibliothek
  xcopy "%TF_SRC%" "%CENTRAL_TF%" /E /I /Y >nul
 )


echo Vorhandenen Ordner/Link entfernen ^(nur Link/Ordner, nicht !CENTRAL_TF! ^)
if exist "%TF_LINK%" (
  echo [tfWebApp] Entferne vorhandenen tfWebApp-Link/Ordner …
  rmdir "%TF_LINK%" >nul 2>nul
)

echo Laufwerke vergleichen, damit mklink /J nicht ins Leere läuft
set "DRIVE_DEST=%DEST_PATH:~0,2%"
set "DRIVE_CENT=%CENTRAL_TF:~0,2%"

echo Ziel-Laufwerk : !DRIVE_DEST!
echo Quell-Laufwerk : !DRIVE_CENT!


if /I not "%DRIVE_DEST%"=="%DRIVE_CENT%" (
  echo Ein symbolischer Link funktioniert nur innerhalb eines Laufwerks. Daher wird der Inhalt physisch kopiert...
  xcopy "%CENTRAL_TF%" "%TF_LINK%" /E /I /y >nul
  echo [tfWebApp] KOPIERT ^(kein Link^).
  exit /b 0
)

echo [tfWebApp] Erzeuge Junction: "%TF_LINK%" -> "%CENTRAL_TF%"
mklink /J "%TF_LINK%" "%CENTRAL_TF%"
if errorlevel 1 (
  echo [WARN] mklink /J fehlgeschlagen ^(anderes Laufwerk/Rechte?^). Fallback: Kopieren.
  xcopy "%CENTRAL_TF%" "%TF_LINK%" /E /I /y >nul
  echo [tfWebApp] KOPIERT ^(kein Link^).
) else (
  echo [tfWebApp] Junction OK.
)
exit /b 0

rem ============================================================
:NpmInstall
echo [npm] Wechsle nach "%DEST_PATH%"
pushd "%DEST_PATH%" >nul

rem Production-Flag -> dev-Dependencies weglassen
if "%NPM_PRODUCTION%"=="1" (
  if exist "package-lock.json" (
    echo [npm] ci --omit=dev
    "%NPM_CMD%" ci --omit=dev
  ) else (
    echo [npm] install --omit=dev
    "%NPM_CMD%" install --omit=dev
  )
) else (
  if exist "package-lock.json" (
    echo [npm] ci
    "%NPM_CMD%" ci
  ) else (
    echo [npm] install
    "%NPM_CMD%" install
  )
)
if errorlevel 1 (
  echo [ERROR] npm install/ci fehlgeschlagen.
  popd >nul
  exit /b 20
)

rem Optional: Build nur wenn Script vorhanden ist
call "%NPM_CMD%" run | findstr /r /c:"^  build" >nul
if not errorlevel 1 (
  echo [npm] run build
  "%NPM_CMD%" run build
  if errorlevel 1 echo [WARN] npm build meldete Fehler—fahre fort.
)

popd >nul
exit /b 0

rem ============================================================
:ServiceInstall
if not "%USE_NSSM%"=="1" (
  echo [Service] USE_NSSM=0 -> Dienst wird nicht installiert/aktualisiert.
  exit /b 0
)

echo Adminrechte prüfen ...
 net session >nul 2>&1
 if errorlevel 1 (
  echo [ERROR] Dienstinstallation erfordert Administratorrechte.
  echo Bitte Eingabeaufforderung als Administrator starten.
  exit /b 30
 )

set "LOG_DIR=%DEST_PATH%\logs"
mkdir "%LOG_DIR%" >nul 2>nul

rem Stop/Remove falls vorhanden (idempotent)
"%NSSM%" stop  "%SERVICE_NAME%"  >nul 2>&1
"%NSSM%" remove "%SERVICE_NAME%" confirm >nul 2>&1

rem Install
echo [Service] Installiere "%SERVICE_NAME%" …
"%NSSM%" install "%SERVICE_NAME%" "%NODE_CMD%" "%DEST_PATH%\%START_JS%"
"%NSSM%" set "%SERVICE_NAME%" AppDirectory "%DEST_PATH%"
"%NSSM%" set "%SERVICE_NAME%" AppStdout    "%LOG_DIR%\out.log"
"%NSSM%" set "%SERVICE_NAME%" AppStderr    "%LOG_DIR%\err.log"
"%NSSM%" set "%SERVICE_NAME%" AppEnvironmentExtra "NODE_ENV=%NODE_ENV%"
"%NSSM%" set "%SERVICE_NAME%" AppStopMethodConsole 15000
"%NSSM%" set "%SERVICE_NAME%" AppThrottle 2000

rem Autostart beim Boot
sc config "%SERVICE_NAME%" start= auto >nul

rem Start
"%NSSM%" start "%SERVICE_NAME%"
if errorlevel 1 (
  echo [ERROR] Dienst konnte nicht gestartet werden.
  exit /b 21
)
echo [Service] Dienst "%SERVICE_NAME%" gestartet.
exit /b 0

rem ============================================================
:ResolveNodeNpm
rem Robuste Ermittlung von node.exe und npm.cmd
setlocal ENABLEDELAYEDEXPANSION
set "NODE_CMD="
set "NPM_CMD="

rem --- node.exe suchen (erster Treffer) ---
for /f "delims=" %%P in ('where node 2^>nul') do (
  if not defined NODE_CMD set "NODE_CMD=%%~fP"
)

echo Ergebnis der node Suche:
echo node = "!NODE_CMD!"

rem Bereinigen: Anführungszeichen und # entfernen (falls mal „schmutzige“ Ausgabe)
if defined NODE_CMD (
  set "NODE_CMD=!NODE_CMD:"=!"
  set "NODE_CMD=!NODE_CMD:#=!"
)


echo Ergebnis der node Bereinigung:
echo node = "!NODE_CMD!"


if not defined NODE_CMD (
  echo [ERROR] Node.js ^(node.exe^) nicht gefunden. Bitte installieren oder PATH korrigieren.
  endlocal & exit /b 1
)

rem --- npm suchen (erster Treffer) ---
for /f "delims=" %%P in ('where npm 2^>nul') do (
  if not defined NPM_CMD set "NPM_CMD=%%~fP"
)

echo Ergebnis der npm Suche:
echo npm = "!NPM_CMD!"


rem Bereinigen
if defined NPM_CMD (
  set "NPM_CMD=!NPM_CMD:"=!"
  set "NPM_CMD=!NPM_CMD:#=!"
)

rem Fallbacks für npm
if not defined NPM_CMD (
  if exist "C:\Program Files\nodejs\npm.cmd" (
    set "NPM_CMD=C:\Program Files\nodejs\npm.cmd"
  )
)
if not defined NPM_CMD (
  if exist "C:\Program Files (x86)\nodejs\npm.cmd" (
    set "NPM_CMD=C:\Program Files (x86)\nodejs\npm.cmd"
  )
)
if not defined NPM_CMD (
  echo [ERROR] npm nicht gefunden. Bitte Node/npm installieren oder PATH korrigieren.
  endlocal & exit /b 2
)

echo [Init] NODE_CMD="!NODE_CMD!"
echo [Init] NPM_CMD ="!NPM_CMD!"
endlocal & (
  set "NODE_CMD=%NODE_CMD%"
  set "NPM_CMD=%NPM_CMD%"
)
exit /b 0

rem ============================================================
:Cleanup
if /i "%~1"=="ok" (
  echo [Cleanup] Aufräumen …
) else (
  echo [Cleanup] Aufräumen nach Fehler …
)
rd /s /q "%WORK%" >nul 2>nul
echo [Done] Installation abgeschlossen: %DEST_PATH%
exit /b 0