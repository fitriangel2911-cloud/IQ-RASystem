@echo off
if exist package.json (
  echo Deleting package.json...
  del /f /q package.json
)
if exist package-lock.json (
  echo Deleting package-lock.json...
  del /f /q package-lock.json
)
echo Done.
