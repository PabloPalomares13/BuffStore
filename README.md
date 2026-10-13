# 🎮 Buff Store - Plataforma Web para la Comercialización de Productos Digitales

<div align="center">

  ![Buff Store Banner](https://img.shields.io/badge/BUFF%20STORE-Gaming%20E--Commerce-00FF37?style=for-the-badge&logo=gamepad&logoColor=black)

  **Plataforma de comercio electrónico Full-Stack para la distribución instantánea de videojuegos, licencias digitales y microtransacciones.**

  [![React](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
  [![Vite](https://img.shields.io/badge/Vite_6-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
  [![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS_v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
  [![NodeJS](https://img.shields.io/badge/Node.js_22-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
  [![Express](https://img.shields.io/badge/Express_5-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
  [![MongoDB](https://img.shields.io/badge/MongoDB_Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
  [![Google Cloud](https://img.shields.io/badge/Google_Cloud_Storage-4285F4?style=for-the-badge&logo=google-cloud&logoColor=white)](https://cloud.google.com/)
  [![Gemini](https://img.shields.io/badge/Google_Gemini_AI-8E75B2?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)
  [![RAWG](https://img.shields.io/badge/RAWG_API-000000?style=for-the-badge&logo=gamecontroller&logoColor=white)](https://rawg.io/apidocs)
  [![MercadoPago](https://img.shields.io/badge/MercadoPago_SDK_v2-009EE3?style=for-the-badge&logo=mercadopago&logoColor=white)](https://www.mercadopago.com/)
  [![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)

</div>

---

## 📌 Visión General del Proyecto

**Buff Store** es una solución web de comercio electrónico Full-Stack orientada a resolver las demandas críticas en la venta de licencias de software y videojuegos digitales: **entrega instantánea, alta concurrencia, enriquecimiento automatizado de catálogo y asistencia interactiva con Inteligencia Artificial**.

El ecosistema está desacoplado en tres componentes principales:
1. **Frontend (`/frontend`):** Aplicación SPA desarrollada en React 19 con Vite, Tailwind CSS v4, animaciones fluidas con Framer Motion y panel de administración interactivo.
2. **Backend API (`/server`):** Servidor RESTful en Node.js 22 y Express 5 con Mongoose 8 sobre MongoDB Atlas, que orquesta la autenticación, catálogos, pagos, asignación de llaves, caché de videojuegos e integraciones de IA.
3. **Procesador Multimedia (`/video-processor`):** Microservicio aislado contenerizado en Docker (Cloud Run ready) que transcodifica trailers de video con FFmpeg y genera miniaturas sin bloquear el servidor principal.

---

## 🌟 Características Principales

### 🎮 Integración con RAWG API & Normalización con Google Gemini AI
Para agilizar la administración del catálogo de videojuegos, el sistema incorpora un pipeline automatizado de búsqueda, extracción y traducción de información técnica y multimedia:

- **Búsqueda Predictiva en Tiempo Real (`RawgSearchBar`):**
  - Implementado en las vistas de creación (`NewProduct`) y modificación (`Modproducto`) de productos.
  - Cuenta con control de *debounce* (400 ms) para evitar sobreconsumo de peticiones HTTP hacia la API externa de [RAWG.io](https://rawg.io/apidocs).
  - Consulta en primer lugar la caché local persistente antes de invocar la API pública.
- **Autocompletado Exhaustivo de Metadatos:**
  - Al seleccionar un título candidato, el sistema extrae automáticamente:
    - Nombre del juego (`name`) y slug oficial.
    - Desarrollador / Estudio (`developer` asignado a `brand`).
    - Editor / Distribuidora (`publisher` asignado a `vendor`).
    - Fecha de lanzamiento oficial (`releaseDate`).
    - Calificación de la comunidad y cantidad de valoraciones (`rating` y `ratingsCount`).
    - Puntuación crítica oficial de **Metacritic** (`metacritic`).
    - Clasificación por edades **ESRB** (`esrbRating`).
    - Enlace al sitio web oficial del título (`website`).
    - Géneros (`genres`), plataformas compatibles (`platformsFull`) y etiquetas temáticas (`rawgTags`).
- **Importación y Autocompletado de Multimedia:**
  - Carátula principal del juego (`background_image` / `cover`).
  - Consulta paralela al endpoint de capturas de RAWG (`/games/:id/screenshots`) para recuperar e importar automáticamente hasta **6 capturas de pantalla oficiales en alta resolución** a la galería del producto.
- **Pipeline de Normalización & Traducción con Gemini (`geminiGameNormalizer`):**
  - Los datos crudos provistos por RAWG en inglés son enviados a la API de **Google Gemini** bajo un esquema forzado de **Structured Outputs (JSON Schema)**.
  - Gemini traduce descripciones extensas, géneros y tags al español de forma natural, **preservando intactos** nombres propios de juegos, nombres de desarrolladores/publishers, consolas y valores numéricos/fechas.
  - Incluye validación de esquema en servidor (`validateGameSchema`) previa a cualquier almacenamiento.
- **Caché en MongoDB (`RawgCache`) y Resiliencia Operativa:**
  - Los datos normalizados se guardan en la colección `rawgcaches` mediante operaciones atómicas de *upsert* para evitar llamadas redundantes a RAWG y optimizar el consumo de tokens de Gemini.
  - **Mecanismo de Fallback:** En caso de saturación o indisponibilidad temporal de los modelos de IA (errores 503 o 429), el controlador utiliza los datos crudos de RAWG para permitir que el administrador continúe trabajando sin interrupciones, advirtiendo en la interfaz visual el estado del fallback.
  - **Purga Selectiva de Caché:** El administrador dispone de un botón y endpoint específico (`DELETE /api/rawg/cache/:rawgId`) para limpiar la caché de un juego puntual y forzar una re-sincronización fresca cuando sea necesario.
- **Seguridad en Endpoints de RAWG:** Rutas (`/api/rawg/search`, `/api/rawg/details/:rawgId`, `/api/rawg/cache/:rawgId`) protegidas estrictamente con middlewares de autenticación y verificación de rol de administrador (`protect`, `isAdmin`).

---

### 🤖 Asistente Virtual Inteligente con Google Gemini
El sistema dispone de un asistente conversacional (`ChatBot.jsx`) integrado de forma transversal en la plataforma con capacidades avanzadas de razonamiento y visión computacional:

- **Arquitectura de Function Calling (Llamadas a Herramientas) con RBAC:**
  El modelo ejecuta herramientas dinámicas en la base de datos según el rol del usuario conectado:
  - **Invitados (`guest`):**
    - `getProducts`: Búsqueda y filtrado de productos del catálogo según texto, categoría o etiquetas.
  - **Usuarios Autenticados (`user`):**
    - `getProducts`: Exploración del catálogo.
    - `getMyOrders`: Consulta del historial de compras y estado de pedidos del usuario en sesión.
    - `getMyFavorites`: Consulta de títulos guardados como favoritos para recomendaciones personalizadas.
    - `createReport`: Creación asistida de tickets de quejas, reclamos, sugerencias o fallas de productos.
  - **Administradores (`admin`):**
    - Todas las anteriores más `createProduct`, `updateProduct`, `deleteProduct`, `getOrders` (todas las órdenes del sistema) y `getUsers` (listado administrativo de cuentas).
- **Identificación Multimodal por Imagen (Visión Artificial):**
  - Endpoint `/api/gemini/image` para subir carátulas o capturas de videojuegos: Gemini analiza la imagen, identifica el título y responde con los detalles correspondientes.
- **Protección contra Abuso & Límites de Tasa:**
  - Middleware `chatRateLimit` y colección de control `ChatUsage` en MongoDB para limitar peticiones de chat por usuario/IP según su rol.
- **Tolerancia a Fallos Multimodelo:**
  - Mecanismo `runWithFallback` que reintenta con retroceso exponencial (*exponential backoff*) y alterna entre modelos de texto/visión de Gemini si un endpoint experimenta saturación.

---

### 🔑 Gestión de Licencias Digitales & Asignación Atómica (`GameCodes`)
- **Inventario de Claves Únicas:** Modelo `GameCode` asociado a productos específicos con soporte de plataformas (`ps5`, `pc`, `xbox`).
- **Estados de Ciclo de Vida:** Control de llaves digitales bajo estados de validez (`valid`, `used`, `expired`).
- **Entrega Concurrente Segura:** Asignación atómica de llaves disponibles al procesar la orden aprobada, evitando duplicidades o entregas cruzadas entre clientes.

---

### 💳 Checkout Transparente & Pagos con MercadoPago
- **Integración con SDK Oficial de MercadoPago:** Creación de preferencias de pago con ítems detallados, precios en moneda local y cargos impositivos.
- **Sincronización Asíncrona vía Webhooks:** Endpoint `/api/payments/webhook` para recepción y verificación de notificaciones de pago en segundo plano.
- **Flujo Completo de Respuesta:** Enrutamiento específico en frontend para transacciones exitosas (`/checkout/success`), pendientes (`/checkout/pending`) y rechazadas (`/checkout/failure`).

---

### ✉️ Notificaciones Transaccionales con Resend & React Email
- **Envío Automatizado de Confirmaciones:** Notificación por correo electrónico tras la aprobación de la compra.
- **Plantillas Dinámicas:** Renderizado de correos con `@react-email` conteniendo el resumen de la orden, los títulos adquiridos y las claves digitales asignadas de forma estructurada.

---

### 🎬 Microservicio Multimedia Asíncrono (`video-processor`)
- **Aislamiento de Carga de Trabajo:** Servicio independiente en Express dentro de un contenedor Docker para no saturar el Event Loop del backend API principal.
- **Transcodificación FFmpeg:**
  - Conversión a contenedor MP4 con códecs universales (`libx264` y audio `aac` a 128 kbps).
  - Compresión balanceada (`-crf 26`, `-preset fast`) y optimización de reproducción progresiva en web (`-movflags +faststart`).
  - Escala adaptativa hasta un máximo de 1080p manteniendo la relación de aspecto.
- **Generación Automática de Miniaturas:** Extracción de fotogramas clave en el 10% del metraje para producir miniaturas JPEG en resolución 640x360.
- **Almacenamiento en Google Cloud Storage:** Subida automática de los archivos procesados con cabeceras de caché prolongado (`Cache-Control: public, max-age=31536000`).
- **Limpieza de Archivos Huérfanos:** Eliminación segura del video crudo inicial en el bucket y de los archivos temporales en disco tras finalizar con éxito.
- **Callback Autenticado:** Comunicación entre el procesador y el servidor principal protegida mediante clave secreta de procesamiento (`x-video-process-key`).

---

### 🛡️ Administración, Soporte, Reseñas y Auditoría
- **Panel Administrativo Integral:** Métricas en tiempo real con Recharts, gestión de stock, banners destacados, moderación de catálogos y órdenes.
- **Sistema de Reseñas y Valoraciones (`Comment`):** Puntuación de 1 a 5 estrellas con cálculo automático de promedios (`reviewsAvg`) y conteos (`reviewsCount`) por producto.
- **Módulo de Reportes & Atención al Cliente (`Report`):** Canal para registrar y clasificar quejas, reclamos, fallas y sugerencias, administrables desde `/Reportes`.
- **Feedback de Tienda (`StoreFeedback`):** Registro de opiniones y satisfacción general sobre la experiencia de compra.
- **Trazabilidad (`Auditlog`):** Registro de acciones críticas realizadas por administradores sobre la plataforma.
- **Favoritos Híbridos:** Gestión persistente de favoritos en `localStorage` para usuarios no registrados con sincronización automática en MongoDB Atlas al iniciar sesión.

---

## 📐 Arquitectura del Sistema

```mermaid
flowchart TD
    subgraph Cliente [Frontend - React 19 + Vite]
        UI[Catálogo & Tienda]
        AdminUI[Panel Admin / Mod / NewProduct]
        ChatUI[Asistente Virtual Chatbot]
        RawgBar[Buscador RAWG con Debounce]
    end

    subgraph Backend [Backend API - Node.js 22 + Express 5]
        Auth[Autenticación & RBAC JWT]
        Catalog[Catálogo & Productos]
        OrderEngine[Motor de Órdenes & GameCodes]
        RawgCtrl[Controlador RAWG & Caché]
        GeminiCtrl[Agente IA & Function Calling]
        GeminiNorm[Normalizador de Videojuegos]
        VideoRouter[Router de Notificación de Video]
    end

    subgraph Microservicios [Procesamiento Aislado]
        VideoProc[video-processor Docker / FFmpeg]
    end

    subgraph Servicios_Externos [Servicios Cloud & Terceros]
        Mongo[(MongoDB Atlas)]
        GCS[(Google Cloud Storage)]
        RAWGAPI[RAWG.io Video Games API]
        GeminiAPI[Google Gemini AI API]
        MP[MercadoPago SDK]
        ResendAPI[Resend Email API]
    end

    AdminUI --> RawgBar
    RawgBar -->|HTTP /rawg/search & /details| RawgCtrl
    RawgCtrl -->|1. Consultar / Guardar| Mongo
    RawgCtrl -->|2. Datos Factuales & Screenshots| RAWGAPI
    RawgCtrl -->|3. Normalizar & Traducir| GeminiNorm
    GeminiNorm -->|Structured Output JSON Schema| GeminiAPI

    ChatUI -->|Texto / Imágenes| GeminiCtrl
    GeminiCtrl -->|Function Calling contextual| Catalog
    GeminiCtrl -->|Function Calling contextual| OrderEngine
    GeminiCtrl -->|Llamadas API| GeminiAPI

    UI --> Catalog
    Catalog --> Mongo
    AdminUI -->|Upload Video| Catalog
    Catalog -->|Guardar Raw| GCS
    Catalog -->|Disparar Tarea /process| VideoProc
    VideoProc -->|Descargar Raw| GCS
    VideoProc -->|Subir Optimizado + Thumb| GCS
    VideoProc -->|Callback Autenticado| VideoRouter

    UI --> OrderEngine
    OrderEngine --> MP
    OrderEngine -->|Asignación Atómica| Mongo
    OrderEngine --> ResendAPI
```

---

## 🛠️ Stack Tecnológico

| Capa | Tecnologías |
| :--- | :--- |
| **Frontend** | React 19, Vite 6, Tailwind CSS v4, Framer Motion, Recharts, Lucide React, React Router DOM 7, React Lazy Load Image, SweetAlert2 |
| **Backend API** | Node.js 22, Express 5, Mongoose 8, MongoDB Atlas, JWT (JsonWebToken), Bcryptjs, Multer |
| **Inteligencia Artificial** | Google Gemini AI (`@google/genai`), Function Calling dinámico por roles, Visión Multimodal, Structured Outputs (JSON Schema) |
| **APIs Externas** | RAWG.io API (Base de datos de videojuegos), MercadoPago SDK v2 (Pasarela de pagos), Resend API (`@react-email`) |
| **Multimedia & Cloud** | Google Cloud Storage (`@google-cloud/storage`), Docker, FFmpeg (`fluent-ffmpeg`), Cloud Run |

---

## 📂 Estructura del Repositorio

```text
plataforma-games/
├── frontend/                  # Aplicación de cliente en React 19 + Vite
│   ├── src/
│   │   ├── components/        # Componentes reutilizables de UI (RawgSearchBar, Navbar, etc.)
│   │   ├── layouts/           # AdminLayout, MainLayout, AuthLayout
│   │   ├── pages/             # Vistas de la tienda, carrito, perfil, checkout y panel admin
│   │   ├── services/          # Conexiones API (rawgService, productService, etc.)
│   │   └── App.jsx            # Enrutamiento de la aplicación y rutas protegidas
│   └── package.json
│
├── server/                    # API Backend en Node.js + Express
│   ├── config/                # Configuraciones (geminiConfig, geminiTools, rawgConfig, db)
│   ├── Controllers/           # Controladores de lógica (rawgController, geminiController, etc.)
│   ├── middleware/            # Autenticación JWT, verificación de roles, chat rate limits
│   ├── models/                # Modelos Mongoose (Product, RawgCache, GameCode, Order, User, etc.)
│   ├── routes/                # Definición de rutas RESTful
│   └── index.js               # Punto de entrada del servidor
│
├── video-processor/           # Microservicio independiente de procesamiento multimedia
│   ├── Dockerfile             # Imagen de contenedor con soporte de FFmpeg
│   ├── server.js              # Servidor Express de transcodificación y subida a GCS
│   └── package.json
│
├── AUDITORIA_PROYECTO.txt     # Informe de auditoría técnica y seguridad
└── README.md                  # Documentación principal del proyecto
```

---

## 🔐 Configuración de Variables de Entorno

Para ejecutar el proyecto, es necesario configurar las variables de entorno en cada uno de los módulos:

### 1. Servidor Principal (`/server/.env`)
```ini
PORT=3000
MONGO_URI=mongodb+srv://<usuario>:<password>@cluster.mongodb.net/buffstore
JWT_SECRET=tu_clave_secreta_jwt_de_alta_entropia
FRONTEND_URL=http://localhost:5173

# API de RAWG (Metadatos de videojuegos)
RAWG_API_KEY=tu_api_key_de_rawg_io

# Google Gemini AI (Chatbot y Normalizador)
GEMINI_API_KEY=tu_api_key_de_google_gemini

# Pasarela de Pagos (Mercado Pago)
MP_ACCESS_TOKEN=tu_access_token_de_mercadopago

# Notificaciones por Email (Resend)
RESEND_API_KEY=tu_api_key_de_resend

# Almacenamiento en Google Cloud Storage
GCS_PROJECT_ID=tu_gcp_project_id
GCS_BUCKET_NAME=tu_bucket_name
GCS_CLIENT_EMAIL=tu_service_account_email
GCS_CLIENT_ID=tu_service_account_id
GCS_PRIVATE_KEY_ID=tu_private_key_id
GCS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Integración con el Microservicio de Video
VIDEO_PROCESSOR_URL=http://localhost:8080
VIDEO_PROCESS_KEY=clave_secreta_compartida_para_procesamiento
```

### 2. Frontend (`/frontend/.env`)
```ini
VITE_API_URL=http://localhost:3000/api
VITE_BACKEND_URL=http://localhost:3000
```

### 3. Procesador de Video (`/video-processor/.env`)
```ini
PORT=8080
VIDEO_PROCESS_KEY=clave_secreta_compartida_para_procesamiento
GCS_PROJECT_ID=tu_gcp_project_id
GCS_BUCKET_NAME=tu_bucket_name
GCS_BUCKET_NAME_NEW=tu_bucket_name
GCS_CLIENT_EMAIL=tu_service_account_email
GCS_CLIENT_ID=tu_service_account_id
GCS_PRIVATE_KEY_ID=tu_private_key_id
GCS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

---

## 🚀 Instalación y Puesta en Marcha Local

### **Requisitos Previos**
- **Node.js** (v20 o v22 recomendado) y **npm**.
- **MongoDB** (Instancia local activa o cluster en MongoDB Atlas).
- **Docker** y **FFmpeg** (requerido para ejecutar localmente el microservicio de video).
- Claves de API activas: **RAWG.io**, **Google Gemini**, **MercadoPago**, **Resend** y cuenta de servicio de **Google Cloud Storage**.

---

### **Pasos para Ejecución**

#### 1. Clonar el Repositorio
```bash
git clone https://github.com/PabloPalomares13/BuffStore.git
cd BuffStore
```

#### 2. Configurar y Levantar el Backend (`/server`)
```bash
cd server
npm install
# Crear el archivo .env con las variables descritas arriba
npm run dev
```
El servidor quedará disponible por defecto en `http://localhost:3000`.

#### 3. Configurar y Levantar el Frontend (`/frontend`)
En una nueva terminal:
```bash
cd frontend
npm install
# Crear el archivo .env con las variables de Vite
npm run dev
```
La aplicación cliente quedará disponible en `http://localhost:5173`.

#### 4. Levantar el Procesador de Video (`/video-processor`) *(Opcional en desarrollo local)*
En una nueva terminal:
```bash
cd video-processor
# Opción con Docker:
docker build -t video-processor .
docker run -p 8080:8080 --env-file .env video-processor

# O ejecución directa con Node.js (requiere FFmpeg instalado en el sistema):
npm install
npm start
```

---

<div align="center">
  <sub>Desarrollado para la comunidad Gamer 🎮 — Buff Store</sub>
</div>
