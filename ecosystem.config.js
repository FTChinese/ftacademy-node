const path = require('path');
const interpreter = path.resolve(process.env.HOME, 'n/n/versions/node/11.13.0/bin/node');

module.exports = {
  /**
   * Application configuration section
   * http://pm2.keymetrics.io/docs/usage/application-declaration/
   */
  apps : [
    {
      name      : "ftacademy",
      script    : "./index.js",
      cwd: __dirname,
      interpreter: interpreter,
      // See https://pm2.io/doc/en/runtime/guide/ecosystem-file/?utm_source=pm2&utm_medium=website&utm_campaign=rebranding
      // for how env is used.
      env: {
        NODE_ENV: "development",
        PORT: 4200,
        DEBUG: "fta*"
      },
      env_production : {
        NODE_ENV: "production",
        PORT: 4200,
        DEBUG: "fta*"
      },
      env_sandbox: {
        NODE_ENV: "sandbox",
        PORT: 4200,
        DEBUG: "fta*"
      },
      env_v2: {
        NODE_ENV: "production",
        PORT: 4200,
        DEBUG: "fta*"
      },
      max_restart: 10,
      error_file: path.resolve(process.env.HOME, 'logs/fta-err.log'),
      out_file: path.resolve(process.env.HOME, 'logs/fta-out.log')
    }
  ],
  deploy: {
    "production": {
      user: "node",
      host: "nodeserver",
      ref: "origin/master",
      repo: "https://github.com/FTChinese/ftacademy-node.git",
      path: "/home/node/next/ftacademy",
      "pre-setup": "node -v",
      "post-setup": "ls -la",
      "post-deploy": "npm install --production && pm2 startOrRestart ecosystem.config.js --env production"
    },
    "v2": {
      user: "node",
      host: "nodeserver",
      ref: "origin/master",
      repo: "https://github.com/FTChinese/ftacademy-node.git",
      path: "/home/node/next/ftacademy",
      "pre-setup": "node -v",
      "post-setup": "ls -la",
      "post-deploy": "npm install --production && pm2 startOrRestart ecosystem.config.js --env v2"
    },
    "sandbox": {
      user: "node",
      host: "nodeserver",
      ref: "origin/master",
      repo: "https://github.com/FTChinese/ftacademy-node.git",
      path: "/home/node/next/ftacademy",
      "pre-setup": "node -v",
      "post-setup": "ls -la",
      "post-deploy": "npm install --production && pm2 startOrRestart ecosystem.config.js --env sandbox"
    }
  }
}
