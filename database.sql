-- Create the database if it doesn't exist
CREATE DATABASE IF NOT EXISTS `condominio`;

USE `condominio`;

-- Table for income from maintenance fees
CREATE TABLE `ingresos` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `apartamento` VARCHAR(50) NOT NULL,
  `nombre` VARCHAR(100) NOT NULL,
  `saldo_anterior` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `mensualidad` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `pago` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `observacion` VARCHAR(255) DEFAULT NULL,
  `fecha` DATE NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table for expenses
CREATE TABLE `gastos` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `descripcion` VARCHAR(255) NOT NULL,
  `efectivo` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `cheques` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `detalle_cheque` VARCHAR(100) DEFAULT NULL,
  `fecha` DATE NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table for monthly summaries
CREATE TABLE `resumen_mensual` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `fecha` DATE NOT NULL,
  `banco_saldo_anterior` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `caja_saldo_anterior` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  PRIMARY KEY (`id`),
  UNIQUE KEY `fecha` (`fecha`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table for manual bank account entries
CREATE TABLE `banco_movimientos` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `descripcion` VARCHAR(255) NOT NULL,
  `monto` DECIMAL(10, 2) NOT NULL,
  `fecha` DATE NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table for manual petty cash entries
CREATE TABLE `caja_movimientos` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `descripcion` VARCHAR(255) NOT NULL,
  `monto` DECIMAL(10, 2) NOT NULL,
  `fecha` DATE NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert initial summary for August 2025, so it has a starting point
INSERT INTO `resumen_mensual` (`fecha`, `banco_saldo_anterior`, `caja_saldo_anterior`) VALUES ('2025-08-01', 8778.74, 37.09);

-- Pre-populating with some data from the document for August 2025
INSERT INTO `ingresos` (`apartamento`, `nombre`, `saldo_anterior`, `mensualidad`, `pago`, `observacion`, `fecha`) VALUES
('1', 'ITZEL DE VALENCIA', 80.00, 40.00, 0.00, NULL, '2025-08-31'),
('2', 'EDITHA BETHANCOURT', 1200.00, 40.00, 0.00, NULL, '2025-08-31'),
('3', 'ANGEL DE MARCO', 0.00, 40.00, 40.00, 'R1389-TR.02/08', '2025-08-31'),
('4', 'CARMEN RODRIGUEZ', 0.00, 40.00, 0.00, NULL, '2025-08-31'),
('5', 'JOESAIDA GARCIA', 0.00, 40.00, 0.00, NULL, '2025-08-31'),
('6', 'CHRISTIAN FIGUEROA', 0.00, 40.00, 0.00, NULL, '2025-08-31'),
('7', 'ROSENDO ORO', 3080.00, 40.00, 0.00, NULL, '2025-08-31'),
('8', 'BENIGNA GONZÁLEZ', -80.00, 40.00, 0.00, NULL, '2025-08-31'),
('9', 'CECILIA SIU', 0.00, 40.00, 40.00, 'R1390-TR.08/AGO', '2025-08-31'),
('10', 'THOMAS BISANG', -40.00, 40.00, 40.00, 'R1391-TR.30/AGO', '2025-08-31');

INSERT INTO `gastos` (`descripcion`, `efectivo`, `cheques`, `detalle_cheque`, `fecha`) VALUES
('LIMPIEZA EDIFICIO - AARON', 50.00, 0.00, 'C524', '2025-08-31'),
('INTERNET Y ELECTRICIDAD CAMARAS FEB ´25', 10.00, 0.00, 'C525', '2025-08-31'),
('CARGO BANCARIO FIRMA CHEQUE INCORRECTA', 0.00, 32.10, NULL, '2025-08-31'),
('NATURGY JUL Y AGO´25', 0.00, 261.21, 'CH 117', '2025-08-31'),
('ABONO REPARACIÓN BOMBA AGUA', 0.00, 1000.00, 'CH 115', '2025-08-31'),
('SALDO REPARACIÓN BOMBA AGUA', 0.00, 990.11, 'CH 116', '2025-08-31'),
('TIMBRES BANCARIOS', 0.00, 0.30, NULL, '2025-08-31');