import type { Config } from "@jest/types";

// Sync object
const config: Config.InitialOptions = {
  verbose: true,
  preset: "ts-jest",
  testEnvironment: "node",
  extensionsToTreatAsEsm: [".ts"],
  globals: {
    "ts-jest": {
      tsconfig: "test/tsconfig.json",
      diagnostics: {
        ignoreCodes: ["TS151001"],
      },
    },
  },
};
export default config;
