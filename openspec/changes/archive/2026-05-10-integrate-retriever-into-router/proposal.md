## Why

The PR-Griller action currently has separate behavior for event routing and data retrieval. Integrating the retriever into the router ensures the action can fetch required PR context before executing either the Grill or Sync workflow.

## What Changes

- Add a new capability to wire `src/agents/retriever.ts` into `src/index.ts`.
- Read GitHub Action inputs `github_token` and `docs_paths` in the router.
- For `pull_request` events, fetch custom docs and the PR diff before proceeding.
- For `issue_comment` events, validate the comment is on a PR and matches `/pr-griller sync`, then fetch docs and diff.
- Preserve graceful failure behavior and log informative flow state.

## Capabilities

### New Capabilities
- `retriever-integration`: Connect the custom docs and PR diff retrieval logic to the main action router, enabling both Grill and Sync flows to load required context.

### Modified Capabilities
- 

## Impact

- Affected code: `src/index.ts`, `src/agents/retriever.ts`
- Dependencies: `@actions/core`, `@actions/github`
- Behavior: event routing now includes context preparation for both PR and comment-triggered flows.
