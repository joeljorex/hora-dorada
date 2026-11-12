@echo off
rem Abre el Estudio de voces de Hora Dorada (graba el libreto y lo envia al juego)
cd /d "%~dp0"
where python >nul 2>nul || (echo Necesitas Python instalado: https://www.python.org/downloads/ & pause & exit /b)
python herramientas\estudio_voces.py
pause

