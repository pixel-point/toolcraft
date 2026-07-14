import {
  defineToolcraftPerformance,
  type ToolcraftPerformanceConfig,
} from "@/toolcraft/runtime";

export const appPerformance: ToolcraftPerformanceConfig = defineToolcraftPerformance({
  browserCheckPolicy: {
    fallbackRunner: "playwright",
    fallbackWhen: ["agent-browser-unavailable", "ci"],
    preferredRunner: "agent-browser",
  },
  rendererStrategy: "none",
  rendererWorkload: "none",
  scenarios: [],
  usesCustomRenderer: false,
  workloadTargets: [],
});
