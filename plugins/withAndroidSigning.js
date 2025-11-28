const { withAppBuildGradle } = require('expo/config-plugins');

const withAndroidSigning = (config) => {
    return withAppBuildGradle(config, (config) => {
        if (config.modResults.language === 'groovy') {
            config.modResults.contents = addSigningConfig(config.modResults.contents);
        }
        return config;
    });
};

function addSigningConfig(buildGradle) {
    const signingConfig = `
    signingConfigs {
        release {
            if (System.getenv("CM_KEYSTORE_PATH")) {
                storeFile file(System.getenv("CM_KEYSTORE_PATH"))
                storePassword System.getenv("CM_KEYSTORE_PASSWORD")
                keyAlias System.getenv("CM_KEY_ALIAS")
                keyPassword System.getenv("CM_KEY_PASSWORD")
            }
        }
    }
  `;

    // Add signing config to android block
    let newBuildGradle = buildGradle.replace(
        'android {',
        `android {${signingConfig}`
    );

    // Apply signing config to release build type
    newBuildGradle = newBuildGradle.replace(
        'buildTypes {',
        `buildTypes {
        release {
            signingConfig signingConfigs.release
        }
    `
    );

    return newBuildGradle;
}

module.exports = withAndroidSigning;
