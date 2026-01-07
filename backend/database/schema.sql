-- Calendly Clone Database Schema
-- Run this script to create the database and tables

CREATE DATABASE IF NOT EXISTS calendly_clone;
USE calendly_clone;

-- Event Types Table
-- Stores different types of events that can be booked (e.g., "30-min Meeting", "1-hour Consultation")
CREATE TABLE event_types (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    duration_minutes INT NOT NULL DEFAULT 30,
    description TEXT,
    color VARCHAR(7) DEFAULT '#0069FF',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Availability Table
-- Stores recurring availability patterns for each event type
-- Each row represents availability for a specific day of week and time range
CREATE TABLE availability (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_type_id INT NOT NULL,
    day_of_week TINYINT NOT NULL COMMENT '0=Sunday, 1=Monday, ..., 6=Saturday',
    start_time TIME NOT NULL COMMENT 'Start time in HH:MM:SS format',
    end_time TIME NOT NULL COMMENT 'End time in HH:MM:SS format',
    timezone VARCHAR(50) NOT NULL DEFAULT 'UTC',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (event_type_id) REFERENCES event_types(id) ON DELETE CASCADE,
    UNIQUE KEY unique_availability (event_type_id, day_of_week, start_time, end_time),
    INDEX idx_event_type (event_type_id),
    INDEX idx_day_of_week (day_of_week)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Meetings Table
-- Stores actual booked meetings
CREATE TABLE meetings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_type_id INT NOT NULL,
    invitee_name VARCHAR(255) NOT NULL,
    invitee_email VARCHAR(255) NOT NULL,
    start_time DATETIME NOT NULL COMMENT 'Meeting start time in UTC',
    end_time DATETIME NOT NULL COMMENT 'Meeting end time in UTC',
    timezone VARCHAR(50) NOT NULL,
    status ENUM('scheduled', 'cancelled', 'completed') DEFAULT 'scheduled',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (event_type_id) REFERENCES event_types(id) ON DELETE CASCADE,
    INDEX idx_event_type (event_type_id),
    INDEX idx_start_time (start_time),
    INDEX idx_status (status),
    INDEX idx_invitee_email (invitee_email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Availability Overrides Table (Optional)
-- Allows overriding default availability for specific dates
-- Can be used to block dates or set custom availability
CREATE TABLE availability_overrides (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_type_id INT NOT NULL,
    override_date DATE NOT NULL,
    is_available BOOLEAN DEFAULT TRUE,
    start_time TIME NULL COMMENT 'Custom start time if available',
    end_time TIME NULL COMMENT 'Custom end time if available',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (event_type_id) REFERENCES event_types(id) ON DELETE CASCADE,
    UNIQUE KEY unique_override (event_type_id, override_date),
    INDEX idx_event_type (event_type_id),
    INDEX idx_override_date (override_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
