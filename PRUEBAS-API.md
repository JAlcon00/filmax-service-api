# 📋 Reporte de Pruebas API - FILMAX Service

**Fecha:** 29 de abril de 2026  
**Servidor:** http://localhost:3000  
**Base API:** http://localhost:3000/api

---

## ✅ Endpoints Probados

### 1. **Módulo Movies** - Estado ✅
- **Endpoint:** `GET /api/movies/status`
- **Respuesta:** 
```json
{
  "module": "movies",
  "status": "scaffold-ready"
}
```
- **HTTP Status:** 200 OK

### 2. **Módulo Users** - Estado ✅
- **Endpoint:** `GET /api/users/status`
- **Respuesta:**
```json
{
  "module": "users",
  "status": "scaffold-ready"
}
```
- **HTTP Status:** 200 OK

---

## ⚠️ Endpoints Requieren Base de Datos

Los siguientes endpoints dependen de una conexión activa a **MySQL en localhost:3306**:

### 3. **Autenticación - Registro** ❌
- **Endpoint:** `POST /api/auth/register`
- **Headers:** `Content-Type: application/json`
- **Body:**
```json
{
  "name": "Usuario Test",
  "email": "test@example.com",
  "password": "password123"
}
```
- **Respuesta Esperada:** 
```json
{
  "id": "user-uuid",
  "name": "Usuario Test",
  "email": "test@example.com",
  "createdAt": "2026-04-29T...",
  "updatedAt": "2026-04-29T..."
}
```
- **Estado Actual:** ❌ Base de datos no disponible

### 4. **Autenticación - Login** ❌
- **Endpoint:** `POST /api/auth/login`
- **Headers:** `Content-Type: application/json`
- **Body:**
```json
{
  "email": "test@example.com",
  "password": "password123"
}
```
- **Respuesta Esperada:**
```json
{
  "token": "jwt-token",
  "user": {
    "id": "user-uuid",
    "email": "test@example.com",
    "name": "Usuario Test"
  }
}
```
- **Estado Actual:** ❌ Base de datos no disponible

### 5. **Usuarios - Obtener Perfil** ❌ (Requiere autenticación)
- **Endpoint:** `GET /api/users/me`
- **Headers:** 
  - `Authorization: Bearer <JWT_TOKEN>`
- **Respuesta Esperada:**
```json
{
  "user": {
    "id": "user-uuid",
    "name": "Usuario Test",
    "email": "test@example.com"
  }
}
```
- **Estado Actual:** ❌ Requiere token válido (Base de datos no disponible)

### 6. **Películas - Búsqueda** ❌ (Requiere autenticación)
- **Endpoint:** `GET /api/movies/search?q=<query>`
- **Headers:**
  - `Authorization: Bearer <JWT_TOKEN>`
- **Query Parameters:**
  - `q` (string): Término de búsqueda (ej: "The Matrix")
- **Respuesta Esperada:** Lista de películas del OMDB
- **Estado Actual:** ❌ Requiere token válido

### 7. **Listas - Crear Lista** ❌ (Requiere autenticación)
- **Endpoint:** `POST /api/lists`
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <JWT_TOKEN>`
- **Body:**
```json
{
  "type": "watchlist",
  "name": "Mis películas favoritas"
}
```
- **Estado Actual:** ❌ Requiere token válido

### 8. **Listas - Obtener Lista** ❌ (Requiere autenticación)
- **Endpoint:** `GET /api/lists/:type`
- **Headers:**
  - `Authorization: Bearer <JWT_TOKEN>`
- **URL Parameters:**
  - `type` (string): Tipo de lista ("watchlist", "favorites", etc.)
- **Respuesta Esperada:**
```json
[
  {
    "id": "content-uuid",
    "title": "Nombre de película",
    "type": "movie",
    "posterUrl": "https://...",
    "externalId": "tt1234567"
  }
]
```
- **Estado Actual:** ❌ Requiere token válido

### 9. **Listas - Agregar Item** ❌ (Requiere autenticación)
- **Endpoint:** `POST /api/lists/:type/items`
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <JWT_TOKEN>`
- **URL Parameters:**
  - `type` (string): Tipo de lista
- **Body:**
```json
{
  "contentId": "content-uuid",
  "title": "Nombre de película",
  "type": "movie",
  "posterUrl": "https://...",
  "externalId": "tt1234567"
}
```
- **Estado Actual:** ❌ Requiere token válido

### 10. **Listas - Eliminar Item** ❌ (Requiere autenticación)
- **Endpoint:** `DELETE /api/lists/:type/items/:contentId`
- **Headers:**
  - `Authorization: Bearer <JWT_TOKEN>`
- **URL Parameters:**
  - `type` (string): Tipo de lista
  - `contentId` (string): ID del contenido
- **Estado Actual:** ❌ Requiere token válido

### 11. **Ratings - Crear Calificación** ❌ (Requiere autenticación)
- **Endpoint:** `POST /api/ratings`
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <JWT_TOKEN>`
- **Body:**
```json
{
  "contentId": "content-uuid",
  "score": 5,
  "comment": "Excelente película"
}
```
O si es contenido externo:
```json
{
  "externalId": "tt1234567",
  "title": "Nombre de película",
  "type": "movie",
  "posterUrl": "https://...",
  "score": 5,
  "comment": "Excelente película"
}
```
- **Validaciones:** 
  - `score` debe estar entre 1 y 5
  - Debe enviar `contentId` o `externalId`
  - Si usa `externalId`, debe incluir `title` y `type`
- **Estado Actual:** ❌ Base de datos no disponible

---

## 🔍 Resumen de Estado

| Componente | Estado | Problema |
|-----------|--------|---------|
| **Servidor API** | ✅ Corriendo | En puerto 3000 |
| **Módulo Movies** | ✅ Disponible | Endpoints de estado funcionando |
| **Módulo Users** | ✅ Disponible | Status OK, pero me/auth necesita BD |
| **Autenticación** | ❌ Bloqueada | MySQL no disponible |
| **Base de Datos** | ❌ No disponible | MySQL en localhost:3306 no responde |
| **Middleware de Auth** | ✅ Configurado | Validación con JWT |

---

## 🚀 Próximos Pasos

Para completar las pruebas completas:

1. **Iniciar MySQL:**
   ```bash
   # Opción 1: Usar Homebrew (macOS)
   brew services start mysql
   
   # Opción 2: Docker
   docker run --name filmax-mysql -e MYSQL_ROOT_PASSWORD=password \
     -e MYSQL_DATABASE=filmax -p 3306:3306 -d mysql:8
   ```

2. **Crear la base de datos:**
   ```bash
   prisma migrate dev
   ```

3. **Re-ejecutar las pruebas:**
   ```bash
   bash test-api.sh
   ```

---

## 📝 Notas Técnicas

- **API Type:** Express.js + TypeScript
- **Base de Datos:** Prisma ORM + MySQL
- **Autenticación:** JWT (jsonwebtoken)
- **Validación:** Zod schemas
- **Hasheo de Contraseña:** bcrypt
- **CORS:** Habilitado
- **Seguridad:** Helmet middleware

---

**Generado automáticamente por pruebas curl del sistema**
