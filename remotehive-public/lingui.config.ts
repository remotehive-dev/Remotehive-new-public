import type { LinguiConfig } from "@lingui/conf";

const config: LinguiConfig = {
  locales: ["en-US"],
  sourceLocale: "en-US",
  catalogs: [
    {
      path: "<rootDir>/src/components/resume/client/locales/{locale}/messages",
      include: ["src"],
    },
  ],
  format: "po",
};

export default config;
