# Code Configuration

To allow added flexibility and eventually support an entire plugin ecosystem, PearAI can be configured programmatically in a Python file, `~/.pearai/config.ts`.

Whenever PearAI loads, it carries out the following steps:

1. Load `~/.pearai/config.json`
2. Convert this into a `Config` object
3. If `~/.pearai/config.ts` exists and has defined `modifyConfig` correctly, call `modifyConfig` with the `Config` object to generate the final configuration

Defining a `modifyConfig` function allows you to make any final modifications to your initial `config.json`. Here's an example that sets the temperature to a random number and maxTokens to 1024:

```typescript title="~/.pearai/config.ts"
export function modifyConfig(config: Config): Config {
  config.completionOptions = {
    ...config.completionOptions,
    temperature: Math.random(),
    maxTokens: 1024,
  };
  return config;
}
```
