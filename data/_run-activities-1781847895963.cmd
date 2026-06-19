@echo off
title activities Extraction
cd /d "C:\Users\smitp\Desktop\Groovy\PRODUCT_CODEX"
if errorlevel 1 (
  echo ERROR: Unable to switch to project directory.
  goto end
)
echo ================================================
echo Starting activities extraction...
echo ================================================
where codex >nul 2>nul
if errorlevel 1 (
  echo ERROR: codex CLI not found in PATH.
  goto end
)
codex -C "C:\Users\smitp\Desktop\Groovy\PRODUCT_CODEX" -i "C:\Users\smitp\Desktop\Groovy\PRODUCT_CODEX\data\upload\1781847895956_Code_Generated_Image.png" "Read and follow agents/activities/extract.md and agents/activities/rules.md strictly. Extract activities data from file: C:\Users\smitp\Desktop\Groovy\PRODUCT_CODEX\data\upload\1781847895956_Code_Generated_Image.png. Write output JSON to data/activities/extracted-1781847895963.json. Do not ask questions. Complete extraction now."
set "EXIT_CODE=%ERRORLEVEL%"
if "%EXIT_CODE%"=="0" (
  if exist "C:\Users\smitp\Desktop\Groovy\PRODUCT_CODEX\data\upload\1781847895956_Code_Generated_Image.png" del /f "C:\Users\smitp\Desktop\Groovy\PRODUCT_CODEX\data\upload\1781847895956_Code_Generated_Image.png" >nul 2>nul
  echo Extraction completed for activities.
) else (
  echo Extraction failed for activities with exit code %EXIT_CODE%.
)
:end
echo.
echo Press any key to close this window...
pause >nul