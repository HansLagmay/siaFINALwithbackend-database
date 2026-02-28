-- TES Property System - MySQL Schema
-- Database: TESdb

CREATE DATABASE IF NOT EXISTS TESdb CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE TESdb;

-- Users
CREATE TABLE IF NOT EXISTS users (
  id          VARCHAR(36)  PRIMARY KEY,
  email       VARCHAR(255) NOT NULL UNIQUE,
  password    VARCHAR(255) NOT NULL,
  name        VARCHAR(255) NOT NULL DEFAULT '',
  role        VARCHAR(50)  NOT NULL DEFAULT 'agent',
  phone       VARCHAR(50)  DEFAULT '',
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Properties
CREATE TABLE IF NOT EXISTS properties (
  id          VARCHAR(36)   PRIMARY KEY,
  title       VARCHAR(255)  NOT NULL DEFAULT '',
  type        VARCHAR(100)  NOT NULL DEFAULT 'House',
  price       DECIMAL(15,2) NOT NULL DEFAULT 0,
  location    VARCHAR(255)  NOT NULL DEFAULT '',
  bedrooms    INT           NOT NULL DEFAULT 0,
  bathrooms   INT           NOT NULL DEFAULT 0,
  area        DECIMAL(10,2) NOT NULL DEFAULT 0,
  description TEXT,
  status      VARCHAR(50)   NOT NULL DEFAULT 'available',
  image_url   VARCHAR(512)  DEFAULT '',
  features    JSON,
  created_by  VARCHAR(255)  DEFAULT '',
  created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Property images (multiple images per property)
CREATE TABLE IF NOT EXISTS property_images (
  id          VARCHAR(36)  PRIMARY KEY,
  property_id VARCHAR(36)  NOT NULL,
  image_url   VARCHAR(512) NOT NULL,
  is_primary  TINYINT(1)   NOT NULL DEFAULT 0,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
);

-- Inquiries
CREATE TABLE IF NOT EXISTS inquiries (
  id                  VARCHAR(36)   PRIMARY KEY,
  ticket_number       VARCHAR(50)   NOT NULL UNIQUE,
  name                VARCHAR(255)  NOT NULL DEFAULT '',
  email               VARCHAR(255)  NOT NULL,
  phone               VARCHAR(50)   DEFAULT '',
  message             TEXT,
  property_id         VARCHAR(36)   DEFAULT NULL,
  property_title      VARCHAR(255)  DEFAULT NULL,
  property_price      DECIMAL(15,2) DEFAULT NULL,
  property_location   VARCHAR(255)  DEFAULT NULL,
  status              VARCHAR(50)   NOT NULL DEFAULT 'new',
  assigned_to         VARCHAR(36)   DEFAULT NULL,
  claimed_by          VARCHAR(36)   DEFAULT NULL,
  assigned_by         VARCHAR(36)   DEFAULT NULL,
  claimed_at          DATETIME      DEFAULT NULL,
  assigned_at         DATETIME      DEFAULT NULL,
  notes               JSON,
  last_follow_up_at   DATETIME      DEFAULT NULL,
  next_follow_up_at   DATETIME      DEFAULT NULL,
  created_at          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  closed_at           DATETIME      DEFAULT NULL
);

-- Calendar events
CREATE TABLE IF NOT EXISTS calendar_events (
  id          VARCHAR(36)  PRIMARY KEY,
  title       VARCHAR(255) NOT NULL DEFAULT '',
  description TEXT,
  type        VARCHAR(100) DEFAULT 'meeting',
  start_time  DATETIME     NOT NULL,
  end_time    DATETIME     NOT NULL,
  agent_id    VARCHAR(36)  DEFAULT NULL,
  created_by  VARCHAR(255) DEFAULT '',
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME     DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP
);

-- Activity log
CREATE TABLE IF NOT EXISTS activity_log (
  id           VARCHAR(36)  PRIMARY KEY,
  action       VARCHAR(255) NOT NULL,
  description  TEXT,
  performed_by VARCHAR(255) DEFAULT '',
  timestamp    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
);