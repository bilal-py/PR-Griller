import { existsSync, readFileSync } from "node:fs";
import * as core from "@actions/core";
import { getOctokit } from "@actions/github";

export function getCustomDocs(docsPathsInput: string): string {
  const docsPaths = docsPathsInput
    .split(",")
    .map((path) => path.trim())
    .filter((path) => path.length > 0);

  let combinedDocs = "";

  for (const docsPath of docsPaths) {
    if (existsSync(docsPath)) {
      const contents = readFileSync(docsPath, "utf8");
      combinedDocs += `\n\n--- Content of ${docsPath} ---\n\n${contents}`;
    } else {
      core.warning(`Custom docs file not found: ${docsPath}`);
    }
  }

  return combinedDocs;
}

export async function getPRDiff(
  token: string,
  owner: string,
  repo: string,
  pullNumber: number
): Promise<string> {
  const octokit = getOctokit(token);

  try {
    const response = await octokit.rest.pulls.get({
      owner,
      repo,
      pull_number: pullNumber,
      mediaType: {
        format: "diff",
      },
    });

    if (typeof response.data !== "string") {
      throw new TypeError("Unexpected response format when fetching PR diff.");
    }

    return response.data;
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw new Error(`Failed to fetch PR diff: ${error.message}`);
    }

    throw new Error("Failed to fetch PR diff: unknown error.");
  }
}
