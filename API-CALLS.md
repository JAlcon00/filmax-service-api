# Llamadas API - FILMAX

## 1️⃣ Estado Servidor
```bash
curl -X GET "http://localhost:3000/api/movies/status"
```

## 2️⃣ Registro de Usuario
```bash
curl -X POST "http://localhost:3000/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Usuario Test",
    "email": "test@example.com",
    "password": "password123"
  }'
```

## 3️⃣ Login
```bash
curl -X POST "http://localhost:3000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

## 4️⃣ Obtener Perfil del Usuario (Requiere Token)
```bash
curl -X GET "http://localhost:3000/api/users/me" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 5️⃣ Buscar Películas (Requiere Token)
```bash
curl -X GET "http://localhost:3000/api/movies/search?q=The%20Matrix" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 6️⃣ Crear Lista (Requiere Token)
```bash
curl -X POST "http://localhost:3000/api/lists" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "type": "watchlist",
    "name": "Mis películas favoritas"
  }'
```

## 7️⃣ Obtener Lista (Requiere Token)
```bash
curl -X GET "http://localhost:3000/api/lists/watchlist" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 8️⃣ Agregar Item a Lista (Requiere Token)
```bash
curl -X POST "http://localhost:3000/api/lists/watchlist/items" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "externalId": "tt0133093",
    "title": "The Matrix",
    "type": "movie",
    "posterUrl": "https://..."
  }'
```

## 9️⃣ Eliminar Item de Lista (Requiere Token)
```bash
curl -X DELETE "http://localhost:3000/api/lists/watchlist/items/CONTENT_ID" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 🔟 Crear Calificación (Requiere Token)
```bash
curl -X POST "http://localhost:3000/api/ratings" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "externalId": "tt0133093",
    "title": "The Matrix",
    "type": "movie",
    "score": 5,
    "comment": "Excelente película"
  }'
```

---

## 📌 Notas
- Reemplaza `YOUR_TOKEN_HERE` con el token JWT que recibas del login
- La BD debe estar corriendo en `localhost:3306`
- Usuario por defecto: `root` / Contraseña: `password`
