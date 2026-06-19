@echo off
title students Extraction
cd /d "C:\Users\smitp\Desktop\Groovy\PRODUCT_CODEX"
if errorlevel 1 (
  echo ERROR: Unable to switch to project directory.
  goto end
)
echo ================================================
echo Starting students extraction...
echo ================================================
where codex >nul 2>nul
if errorlevel 1 (
  echo ERROR: codex CLI not found in PATH.
  goto end
)
codex -C "C:\Users\smitp\Desktop\Groovy\PRODUCT_CODEX" -i "C:\Users\smitp\Desktop\Groovy\PRODUCT_CODEX\data\upload\1781848290140_Code_Generated_Image (2).png" "Read and follow agents/students/extract.md and agents/students/rules.md strictly. Extract students data from file: C:\Users\smitp\Desktop\Groovy\PRODUCT_CODEX\data\upload\1781848290140_Code_Generated_Image (2).png. Write output JSON to data/students/extracted-1781848290142.json. Do not ask questions. Complete extraction now."
set "EXIT_CODE=%ERRORLEVEL%"
if "%EXIT_CODE%"=="0" (
  if exist "C:\Users\smitp\Desktop\Groovy\PRODUCT_CODEX\data\upload\1781848290140_Code_Generated_Image (2).png" del /f "C:\Users\smitp\Desktop\Groovy\PRODUCT_CODEX\data\upload\1781848290140_Code_Generated_Image (2).png" >nul 2>nul
  echo Extraction completed for students.
) else (
  echo Extraction failed for students with exit code %EXIT_CODE%.
)
:end
echo.
echo Press any key to close this window...
pause >nul