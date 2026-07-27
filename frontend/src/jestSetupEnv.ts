// Polyfill import.meta.env for Jest (Vite uses import.meta.env, Jest does not)
// @ts-expect-error - global augmentation for test environment
globalThis.importMeta = { env: {} };

// The actual shim: ts-jest with diagnostics ignored for TS1343/TS2339,
// and we need the runtime value to not crash.
// We patch this via the transform diagnostics ignore in jest.config.ts.
// At runtime in Jest, `import.meta` is not available in CommonJS,
// so api.ts is mocked in tests that need it.
