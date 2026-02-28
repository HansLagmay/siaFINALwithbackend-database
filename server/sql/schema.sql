CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL
);

CREATE TABLE properties (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE property_images (
    id VARCHAR(36) PRIMARY KEY,
    property_id VARCHAR(36),
    image_url VARCHAR(255) NOT NULL,
    FOREIGN KEY (property_id) REFERENCES properties(id)
);

CREATE TABLE inquiries (
    id VARCHAR(36) PRIMARY KEY,
    property_id VARCHAR(36),
    user_id VARCHAR(36),
    status VARCHAR(50),
    FOREIGN KEY (property_id) REFERENCES properties(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE calendar_events (
    id VARCHAR(36) PRIMARY KEY,
    event_date DATE,
    description TEXT
);

CREATE TABLE activity_log (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36),
    action VARCHAR(255),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);