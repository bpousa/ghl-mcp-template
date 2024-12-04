CREATE TABLE IF NOT EXISTS ghl_api_keys (
  id INT PRIMARY KEY AUTO_INCREMENT,
  location_id VARCHAR(255) UNIQUE NOT NULL,
  agency_id VARCHAR(255) NOT NULL,
  api_key TEXT NOT NULL,
  location_name VARCHAR(255),
  agency_name VARCHAR(255),
  generated_by VARCHAR(100),
  generated_at DATETIME,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_agency_id (agency_id),
  INDEX idx_generated_at (generated_at)
);