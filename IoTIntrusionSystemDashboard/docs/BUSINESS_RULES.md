# Data Requirements & Business Rules

## Overview
This document outlines the data requirements, business rules, and constraints that govern the IoT Intrusion System Dashboard. These rules ensure data integrity, system security, and proper business logic implementation.

## Entity Data Requirements

### 1. Users Entity

#### Data Requirements
- **Primary Key**: Auto-incrementing integer ID
- **Name**: Required, varchar(255), human-readable full name
- **Email**: Required, unique, varchar(255), valid email format
- **Password Hash**: Required, varchar(255), BCrypt hashed password
- **Role**: Optional, varchar(50), default 'user'
- **Active Status**: Optional, boolean, default true
- **Timestamps**: Creation, update, and last login timestamps

#### Business Rules
- **BR-U001**: Email addresses must be unique across all users
- **BR-U002**: Passwords must be minimum 8 characters long
- **BR-U003**: Only active users can authenticate and access the system
- **BR-U004**: User roles determine system access permissions
- **BR-U005**: Last login timestamp must be updated on successful authentication
- **BR-U006**: Inactive users cannot perform any system operations
- **BR-U007**: Email format must be validated before account creation

### 2. Devices Entity

#### Data Requirements
- **Primary Key**: Auto-incrementing integer ID
- **Name**: Required, varchar(255), human-readable device name
- **Device Type**: Required, varchar(100), categorized device classification
- **MAC Address**: Optional, varchar(17), unique network identifier
- **IP Address**: Optional, INET type, network address
- **Status**: Optional, varchar(50), default 'offline'
- **Location**: Optional, varchar(255), physical or logical location
- **Firmware Version**: Optional, varchar(50), device firmware information
- **Timestamps**: Last seen, creation, and update timestamps

#### Business Rules
- **BR-D001**: Device names must be unique within the system
- **BR-D002**: MAC addresses must be unique when specified
- **BR-D003**: Device status must be one of: 'online', 'offline', 'alert'
- **BR-D004**: Valid device types include: 'camera', 'sensor', 'router', 'gateway', 'controller'
- **BR-D005**: Last seen timestamp updates when device status changes to 'online'
- **BR-D006**: Offline devices cannot accept new connections
- **BR-D007**: Device firmware version should be tracked for security updates
- **BR-D008**: IP addresses must be valid IPv4 or IPv6 format when specified

### 3. Security Rules Entity

#### Data Requirements
- **Primary Key**: Auto-incrementing integer ID
- **Rule Name**: Required, varchar(255), descriptive rule identifier
- **Rule Type**: Required, varchar(100), categorized rule classification
- **Conditions**: Required, JSONB, rule evaluation criteria
- **Actions**: Required, JSONB, automated response actions
- **Active Status**: Optional, boolean, default true
- **Priority**: Optional, integer, default 100
- **Created By**: Optional, foreign key to users table
- **Timestamps**: Creation and update timestamps

#### Business Rules
- **BR-SR001**: Rule names must be unique within the system
- **BR-SR002**: Valid rule types: 'firewall', 'intrusion_detection', 'access_control'
- **BR-SR003**: Conditions must be valid JSON format
- **BR-SR004**: Actions must be valid JSON format
- **BR-SR005**: Only active rules are evaluated during security checks
- **BR-SR006**: Lower priority numbers indicate higher priority (1 = highest)
- **BR-SR007**: Rules must have a valid creator when specified
- **BR-SR008**: Conditions must contain at least one evaluation criterion

### 4. Security Alerts Entity

#### Data Requirements
- **Primary Key**: Auto-incrementing integer ID
- **Device ID**: Optional, foreign key to devices table
- **Alert Type**: Required, varchar(100), categorized alert classification
- **Severity**: Required, varchar(20), alert importance level
- **Description**: Optional, text, detailed alert information
- **Source IP**: Optional, INET, originating IP address
- **Detection Timestamp**: Auto-generated, timestamp of alert creation
- **Resolution Timestamp**: Optional, timestamp when alert resolved
- **Status**: Optional, varchar(50), default 'active'
- **Resolved By**: Optional, foreign key to users table
- **Metadata**: Optional, JSONB, additional alert context

#### Business Rules
- **BR-SA001**: Valid severity levels: 'low', 'medium', 'high', 'critical'
- **BR-SA002**: Valid status values: 'active', 'investigating', 'resolved', 'false_positive'
- **BR-SA003**: Resolution timestamp can only be set when status is 'resolved'
- **BR-SA004**: Active alerts require immediate attention
- **BR-SA005**: Critical alerts must be addressed within 1 hour
- **BR-SA006**: High severity alerts must be addressed within 4 hours
- **BR-SA007**: Resolved alerts cannot be modified except for status changes
- **BR-SA008**: Alert metadata must be valid JSON when specified

### 5. Blocked Attempts Entity

#### Data Requirements
- **Primary Key**: Auto-incrementing integer ID
- **Source IP**: Required, INET, originating IP address
- **Target Device ID**: Optional, foreign key to devices table
- **Attempt Type**: Required, varchar(100), categorized attempt classification
- **Blocked Timestamp**: Auto-generated, timestamp of blocking action
- **Attempt Count**: Optional, integer, default 1
- **User Agent**: Optional, text, browser/client identification
- **Request Details**: Optional, JSONB, additional attempt information

#### Business Rules
- **BR-BA001**: Valid attempt types: 'brute_force', 'port_scan', 'malware', 'unauthorized_access'
- **BR-BA002**: Attempt count must be positive integer
- **BR-BA003**: Source IP must be valid IPv4 or IPv6 address
- **BR-BA004**: Blocked attempts are immutable once created
- **BR-BA005**: Multiple attempts from same IP within 1 hour increment attempt count
- **BR-BA006**: Request details must be valid JSON when specified

### 6. Device Logs Entity

#### Data Requirements
- **Primary Key**: Auto-incrementing integer ID
- **Device ID**: Optional, foreign key to devices table
- **Log Level**: Required, varchar(20), log severity classification
- **Message**: Required, text, log message content
- **Event Type**: Optional, varchar(100), categorized event classification
- **Creation Timestamp**: Auto-generated, timestamp of log creation
- **Metadata**: Optional, JSONB, additional log context

#### Business Rules
- **BR-DL001**: Valid log levels: 'info', 'warning', 'error', 'debug'
- **BR-DL002**: Valid event types: 'connection', 'disconnection', 'data_transmission', 'error', 'heartbeat'
- **BR-DL003**: Log messages cannot be empty
- **BR-DL004**: Device logs are immutable once created
- **BR-DL005**: Metadata must be valid JSON when specified
- **BR-DL006**: Error level logs require immediate investigation

### 7. System Metrics Entity

#### Data Requirements
- **Primary Key**: Auto-incrementing integer ID
- **Metric Type**: Required, varchar(50), categorized metric classification
- **Metric Value**: Required, decimal(5,2), numeric measurement value
- **Unit**: Optional, varchar(20), default 'percent'
- **Recording Timestamp**: Auto-generated, timestamp of metric recording
- **Device ID**: Optional, foreign key to devices table

#### Business Rules
- **BR-SM001**: Valid metric types: 'cpu', 'memory', 'network', 'storage'
- **BR-SM002**: Metric values must be non-negative
- **BR-SM003**: Percentage values must be between 0 and 100
- **BR-SM004**: System-wide metrics have null device_id
- **BR-SM005**: Device-specific metrics must reference valid device
- **BR-SM006**: Metrics are recorded at regular intervals (configurable)

### 8. User Sessions Entity

#### Data Requirements
- **Primary Key**: Auto-incrementing integer ID
- **User ID**: Required, foreign key to users table
- **Session Token**: Required, varchar(255), unique session identifier
- **IP Address**: Optional, INET, client IP address
- **User Agent**: Optional, text, client browser/application
- **Creation Timestamp**: Auto-generated, session start time
- **Expiration Timestamp**: Required, session timeout
- **Active Status**: Optional, boolean, default true

#### Business Rules
- **BR-US001**: Session tokens must be unique across all sessions
- **BR-US002**: Expired sessions cannot be used for authentication
- **BR-US003**: Inactive sessions cannot be used for authentication
- **BR-US004**: Session expiration must be in the future when created
- **BR-US005**: Only one active session per user (configurable)
- **BR-US006**: Sessions must be destroyed on logout
- **BR-US007**: Session timeout period is configurable (default 24 hours)

## System-Wide Business Rules

### Security Rules
- **BR-SYS001**: All passwords must be hashed using BCrypt with minimum 10 salt rounds
- **BR-SYS002**: Failed login attempts must be logged for security analysis
- **BR-SYS003**: Suspicious activities must trigger automatic security alerts
- **BR-SYS004**: Admin users have full system access, regular users have limited access
- **BR-SYS005**: Device access requires active user session and appropriate permissions

### Data Integrity Rules
- **BR-SYS006**: All foreign key relationships must be maintained
- **BR-SYS007**: Cascading deletes must be carefully controlled to prevent data loss
- **BR-SYS008**: Timestamps must be stored in UTC format
- **BR-SYS009**: JSON data must be validated before storage
- **BR-SYS010**: Database transactions must be used for multi-table operations

### Performance Rules
- **BR-SYS011**: Database queries must be optimized with appropriate indexes
- **BR-SYS012**: Large result sets must implement pagination
- **BR-SYS013**: Long-running operations must provide progress feedback
- **BR-SYS014**: System metrics must be collected without impacting performance

### Audit and Compliance Rules
- **BR-SYS015**: All user actions must be logged for audit purposes
- **BR-SYS016**: Sensitive data access must be tracked and monitored
- **BR-SYS017**: System configuration changes must be logged
- **BR-SYS018**: Data retention policies must be enforced
- **BR-SYS019**: Regular database backups must be maintained

## Data Validation Rules

### Input Validation
- **BR-VAL001**: All user inputs must be validated and sanitized
- **BR-VAL002**: SQL injection prevention must be implemented
- **BR-VAL003**: Cross-site scripting (XSS) prevention must be implemented
- **BR-VAL004**: File uploads must be validated for type and size
- **BR-VAL005**: Date and time inputs must be validated for proper format

### Business Logic Validation
- **BR-VAL006**: Device connections require device to be online
- **BR-VAL007**: Alert resolution requires appropriate user permissions
- **BR-VAL008**: User role changes require admin privileges
- **BR-VAL009**: Critical alerts cannot be marked as false positives without justification
- **BR-VAL010**: System configuration changes require admin approval

## Error Handling Rules

### System Error Handling
- **BR-ERR001**: Database connection failures must be handled gracefully
- **BR-ERR002**: User-friendly error messages must not expose system internals
- **BR-ERR003**: Critical errors must trigger immediate notifications
- **BR-ERR004**: Error recovery mechanisms must be implemented where possible
- **BR-ERR005**: All errors must be logged with sufficient detail for debugging

### User Error Handling
- **BR-ERR006**: Invalid user inputs must provide clear correction guidance
- **BR-ERR007**: Permission denied errors must explain required permissions
- **BR-ERR008**: Session timeout must redirect to login with clear message
- **BR-ERR009**: Form validation errors must highlight specific fields
- **BR-ERR010**: Network errors must provide retry options where appropriate