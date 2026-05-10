## Overview

This design describes how `src/index.ts` will act as the main event router for PR-Griller while using `src/agents/retriever.ts` to gather the required execution context.

## Router Responsibilities

- Read action inputs at runtime.
- Determine the GitHub event type from `github.context.eventName`.
- For supported events, fetch the required docs and PR diff context.
- Preserve the existing try/catch structure and graceful failure behavior.

## Inputs

- `github_token` (required): used to authenticate GitHub API calls.
- `docs_paths` (optional): comma-separated paths for custom documentation files. Uses `architecture.md` by default.

## Flow Details

### pull_request

1. Extract the PR number from `github.context.payload.pull_request?.number`.
2. If the PR number is missing, log an error and return cleanly.
3. Use `getCustomDocs(docsPaths)` to collect docs content.
4. Use `getPRDiff(token, owner, repo, prNumber)` to fetch the PR diff.
5. Log that docs and diff were successfully fetched for the Grill Flow.

### issue_comment

1. Extract comment body from `github.context.payload.comment?.body`.
2. Validate the comment matches `/pr-griller sync` after trimming whitespace.
3. Verify `github.context.payload.issue?.pull_request` exists to confirm the comment is on a PR.
4. Extract `prNumber` from `github.context.payload.issue?.number`.
5. If `prNumber` is missing, log an error and return cleanly.
6. Fetch docs and diff exactly as in the pull request flow.
7. Log that docs and diff were successfully fetched for the Sync Flow.

### Unsupported events

- Log `Unsupported event trigger` and exit cleanly.

## Error Handling

- Keep the router's `try/catch` block intact.
- Use `core.setFailed(error.message)` in the catch block.
- For missing PR number or non-PR comments, use `core.error` or `core.info` and return without throwing.

## Implementation Notes

- Import `getCustomDocs` and `getPRDiff` from `./agents/retriever`.
- Use strict TypeScript typing for all extracted values.
- Any context preparation is kept in memory only; no LLM or downstream processing is implemented yet.
