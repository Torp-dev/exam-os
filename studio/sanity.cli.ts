import { defineCliConfig } from "sanity/cli";

export default defineCliConfig({
  api: {
    projectId: "vju5fidf",
    dataset: "production",
  },
  deployment: {
    appId: "ta59wtuwefou3q6dcca3nyat",
    autoUpdates: true,
  },
});
