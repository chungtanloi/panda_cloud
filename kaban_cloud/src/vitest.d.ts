// Pulls in @testing-library/jest-dom's `expect` matcher augmentations
// (toBeInTheDocument, toBeDisabled, ...) for typechecking test files under
// src/. The runtime side is wired separately in vitest.setup.ts.
/// <reference types="@testing-library/jest-dom" />
