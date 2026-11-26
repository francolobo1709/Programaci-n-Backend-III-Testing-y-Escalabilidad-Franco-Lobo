# ShipNow API — Pre-entrega Módulo 1

API inicial de **ShipNow** construida desde cero bajo una arquitectura profesional en 3 capas (**Controller → Service → Repository**), con validación centralizada de entorno al arranque (*fail-fast*) y catálogo inmutable de constantes de dominio (`Object.freeze`).

---

## 1. Estructura del Proyecto

```text
shipnow-api/
├── src/
│   ├── config/
│   │   ├── env.config.js        # Único punto de lectura y validación de process.env (dotenv)
│   │   ├── db.config.js         # Conexión a MongoDB Atlas consumiendo envConfig
│   │   └── index.js             # Barril de exportación de configuración
│   ├── constants/
│   │   └── index.js             # ROLES, PRODUCT_STATUS, HTTP_STATUS y NODE_ENVIRONMENTS con Object.freeze
│   ├── controllers/
│   │   ├── products.controller.js
│   │   └── users.controller.js
│   ├── models/
│   │   ├── product.model.js
│   │   └── user.model.js
│   ├── repositories/
│   │   ├── products.repository.js
│   │   └── users.repository.js
│   ├── routes/
│   │   ├── products.router.js
│   │   └── users.router.js
│   ├── services/
│   │   ├── products.service.js
│   │   └── users.service.js
│   ├── app.js                   # Configuración Express, routers y manejador 404 en JSON
│   └── server.js                # Arranque del servidor HTTP tras conectar la base de datos
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

---

## 2. Instrucciones para Correr el Proyecto Localmente

1. **Requisitos previos:** Node.js 18+ y una base de datos MongoDB (configurado para **MongoDB Atlas** o instancia local).
2. **Instalar dependencias:**
   ```bash
   npm install
   ```
3. **Configurar variables de entorno:**
   Crear el archivo `.env` a partir de `.env.example`:
   ```bash
   cp .env.example .env
   ```
   *(En Windows PowerShell: `copy .env.example .env`)*

   Completar las variables requeridas en `.env`:
   ```env
   PORT=8080
   MONGODB_URI=mongodb+srv://<db_user>:<db_password>@cluster-clean-match.oifes2j.mongodb.net/shipnow?retryWrites=true&w=majority
   NODE_ENV=development
   ```
4. **Iniciar el servidor:**
   - Modo desarrollo con recarga automática (`--watch`):
     ```bash
     npm run dev
     ```
   - Modo producción:
     ```bash
     npm start
     ```
   Salida esperada al iniciar correctamente:
   ```text
   [DB] Conectado a MongoDB (development)
   [SERVER] ShipNow API escuchando en http://localhost:8080
   ```

---

## 3. Justificación Arquitectónica: ¿Por qué separar `Service` y `Repository`?

Separar la lógica entre **Service** y **Repository** evita que las reglas de negocio del dominio de envíos (**ShipNow**) queden acopladas al motor de base de datos (Mongoose/MongoDB):

| Capa | Responsabilidad en ShipNow | Qué NO hace |
| :--- | :--- | :--- |
| **Controller** (`src/controllers/`) | Única puerta de entrada HTTP. Extrae parámetros (`req.body`, `req.params`, `req.query`), invoca al `Service` y devuelve la respuesta JSON con el código de estado de `HTTP_STATUS`. | No importa Mongoose, no ejecuta queries y no calcula estados ni reglas de negocio. |
| **Service** (`src/services/`) | Concentra el 100 % de las decisiones de negocio: calcula automáticamente el estado del producto (`AVAILABLE` u `OUT_OF_STOCK`) en función del stock (`resolveStatusByStock`), impide que una operación deje stock negativo, valida formato de IDs, normaliza emails, verifica unicidad de correo y valida roles contra `ROLES`. | No conoce objetos HTTP (`req`, `res`) ni métodos de Mongoose (`.find()`, `.findOneAndUpdate()`). |
| **Repository** (`src/repositories/`) | Único lugar que conoce e importa los modelos de Mongoose (`ProductModel`, `UserModel`). No es un simple "pasamanos": encapsula filtros por defecto de integridad (`isDeleted: false` en productos, `isActive: true` en usuarios), aplica proyecciones para ocultar metadatos internos (`-__v -isDeleted`, `-__v -isActive`), ordena resultados y retorna objetos planos mediante `.lean()`. | No toma decisiones de negocio, no calcula estados y no valida permisos ni reglas de dominio. |

---

## 4. Cumplimiento de la Rúbrica y Evidencias Verificables

### A. Configuración de entorno centralizada y robusta (30 %)
- **Implementación:** `src/config/env.config.js` es el **único** archivo de todo el proyecto que accede a `process.env`. Valida la presencia obligatoria de `PORT`, `MONGODB_URI` y `NODE_ENV`, verifica que `PORT` sea un entero positivo y que `NODE_ENV` pertenezca a `NODE_ENVIRONMENTS`, exportando `envConfig` congelado con `Object.freeze`.
- **Evidencia verificable (Fail-Fast sin `MONGODB_URI`):**
  Si se elimina o deja vacía `MONGODB_URI`, la aplicación aborta inmediatamente antes de levantar Express:
  ```text
  Error: [ENV CONFIG ERROR] Falta la variable de entorno obligatoria: MONGODB_URI. Revisa tu archivo .env o .env.example.
  ```

### B. Arquitectura por capas para `Products` y `Users` (35 %)
- **Implementación:** Ambas entidades cuentan con su flujo completo **Router → Controller → Service → Repository → Model**. Los archivos en `src/routes/` son mínimos y únicamente conectan cada path HTTP con el método del controlador.

| Método | Ruta | Capa de Negocio (`Service`) | Capa de Datos (`Repository`) |
| :--- | :--- | :--- | :--- |
| `GET` | `/health` | Healthcheck del servicio | — |
| `GET` | `/api/products` | Filtra por `?available=true` usando `PRODUCT_STATUS.AVAILABLE` | `find({ isDeleted: false, ... })` con proyección `-__v -isDeleted` |
| `GET` | `/api/products/:id` | Valida ID y lanza `404` si no existe | `findOne({ _id: id, isDeleted: false })` |
| `POST` | `/api/products` | Calcula `status` (`AVAILABLE` / `OUT_OF_STOCK`) según `stock` | `ProductModel.create()` sanitizando campos internos |
| `PUT` | `/api/products/:id` | Actualiza datos y recalcula `status` automáticamente si cambia el `stock` | `findOneAndUpdate({ _id: id, isDeleted: false })` |
| `PATCH` | `/api/products/:id/stock` | Suma/resta `deltaStock`, impide stock `< 0` y sincroniza `status` | `findOneAndUpdate` con `runValidators: true` |
| `DELETE` | `/api/products/:id` | Verifica existencia previa | Baja lógica (`softDeleteById`: `isDeleted: true`) |
| `GET` | `/api/users` | Permite filtrar por `?role=ADMIN` validando contra `ROLES` | `find({ isActive: true, ... })` con proyección `-__v -isActive` |
| `GET` | `/api/users/:id` | Valida ID y lanza `404` si no existe | `findOne({ _id: id, isActive: true })` |
| `POST` | `/api/users` | Normaliza email, valida rol en `ROLES` y evita duplicados (`409`) | `findByEmail()` + `UserModel.create()` |
| `PUT` | `/api/users/:id` | Valida unicidad si cambia el email y normaliza el rol | `findOneAndUpdate({ _id: id, isActive: true })` |
| `PATCH` | `/api/users/:id/role` | Valida el nuevo rol contra `ROLES` (`ADMIN`, `USER`) | `updateRole(id, normalizedRole)` |
| `DELETE` | `/api/users/:id` | Verifica existencia previa | Baja lógica (`softDeleteById`: `isActive: false`) |

### C. Abstracción y flujo de negocio en `Controllers` y `Services` (20 %)
- **Evidencia 1 — Creación de producto con `stock: 0` (asigna `OUT_OF_STOCK` automáticamente en el Service):**
  ```bash
  curl -X POST http://localhost:8080/api/products \
    -H "Content-Type: application/json" \
    -d '{"name": "Caja Postal ShipNow", "price": 1500, "stock": 0}'
  ```
  Respuesta (`201 Created`):
  ```json
  {
    "ok": true,
    "data": {
      "_id": "6745f1a2c9d8e70012345678",
      "name": "Caja Postal ShipNow",
      "price": 1500,
      "stock": 0,
      "status": "OUT_OF_STOCK",
      "createdAt": "2026-11-26T18:00:00.000Z",
      "updatedAt": "2026-11-26T18:00:00.000Z"
    }
  }
  ```
- **Evidencia 2 — Reposición de stock (`PATCH /api/products/:id/stock` transiciona a `AVAILABLE`):**
  ```bash
  curl -X PATCH http://localhost:8080/api/products/6745f1a2c9d8e70012345678/stock \
    -H "Content-Type: application/json" \
    -d '{"deltaStock": 10}'
  ```
  Respuesta (`200 OK`):
  ```json
  {
    "ok": true,
    "data": {
      "_id": "6745f1a2c9d8e70012345678",
      "name": "Caja Postal ShipNow",
      "price": 1500,
      "stock": 10,
      "status": "AVAILABLE"
    }
  }
  ```
- **Evidencia 3 — Ruta inexistente responde 404 en JSON:**
  ```bash
  curl http://localhost:8080/api/ruta-inexistente
  ```
  Respuesta (`404 Not Found`):
  ```json
  {
    "ok": false,
    "message": "Ruta no encontrada: GET /api/ruta-inexistente"
  }
  ```

### D. Centralización de constantes y eliminación de strings mágicos (10 %)
- **Implementación:** `src/constants/index.js` define y congela con `Object.freeze`:
  - `ROLES` (`ADMIN`, `USER`)
  - `PRODUCT_STATUS` (`AVAILABLE`, `OUT_OF_STOCK`)
  - `HTTP_STATUS` (`OK`, `CREATED`, `BAD_REQUEST`, `NOT_FOUND`, `CONFLICT`, `INTERNAL_SERVER_ERROR`)
  - `NODE_ENVIRONMENTS` (`DEVELOPMENT`, `PRODUCTION`, `TEST`)
