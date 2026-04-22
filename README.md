# filmax-service-api

API backend del proyecto **FILMAX**, orientada a soportar el MVP de una plataforma de valoración de películas y series. Este repositorio corresponde a la capa de servidor y concentra la autenticación, la consulta de contenido, el registro de valoraciones y la persistencia de la actividad del usuario.

## Descripción del proyecto

FILMAX es una solución web construida bajo enfoque Scrum para permitir que los usuarios:

- Se registren en la plataforma.
- Inicien sesión de forma segura.
- Consulten el catálogo de películas y series.
- Califiquen contenido con una escala de 1 a 5.

El alcance de esta versión prioriza el producto mínimo viable para validar el flujo principal de uso.

## Stack tecnológico

- Backend: Node.js / Express 20 LTS
- Base de datos: MySQL
- ORM: Prisma 6.x
- Seguridad: JWT y bcrypt
- API externa: IMDb API
- Frontend asociado: Angular 19 / Tailwind CSS 19.x

## Objetivo del sprint

El objetivo del sprint es entregar un primer incremento funcional del sistema que permita:

- Registrar usuarios.
- Iniciar sesión.
- Visualizar el catálogo de películas y series.
- Emitir una calificación sobre el contenido.

## Historias de usuario del sprint

- HU1: Registro de usuario
- HU2: Inicio de sesión
- HU3: Visualización del catálogo
- HU4: Calificación de contenido

## Funcionalidades del backend

- Autenticación con JWT.
- Hashing de contraseñas con bcrypt.
- Consulta del catálogo de películas y series.
- Registro y actualización de calificaciones.
- Cálculo de promedios de valoración.
- Persistencia de usuarios, contenido asociado y calificaciones.

## Reglas de negocio

- La escala de valoración es de 1 a 5 estrellas.
- Un usuario solo puede tener una valoración por película o serie.
- El catálogo no se almacena completo localmente; se consulta desde la API externa y se guarda únicamente el identificador necesario para la actividad del usuario.
- Las listas y valoraciones son privadas del usuario creador.
- No se debe exponer la API key de IMDb en el frontend.

## Endpoints esperados

- `POST /auth/login`
- `GET /movies/search`
- `POST /ratings`
- `GET /lists/:type`

## Alcance fuera del sprint

- Autenticación con terceros.
- Streaming o reproducción de contenido.
- Listas personales de favoritos.
- Sistema de comentarios.

## Equipo del proyecto

- José de Jesús Almanza Contreras
- Pablo Emilio Alonso Romero
- Víctor Hassiel Ávila Monjaraz
- Jossué Amador Ynfante
- Leonardo Gael Durán Torres

### Roles del sprint

- Product Owner: Pablo Emilio Alonso Romero
- Scrum Master: José de Jesús Almanza Contreras
- Frontend: Víctor Hassiel Ávila Monjaraz y Jossué Amador Ynfante
- Backend: Leonardo Gael Durán Torres

## Definición de terminado

Una historia de usuario se considera terminada cuando:

- La funcionalidad está implementada en frontend y backend.
- La integración entre componentes funciona correctamente.
- La funcionalidad fue probada sin errores críticos.
- Cumple los criterios de aceptación.
- Es utilizable dentro del flujo principal de la aplicación.

## Inicio rápido

1. Clona el repositorio.
2. Instala dependencias del backend.
3. Configura las variables de entorno.
4. Ejecuta las migraciones de base de datos.
5. Levanta el servidor de desarrollo.

## Flujo Git sugerido

Este proyecto sigue una estrategia basada en Git Flow.

```bash
git init
git add README.md
git commit -m "first commit"
git branch -M main
git remote add origin https://github.com/JAlcon00/filmax-service-api.git
git push -u origin main
```

## Nota

La documentación del sprint y de requerimientos proporcionada por el equipo fue consolidada en este README para dejar una base inicial del backend.
