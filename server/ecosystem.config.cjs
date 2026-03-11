module.exports = {
    apps: [{
        name: 'lenco-vps-backend',
        script: './index.js',
        instances: '1',
        autorestart: true,
        watch: false,
        max_memory_restart: '1G',
        env_production: {
            NODE_ENV: 'production',
            PORT: 3001
        }
    }]
};
