# Installation & Setup Guide

## Prerequisites

### System Requirements
- **Operating System**: Windows 10/11, macOS 10.14+, or Linux (Ubuntu 18.04+)
- **Node.js**: Version 16.0 or higher
- **PostgreSQL**: Version 12.0 or higher
- **Memory**: Minimum 4GB RAM (8GB recommended)
- **Storage**: Minimum 500MB free space

### Software Dependencies
- Node.js and npm
- PostgreSQL database server
- Git (for cloning the repository)
- A modern web browser (Chrome, Firefox, Safari, Edge)

## Installation Steps

### 1. Clone the Repository
```bash
git clone <repository-url>
cd IoTIntrusionSystemDashboard
```

### 2. Install Node.js Dependencies
```bash
npm install
```

### 3. Database Setup

#### Install PostgreSQL
**Windows**:
- Download PostgreSQL from https://www.postgresql.org/download/windows/
- Run the installer and follow the setup wizard
- Note the password for the postgres user

**macOS**:
```bash
brew install postgresql
brew services start postgresql
```

**Linux (Ubuntu)**:
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

#### Create Database and User
```sql
-- Connect to PostgreSQL as postgres user
psql -U postgres

-- Create database
CREATE DATABASE iot_intrusion_db;

-- Create user
CREATE USER iot_user WITH PASSWORD 'your_secure_password';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE iot_intrusion_db TO iot_user;

-- Exit psql
\q
```

### 4. Environment Configuration

Create a `.env` file in the project root:
```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=iot_intrusion_db
DB_USER=iot_user
DB_PASSWORD=your_secure_password

# Session Configuration
SESSION_SECRET=your_very_secure_session_secret_key_here

# Application Configuration
NODE_ENV=development
PORT=3000

# Logging Configuration
LOG_LEVEL=info
LOG_FORMAT=combined

# Security Configuration
BCRYPT_ROUNDS=12
```

### 5. Database Migration
```bash
# Run database migrations
npm run db:migrate

# Check migration status
npm run db:status
```

### 6. Initialize Application
```bash
# Initialize the application with sample data
npm run init
```

### 7. Start the Application
```bash
# Development mode
npm start

# For production
NODE_ENV=production npm start
```

The application will be available at `http://localhost:3000`

## Configuration Options

### Environment Variables

#### Database Configuration
- `DB_HOST`: Database server hostname (default: localhost)
- `DB_PORT`: Database server port (default: 5432)
- `DB_NAME`: Database name
- `DB_USER`: Database username
- `DB_PASSWORD`: Database password
- `DB_SSL`: Enable SSL connection (default: false)

#### Application Configuration
- `NODE_ENV`: Environment mode (development/production)
- `PORT`: Application port (default: 3000)
- `SESSION_SECRET`: Secret key for session encryption
- `BCRYPT_ROUNDS`: Password hashing rounds (default: 12)

#### Logging Configuration
- `LOG_LEVEL`: Logging level (error, warn, info, debug)
- `LOG_FORMAT`: Log format (combined, common, dev, short, tiny)

### Database Migration Commands
```bash
# Run all pending migrations
npm run db:migrate

# Check migration status
npm run db:status

# Create new migration (manual process)
# Add new .sql file to migrations/ directory
```

## Development Setup

### Development Dependencies
```bash
# Install development dependencies
npm install --dev

# Run linting
npx eslint .

# Run in development mode with auto-restart
npm run dev
```

### Development Database
For development, you may want to use a separate database:
```env
# Development environment (.env.development)
DB_NAME=iot_intrusion_dev_db
```

## Production Deployment

### Production Environment Setup
1. **Server Requirements**:
   - Ubuntu 20.04 LTS or similar
   - Node.js 16+ installed
   - PostgreSQL 12+ installed
   - Nginx (recommended for reverse proxy)
   - SSL certificate for HTTPS

2. **Environment Configuration**:
```env
NODE_ENV=production
PORT=3000
DB_SSL=true
SESSION_SECRET=very_secure_production_secret
LOG_LEVEL=warn
```

3. **Process Management**:
```bash
# Install PM2 for process management
npm install -g pm2

# Start application with PM2
pm2 start app.js --name "iot-dashboard"

# Configure PM2 for auto-restart
pm2 startup
pm2 save
```

4. **Nginx Configuration**:
```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name your-domain.com;
    
    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Troubleshooting

### Common Issues

#### Database Connection Issues
**Error**: `ECONNREFUSED` or connection timeout
**Solutions**:
1. Verify PostgreSQL is running
2. Check database credentials
3. Verify network connectivity
4. Check firewall settings

#### Migration Failures
**Error**: Migration script fails
**Solutions**:
1. Check database permissions
2. Verify PostgreSQL version compatibility
3. Review migration SQL syntax
4. Check for existing data conflicts

#### Session Issues
**Error**: Session-related errors
**Solutions**:
1. Verify SESSION_SECRET is set
2. Check session store configuration
3. Clear browser cookies
4. Restart the application

#### Port Already in Use
**Error**: `EADDRINUSE`
**Solutions**:
1. Change PORT in environment configuration
2. Kill existing process using the port
3. Use different port for development

### Debugging

#### Enable Debug Logging
```env
LOG_LEVEL=debug
NODE_ENV=development
```

#### Database Query Logging
Add to database configuration:
```javascript
// In config/database.js
const config = {
  // ... other config
  logging: process.env.NODE_ENV === 'development' ? console.log : false
};
```

#### Check Application Logs
```bash
# View application logs
tail -f logs/app.log

# View error logs
tail -f logs/error.log

# PM2 logs (production)
pm2 logs iot-dashboard
```

## Security Considerations

### Production Security Checklist
- [ ] Use HTTPS in production
- [ ] Set secure session configuration
- [ ] Configure database SSL
- [ ] Set up firewall rules
- [ ] Regularly update dependencies
- [ ] Monitor security logs
- [ ] Implement backup strategy
- [ ] Use environment variables for secrets
- [ ] Configure CORS appropriately
- [ ] Set security headers

### Environment Variable Security
- Never commit `.env` files to version control
- Use different secrets for each environment
- Rotate secrets regularly
- Use strong, randomly generated secrets

## Backup and Recovery

### Database Backup
```bash
# Create backup
pg_dump -U iot_user -h localhost iot_intrusion_db > backup.sql

# Automated daily backup
0 2 * * * pg_dump -U iot_user -h localhost iot_intrusion_db > /backups/iot_$(date +\%Y\%m\%d).sql
```

### Database Recovery
```bash
# Restore from backup
psql -U iot_user -h localhost iot_intrusion_db < backup.sql
```

### Application Files Backup
- Code repository (Git)
- Configuration files
- Log files
- SSL certificates
- Environment files (securely stored)

## Monitoring and Maintenance

### Health Checks
- Database connectivity
- Application response time
- Memory usage
- Disk space
- Log file sizes

### Regular Maintenance Tasks
- Update Node.js dependencies
- PostgreSQL maintenance (VACUUM, ANALYZE)
- Log file rotation
- Security updates
- Performance monitoring
- Backup verification