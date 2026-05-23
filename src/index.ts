import * as core from "@actions/core";
import * as github from "@actions/github";
import { getPRDiff, getArchitectureDocs } from "./agents/retriever";
import { evaluatePR } from "./agents/judge";

async function run(): Promise<void> {
  try {
    const eventName = github.context.eventName;

    switch (eventName) {
      case "pull_request": {
        const prNumber = github.context.payload.pull_request?.number;

        if (!prNumber) {
          core.error("Pull request number not found in payload.");
          return;
        }

        // Read inputs
        const token = core.getInput("github_token", { required: true });
        const docsPath = core.getInput("docs_paths") || "architecture.md";
        const llmApiKey = core.getInput("llm_api_key", { required: true });

        // Instantiate Octokit
        const octokit = github.getOctokit(token);

        // Fetch PR diff
        const diff = await getPRDiff(octokit, github.context);

        // Fetch architecture documentation
        const architectureRules = getArchitectureDocs(docsPath);

        // Log context lengths
        core.info(`PR diff length: ${diff.length} characters`);
        core.info(`Architecture docs length: ${architectureRules.length} characters`);

        try {
          const grillReport = await evaluatePR(diff, architectureRules, llmApiKey);
          const issueNumber = github.context.issue.number ?? prNumber;

          if (!issueNumber) {
            core.error("Issue number not found for PR comment.");
            return;
          }

          await octokit.rest.issues.createComment({
            owner: github.context.repo.owner,
            repo: github.context.repo.repo,
            issue_number: issueNumber,
            body: grillReport,
          });

          core.info("Posted PR grill report comment.");
        } catch (error: unknown) {
          if (error instanceof Error) {
            core.setFailed(`OpenAI evaluation failed: ${error.message}`);
          } else {
            core.setFailed("OpenAI evaluation failed: unknown error.");
          }
          return;
        }

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

          // Read inputs
          const token = core.getInput("github_token", { required: true });
          const docsPath = core.getInput("docs_paths") || "architecture.md";

          // Instantiate Octokit
          const octokit = github.getOctokit(token);

          // Fetch PR diff
          const diff = await getPRDiff(octokit, github.context);

          // Fetch architecture documentation
          const architectureRules = getArchitectureDocs(docsPath);

          // Log context lengths
          core.info(`PR diff length: ${diff.length} characters`);
          core.info(`Architecture docs length: ${architectureRules.length} characters`);
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
