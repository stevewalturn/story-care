/** @type {import('@commitlint/types').UserConfig} */
const Configuration = {
  extends: ['@commitlint/config-conventional'],
  ignores: [message => message.startsWith('chore: bump')], // Ignore dependabot commits
};

export default Configuration;
