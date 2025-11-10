// PM2 ecosystem configuration for Baitul Jannah School
// Adjust PORT, instances, and paths as needed on your server.
module.exports = {
  apps: [
    {
      name: 'baituljannah',
      script: 'app.js',
      // If you run pm2 from the project root, you can keep cwd as '.'
      cwd: '.',
      instances: 1, // set to 'max' to use all CPU cores (cluster mode)
      exec_mode: 'fork', // use 'cluster' if you set instances > 1
      watch: false,
      autorestart: true,
      max_memory_restart: '300M',
      // Use PM2 default log location (~/.pm2/logs). Uncomment below if you prefer project logs folder
      // out_file: './logs/out.log',
      // error_file: './logs/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      env: {
        NODE_ENV: 'development',
        PORT: 3000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    }
  ]
};