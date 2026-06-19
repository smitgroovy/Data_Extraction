@echo off
title billing Extraction
cd /d "C:\Users\smitp\Desktop\Groovy\PRODUCT_CODEX"
if errorlevel 1 (
  echo ERROR: Unable to switch to project directory.
  goto end
)
echo ================================================
echo Starting billing extraction...
echo ================================================
where codex >nul 2>nul
if errorlevel 1 (
  echo ERROR: codex CLI not found in PATH.
  goto end
)
codex -C "C:\Users\smitp\Desktop\Groovy\PRODUCT_CODEX" -i "C:\Users\smitp\Desktop\Groovy\PRODUCT_CODEX\data\upload\1781848171030_Code_Generated_Image (1).png" "Read and follow agents/billing/extract.md and agents/billing/rules.md strictly. Extract billing data from file: C:\Users\smitp\Desktop\Groovy\PRODUCT_CODEX\data\upload\1781848171030_Code_Generated_Image (1).png. Write output JSON to data/billing/extracted-1781848171034.json. Do not ask questions. Complete extraction now."
set "EXIT_CODE=%ERRORLEVEL%"
if "%EXIT_CODE%"=="0" (
  if exist "C:\Users\smitp\Desktop\Groovy\PRODUCT_CODEX\data\upload\1781848171030_Code_Generated_Image (1).png" del /f "C:\Users\smitp\Desktop\Groovy\PRODUCT_CODEX\data\upload\1781848171030_Code_Generated_Image (1).png" >nul 2>nul
  echo Extraction completed for billing.
) else (
  echo Extraction failed for billing with exit code %EXIT_CODE%.
)
:end
echo.
echo Press any key to close this window...
pause >nul