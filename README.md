# filmax-service-api

API backend del proyecto **FILMAX**, orientada a soportar el MVP de una plataforma de valoración de películas y series. Este repositorio concentra la lógica de negocio del sistema: autenticación, consulta de catálogo, registro de valoraciones, administración de listas personales y persistencia de la actividad del usuario.

## Descripción del proyecto

FILMAX es una solución web desarrollada bajo Scrum para permitir que los usuarios interactúen con un catálogo de películas y series mediante un flujo funcional mínimo pero completo:

- Registrar una cuenta.
- Iniciar sesión de forma segura.
- Buscar y visualizar contenido.
- Guardar valoraciones y listas personales.
- Consultar la información relacionada con su propia actividad.

El alcance de esta versión prioriza el producto mínimo viable para validar el comportamiento central del negocio.

## Stack tecnológico

- Backend: Node.js / Express 20 LTS
- Base de datos: MySQL
- ORM: Prisma 6.x
- Seguridad: JWT y bcrypt
- API externa: IMDb API
- Frontend asociado: Angular 19 / Tailwind CSS 19.x

## Lógica de negocio

La aplicación está diseñada alrededor de una experiencia de usuario simple y privada. El backend no solo expone endpoints, sino que aplica las reglas que determinan cómo se crea, consulta y protege la información del sistema.

### 1. Identidad y autenticación

- El usuario se registra con sus datos básicos y una contraseña segura.
- La contraseña nunca se guarda en texto plano; se almacena como hash.
- El inicio de sesión valida credenciales y emite un token JWT para identificar al usuario en las siguientes peticiones.
- Las rutas protegidas requieren autenticación previa.

### 2. Catálogo de películas y series

- El catálogo se consume desde una API externa de IMDb.
- El backend actúa como intermediario para evitar exponer credenciales sensibles en el frontend.
- El sistema no mantiene una copia completa del catálogo en la base de datos local.
- Solo se conserva el identificador del contenido necesario para relacionarlo con valoraciones y listas del usuario.
- La información mostrada al usuario incluye los datos necesarios para explorar el contenido disponible, como título, descripción, año o género según la fuente externa.

### 3. Valoraciones

- Cada usuario puede calificar una película o serie con una escala de 1 a 5.
- Solo se permiten valores enteros dentro de ese rango.
- Un usuario solo puede tener una valoración por contenido.
- Si el usuario vuelve a calificar el mismo elemento, la valoración se actualiza en lugar de duplicarse.
- El sistema calcula el promedio de calificaciones por contenido para dar una referencia agregada.

### 4. Listas personales

- El usuario puede organizar contenido en listas privadas, como Favoritos y Watchlist, cuando esa funcionalidad forme parte del alcance activado.
- Cada lista pertenece exclusivamente a su creador.
- Agregar o eliminar un contenido de una lista no afecta a la otra.
- El acceso a estas listas está restringido al usuario autenticado dueño de la información.

### 5. Privacidad y control de acceso

- Toda la actividad de usuario se consulta con verificación de propiedad.
- Ningún usuario puede modificar valoraciones o listas de otro usuario.
- Los datos sensibles del sistema se manejan exclusivamente en el backend.
- La API key externa nunca debe exponerse desde el cliente.

### 6. Persistencia de datos

- Se almacenan usuarios, valoraciones y relaciones con contenido externo.
- La base de datos local conserva solo la información necesaria para sostener la actividad del usuario.
- El modelo busca evitar duplicidad, mantener trazabilidad y facilitar la consulta de la interacción histórica del usuario.

## Funcionalidades del backend

- Registro de usuarios.
- Inicio de sesión con JWT.
- Hashing de contraseñas con bcrypt.
- Búsqueda y consulta del catálogo mediante IMDb.
- Registro y actualización de valoraciones.
- Cálculo de promedios de valoración.
- Gestión de listas personales privadas.
- Persistencia de usuarios, actividad y relaciones con contenido.

## Reglas de negocio

- La escala de valoración es de 1 a 5 estrellas.
- Solo se aceptan valores enteros en la calificación.
- Un usuario solo puede tener una valoración por película o serie.
- Las valoraciones se guardan con lógica de actualización para evitar duplicados.
- El catálogo no se almacena completo localmente; se consulta desde la API externa y se guarda únicamente el identificador necesario para la actividad del usuario.
- Las listas y valoraciones son privadas del usuario creador.
- No se debe exponer la API key de IMDb en el frontend.
- El backend debe validar propiedad y autenticación antes de permitir lectura o modificación de datos privados.

## Modelo funcional del sistema

El flujo principal del negocio se puede resumir así:

1. El usuario crea una cuenta o inicia sesión.
2. El backend valida la identidad y entrega un token.
3. El usuario busca contenido en IMDb mediante el backend.
4. El usuario califica una película o serie o la agrega a una lista personal.
5. El backend guarda la relación entre el usuario y el contenido.
6. El sistema calcula y expone promedios o historial según corresponda.

## Definición de Contratos API (IN-01)

Para asegurar compatibilidad entre frontend y backend, se definieron contratos de solicitudes y respuestas en:

- `src/contracts/api.contracts.ts`
- `src/contracts/index.ts`

Estos contratos usan `zod` para validación y también exportan tipos TypeScript para consumo desde capas de aplicación.

## Registro de endpoints

Base URL del backend:

- `/api`

Endpoints implementados actualmente:

- `GET /health`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/status`
- `GET /api/users/status`
- `GET /api/users/me`
- `GET /api/movies/status`
- `GET /api/movies/search`
- `GET /api/ratings/status`
- `POST /api/ratings`
- `GET /api/ratings/average/:contentId`
- `GET /api/lists/status`

Endpoints funcionales esperados (MVP):

- `GET /api/lists/:type`

### Contratos principales

1. Registro de usuario

- Endpoint: `POST /api/auth/register`
- Request:

```json
{
	"name": "string",
	"email": "string(email)",
	"password": "string(min:8)"
}
```

- Response `201`:

```json
{
	"id": "string",
	"name": "string",
	"email": "string",
	"createdAt": "date-time",
	"updatedAt": "date-time"
}
```

2. Login

- Endpoint: `POST /api/auth/login`
- Request:

```json
{
	"email": "string(email)",
	"password": "string(min:8)"
}
```

- Response `200`:

```json
{
	"accessToken": "string",
	"tokenType": "bearer",
	"expiresIn": "string",
	"user": {
		"id": "string",
		"name": "string",
		"email": "string",
		"createdAt": "date-time",
		"updatedAt": "date-time"
	}
}
```

3. Catálogo de películas y series

- Endpoint: `GET /api/movies/search`
- Query params:
	- `q` opcional (`string`)
	- `limit` opcional (`number` entre 1 y 100, default backend: 20)
- Response `200`:

```json
{
	"count": 0,
	"items": [
		{
			"externalId": "string",
			"title": "string",
			"type": "movie|series",
			"posterUrl": "string|null"
		}
	]
}
```

4. Crear o actualizar calificación

- Endpoint: `POST /api/ratings`
- Requiere: `Authorization: Bearer <token>`
- Request:

```json
{
	"contentId": "string",
	"score": 1,
	"comment": "string(opcional)"
}
```

- Response `201` (creado) o `200` (actualizado):

```json
{
	"id": "string",
	"score": 1,
	"comment": "string|null",
	"userId": "string",
	"contentId": "string",
	"createdAt": "date-time",
	"updatedAt": "date-time"
}
```

5. Promedio de calificaciones por contenido

- Endpoint: `GET /api/ratings/average/:contentId`
- Response `200`:

```json
{
	"contentId": "string",
	"averageScore": 0,
	"totalRatings": 0
}
```

6. Perfil autenticado

- Endpoint: `GET /api/users/me`
- Requiere: `Authorization: Bearer <token>`
- Response `200`:

```json
{
	"user": {
		"id": "string",
		"email": "string",
		"name": "string(opcional)"
	}
}
```

7. Contrato previsto para listas personales (MVP)

- Endpoint esperado: `GET /api/lists/:type`
- Requiere: `Authorization: Bearer <token>`
- `type`: `favorites | watchlist`
- Response esperada `200`:

```json
{
	"id": "string",
	"name": "string",
	"type": "favorites|watchlist",
	"items": [
		{
			"contentId": "string",
			"externalId": "string",
			"title": "string",
			"type": "movie|series",
			"posterUrl": "string|null",
			"addedAt": "date-time"
		}
	]
}
```

8. Errores estándar

- Estructura común:

```json
{
	"message": "string"
}
```

## Alcance fuera del MVP

- Autenticación con terceros.
- Streaming o reproducción de contenido.
- Sincronización completa del catálogo en base de datos local.
- Sistema de comentarios.
- Funcionalidades de comunidad o interacción entre usuarios.

## Componentes del proyecto

El backend de FILMAX se organiza alrededor de los siguientes componentes funcionales:

- Autenticación y autorización.
- Consulta de catálogo externo.
- Gestión de valoraciones.
- Gestión de listas personales.
- Persistencia de usuarios y actividad.
- Integración con IMDb mediante backend proxy.

## Estructura lógica de datos

El sistema conserva únicamente la información necesaria para la operación del usuario y evita duplicar el catálogo completo en la base de datos local.

Las entidades funcionales principales son:

- Usuario: identidad, credenciales y relación con la actividad.
- Rating: calificación asignada por un usuario a un contenido.
- Personal list: relación entre un usuario y un contenido guardado como favorito o watchlist cuando esa funcionalidad esté habilitada.

## Uso del proyecto

Este repositorio sirve como base para el backend de FILMAX. Su objetivo es exponer la lógica de negocio, asegurar la integridad de los datos y servir como punto de integración con el frontend.

## Colaboradores

Este proyecto fue desarrollado por:

- José de Jesús Almanza Contreras
- Pablo Emilio Alonso Romero
- Víctor Hassiel Ávila Monjaraz
- Jossué Amador Ynfante
- Leonardo Gael Durán Torres

## Documentación general

Este README describe el proyecto como un backend orientado al control de autenticación, catálogo y actividad del usuario. Su propósito es documentar el comportamiento general del sistema y la lógica de negocio que lo sostiene.

## Inicio rápido

1. Clona el repositorio.
2. Instala dependencias del backend.
3. Configura las variables de entorno.
4. Ejecuta las migraciones de base de datos.
5. Levanta el servidor de desarrollo.

## Arquitectura de carpetas

La base del proyecto quedó organizada con una estructura estándar por capas y por dominio funcional:

```text
prisma/
src/
	config/
	middlewares/
	routes/
	modules/
		auth/
		movies/
		ratings/
		lists/
		users/
	utils/
```

La idea es separar la infraestructura común del negocio por módulos, para que autenticación, catálogo, valoraciones y listas crezcan sin mezclar responsabilidades.

## Instalación de dependencias

```bash
npm install
```

Dependencias principales ya contempladas:

- express, cors, helmet, morgan, express-rate-limit
- dotenv, zod
- bcrypt, jsonwebtoken
- prisma, @prisma/client
- typescript, tsx, eslint, prettier

## Comandos base

```bash
npm run dev
npm run build
npm run prisma:generate
npm run prisma:migrate
```

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

La información de este README fue consolidada a partir de los requisitos funcionales y técnicos del proyecto para dejar una base inicial del backend.
