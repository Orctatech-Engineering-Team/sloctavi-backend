// ecosystem.config.ts (or .js if you prefer)
export const apps = [
  {
    name: "orcta-api",
    script: "dist/src/index.js",
    interpreter: "node",
    instances: "max",                // Use all CPU cores
    exec_mode: "cluster",           // Cluster mode for scalability
    watch: false,                   // Disable for prod; enable in dev
    max_memory_restart: "1G",       // Auto-restart on memory spike
    env: {
      NODE_ENV: "production",
      PORT: 3000
    },
    env_development: {
      NODE_ENV: "development",
      PORT: 3001
    },
    error_file: "logs/api-error.log",
    out_file: "logs/api-out.log",
    log_file: "logs/api-combined.log",
    log_date_format: "YYYY-MM-DD HH:mm:ss",
    log_rotate: true,
    log_max_size: "10M",
    log_max_files: 30
  },
  {
    name: "orcta-worker",
    script: "dist/src/scripts/worker-manager.js",
    interpreter: "node",
    args: "start",                  // Optional CLI args for worker
    exec_mode: "fork",             // 1 process (for safety; scale later)
    instances: 1,
    watch: false,
    max_memory_restart: "1G",
    env: {
      NODE_ENV: "production"
    },
    env_development: {
      NODE_ENV: "development"
    },
    error_file: "logs/worker-error.log",
    out_file: "logs/worker-out.log",
    log_file: "logs/worker-combined.log",
    log_date_format: "YYYY-MM-DD HH:mm:ss",
    log_rotate: true,
    log_max_size: "10M",
    log_max_files: 30
  }
];
