require('dotenv').config(); // This loads the environment variables from .env

const apps = [
  './AI-api/',
  './lambda/',
  './ui-editor-layer/',
  './tools/dynamodb-utils/'
].map((dir, index) => ({
  name: dir.split('/').filter(Boolean).pop(),
  cwd: dir,
  script: index === 2 ? 'npm run dev' : 'npm start',
  watch: true,
  env: process.env, // This applies the loaded environment variables
  autorestart: index === 3 ? false : true,
  restart_delay: 5000,
  pre_start: [
    {
      name: `npm-install-${dir.split('/').filter(Boolean).pop()}`,
      script: 'npm',
      args: 'install'
    }
  ]
}));

module.exports = { apps };