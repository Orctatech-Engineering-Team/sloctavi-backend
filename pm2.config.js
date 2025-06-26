module.exports = {
  apps: [
    {
      name: "sloctavi-backend",
      script: "dist/src/index.js",
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
      },
      error_file: "logs/error.log",
      out_file: "logs/out.log",
      log_file: "logs/combined.log",
    },
    {
      name: "email-worker",
      script: "dist/src/scripts/worker-manager.js",
      args: "start",
      watch: false,
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "production",
      },
      error_file: "logs/worker-error.log",
      out_file: "logs/worker-out.log",
      log_file: "logs/worker-combined.log",
    }
  ],
}
