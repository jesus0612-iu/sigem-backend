CREATE DATABASE IF NOT EXISTS sigem CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE sigem;

CREATE TABLE IF NOT EXISTS usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  email VARCHAR(120) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  rol ENUM('administrador','tecnico','responsable') NOT NULL DEFAULT 'tecnico',
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS equipos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(120) NOT NULL,
  tipo VARCHAR(60) NOT NULL,
  ubicacion VARCHAR(120) NOT NULL,
  estado ENUM('operativo','en_mantenimiento','fuera_de_servicio') NOT NULL DEFAULT 'operativo',
  responsable_id INT NULL,
  proximo_mantenimiento DATE NULL,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (responsable_id) REFERENCES usuarios(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS mantenimientos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  equipo_id INT NOT NULL,
  tecnico_id INT NOT NULL,
  tipo ENUM('preventivo','correctivo') NOT NULL,
  fecha DATE NOT NULL,
  descripcion TEXT NOT NULL,
  costo DECIMAL(12,2) NOT NULL DEFAULT 0,
  proximo_mantenimiento DATE NULL,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (equipo_id) REFERENCES equipos(id) ON DELETE CASCADE,
  FOREIGN KEY (tecnico_id) REFERENCES usuarios(id)
);

CREATE TABLE IF NOT EXISTS fallas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  equipo_id INT NOT NULL,
  descripcion TEXT NOT NULL,
  fecha DATE NOT NULL,
  reportada_por INT NOT NULL,
  FOREIGN KEY (equipo_id) REFERENCES equipos(id) ON DELETE CASCADE,
  FOREIGN KEY (reportada_por) REFERENCES usuarios(id)
);

CREATE TABLE IF NOT EXISTS auditoria (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NULL,
  accion VARCHAR(20) NOT NULL,
  tabla VARCHAR(40) NOT NULL,
  registro_id INT NULL,
  fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
