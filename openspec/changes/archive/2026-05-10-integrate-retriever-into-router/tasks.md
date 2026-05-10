## Implementation Tasks

- [x] Update `src/index.ts` imports
  - Import `core` from `@actions/core` and `github` from `@actions/github`.
  - Import `getCustomDocs` and `getPRDiff` from `./agents/retriever`.

- [x] Read required inputs at the start of `run()`
  - `const token = core.getInput('github_token', { required: true });`
  - `const docsPaths = core.getInput('docs_paths') || 'architecture.md';`

- [x] Extend the `pull_request` flow
  - Safely extract `prNumber` from `github.context.payload.pull_request?.number`.
  - If missing, log an error and return.
  - Call `getCustomDocs(docsPaths)`.
  - Call `await getPRDiff(token, github.context.repo.owner, github.context.repo.repo, prNumber)`.
  - Log a success message when docs and diff are fetched.

- [x] Extend the `issue_comment` flow
  - Extract and trim the comment body.
  - Confirm the comment is on a PR by checking `github.context.payload.issue?.pull_request`.
  - If not, log `Comment is not on a pull request. Ignoring.` and return.
  - Extract `prNumber` from `github.context.payload.issue?.number`.
  - If missing, log an error and return.
  - If the comment body matches `/pr-griller sync`, fetch docs and diff exactly like the `pull_request` flow.
  - Log a success message when docs and diff are fetched.

- [x] Keep unsupported events unchanged
  - For other events, log `Unsupported event trigger` and return cleanly.

- [x] Preserve error handling
  - Keep `try/catch` around the router logic.
  - In the catch block, call `core.setFailed(error.message)` for any thrown errors.
