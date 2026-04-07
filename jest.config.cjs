module.exports = {
    preset: "ts-jest/presets/default-esm",
    testEnvironment: "node",
    watchman: false,
    extensionsToTreatAsEsm: [".ts"],
    moduleNameMapper: {
        "^@app/(.*)$": "<rootDir>/src/$1",
    },
    transform: {
        "^.+\\.ts$": ["ts-jest", { useESM: true, tsconfig: "tsconfig.test.json" }],
    },
}
