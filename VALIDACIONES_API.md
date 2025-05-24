# Validaciones con APIs Externas

Esta documentación describe las nuevas funcionalidades de validación implementadas en el diálogo de cliente utilizando APIs externas de servicios chilenos.

## Funcionalidades Implementadas

### 1. Validación de RUT con SII (Servicio de Impuestos Internos)

- **Validación de formato**: Verifica que el RUT tenga el formato correcto y dígito verificador válido
- **Validación con SII**: Consulta la API del SII para verificar si el RUT existe y está registrado
- **Información adicional**: Muestra el nombre de la empresa registrada en el SII

#### Estados de validación:
- ✅ **Válido y registrado**: RUT válido que existe en la base de datos del SII
- ⚠️ **Válido pero no encontrado**: RUT con formato correcto pero no registrado en el SII
- ❌ **Inválido**: RUT con formato incorrecto o dígito verificador erróneo

### 2. Validación de Dirección con Correos de Chile

- **Validación de formato**: Verifica que la dirección tenga un formato válido
- **Búsqueda de direcciones**: Permite buscar direcciones similares usando la API de Correos de Chile
- **Sugerencias automáticas**: Muestra sugerencias de direcciones válidas
- **Formato normalizado**: Muestra la dirección en formato estándar de Correos de Chile

#### Características:
- Búsqueda automática al ingresar más de 5 caracteres
- Botón de búsqueda manual con ícono de ubicación
- Lista de sugerencias seleccionables
- Validación en tiempo real con indicadores visuales

### 3. Validación de Email

- **Validación de formato**: Verifica que el email tenga un formato válido
- **Verificación de dominio**: Valida que el dominio del email existe y está activo
- **Dominios comunes**: Reconoce dominios chilenos comunes (empresa.cl, constructor.cl, etc.)

#### Estados de validación:
- ✅ **Email válido y activo**: Email con formato correcto y dominio verificado
- ⚠️ **Email válido pero dominio no verificado**: Email con formato correcto pero dominio sin verificar
- ❌ **Email inválido**: Email con formato incorrecto

## Implementación Técnica

### Servicio de Validación (`ValidationService`)

El servicio `ValidationService` centraliza todas las validaciones y maneja la comunicación con las APIs externas:

```typescript
// Métodos principales
validateRutWithSII(rut: string): Observable<RutValidationResponse>
validateAddress(address: string): Observable<AddressValidationResponse>
validateEmail(email: string): Observable<EmailValidationResponse>
searchAddresses(query: string): Observable<string[]>
```

### APIs Utilizadas

1. **SII API**: `https://api.sii.cl/recursos/v1/contribuyente/{rut}`
2. **Correos de Chile API**: `https://api.correos.cl/v1/direcciones/`
3. **Validación de Email**: Implementación local con verificación de dominios

### Componente del Diálogo

El componente `CustomerDialogComponent` se actualizado para:

- Manejar estados de carga para cada validación
- Mostrar indicadores visuales en tiempo real
- Procesar y mostrar sugerencias de direcciones
- Integrar la información adicional del SII

## Interfaz de Usuario

### Indicadores Visuales

- **Spinner de carga**: Se muestra durante las consultas a las APIs
- **Íconos de estado**: 
  - ✅ Verde para válido
  - ⚠️ Amarillo para advertencias
  - ❌ Rojo para errores
- **Texto descriptivo**: Mensajes claros sobre el estado de cada validación

### Experiencia de Usuario

- **Validación en tiempo real**: Las validaciones se ejecutan automáticamente al escribir
- **Debounce**: Las consultas se optimizan para evitar llamadas excesivas a las APIs
- **Fallbacks**: Si las APIs fallan, se mantienen las validaciones locales
- **Sugerencias interactivas**: Las direcciones sugeridas son seleccionables con un clic

## Configuración

### HttpClient

Se agregó `provideHttpClient()` en `app.config.ts` para habilitar las llamadas HTTP:

```typescript
export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(), // ← Nuevo
    DatePipe
  ]
};
```

### Variables de Entorno

Para producción, se recomienda configurar las URLs de las APIs como variables de entorno:

```typescript
// environment.ts
export const environment = {
  production: false,
  siiApiUrl: 'https://api.sii.cl/recursos/v1',
  correosApiUrl: 'https://api.correos.cl/v1',
  emailValidationApiUrl: 'https://api.hunter.io/v2'
};
```

## Manejo de Errores

- **Timeout**: Las consultas tienen un timeout de 10 segundos
- **Retry**: Se implementa retry automático en caso de errores temporales
- **Fallback**: Si las APIs fallan, se mantienen las validaciones básicas locales
- **Logging**: Los errores se registran en la consola para debugging

## Futuras Mejoras

1. **Cache**: Implementar cache local para evitar consultas repetidas
2. **Offline**: Mejorar el comportamiento sin conexión a internet
3. **Rate Limiting**: Implementar limitación de consultas por minuto
4. **Autenticación**: Agregar tokens de API cuando sea necesario
5. **Métricas**: Implementar seguimiento de uso de las APIs

## Notas Importantes

- Las validaciones son opcionales y no bloquean el guardado del cliente
- El botón "Guardar" permanece activo independientemente del estado de las validaciones
- Las APIs externas pueden tener limitaciones de uso o requerir autenticación en producción
- Se recomienda implementar cache y rate limiting para uso en producción
