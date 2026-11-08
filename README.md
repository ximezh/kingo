# KinGo · Sistema Integral Kin Sushi

Sistema de punto de venta, gestión de pedidos en comedor, para llevar y a domicilio, asignación de repartidores, administración de catálogo y generación de reportes para **Kin Sushi**.

---

## Tecnologías Utilizadas

- **Frontend:** Vue 3 (Composition API), Vite, Pinia, Vue Router.
- **Backend:** Node.js, Express, CORS, dotenv.
- **Base de Datos:** PostgreSQL (`pg`, `pgcrypto`).

---

## Instalación y Ejecución Local

### 1. Clonar el repositorio e instalar dependencias

```bash
git clone https://github.com/ximezh/kingo.git
cd kingo
npm install
```

### 2. Configuración de la Base de Datos (PostgreSQL)

1. Abrir **pgAdmin** o el cliente de PostgreSQL.
2. Crear una base de datos con el nombre `kingo`.
3. Ejecutar los scripts ubicados en el directorio `database/` en el siguiente orden:
   - `database/schema_kingo.sql`: Crea las extensiones, tipos enumerados, tablas, restricciones, índices, vistas y triggers.
   - `database/seed_kingo.sql`: Inserta los usuarios base, las categorías oficiales, los 155 productos del menú, paquetes y promociones.

### 3. Variables de Entorno

Crear un archivo `.env` en la raíz del proyecto tomando como base `.env.example`:

```bash
cp .env.example .env
```

Configurar las credenciales correspondientes a la instancia local de PostgreSQL:

```ini
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=tu_contraseña
DB_NAME=kingo
```

### 4. Ejecución del Sistema

Iniciar el servidor backend y el servidor de desarrollo frontend en dos terminales independientes:

- **Terminal 1 (Servidor Backend API en `http://localhost:3000`):**
  ```bash
  npm run server
  ```

- **Terminal 2 (Aplicación Frontend en `http://localhost:5173`):**
  ```bash
  npm run dev
  ```

---
