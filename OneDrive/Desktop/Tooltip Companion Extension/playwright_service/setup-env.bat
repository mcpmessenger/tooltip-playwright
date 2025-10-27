@echo off
echo Creating .env file...
echo.

echo Enter your OpenAI API key (or press Enter to skip):
set /p API_KEY=

if "%API_KEY%"=="" (
    echo No API key provided. Creating .env without OpenAI key.
    echo OPENAI_API_KEY=>.env
) else (
    echo OPENAI_API_KEY=%API_KEY% > .env
    echo.
    echo ✅ .env file created successfully!
    echo AI features will be enabled when you start the server.
)

echo.
echo Installing dependencies...
call npm install

echo.
echo ✅ Setup complete!
echo.
echo To start the server, run: npm start

