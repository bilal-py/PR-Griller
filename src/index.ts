import * as core from "@actions/core";
import * as github from "@actions/github";
import { getCustomDocs, getPRDiff } from "./agents/retriever";

async function run(): Promise<void> {
  try {
    // Read inputs
    const token = core.getInput("github_token", { required: true });
    const docsPaths = core.getInput("docs_paths") || "architecture.md";

    const eventName = github.context.eventName;

    switch (eventName) {
      case "pull_request": {
        const prNumber = github.context.payload.pull_request?.number;

        if (!prNumber) {
          core.error("Pull request number not found in payload.");
          return;
        }

        const docsContext = getCustomDocs(docsPaths);
        const prDiff = await getPRDiff(
          token,
          github.context.repo.owner,
          github.context.repo.repo,
          prNumber
        );

        core.info("Successfully fetched docs and PR diff for The Grill Flow.");
        break;
      }

      case "issue_comment": {
        // Verify comment is on a PR
        if (!github.context.payload.issue?.pull_request) {
          core.info("Comment is not on a pull request. Ignoring.");
          return;
        }

        const commentBody = github.context.payload.comment?.body?.trim();

        if (commentBody === "/pr-griller sync") {
          const prNumber = github.context.payload.issue?.number;

          if (!prNumber) {
            core.error("Pull request number not found in payload.");
            return;
          }

          const docsContext = getCustomDocs(docsPaths);
          const prDiff = await getPRDiff(
            token,
            github.context.repo.owner,
            github.context.repo.repo,
            prNumber
          );

          core.info("Successfully fetched docs and PR diff for The Sync Flow.");
        } else {
          core.info("Ignored comment: not a sync command");
        }
        break;
      }

      default:
        core.info("Unsupported event trigger");
        break;
    }
  } catch (error: unknown) {
    if (error instanceof Error) {
      core.setFailed(error.message);
    } else {
      core.setFailed("An unexpected error occurred.");
    }
  }
}

run();