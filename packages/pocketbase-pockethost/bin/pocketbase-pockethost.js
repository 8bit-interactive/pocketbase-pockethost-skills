#!/usr/bin/env node

import { runCli } from "../src/cli.js";

runCli(process.argv.slice(2)).catch((error) => {
  const exitCode = Number.isInteger(error.exitCode) ? error.exitCode : 1;
  const message = error instanceof Error ? error.message : String(error);

  console.error(message);

  if (process.env.PB_DEBUG === "1" && error instanceof Error && error.stack) {
    console.error("");
    console.error(error.stack);
  }

  process.exit(exitCode);
});

