# Documentation Index

This folder contains comprehensive documentation for the IoT Intrusion System Dashboard project.

## 📋 Documentation Overview

### Core Documentation Files

| Document | Description | Key Content |
|----------|-------------|-------------|
| **[README.md](README.md)** | Main project documentation | System overview, architecture, quick reference |
| **[FUNCTIONALITY.md](FUNCTIONALITY.md)** | System functionality details | Complete feature descriptions, 9 core modules |
| **[BUSINESS_RULES.md](BUSINESS_RULES.md)** | Data requirements & business rules | Entity requirements, validation rules, constraints |
| **[ERD.md](ERD.md)** | Entity Relationship Diagram | Database schema, relationships, indexing strategy |
| **[NORMALIZATION.md](NORMALIZATION.md)** | Database normalization analysis | 1NF-3NF compliance, optimization decisions |
| **[INSTALLATION.md](INSTALLATION.md)** | Installation & setup guide | Step-by-step setup, configuration, deployment |
| **[API.md](API.md)** | REST API documentation | Complete API reference, endpoints, examples |

## 🏗️ System Architecture Summary

### Technology Stack
- **Backend**: Node.js + Express.js
- **Database**: PostgreSQL with JSONB support
- **Frontend**: Handlebars templating
- **Authentication**: BCrypt + Express-session
- **Logging**: Winston logger

### Core Entities (8 Tables)
1. **USERS** - Authentication and user management
2. **DEVICES** - IoT device registry
3. **SECURITY_RULES** - Configurable security policies
4. **SECURITY_ALERTS** - Threat detection and management
5. **BLOCKED_ATTEMPTS** - Intrusion attempt logging
6. **DEVICE_LOGS** - Device activity tracking
7. **SYSTEM_METRICS** - Performance monitoring
8. **USER_SESSIONS** - Session management

### Functional Modules (9 Modules)
1. **Authentication & Authorization** - User security
2. **Dashboard** - Real-time monitoring
3. **Device Management** - IoT device lifecycle
4. **Security Alert Management** - Threat handling
5. **Intrusion Detection** - Security monitoring
6. **Logging & Audit** - Activity tracking
7. **System Metrics** - Performance monitoring
8. **User Management** - User administration
9. **API Integration** - Programmatic access

## 📊 Key System Features

### Security Features
- Real-time threat detection
- Automated security alerts
- Intrusion attempt blocking
- Role-based access control
- Comprehensive audit logging
- Session-based authentication

### Monitoring Capabilities
- Device status tracking
- Performance metrics collection
- Security event correlation
- Dashboard analytics
- Historical trend analysis

### Management Features
- Device lifecycle management
- User administration
- Alert resolution workflow
- Configuration management
- System health monitoring

## 🗄️ Database Design Highlights

### Normalization Level: 3NF
- **1NF**: Atomic values (strategic JSONB usage)
- **2NF**: No partial dependencies
- **3NF**: No transitive dependencies
- **Performance**: Strategic indexing and optimization

### Key Relationships
- Users → Security Rules, Alerts, Sessions
- Devices → Alerts, Logs, Metrics, Blocked Attempts
- Proper foreign key constraints
- Cascading behavior for data integrity

### Business Rules Summary
- 100+ comprehensive business rules
- Data validation and integrity
- Security constraints
- Error handling protocols
- Audit and compliance requirements

## 🚀 Quick Start Guide

### Prerequisites
- Node.js 16+
- PostgreSQL 12+
- 4GB+ RAM

### Installation Steps
```bash
1. git clone <repository>
2. npm install
3. Configure .env file
4. npm run db:migrate
5. npm run init
6. npm start
```

### Access Points
- **Web Dashboard**: http://localhost:3000
- **API Base URL**: http://localhost:3000/api
- **Authentication**: Required for all access

## 📡 API Summary

### Device Management
- `GET /api/devices` - List devices
- `POST /api/devices` - Create device
- `PUT /api/devices/:id` - Update device
- `DELETE /api/devices/:id` - Delete device

### Security Alerts
- `GET /api/alerts` - List alerts
- `POST /api/alerts` - Create alert
- `PUT /api/alerts/:id/resolve` - Resolve alert
- `GET /api/alerts/stats/summary` - Alert statistics

### Dashboard
- `GET /dashboard/api/stats` - System statistics
- `POST /dashboard/api/populate-sample-data` - Generate test data

## 🛡️ Security Considerations

### Production Security
- HTTPS enforcement
- Environment variable security
- Database SSL connections
- Session security
- Input validation and sanitization
- SQL injection prevention
- XSS protection

### Access Control
- Role-based permissions (admin/user)
- Device access permissions
- Session-based authentication
- Audit trail for all actions

## 🔧 Maintenance & Operations

### Monitoring
- Application health checks
- Database performance monitoring
- Log file management
- Security event monitoring

### Backup Strategy
- Database backups
- Configuration backups
- Log archival
- Disaster recovery planning

## 📈 Scalability Considerations

### Horizontal Scaling
- Read replicas for dashboards
- Time-based partitioning for logs
- Connection pooling
- Load balancing

### Performance Optimization
- Strategic indexing
- Query optimization
- Caching strategies
- Resource monitoring

## 🔍 Troubleshooting Quick Reference

### Common Issues
- Database connection problems
- Session-related errors
- Migration failures
- Port conflicts

### Debug Resources
- Application logs
- Database query logs
- Error stack traces
- Performance metrics

## 📝 Documentation Maintenance

### Updating Documentation
- Keep documents synchronized with code changes
- Update ERD when schema changes
- Refresh API documentation for new endpoints
- Update business rules for new requirements

### Version Control
- Document version alongside code versions
- Maintain changelog for significant updates
- Review documentation in code reviews
- Archive old documentation versions

## 🎯 Next Steps

### For Developers
1. Review [FUNCTIONALITY.md](FUNCTIONALITY.md) for feature understanding
2. Study [ERD.md](ERD.md) for database design
3. Follow [INSTALLATION.md](INSTALLATION.md) for setup
4. Use [API.md](API.md) for integration

### For System Administrators
1. Follow [INSTALLATION.md](INSTALLATION.md) for deployment
2. Review [BUSINESS_RULES.md](BUSINESS_RULES.md) for operational rules
3. Implement monitoring based on system requirements
4. Establish backup and security procedures

### For Security Teams
1. Review security features in [FUNCTIONALITY.md](FUNCTIONALITY.md)
2. Understand threat detection in [BUSINESS_RULES.md](BUSINESS_RULES.md)
3. Configure security rules and policies
4. Monitor security alerts and incidents

---

**Last Updated**: Generated automatically with project documentation
**Maintainer**: Project development team
**Review Cycle**: Update with major system changes