/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    // Look for tests in any folder named __tests__ or with the .test.ts suffix
    testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.ts$',
    // Ignore the 'dist' folder (the compiled JS)
    modulePathIgnorePatterns: ['<rootDir>/dist/'],
};