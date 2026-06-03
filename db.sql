-- ============================================================
--  Plataforma de Gestión de Soporte Técnico IoT
--  ESCOM — IPN | Grupo 6CM2 | 
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS
  Historial_Estado,
  Codigo_QR,
  Solicitud,
  Cliente_Dispositivo,
  Compra_Dispositivo,
  Compra,
  Dispositivo,
  Administrador,
  Tecnico,
  Cliente,
  Usuario;
SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
--  1. USUARIO (super entidad)
-- ============================================================
CREATE TABLE Usuario (
  id            CHAR(36)        NOT NULL DEFAULT (UUID()),
  nombre        VARCHAR(80)     NOT NULL,
  paterno       VARCHAR(80)     NOT NULL,
  materno       VARCHAR(80)         NULL,
  email         VARCHAR(150)    NOT NULL,
  telefono      VARCHAR(15)         NULL,
  password      VARCHAR(255)    NOT NULL,          -- bcrypt hash
  rol           ENUM(
                  'cliente',
                  'tecnico',
                  'administrador'
                )               NOT NULL,
  foto          VARCHAR(255)        NULL,
  activo        TINYINT(1)      NOT NULL DEFAULT 1,

  CONSTRAINT pk_usuario   PRIMARY KEY (id),
  CONSTRAINT uq_usuario_email UNIQUE (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
--  2. CLIENTE (sub entidad)
-- ============================================================
CREATE TABLE Cliente (
  id            CHAR(36)        NOT NULL,
  calle         VARCHAR(150)    NOT NULL,
  num_exterior  VARCHAR(20)     NOT NULL,
  num_interior  VARCHAR(20)         NULL,
  codigo_postal CHAR(5)         NOT NULL,
  colonia       VARCHAR(100)    NOT NULL,
  delegacion    VARCHAR(100)    NOT NULL,
  estado        VARCHAR(80)     NOT NULL,

  CONSTRAINT pk_cliente       PRIMARY KEY (id),
  CONSTRAINT fk_cliente_usuario
    FOREIGN KEY (id) REFERENCES Usuario(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
--  3. TECNICO (sub entidad)
-- ============================================================
CREATE TABLE Tecnico (
  id            CHAR(36)        NOT NULL,
  calle         VARCHAR(150)    NOT NULL,
  num_exterior  VARCHAR(20)     NOT NULL,
  num_interior  VARCHAR(20)         NULL,
  codigo_postal CHAR(5)         NOT NULL,
  colonia       VARCHAR(100)    NOT NULL,
  delegacion    VARCHAR(100)    NOT NULL,
  estado        VARCHAR(80)     NOT NULL,
  creado_en     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT pk_tecnico       PRIMARY KEY (id),
  CONSTRAINT fk_tecnico_usuario
    FOREIGN KEY (id) REFERENCES Usuario(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
--  4. ADMINISTRADOR (sub entidad)
-- ============================================================
CREATE TABLE Administrador (
  id            CHAR(36)        NOT NULL,
  acceso        TINYINT(1)      NOT NULL DEFAULT 1,

  CONSTRAINT pk_administrador PRIMARY KEY (id),
  CONSTRAINT fk_admin_usuario
    FOREIGN KEY (id) REFERENCES Usuario(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
--  5. DISPOSITIVO (super entidad de producto)
-- ============================================================
CREATE TABLE Dispositivo (
  id            CHAR(36)        NOT NULL DEFAULT (UUID()),
  precio        DECIMAL(10,2)   NOT NULL,
  modelo        VARCHAR(100)    NOT NULL,
  marca         VARCHAR(100)    NOT NULL,
  tipo          ENUM(
                  'sensor_agua',
                  'sensor_gas',
                  'sistema_apertura'
                )               NOT NULL,

  CONSTRAINT pk_dispositivo   PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
--  6. COMPRA
-- ============================================================
CREATE TABLE Compra (
  id            CHAR(36)        NOT NULL DEFAULT (UUID()),
  cliente_id    CHAR(36)        NOT NULL,
  fecha         DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  precio_total  DECIMAL(10,2)   NOT NULL,
  estado        ENUM(
                  'confirmada',
                  'cancelada'
                )               NOT NULL DEFAULT 'confirmada',
  descripcion   TEXT                NULL,
  metodo_pago   ENUM(
                  'tarjeta',
                  'transferencia'
                )               NOT NULL,

  CONSTRAINT pk_compra        PRIMARY KEY (id),
  CONSTRAINT fk_compra_cliente
    FOREIGN KEY (cliente_id) REFERENCES Cliente(id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
--  7. COMPRA_DISPOSITIVO (tabla intermedia N:M)
-- ============================================================
CREATE TABLE Compra_Dispositivo (
  compra_id       CHAR(36)      NOT NULL,
  dispositivo_id  CHAR(36)      NOT NULL,
  cantidad        SMALLINT      NOT NULL DEFAULT 1,
  precio_unitario DECIMAL(10,2) NOT NULL,

  CONSTRAINT pk_compra_dispositivo
    PRIMARY KEY (compra_id, dispositivo_id),
  CONSTRAINT fk_cd_compra
    FOREIGN KEY (compra_id)      REFERENCES Compra(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_cd_dispositivo
    FOREIGN KEY (dispositivo_id) REFERENCES Dispositivo(id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
--  8. CLIENTE_DISPOSITIVO
--     Vincula dispositivos adquiridos al perfil del cliente.
--     numero_serie identifica la unidad física concreta.
-- ============================================================
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE Cliente_Dispositivo;

CREATE TABLE Cliente_Dispositivo (
  id              CHAR(36)      NOT NULL DEFAULT (UUID()),
  cliente_id      CHAR(36)      NOT NULL,
  dispositivo_id  CHAR(36)      NOT NULL,
  numero_serie    VARCHAR(100)  NOT NULL,
  fecha_registro  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT pk_cliente_dispositivo PRIMARY KEY (id),
  CONSTRAINT uq_numero_serie        UNIQUE (numero_serie),
  CONSTRAINT fk_cld_cliente
    FOREIGN KEY (cliente_id)     REFERENCES Cliente(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_cld_dispositivo
    FOREIGN KEY (dispositivo_id) REFERENCES Dispositivo(id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
--  9. SOLICITUD
--     estado_dir = estado geográfico de la dirección de atención
--     (renombrado para evitar ambigüedad con estado del ticket)
-- ============================================================
CREATE TABLE Solicitud (
  id              CHAR(36)      NOT NULL DEFAULT (UUID()),
  cliente_id      CHAR(36)      NOT NULL,
  dispositivo_id  CHAR(36)      NOT NULL,
  tecnico_id      CHAR(36)          NULL,           -- nullable hasta asignación
  tipo            ENUM(
                    'instalacion',
                    'reparacion',
                    'falla',
                    'desinstalacion'
                  )             NOT NULL,
  estado          ENUM(
                    'pendiente',
                    'asignado',
                    'en_proceso',
                    'completado',
                    'cancelado'
                  )             NOT NULL DEFAULT 'pendiente',
  descripcion     TEXT          NOT NULL,
  fecha_solicitud DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_estimada  DATETIME          NULL,
  observaciones   TEXT              NULL,
  calificacion    TINYINT           NULL CHECK (calificacion BETWEEN 1 AND 5),
  -- Dirección de atención (puede diferir del domicilio del cliente)
  calle           VARCHAR(150)  NOT NULL,
  num_exterior    VARCHAR(20)   NOT NULL,
  num_interior    VARCHAR(20)       NULL,
  codigo_postal   CHAR(5)       NOT NULL,
  colonia         VARCHAR(100)  NOT NULL,
  delegacion      VARCHAR(100)  NOT NULL,
  estado_dir      VARCHAR(80)   NOT NULL,
  latitud         DECIMAL(10,7)     NULL,
  longitud        DECIMAL(10,7)     NULL,

  CONSTRAINT pk_solicitud     PRIMARY KEY (id),
  CONSTRAINT fk_sol_cliente
    FOREIGN KEY (cliente_id)     REFERENCES Cliente(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_sol_dispositivo
    FOREIGN KEY (dispositivo_id) REFERENCES Dispositivo(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_sol_tecnico
    FOREIGN KEY (tecnico_id)     REFERENCES Tecnico(id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
--  10. HISTORIAL_ESTADO
--      Registra cada transición de estado de una solicitud.
--      actor_id: quién provocó el cambio (cliente, técnico o admin).
-- ============================================================
CREATE TABLE Historial_Estado (
  id            CHAR(36)        NOT NULL DEFAULT (UUID()),
  solicitud_id  CHAR(36)        NOT NULL,
  estado        ENUM(
                  'pendiente',
                  'asignado',
                  'en_proceso',
                  'completado',
                  'cancelado'
                )               NOT NULL,
  fecha_cambio  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actor_id      CHAR(36)        NOT NULL,

  CONSTRAINT pk_historial     PRIMARY KEY (id),
  CONSTRAINT fk_hist_solicitud
    FOREIGN KEY (solicitud_id) REFERENCES Solicitud(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_hist_actor
    FOREIGN KEY (actor_id)     REFERENCES Usuario(id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
--  11. CODIGO_QR
--      Un único QR por solicitud (UNIQUE en solicitud_id).
--      token_hash: HMAC-SHA256 del payload, nunca el token en claro.
--      Se reemplaza cada 30 min via UPDATE (no INSERT nuevo).
-- ============================================================
CREATE TABLE Codigo_QR (
  id               CHAR(36)     NOT NULL DEFAULT (UUID()),
  solicitud_id     CHAR(36)     NOT NULL,
  tecnico_id       CHAR(36)     NOT NULL,
  token_hash       VARCHAR(255) NOT NULL,
  used             TINYINT(1)   NOT NULL DEFAULT 0,
  fecha_activacion DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_expiracion DATETIME     NOT NULL,

  CONSTRAINT pk_codigo_qr     PRIMARY KEY (id),
  CONSTRAINT uq_qr_solicitud  UNIQUE (solicitud_id),
  CONSTRAINT fk_qr_solicitud
    FOREIGN KEY (solicitud_id) REFERENCES Solicitud(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_qr_tecnico
    FOREIGN KEY (tecnico_id)   REFERENCES Tecnico(id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Productos de la empresa 

INSERT INTO Dispositivo (id, precio, modelo, marca, tipo) VALUES
  (UUID(), 1299.00, 'IoT-GAS-01', 'IoTech', 'sensor_gas'),
  (UUID(), 899.00,  'IoT-AGU-01', 'IoTech', 'sensor_agua'),
  (UUID(), 2499.00, 'IoT-ZAG-01', 'IoTech', 'sistema_apertura');