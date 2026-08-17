// Tests don't care which contract release a build is pinned to; setting it
// keeps apiConfig's startup check quiet in test output.
process.env.NEXT_PUBLIC_CONTRACT_VERSION ??= "test";

import "@testing-library/jest-dom/vitest";
