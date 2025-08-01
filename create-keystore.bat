@echo off
echo Creating Lelekart release keystore...
echo.

keytool -genkey -v -keystore android/app/lelekart-release-key.keystore -alias lelekart-key-alias -keyalg RSA -keysize 2048 -validity 10000 -storepass lelekart123 -keypass lelekart123 -dname "CN=Lelekart, OU=Development, O=Lelekart, L=City, S=State, C=IN"

echo.
echo Keystore created successfully!
echo Keystore location: android/app/lelekart-release-key.keystore
echo Store password: lelekart123
echo Key password: lelekart123
echo Key alias: lelekart-key-alias
echo.
echo Please save these credentials securely!
pause 