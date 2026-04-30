#!/bin/bash

# Script para probar los endpoints de la API Filmax
BASE_URL="http://localhost:3000"
API_URL="$BASE_URL/api"

echo "=========================================="
echo "PRUEBAS DE API - FILMAX SERVICE"
echo "=========================================="
echo ""

# 1. Probar conectividad básica
echo "1️⃣  Verificando estado del servidor..."
curl -s -X GET "$API_URL/movies/status" | jq '.' || echo "❌ Error: No se puede conectar al servidor"
echo ""

# 2. Probar endpoints de status sin autenticación
echo "2️⃣  Estado del módulo usuarios..."
curl -s -X GET "$API_URL/users/status" | jq '.'
echo ""

# 3. Registrar un nuevo usuario
echo "3️⃣  Registrando nuevo usuario..."
REGISTER_RESPONSE=$(curl -s -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Usuario Test",
    "email": "test@example.com",
    "password": "password123"
  }')
echo "$REGISTER_RESPONSE" | jq '.'
USER_ID=$(echo "$REGISTER_RESPONSE" | jq -r '.id // empty')
echo ""

# 4. Login con el usuario registrado
echo "4️⃣  Haciendo login..."
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }')
echo "$LOGIN_RESPONSE" | jq '.'
TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token // empty')
echo ""

# 5. Obtener información del usuario autenticado
if [ -n "$TOKEN" ]; then
  echo "5️⃣  Obteniendo datos del usuario autenticado..."
  curl -s -X GET "$API_URL/users/me" \
    -H "Authorization: Bearer $TOKEN" | jq '.'
  echo ""
  
  # 6. Buscar películas
  echo "6️⃣  Buscando películas (The Matrix)..."
  curl -s -X GET "$API_URL/movies/search?q=The%20Matrix" \
    -H "Authorization: Bearer $TOKEN" | jq '.'
  echo ""
  
  # 7. Crear una lista
  echo "7️⃣  Creando una nueva lista..."
  LIST_RESPONSE=$(curl -s -X POST "$API_URL/lists" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{
      "type": "watchlist",
      "name": "Mis películas favoritas"
    }')
  echo "$LIST_RESPONSE" | jq '.'
  echo ""
  
  # 8. Obtener lista
  echo "8️⃣  Obteniendo lista de watchlist..."
  curl -s -X GET "$API_URL/lists/watchlist" \
    -H "Authorization: Bearer $TOKEN" | jq '.'
  echo ""
else
  echo "⚠️  No se obtuvo token. Saltando pruebas autenticadas."
fi

echo "=========================================="
echo "FIN DE PRUEBAS"
echo "=========================================="
