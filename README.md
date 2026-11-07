===============================================================================
MAGICUWE 1.5.0 - HERRAMIENTAS CASE PARA UML-BASED WEB ENGINEERING (UWE)
===============================================================================

Proyecto de ingenieria de software orientado al modelado formal y diseo de
aplicaciones web mediante la metodologia UWE (UML-based Web Engineering),
desarrollada originalmente por el grupo de investigacion de Programacion e
Ingenieria de Software de la Ludwig-Maximilians-Universitat Munchen (LMU Munchen).

Este repositorio consolida la distribucion del plugin MagicUWE 1.5.0 para el
entorno de modelado No Magic MagicDraw UML 18.0, sus perfiles oficiales,
documentacion academica y la implementacion de su entorno web para desarrollo
de tesis universitarias y proyectos de grado.


-------------------------------------------------------------------------------
1. DESCRIPCION DEL PROYECTO
-------------------------------------------------------------------------------

La metodologia UWE es una extension disciplinada del estandar UML para el
desarrollo de sistemas web conducido por modelos (Model-Driven Development - MDD).
Permite modelar formalmente y de forma separada las distintas dimensiones de una
aplicacion web a traves de vistas especializadas:

  a) Modelo de Requisitos:
     Captura las necesidades de los usuarios mediante casos de uso web y
     asociaciones de navegacion.

  b) Modelo de Contenido:
     Representa las entidades del dominio de negocio y sus relaciones
     estructurales (diagramas de clases UML estandar).

  c) Modelo de Navegacion:
     Define el espacio navegacional accesible para el usuario. Introduce
     clases de navegacion (<<navigationClass>>), primitivas de acceso
     (indices, consultas, recorridos guiados, menus) y clases de proceso
     (<<processClass>>).

  d) Modelo de Presentacion:
     Especifica la interfaz grafica abstracta (UI), organizando componentes
     en clases de presentacion (<<presentationClass>>), formularios, textos,
     botones y anclas de hipertexto.

  e) Modelo de Flujo de Procesos:
     Modela el comportamiento transaccional y la logica de operaciones
     mediante diagramas de actividades y acciones de proceso.


-------------------------------------------------------------------------------
2. CONTENIDO DEL PAQUETE
-------------------------------------------------------------------------------

El proyecto esta organizado en las siguientes carpetas:

  MagicUWE_1.5.0/
  |
  +-- plugins/
  |   +-- de.lmu.ifi.pst.uwe.MagicUWE/
  |       +-- MagicUWE.jar              [Binario del plugin Java compilado]
  |       +-- plugin.xml                [Descriptor de extension MagicDraw]
  |       +-- MagicUWE.properties       [Cadenas de configuracion y mensajes]
  |       +-- Licence.txt               [Texto de la licencia EPL v1.0]
  |       +-- Readme.txt                [Ficha tecnica original de LMU]
  |
  +-- profiles/
  |   +-- UWE Profile.mdzip             [Perfil de estereotipos empaquetado]
  |   +-- UWE Profile.html              [Documentacion y matriz de estereotipos]
  |
  +-- manual/
  |   +-- MagicUWE UserGuide.pdf        [Guia de usuario oficial de MagicUWE]
  |   +-- UWE_27042010_sevilla.pdf      [Presentacion metodologica UWE Sevilla]
  |
  +-- data/
  |   +-- resourcemanager/              [Descriptores del Resource Manager de MagicDraw]
  |
  +-- magicuwe-web/                     [Entorno de modelado UWE en plataforma web]
  |   +-- server.mjs                    [Servidor HTTP y despachador de servicios]
  |   +-- api/                          [Controladores REST y motor de persistencia]
  |   +-- assets/                       [Librerias de renderizado y logica UWE]
  |   +-- public/                       [Distribucion estatica y recursos cliente]
  |   +-- package.json                  [Definicion del modulo web]
  |   +-- vercel.json                   [Configuracion de despliegue]
  |
  +-- .gitignore                        [Reglas de exclusion para Git]
  +-- README.md                         [Este archivo]


-------------------------------------------------------------------------------
3. REQUISITOS DEL SISTEMA
-------------------------------------------------------------------------------

Para el plugin clasico de escritorio (MagicDraw UML):
  * Sistema Operativo: Microsoft Windows 7/8/10, GNU/Linux, Apple Mac OS X
  * Java Runtime Environment: Oracle JRE 7 o JRE 8 (arquitectura x86 o x64)
  * Herramienta base: No Magic MagicDraw UML version 17.5 o 18.0
    (Ediciones: Personal, Standard, Professional, Enterprise o Architect)

Para el entorno web (magicuwe-web):
  * Entorno de ejecucion: Node.js version 18.x o superior
  * Navegador web compatible con HTML5 Canvas y JavaScript ES6 (Mozilla Firefox,
    Google Chrome, Apple Safari)
  * Persistencia: SQLite 3 soportado via modulo nativo 'node:sqlite'


-------------------------------------------------------------------------------
4. INSTRUCCIONES DE INSTALACION Y PUESTA EN MARCHA
-------------------------------------------------------------------------------

MODO A: Plugin para MagicDraw UML (Entorno Clasico)
--------------------------------------------------
1. Finalice cualquier instancia en ejecucion de MagicDraw UML.
2. Copie la carpeta 'plugins/de.lmu.ifi.pst.uwe.MagicUWE' en el directorio
   de plugins de su instalacion de MagicDraw:
     [MagicDraw_Home]/plugins/
3. Copie el archivo 'profiles/UWE Profile.mdzip' dentro del directorio:
     [MagicDraw_Home]/profiles/
4. Inicie MagicDraw UML.
5. Verifique la carga del plugin en el dialogo 'Help' -> 'About MagicDraw' ->
   pestana 'Plugins'. El modulo MagicUWE aparecera registrado y activo.

MODO B: Aplicacion Web de Modelado UWE (magicuwe-web)
----------------------------------------------------

El subsistema web esta construido utilizando la biblioteca estandar de Node.js
y modulos nativos del sistema, por lo que NO requiere instalar dependencias
externas con 'npm install'. La puesta en marcha es inmediata y autocontenida.

Paso 1: Comprobar el interprete de Node.js
  Asegurese de disponer de Node.js version 18.x o superior (se sugiere
  Node.js 20.x o 22.x para persistencia nativa con 'node:sqlite'):
    $ node -v

Paso 2: Acceder al directorio de la aplicacion web
    $ cd magicuwe-web

Paso 3: (Opcional) Configuracion de variables de entorno
  Si desea configurar un puerto alternativo, claves secretas o autenticacion:
    $ cp .env.example .env

  Parametros principales en el archivo .env:
    PORT=3456
    MAGICUWE_SECRET=magicuwe-lmu-thesis-secret-key-2026
    GOOGLE_CLIENT_ID=tu-id-cliente.apps.googleusercontent.com
    GOOGLE_CLIENT_SECRET=tu-secreto-cliente

Paso 4: Levantar el servidor HTTP y servicios REST
  Inicie el proceso del servidor mediante cualquiera de estas opciones:

  * Opcion 1 (Estandar via npm):
      $ npm start

  * Opcion 2 (Ejecucion directa con Node.js):
      $ node server.mjs

  * Opcion 3 (Modo desarrollo):
      $ npm run dev

  * Opcion 4 (Especificar puerto en linea de comandos):
      $ PORT=8080 node server.mjs

  Mensaje de confirmacion en consola:
    [MagicUWE] Variables de entorno cargadas desde .env
    MagicUWE Web Server running at http://localhost:3456

Paso 5: Acceso desde el navegador
  Abra su navegador de preferencia e ingrese a:
    http://localhost:3456

Paso 6: Puntos de enlace y almacenamiento
  * Entorno de modelado UWE:      http://localhost:3456
  * Comprobacion de estado (API): http://localhost:3456/api/health
  * Base de datos SQLite:         Se crea de forma automatica en 'data/magicuwe.sqlite'

Paso 7: Detener el servidor
  Para finalizar la ejecucion presione en la consola:
    Ctrl + C

Paso 8: Ejecucion como servicio en segundo plano (Unix/Linux)
  Para mantener el servidor activo tras cerrar la sesion de terminal:
    $ nohup node server.mjs > server.log 2>&1 &


-------------------------------------------------------------------------------
5. PERFIL UWE Y PRIMITIVAS DE MODELADO
-------------------------------------------------------------------------------

El perfil formal UWE 3.0 contempla las siguientes extensiones y estereotipos:

* Elementos de Navegacion:
    <<navigationClass>>   Clase navegable con representacion en el espacio web.
    <<externalLink>>      Punto de enlace hacia recursos externos al sistema.
    <<processClass>>      Entidad de control para la ejecucion de procesos.

* Primitivas de Acceso:
    <<index>>             Indice jerarquico o lista de seleccion.
    <<guidedTour>>        Secuencia lineal o recorrido dirigido entre paginas.
    <<query>>             Filtro o consulta parametrizada contra el modelo de datos.
    <<menu>>              Contenedor y selector de alternativas de navegacion.

* Elementos de Presentacion (IU):
    <<presentationClass>> Contenedor de nivel superior (pagina o ventana).
    <<presentationGroup>> Agrupacion logica de componentes de interfaz.
    <<anchor>>            Enlace navegacional dentro de la presentacion.
    <<text>>              Campo o etiqueta textual de lectura.
    <<form>>              Formulario interactivo de entrada de datos.
    <<button>>            Elemento de accion o disparo transaccional.


-------------------------------------------------------------------------------
6. LICENCIA Y CREDITOS ACADEMICOS
-------------------------------------------------------------------------------

MagicUWE fue desarrollado por el equipo de investigacion UWE en la Ludwig-
Maximilians-Universitat Munchen (LMU), Alemania.

  * Licencia de software: Eclipse Public License - v 1.0 (EPL-1.0)
  * Para revisar los terminos completos, consulte el archivo:
    'plugins/de.lmu.ifi.pst.uwe.MagicUWE/Licence.txt'

Referencias cientificas y autoria:
  * Nora Koch, Alexander Knapp, Gefei Zhang, Marianne Busch.
  * LMU Munchen, Department of Computer Science.
  * Sitio web de investigacion: http://uwe.pst.ifi.lmu.de/

===============================================================================
[FIN DEL ARCHIVO README]
===============================================================================
