@echo off
setlocal

set "ROOT=%~dp0"
set "VENV_ACTIVATE=%ROOT%backend\.venv\Scripts\activate.bat"
set "WANGP_DIR=%ROOT%Wan2GP"

if not exist "%VENV_ACTIVATE%" (
    echo [!] Missing project venv: "%VENV_ACTIVATE%"
    echo     Run project setup first, then try again.
    pause
    exit /b 1
)

if not exist "%WANGP_DIR%\wgp.py" (
    echo [!] Missing Wan2GP entrypoint: "%WANGP_DIR%\wgp.py"
    echo     Run scripts\ensure-wan2gp.ps1 first, then try again.
    pause
    exit /b 1
)

cd /d "%WANGP_DIR%" || (
    echo [!] Could not enter Wan2GP folder.
    pause
    exit /b 1
)

call "%VENV_ACTIVATE%" || (
    echo [!] Could not activate project venv.
    pause
    exit /b 1
)

echo [*] Starting Wan2GP browser UI with project venv...
echo [*] Command: python wgp.py --open-browser %*
python wgp.py --open-browser %*

set "EXIT_CODE=%ERRORLEVEL%"
echo.
echo [*] Wan2GP exited with code %EXIT_CODE%.
pause
exit /b %EXIT_CODE%
