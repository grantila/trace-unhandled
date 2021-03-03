module.exports = {
  testEnvironment: "node",
  testMatch: ['<rootDir>/test/**/*.spec.js'],
  coverageReporters: ["lcov", "text", "html"],
  coveragePathIgnorePatterns: [ '/node_modules/', '/test/' ],
};
