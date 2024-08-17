---
title: Overview
description: PearAI can be deeply customized
keywords: [custom, slash commands, models, context providers]
---

# Overview

PearAI can be deeply customized by editing `config.json` and `config.ts` on your machine. You can find these files in the `~/.pearai/` directory on MacOS and the `%userprofile%\.continue` directory on Windows. These files are created the first time you run PearAI.

Currently, you can customize the following:

- [Models](../setup/select-model.md) and [providers](../setup/select-provider.md)
- [Context Providers](./context-providers.md)
- [Slash Commands](./slash-commands.md)
- [Other configuration options](../reference/config.mdx)

If you'd like to share PearAI configuration with others, you can add a `.continuerc.json` to the root of your project. It has the same JSON Schema definition as `config.json`, and will automatically be applied on top of the local `config.json`.
