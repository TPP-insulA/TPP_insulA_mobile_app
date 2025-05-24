<div align="center">
  <img src="assets\logo-fiuba.png" alt="Logo FIUBA" width="800"/>
</div>

# insulA - Aplicación de Gestión de insulina


insulA es una aplicación integral para la gestión de la diabetes diseñada para ayudar a los usuarios a realizar seguimiento, monitorear y gestionar su diabetes de manera efectiva. La aplicación proporciona una interfaz intuitiva para registrar niveles de glucosa, dosis de insulA y otras métricas importantes de salud, mientras ofrece análisis de tendencias y estadísticas.

## Características

### Características Implementadas
- 📱 Autenticación y Seguridad
  - Login y registro de usuarios
  - Autenticación biométrica (huella digital)
  - Recuperación de contraseña
  - Perfil de usuario personalizable

- 📊 Dashboard Principal
  - Panel de control con métricas clave de salud
  - Registro y seguimiento de niveles de glucosa
  - Visualización de estado actual de glucosa
  - Actividad reciente integrada

- 💉 Gestión de Insulina
  - Registro de dosis de insulina
  - Calculadora de dosis de insulina
  - Predicciones de dosis basadas en comidas
  - Ajustes por actividad física

- 🍽️ Gestión de Comidas
  - Registro de comidas y carbohidratos
  - Historial de comidas
  - Cálculo de carbohidratos por comida

- 📈 Historial y Análisis
  - Historial detallado de mediciones
  - Estadísticas y tendencias
  - Filtros y búsqueda avanzada
  - Visualización de predicciones

- ⚙️ Configuraciones
  - Modo claro/oscuro
  - Notificaciones personalizables
  - Unidades de medida configurables
  - Preferencias de usuario

### Características Planificadas
- 🔔 Recordatorios y notificaciones avanzadas
- 🤝 Integración con profesionales de la salud
- 📱 Funcionalidad de exportación de datos
- 🔄 Sincronización de datos entre dispositivos
- 👥 Acceso para familiares/cuidadores
- 💪 Seguimiento detallado de ejercicios
- 📊 Análisis y reportes avanzados

## Stack Tecnológico

- **Framework Frontend**: React Native
- **Componentes UI**: Tailwind CSS 
- **Lenguajes**: TypeScript/Javascript
- **Iconos**: Lucide Icons
- **Fuentes**: Inter (Google Fonts)

## Requisitos Previos

Antes de comenzar, asegúrate de tener instalado lo siguiente:
- Node.js (v18.17 o superior)
- npm (v9.0 o superior)
- Git

## Instalación

1. Clonar el repositorio:
   ```bash
   git clone https://github.com/TPP-insulA/TPP_insulA_mobile_app.git
   cd TPP_insulA_app
   ```

2. Instalar dependencias:
   ```bash
   npm install --legacy-peer-deps
   ```

3. (opcional) Crear un archivo `.env.local` en el directorio raíz y agregar las variables de entorno necesarias:
   ```env
   NEXT_PUBLIC_API_URL=your_api_url_here
   ```

## Ejecutar la Aplicación

### Modo Desarrollo
Para ejecutar la aplicación en modo desarrollo:
```bash
# Inicia la aplicación con Expo
npx expo start

# Una vez iniciado, presiona 'S' en la terminal para cambiar al modo de desarrollo
# También puedes usar directamente:
npx expo start --dev-client
```

### Build de Producción
Para crear una build de producción:

#### Android
```bash
# Construye la aplicación para Android
npx expo build:android

# Alternativamente, para construir y ejecutar en un dispositivo conectado:
npx expo run:android --variant release
```

#### iOS
```bash
# Construye la aplicación para iOS
npx expo build:ios

# Alternativamente, para construir y ejecutar en un simulador o dispositivo:
npx expo run:ios --configuration Release
```

## Estructura del Proyecto

```
TPP_insulA_mobile_app/
├── components/           # Componentes reutilizables
│   └── ui/               # Componentes UI base (botones, tarjetas, etc.)
├── screens/              # Pantallas de la aplicación
├── hooks/                # Custom hooks de React
├── lib/                  # Funciones de utilidad y servicios
│   └── api/              # Funciones para interactuar con la API
├── assets/               # Archivos estáticos (imágenes, iconos)
├── styles/               # Estilos globales y tema
├── types/                # Definiciones de tipos TypeScript
├── android/              # Código nativo de Android
├── __mocks__/            # Mocks para pruebas
└── App.tsx               # Componente raíz de la aplicación
```

## Contribuir

1. Haz un fork del repositorio
2. Crea tu rama de características (`git checkout -b feature/NuevaCaracteristica`)
3. Realiza tus cambios (`git commit -m 'Agregar nueva característica'`)
4. Sube la rama (`git push origin feature/NuevaCaracteristica`)
5. Abre un Pull Request

## Licencia

Este proyecto está licenciado bajo la Licencia MIT - ver el archivo LICENSE para más detalles.

## Soporte

Para soporte, por favor abre un issue en el repositorio de GitHub o contacta al equipo de desarrollo.

