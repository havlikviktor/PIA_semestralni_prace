@echo off
setlocal enableextensions enabledelayedexpansion

set "COMPOSE_MENU=0"

for /f "delims=" %%A in ('echo prompt $E^| cmd') do set "ESC=%%A"
set "GREEN=%ESC%[32m"
set "RED=%ESC%[31m"
set "RESET=%ESC%[0m"

set "COMPOSE_FILE=./docker-compose.test.yml"
set "EXIT_CODE=0"
set "WAS_STARTED=0"
set "BUILD_LOG=%TEMP%\pia-e_docker_build.log"

echo.
call :echoGreen "=== Running backend unit tests ==="
pushd "%~dp0backend"
call npm test
if errorlevel 1 (
    echo.
    call :echoRed "!!! Unit tests FAILED. Skipping E2E. !!!"
    popd
    set "EXIT_CODE=1"
    goto :cleanup
)
popd

echo.
call :echoGreen "=== Unit tests OK. Running E2E via Docker Compose ==="
echo.
set "WAS_STARTED=1"

call :echoGreen "=== Building docker image (backend-test) ==="
echo (Build output hidden; see: %BUILD_LOG%)
docker compose -f "%COMPOSE_FILE%" build --progress quiet backend-test > "%BUILD_LOG%" 2>&1
if errorlevel 1 (
    echo.
    echo !!! Docker build FAILED. Last lines from %BUILD_LOG%: !!!
    powershell -NoProfile -Command "Get-Content -Path '%BUILD_LOG%' -Tail 80"
    set "EXIT_CODE=1"
    goto :cleanup
)

echo.
call :echoGreen "=== Running E2E (backend-test output only) ==="
docker compose -f "%COMPOSE_FILE%" up ^
    --abort-on-container-failure ^
    --exit-code-from backend-test ^
    --timeout 5 ^
    --no-attach db-test ^
    --no-attach mailhog-test
set "EXIT_CODE=%ERRORLEVEL%"

:cleanup
echo.
if "%WAS_STARTED%"=="1" (
    call :echoGreen "=== Cleaning up Docker Compose test stack ==="
    docker compose -f "%COMPOSE_FILE%" down --remove-orphans
)

echo.
if "%EXIT_CODE%"=="0" (
    call :echoGreen "=== E2E tests OK (exit code: %EXIT_CODE%) ==="
) else (
    call :echoRed "=== E2E tests FAILED (exit code: %EXIT_CODE%) ==="
)

exit /b %EXIT_CODE%

:echoGreen
echo !GREEN!%~1!RESET!
exit /b 0

:echoRed
echo !RED!%~1!RESET!
exit /b 0
