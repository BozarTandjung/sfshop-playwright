@echo off
echo ===============================
echo RUN SANITY TEST - SFSHOP
echo ===============================

cd /d %~dp0\..

echo Running Playwright sanity test...
npx playwright test tests/purchase-mobile-legends.spec.ts --project=chromium-galaxy-note-20

echo ===============================
echo SANITY TEST FINISHED
echo ===============================

pause
