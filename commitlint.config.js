module.exports = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [
      2,
      "always",
      [
        "feat", // New feature
        "fix", // Bug fix
        "docs", // Documentation only changes
        "style", // Changes that don't affect code meaning
        "refactor", // Code change that neither fixes a bug nor adds a feature
        "perf", // Performance improvement
        "test", // Adding missing tests or correcting existing tests
        "chore", // Changes to build process or auxiliary tools
        "ci", // Changes to CI configuration files and scripts
        "revert", // Reverts a previous commit
      ],
    ],
    "subject-case": [0], // Allow any case for subject
  },
};
