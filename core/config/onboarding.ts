import { SerializedContinueConfig } from "../index.js";

export function setupConfig(
  config: SerializedContinueConfig,
): SerializedContinueConfig {
  return {
    ...config,
  };
}
