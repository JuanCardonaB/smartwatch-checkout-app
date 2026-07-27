import '@testing-library/jest-dom';

// Polyfills required by react-router-dom v7 in jsdom environment
import { TextEncoder, TextDecoder } from 'util';
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as typeof global.TextDecoder;
