import { existsSync, readFileSync, statSync, readdirSync } from "node:fs";
import { join } from "node:path";
import * as core from "@actions/core";
import { getOctokit } from "@actions/github";
import type { Context } from "@actions/github/lib/context";

export async function getPRDiff(
  octokit: ReturnType<typeof getOctokit>,
  context: Context
): Promise<string> {
  try {
    const { owner, repo } = context.repo;
    const pullNumber = context.payload.pull_request?.number;

    if (!pullNumber) {
      throw new Error("Pull request number not found in context.");
    }

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

function readMarkdownFilesFromDirectory(dirPath: string): string {
  let combinedDocs = "";
  const files = readdirSync(dirPath);
  const markdownFiles = files.filter((file) => file.endsWith(".md"));

  for (const file of markdownFiles) {
    const filePath = join(dirPath, file);
    try {
      const contents = readFileSync(filePath, "utf8");
      combinedDocs += `\n\n--- Content of ${file} ---\n\n${contents}`;
    } catch (fileError: unknown) {
      const errorMsg =
        fileError instanceof Error ? fileError.message : "unknown error";
      core.warning(`Failed to read architecture docs file ${file}: ${errorMsg}`);
    }
  }

  return combinedDocs;
}

export function getArchitectureDocs(docsPath: string): string {
  try {
    if (!existsSync(docsPath)) {
      core.warning(`Architecture docs path not found: ${docsPath}`);
      return "";
    }

    const stat = statSync(docsPath);

    if (stat.isDirectory()) {
      return readMarkdownFilesFromDirectory(docsPath);
    }

    if (stat.isFile()) {
      const contents = readFileSync(docsPath, "utf8");
      return contents;
    }

    core.warning(`Architecture docs path is neither file nor directory: ${docsPath}`);
    return "";
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "unknown error";
    core.warning(`Error reading architecture docs: ${errorMsg}`);
    return "";
  }
}

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


