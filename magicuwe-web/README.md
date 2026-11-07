# MagicUWE 1.5.0 Web — Entorno de Modelado UWE 3.0 para Tesis Universitaria

Modernización web completa del plugin académico **MagicUWE 1.5.0** (originalmente desarrollado por la Ludwig-Maximilians-Universität München - LMU Munich para MagicDraw 18.0).

Diseñado específicamente para la elaboración de trabajos de grado, tesis de licenciatura y posgrado, preservando al **100% el aspecto visual, iconos, colores y metodología UML-based Web Engineering (UWE 3.0)** utilizada en el ámbito académico.

- 🌐 **Despliegue Oficial en Producción (Vercel):** [https://magicuwe-web.vercel.app](https://magicuwe-web.vercel.app)
- 📄 **Licencia:** Eclipse Public License v1.0 (EPL-1.0)

---

## 📑 Tabla de Contenidos
1. [Metodología UWE 3.0 Soportada](#-metodología-uwe-30-soportada)
2. [Fidelidad Visual con MagicDraw 18.0](#-fidelidad-visual-con-magicdraw-180)
3. [Tipos de Diagramas Soportados (10 Vistas Oficiales)](#-tipos-de-diagramas-soportados-10-vistas-oficiales)
4. [Primitivas de Acceso y Acciones UWE](#-primitivas-de-acceso-y-acciones-uwe)
5. [Patrones RIA (Rich Internet Applications)](#-patrones-ria-rich-internet-applications)
6. [Transformaciones Modelo a Modelo (M2M)](#-transformaciones-modelo-a-modelo-m2m)
7. [Edición Bi-direccional: Visual + XML / XMI](#-edición-bi-direccional-visual--xml--xmi)
8. [Persistencia Relacional SQLite](#-persistencia-relacional-sqlite)
9. [Autenticación Multi-usuario y Gmail](#-autenticación-multi-usuario-y-gmail)
10. [Exportación en Alta Resolución para Tesis (Word / LaTeX)](#-exportación-en-alta-resolución-para-tesis-word--latex)
11. [Guía de Ejecución Local y Despliegue](#-guía-de-ejecución-local-y-despliegue)
12. [Referencias Bibliográficas](#-referencias-bibliográficas)

---

## 🎯 Metodología UWE 3.0 Soportada

UWE (*UML-based Web Engineering*) es una metodología dirigida por modelos (MDD) que cubre todo el ciclo de desarrollo de aplicaciones web complejas:

```
[ Casos de Uso / Requisitos ]
             │
             ▼
     [ Modelo de Contenido ]  (Clases del Dominio)
             │
             ▼
   [ Modelo de Navegación ]   («navigationClass», primitivas de acceso, «processClass»)
        ┌────┴────────────────────────┬──────────────────────┐
        ▼                             ▼                      ▼
[ Modelo de Presentación ]   [ Estructura de Proceso ]  [ Flujo de Proceso ]
(Páginas y UI anidada)      (Clases transaccionales)   (Workflows y Acciones)
```

MagicUWE Web implementa formalmente el meta-perfil UWE 3.0 con todas sus extensiones estereotipadas y valores etiquetados (*tagged values*).

---

## 🎨 Fidelidad Visual con MagicDraw 18.0

Para que los diagramas generados sean 100% compatibles e indistinguibles de los producidos en MagicDraw 18.0, la aplicación integra:

1. **154 Iconos Originales PNG**: Extraídos directamente del binario Java `MagicUWE.jar` y del archivo de perfil XMI `UWE Profile.mdzip`. Todos los iconos están embebidos en Base64 en el bundle `public/assets/uwe-assets.js`.
2. **Paleta de Colores Extraída del Perfil Oficial**:
   - **Clases / Contenedores**: Relleno `#FFE2C6`, Borde `#99795C`.
   - **Atributos y Tagged Values**: Texto `#280000` (fuente Arial 11px).
   - **Operaciones**: Texto `#000028`.
   - **Paquetes y Modelos**: Relleno `#D4DDFF`, Borde `#6B7599`.
   - **Estados de Navegación**: Relleno `#DDDDFF`, Borde `#6B7599`.
   - **Acciones de Proceso**: Relleno `#E1E1C3`, Borde `#99995C`.
   - **Casos de Uso**: Relleno `#FFFFCC`, Borde `#666647`.
   - **Notas y Restricciones**: Relleno `#FFF0B4`, Borde `#998D5C`.
3. **Marco de Diagrama Oficial**: Encabezado pentagonal estándar `package Model [ Icon DiagramName ]` en la esquina superior izquierda de cada diagrama.

---

## 📊 Tipos de Diagramas Soportados (10 Vistas Oficiales)

| Tipo de Diagrama | Estereotipo de Paquete | Metaclases y Estereotipos Principales | Atajo de Barra |
| :--- | :--- | :--- | :--- |
| **Content Diagram** | `«contentModel»` | Clases de dominio, asociaciones, generalizaciones, atributos y multiplicidades. | `C` |
| **Navigation Diagram** | `«navigationModel»` | `«navigationClass»`, `«externalNode»`, `«navigationLink»`, `«processClass»`, `«processLink»`. | `N` |
| **Presentation Diagram** | `«presentationModel»` | `«presentationPage»`, `«presentationGroup»`, `«window»`, y propiedades UI anidadas (`text`, `button`, `inputForm`, `anchor`). | `P` |
| **Process Structure** | `«processModel»` | `«processClass»`, dependencias de datos y componentes lógicos de negocio. | `S` |
| **Process Flow** | `«processModel»` | Actividades `«userAction»`, `«systemAction»`, nodos de inicio/fin, bifurcaciones de decisión. | `F` |
| **Use Case (Requirements)** | `«requirementsModel»` | `«webUseCase»`, `«browsing»`, `«processing»`, actores `«user»`. | `U` |
| **Requirements Activity** | `«requirementsModel»` | `«displayAction»`, `«interactionPin»`, `«navigationAction»`. | `A` |
| **Navigation States** | `«navigationStatesModel»`| `«navigationalNode»`, `«session»`, `«collection»`, `«externalLink»`, `«target»`. | `T` |
| **User Model** | `«userModel»` | Perfiles de usuario, roles, preferencias y adaptatividad. | `M` |
| **Basic Rights** | `«basicRightsModel»` | Dependencias `«create»`, `«read»`, `«update»`, `«delete»`, `«execute»`, `«accessType»`. | `R` |

---

## ⚡ Primitivas de Acceso y Acciones UWE

En el **Diagrama de Navegación**, al seleccionar cualquier relación entre nodos, el inspector contextual ofrece la inserción automática con un solo clic de las cuatro primitivas de acceso de UWE:

- **`«index»`**: Modela un índice o lista seleccionable de elementos de destino (multiplicidad `*`).
- **`«query»`**: Modela un formulario o mecanismo de búsqueda mediante una expresión de consulta (`{expression}`).
- **`«guidedTour»`**: Modela un recorrido guiado o paginación secuencial (`{sortExpression}`).
- **`«menu»`**: Modela un menú estático o dinámico con opciones de navegación fijas.

En el **Diagrama de Presentación**, la herramienta de propiedades de interfaz (`DrawPropertyAction`) permite hacer clic dentro de una clase `«presentationPage»` o `«presentationGroup»` para incrustar controles visuales:
- `text` y `textInput`
- `button` y `fileUpload`
- `anchor` y `mediaObject`
- `selection` y `inputForm`

---

## 🌟 Patrones RIA (Rich Internet Applications)

El panel del Inspector incluye los patrones RIA del perfil UWE para modelar comportamientos interactivos avanzados:

- **Validación y Sugerencias:** `liveValidation`, `autoCompletion`, `autoSuggestion`.
- **Efectos Visuales:** `lightbox`, `collapse`, `dragAndDrop`, `periodicRefresh`.
- **Componentes Ricos:** `richEditor`, `gallery`, `filter`, `liveReport`, `multipleSelection`.
- **Seguridad y Sesión:** `csrfPrevention`, `newSessionID`, `{transmissionType = TLS}`.

---

## 🔄 Transformaciones Modelo a Modelo (M2M)

Desde el menú superior **Transformaciones UWE (M2M)** se pueden ejecutar las transformaciones automáticas basadas en las reglas de Nora Koch et al.:

1. **Content ➔ Navigation:** Genera automáticamente clases `«navigationClass»` y enlaces navegacionales a partir de las clases de entidad del modelo de contenido.
2. **Navigation ➔ Presentation:** Scaffolding automático de páginas `«presentationPage»` y formularios `«inputForm»` con sus correspondientes botones y anclas.
3. **Navigation ➔ Process Structure:** Extrae todas las clases marcadas como `«processClass»` y las organiza en el diagrama estructural de procesos.
4. **Navigation ➔ Process Flows:** Genera un diagrama de actividad con flujos de control (`«userAction»` ➔ `«systemAction»`) para cada clase de proceso.
5. **Requirements ➔ Content / Navigation / Presentation / Process:** Genera los modelos técnicos iniciales a partir de los casos de uso (`«browsing»` y `«processing»`).

---

## 💻 Edición Bi-direccional: Visual + XML / XMI

La aplicación ofrece tres modos de visualización seleccionables desde la barra de herramientas:

1. **🎨 Vista Visual:** Lienzo de modelado gráfico interactivo estilo MagicDraw 18.0.
2. **⚡ Vista Dividida (Visual + XML en vivo):** Visualiza simultáneamente el canvas y el código XML/XMI del modelo. Cada movimiento o edición de nodos actualiza el XML en tiempo real.
3. **💻 Código XML:** Editor de texto con resaltado y formateador XML. Permite modificar estereotipos, atributos o coordenadas a mano y pulsar **"Aplicar XML al Modelo"** para que los cambios se reflejen de inmediato en el canvas y en el árbol de contención.

Además, permite descargar en cualquier momento el snapshot en formato `.uwe.xmi.xml`.

---

## 🗄️ Persistencia Relacional SQLite

El backend almacena y normaliza el modelo UWE en una base de datos relacional SQLite (`magicuwe.sqlite`) utilizando el módulo nativo `node:sqlite`:

- **Tabla `users`:** Cuentas registradas y perfiles de Google/Gmail.
- **Tabla `projects`:** Metadatos, snapshot JSON y snapshot XML.
- **Tabla `packages`:** Jerarquía de modelos y paquetes UWE (`project_id`, `stereotype`).
- **Tabla `elements`:** Clases, estados, acciones y casos de uso con atributos y tagged values.
- **Tabla `relationships`:** Asociaciones, enlaces, dependencias y transiciones con multiplicidades.
- **Tabla `diagrams`:** Layout visual de nodos (`x`, `y`, `width`, `height`) y aristas.

### Manejo de Capas y Agrupación Estilo Canva.com
- **Capas Visuales (Z-Index / Stacking Order):** Control de orden de superposición mediante botones de barra de herramientas e inspector:
  - `🔼 Frente`: Trae los elementos seleccionados a la capa superior.
  - `⬆️ Adelante` / `⬇️ Atrás`: Sube o baja una capa el elemento (`Ctrl+]` / `Ctrl+[`).
  - `🔽 Fondo`: Envía los elementos seleccionados a la capa más profunda.
- **Agrupación y Desagrupación (Group / Ungroup):**
  - `🔗 Agrupar (Ctrl+G)`: Con Shift + Clic selecciona múltiples nodos y agrúpalos para que se muevan juntos en bloque manteniendo sus distancias relativas exactas.
  - `🔓 Desagrupar (Ctrl+Shift+G)`: Libera los elementos para que vuelvan a moverse individualmente.
  - Distintivos visuales (`🔗 Grupo`, `Capa N`) en tiempo real.

### Persistencia Relacional SQLite
El modelo UWE y sus diagramas se almacenan y sincronizan automáticamente en la base de datos relacional SQLite del servidor mediante tablas normalizadas (`uwe_packages`, `uwe_elements`, `uwe_relationships`, `uwe_diagrams`, `uwe_xml_snapshots`). Permite importar archivos `.uwe.sqlite` e inspeccionar las tablas relacionales en vivo.

---

## 🔑 Autenticación Multi-usuario y Gmail

La aplicación cuenta con un sistema completo de autenticación que se solicita en la primera visita del usuario o cuando no hay una sesión activa:

- **Modal "Iniciar Sesión / Crear Cuenta (Multi-usuario y Gmail)":**
  - **Pestaña 1 - Iniciar Sesión:** Acceso rápido mediante correo electrónico o nombre de usuario y contraseña (`POST /api/auth/login`).
  - **Pestaña 2 - Registrarse:** Creación de cuenta con nombre completo, correo/usuario, contraseña y confirmación (`POST /api/auth/register`).
  - **Pestaña 3 - Google / Gmail:**
    - **Botón Oficial de Google Identity Services:** Si se configura `GOOGLE_CLIENT_ID` en el archivo `.env`, se activa el botón oficial de Google One Tap / OAuth.
    - **Acceso Directo con Gmail:** Permite ingresar ingresando la dirección `@gmail.com` de forma instantánea sin necesidad de configuración externa.
  - **Modo Invitado:** Opción para continuar y explorar la herramienta en modo local en el navegador sin guardar en la base de datos de la nube.

### ⚙️ Configuración del Token / Client ID de Google en `.env`

El proyecto incluye un archivo `.env` en la raíz de `magicuwe-web/`:
```env
PORT=3456
MAGICUWE_SECRET=magicuwe-lmu-thesis-secret-key-2026

# Credenciales de Google OAuth 2.0 (Google Identity Services)
GOOGLE_CLIENT_ID=tu-id-de-cliente.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=tu-client-secret
```

**Para generar el ID de cliente de Google:**
1. Ingresa a la [Consola de Google Cloud](https://console.cloud.google.com/apis/credentials).
2. Haz clic en **Crear credenciales** > **ID de cliente de OAuth**.
3. Selecciona Tipo de aplicación: **Aplicación Web**.
4. En **Orígenes de JavaScript autorizados**, añade: `http://localhost:3456`.
5. Copia el **ID de cliente** generado y pégalo en la variable `GOOGLE_CLIENT_ID` de tu archivo `.env`.
6. Reinicia el servidor local (`npm start`). El botón oficial de Google aparecerá automáticamente.

---

## 📷 Exportación en Alta Resolución para Tesis (Word / LaTeX)

- **Vectorial SVG (`.svg`):** Exporta el diagrama en formato escalable con todas las fuentes, colores y los 154 iconos originales PNG embebidos en Base64. Ideal para su conversión a PDF vectorial o inclusión en LaTeX.
- **PNG 300 DPI (`.png`):** Renderizado a triple resolución (3x) con fondo blanco nítido y marco MagicDraw 18.0, listo para insertar directamente en Microsoft Word o LibreOffice sin pixelación.

---

## 🚀 Guía de Ejecución Local y Despliegue

### Requisitos Previos
- **Node.js 18+** (Node.js 20, 22 o 25 recomendado para soporte nativo de `node:sqlite`).
- **Sin dependencias externas:** No requiere ejecutar `npm install` (utiliza bibliotecas estándar de Node.js).

### Pasos para Levantar el Servidor Local

1. **Acceder a la carpeta del proyecto:**
   ```bash
   cd magicuwe-web
   ```

2. **(Opcional) Configurar variables de entorno:**
   ```bash
   cp .env.example .env
   ```
   *Permite personalizar el puerto (`PORT=3456`) y credenciales de Google OAuth.*

3. **Iniciar el servidor:**
   ```bash
   # Opción estándar
   npm start

   # O ejecución directa con Node.js
   node server.mjs

   # En modo desarrollo
   npm run dev

   # En un puerto específico
   PORT=8080 npm start
   ```

4. **Acceder a la aplicación:**
   - **Aplicación Web UWE:** [http://localhost:3456](http://localhost:3456)
   - **Verificación de API (Healthcheck):** [http://localhost:3456/api/health](http://localhost:3456/api/health)
   - **Base de datos SQLite:** Se genera automáticamente en `data/magicuwe.sqlite`

5. **Detener el servidor:**
   Presiona `Ctrl + C` en la terminal.

### Despliegue en Vercel
El proyecto está preconfigurado con `vercel.json` y funciones Serverless en `/api`:
```bash
npm install -g vercel
vercel --prod
```

---

## 📚 Referencias Bibliográficas

- **Koch, N., & Kraus, A.** (2002). *The expressive power of UML-based Web engineering*. In Second International Workshop on Web-oriented Software Technology (IWWOST).
- **Kraus, A., Knapp, A., & Koch, N.** (2007). *Model-Driven Web Engineering with UWE*. In International Conference on Web Engineering (ICWE), Como, Italy.
- **Koch, N., Zhang, G., & Escalona, M. J.** (2006). *Model Transformations from Requirements to Web System Design*. In Web Engineering (pp. 281-288). Springer, Berlin, Heidelberg.
- **Baumeister, H., Koch, N., & Mandel, L.** (1999). *Towards a UML extension for hypermedia design*. In «UML»’99—The Unified Modeling Language (pp. 614-629). Springer, Berlin, Heidelberg.
- **Ludwig-Maximilians-Universität München (LMU).** *MagicUWE — A CASE Tool Plugin for UML-based Web Engineering*. [https://uwe.pst.ifi.lmu.de/toolMagicUWE.html](https://uwe.pst.ifi.lmu.de/toolMagicUWE.html).

