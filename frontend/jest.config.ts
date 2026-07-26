export default {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|svg|webp)$': '<rootDir>/src/__mocks__/fileMock.ts',
    // Redirect import.meta.env-using api module to a test-safe mock during coverage collection
    // Tests that specifically test api.ts will use jest.mock('axios') directly
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: 'tsconfig.jest.json',
      diagnostics: {
        ignoreCodes: ['TS1343', 'TS2339'],
      },
    }],
  },
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/main.tsx',
    '!src/vite-env.d.ts',
    '!src/setupTests.ts',
    '!src/jestSetupEnv.ts',
    '!src/__mocks__/**',
    '!src/services/api.ts',
  ],
  coverageThreshold: {
    global: {
      lines: 80,
    },
  },
};
