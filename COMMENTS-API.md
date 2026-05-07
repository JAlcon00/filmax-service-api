# API de Comentarios - FILMAX

## Descripción

Sistema completo de comentarios para películas y contenido. Los usuarios pueden crear, editar y eliminar comentarios, con validación de autorización y datos.

## Endpoints

### 1. Estado del Módulo

```bash
GET /api/comments/status
```

**Respuesta:**
```json
{
  "status": "Comments module is running"
}
```

---

### 2. Crear Comentario

```bash
POST /api/comments
Content-Type: application/json
Authorization: Bearer <token>
```

**Request:**
```json
{
  "text": "Excelente película, muy recomendada",
  "rating": 5,
  "contentId": "content-id-123"
}
```

**Alternativa con externalId (auto-crea contenido):**
```json
{
  "text": "Gran producción",
  "rating": 4,
  "externalId": "imdb-tt1234567",
  "title": "Inception",
  "type": "movie"
}
```

**Respuesta (201 Created):**
```json
{
  "id": "comment-123",
  "text": "Excelente película, muy recomendada",
  "rating": 5,
  "userId": "user-456",
  "contentId": "content-789",
  "createdAt": "2026-05-06T20:30:00.000Z",
  "updatedAt": "2026-05-06T20:30:00.000Z",
  "author": {
    "id": "user-456",
    "name": "Juan Pérez",
    "email": "juan@example.com"
  }
}
```

**Validaciones:**
- `text`: 1-500 caracteres (requerido)
- `rating`: 1-5 (opcional)
- `contentId` XOR (`externalId` + `title` + `type`)

**Errores:**
- `400`: Validación fallida
- `401`: No autenticado
- `404`: Contenido no encontrado

---

### 3. Obtener Comentarios de Contenido

```bash
GET /api/comments/content/:contentId?limit=10&offset=0
```

**Parámetros:**
- `limit`: 1-100 (default: 10)
- `offset`: >= 0 (default: 0)

**Respuesta:**
```json
{
  "comments": [
    {
      "id": "comment-123",
      "text": "Excelente película",
      "rating": 5,
      "userId": "user-456",
      "contentId": "content-789",
      "createdAt": "2026-05-06T20:30:00.000Z",
      "updatedAt": "2026-05-06T20:30:00.000Z",
      "author": {
        "id": "user-456",
        "name": "Juan Pérez",
        "email": "juan@example.com"
      }
    }
  ],
  "total": 15
}
```

---

### 4. Editar Comentario

```bash
PATCH /api/comments/:commentId
Content-Type: application/json
Authorization: Bearer <token>
```

**Request:**
```json
{
  "text": "Comentario actualizado",
  "rating": 4
}
```

**Respuesta (200 OK):**
```json
{
  "id": "comment-123",
  "text": "Comentario actualizado",
  "rating": 4,
  "userId": "user-456",
  "contentId": "content-789",
  "createdAt": "2026-05-06T20:30:00.000Z",
  "updatedAt": "2026-05-06T20:35:00.000Z",
  "author": {
    "id": "user-456",
    "name": "Juan Pérez",
    "email": "juan@example.com"
  }
}
```

**Errores:**
- `400`: Validación fallida
- `401`: No autenticado
- `403`: No es el autor del comentario
- `404`: Comentario no encontrado

---

### 5. Eliminar Comentario

```bash
DELETE /api/comments/:commentId
Authorization: Bearer <token>
```

**Respuesta (204 No Content):** Sin contenido

**Errores:**
- `401`: No autenticado
- `403`: No es el autor del comentario
- `404`: Comentario no encontrado

---

## Reglas de Negocio

1. **Autenticación:** POST, PATCH y DELETE requieren Bearer token JWT
2. **Autorización:** Solo el autor puede editar/eliminar su comentario
3. **Rating:** Opcional, valores 1-5 si se proporciona
4. **Texto:** 1-500 caracteres, requerido
5. **Contenido:** Se crea automáticamente si se proporciona `externalId`
6. **Ordenamiento:** Comentarios ordenados por `createdAt` DESC (más recientes primero)

---

## Ejemplos con cURL

### Crear comentario:
```bash
curl -X POST http://localhost:3000/api/comments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGci..." \
  -d '{
    "text": "Excelente película",
    "rating": 5,
    "contentId": "content-123"
  }'
```

### Obtener comentarios:
```bash
curl http://localhost:3000/api/comments/content/content-123?limit=10&offset=0
```

### Editar comentario:
```bash
curl -X PATCH http://localhost:3000/api/comments/comment-123 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGci..." \
  -d '{
    "text": "Comentario editado",
    "rating": 4
  }'
```

### Eliminar comentario:
```bash
curl -X DELETE http://localhost:3000/api/comments/comment-123 \
  -H "Authorization: Bearer eyJhbGci..."
```

---

## Códigos de Estado HTTP

| Código | Significado |
|--------|---|
| 200 | OK - Operación exitosa |
| 201 | Created - Recurso creado |
| 204 | No Content - Eliminado exitosamente |
| 400 | Bad Request - Validación fallida |
| 401 | Unauthorized - Falta autenticación |
| 403 | Forbidden - Sin autorización |
| 404 | Not Found - Recurso no existe |
