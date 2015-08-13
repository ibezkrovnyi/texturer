npm run build
exit

@echo off
set TSC=%~dp0/tools/typescript/tsc.js

call npm install

node %TSC% --project src/texturer
node %TSC% --project src/binPacker
node %TSC% --project src/compressImage
node %TSC% --project src/tinyPng
node %TSC% --project src/writeFile
node %TSC% --project src/copyFile
