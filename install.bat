@echo off
setlocal ENABLEDELAYEDEXPANSION

REM URL des Git-Repositories
set "GIT_URL=https://github.com/ThomasFerl/JS-4/archive/refs/heads/main.zip"

REM Zielbasis
set "DEST_ROOT=C:\nodeJS"

REM Pfad zu WinRAR
set "WINRAR=C:\Program Files\WinRAR\WinRAR.exe"

if "%~1"=="" (
  echo [ERROR] Bitte SUBDIR ^(relativer Pfad im Repo^) angeben.
  echo   Beispiel: "prototyp" oder "src\tools"
  exit /b 1
)

REM === FIX: ZIP_URL korrekt aus GIT_URL übernehmen
set "ZIP_URL=%GIT_URL%"
set "SUBDIR_RAW=%~1"

REM SUBDIR normalisieren
set "SUBDIR=%SUBDIR_RAW:/=\%"
:trim_loop
if "%SUBDIR:~0,1%"=="\" set "SUBDIR=%SUBDIR:~1%" & goto trim_loop

REM Checks
if not exist "%WINRAR%" (
  echo [ERROR] WinRAR.exe nicht gefunden: "%WINRAR%"
  exit /b 2
)
where curl >nul 2>nul
if errorlevel 1 (
  echo [ERROR] curl.exe nicht gefunden.
  exit /b 3
)

REM Temp-Verzeichnisse
for /f "tokens=1-4 delims=/:. " %%a in ("%date% %time%") do (
  set TS=%%a%%b%%c_%%d
)
set "TEMP_BASE=%TEMP%\repo_tmp_%TS%"
set "ZIP_PATH=%TEMP_BASE%\repo.zip"
set "EXTRACT_DIR=%TEMP_BASE%\unzipped"

mkdir "%TEMP_BASE%" >nul 2>nul
mkdir "%EXTRACT_DIR%" >nul 2>nul

echo [INFO] Lade ZIP:
echo        %ZIP_URL%
curl -L -o "%ZIP_PATH%" "%ZIP_URL%"
if errorlevel 1 (
  echo [ERROR] Download fehlgeschlagen.
  rd /s /q "%TEMP_BASE%" >nul 2>nul
  exit /b 4
)

echo [INFO] Entpacke mit WinRAR ...
"%WINRAR%" x -idq -y "%ZIP_PATH%" "%EXTRACT_DIR%\"
if errorlevel 1 (
  echo [ERROR] Entpacken fehlgeschlagen.
  rd /s /q "%TEMP_BASE%" >nul 2>nul
  exit /b 5
)

REM Top-Level-Ordner finden
set "TOPDIR="
for /f "delims=" %%D in ('dir /ad /b "%EXTRACT_DIR%"') do (
  if not defined TOPDIR set "TOPDIR=%%D"
)

if not defined TOPDIR (
  echo [ERROR] Kein Top-Level-Verzeichnis gefunden.
  rd /s /q "%TEMP_BASE%" >nul 2>nul
  exit /b 6
)

REM Quelle = gewünschtes Unterverzeichnis
set "SOURCE_SUBDIR=%EXTRACT_DIR%\%TOPDIR%\%SUBDIR%"
if not exist "%SOURCE_SUBDIR%" (
  echo [ERROR] Unterverzeichnis existiert nicht: %SOURCE_SUBDIR%
  dir /ad /s /b "%EXTRACT_DIR%\%TOPDIR%"
  rd /s /q "%TEMP_BASE%" >nul 2>nul
  exit /b 7
)

REM Ziel
set "DEST_PATH=%DEST_ROOT%\%SUBDIR%"
echo [INFO] Kopiere nach "%DEST_PATH%" ...
robocopy "%SOURCE_SUBDIR%" "%DEST_PATH%" *.* /MIR /R:2 /W:2 /NFL /NDL /NP
set "RC=%ERRORLEVEL%"
if %RC% GEQ 8 (
  echo [ERROR] robocopy Fehler (Code %RC%).
  rd /s /q "%TEMP_BASE%" >nul 2>nul
  exit /b %RC%
)

echo [OK] Fertig: %DEST_PATH%
rd /s /q "%TEMP_BASE%" >nul 2>nul

endlocal
exit /b 0