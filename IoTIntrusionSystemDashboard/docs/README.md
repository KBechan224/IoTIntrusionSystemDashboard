# IoT Intrusion System Dashboard

## Table of Contents
1. [System Description](#system-description)
2. [System Functionality](#system-functionality)
3. [Data Requirements & Business Rules](#data-requirements--business-rules)
4. [Entity Relationship Diagram (ERD)](#entity-relationship-diagram-erd)
5. [Database Normalization](#database-normalization)
6. [Installation & Setup](#installation--setup)
7. [API Documentation](#api-documentation)

## Documentation Files
- **[System Functionality](FUNCTIONALITY.md)** - Detailed description of each system functionality
- **[Data Requirements & Business Rules](BUSINESS_RULES.md)** - Complete data requirements and business rules
- **[Entity Relationship Diagram](ERD.md)** - Database ERD with relationships and analysis
- **[Database Normalization](NORMALIZATION.md)** - Comprehensive normalization analysis
- **[Installation Guide](INSTALLATION.md)** - Step-by-step installation and setup instructions
- **[API Documentation](API.md)** - Complete REST API reference

## System Description

The IoT Intrusion System Dashboard is a comprehensive security monitoring and management system designed specifically for Internet of Things (IoT) environments. The system provides real-time monitoring, threat detection, and security management capabilities for IoT devices across networks.

### Purpose
The primary purpose of this system is to:
- Monitor IoT devices in real-time
- Detect and respond to security threats and intrusions
- Provide centralized management of IoT device security
- Generate security alerts and reports
- Block unauthorized access attempts
- Manage user access to IoT devices

### Target Environment
- Small to medium-scale IoT deployments
- Enterprise IoT networks
- Smart home environments
- Industrial IoT systems
- Security-conscious organizations

### Technology Stack
- **Backend**: Node.js with Express.js framework
- **Database**: PostgreSQL with advanced indexing
- **Frontend**: Handlebars templating engine
- **Session Management**: Express-session
- **Authentication**: BCrypt for password hashing
- **Logging**: Winston logger
- **Environment**: Configurable through environment variables

### Key Features
1. **Real-time Device Monitoring**: Track IoT device status, connectivity, and health
2. **Security Alert System**: Automated threat detection and alert generation
3. **Access Control**: Role-based access control for device management
4. **Intrusion Detection**: Monitor and block suspicious activities
5. **Dashboard Analytics**: Visual representation of security metrics
6. **Audit Logging**: Comprehensive logging of all system activities
7. **User Management**: Multi-user support with role-based permissions

## Architecture Overview
The system follows a Model-View-Controller (MVC) architecture pattern with:
- **Routes**: Handle HTTP requests and responses
- **Models**: Database interactions and data management
- **Views**: User interface rendering with Handlebars
- **Middleware**: Authentication, logging, and request processing
- **Utils**: Utility functions and system initialization

The system is designed to be scalable, maintainable, and secure, following best practices for web application development and IoT security management.

## System Functionality

For detailed information about system functionality, see **[FUNCTIONALITY.md](FUNCTIONALITY.md)**.

The system provides comprehensive functionality across 9 core modules:
1. **Authentication & Authorization** - User registration, login, and session management
2. **Dashboard** - Real-time security monitoring and statistics
3. **Device Management** - IoT device registry and lifecycle management
4. **Security Alert Management** - Automated threat detection and alert handling
5. **Intrusion Detection** - Monitoring and blocking security violations
6. **Logging & Audit** - Comprehensive activity tracking and audit trails
7. **System Metrics** - Performance and health monitoring
8. **User Management** - User profiles and role-based access control
9. **API Integration** - RESTful API for programmatic access

## Data Requirements & Business Rules

For complete data requirements and business rules, see **[BUSINESS_RULES.md](BUSINESS_RULES.md)**.

The system implements comprehensive business rules covering:
- **Entity Data Requirements** - Detailed specifications for all 8 database entities
- **System-Wide Business Rules** - Security, data integrity, performance, and audit rules
- **Data Validation Rules** - Input validation and business logic validation
- **Error Handling Rules** - System and user error handling protocols

## Entity Relationship Diagram (ERD)

For the complete ERD analysis, see **[ERD.md](ERD.md)**.

The database design includes 8 main entities with properly normalized relationships:
- **USERS** - User accounts and authentication
- **DEVICES** - IoT device registry
- **SECURITY_RULES** - Configurable security policies
- **SECURITY_ALERTS** - Threat detection and alerting
- **BLOCKED_ATTEMPTS** - Intrusion attempt logging
- **DEVICE_LOGS** - Device activity logging
- **SYSTEM_METRICS** - Performance monitoring
- **USER_SESSIONS** - Session management

## Database Normalization

For detailed normalization analysis, see **[NORMALIZATION.md](NORMALIZATION.md)**.

The database achieves **Third Normal Form (3NF)** compliance with strategic design decisions:
- **1NF Compliance** - All attributes are atomic (with strategic JSONB usage)
- **2NF Compliance** - No partial dependencies (single-column primary keys)
- **3NF Compliance** - No transitive dependencies
- **Performance Optimization** - Strategic indexing and limited denormalization
- **Data Integrity** - Strong referential integrity through foreign key constraints

## Installation & Setup

For complete installation instructions, see **[INSTALLATION.md](INSTALLATION.md)**.

Quick start:
1. Install Node.js 16+ and PostgreSQL 12+
2. Clone repository and run `npm install`
3. Create database and configure `.env` file
4. Run `npm run db:migrate` and `npm run init`
5. Start with `npm start`

## API Documentation

For complete API reference, see **[API.md](API.md)**.

The system provides RESTful APIs for:
- **Device Management** - CRUD operations for IoT devices
- **Security Alerts** - Alert creation, management, and resolution
- **Dashboard Statistics** - Real-time system metrics
- **Authentication** - Session-based authentication required for all endpoints