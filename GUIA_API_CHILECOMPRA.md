# 🔑 Guía para Obtener el Ticket de la API de ChileCompra

## URL de la API
✅ **Base URL:** `https://api.mercadopublico.cl`

## Cómo Obtener el Ticket de Acceso

La API de ChileCompra usa un sistema de **"tickets"** (tokens) en lugar de API keys tradicionales.

### Opción 1: Portal de Desarrolladores (Recomendado)

1. **Visita el sitio oficial:**
   - https://www.mercadopublico.cl
   - O busca "ChileCompra API" en Google

2. **Busca la sección de API/Desarrolladores:**
   - Puede estar en el menú principal
   - O en el footer del sitio
   - Busca términos como: "API", "Desarrolladores", "Integraciones", "Documentación Técnica"

3. **Registro:**
   - Crea una cuenta de desarrollador
   - Completa el formulario de registro
   - Acepta términos y condiciones

4. **Obtén tu Ticket:**
   - Una vez registrado, deberías recibir un "ticket" o token
   - Este ticket es lo que usarás como `CHILECOMPRA_API_KEY` en tu `.env.local`

### Opción 2: Documentación de la API

1. **Busca la documentación:**
   - https://api.mercadopublico.cl/documentacion (si existe)
   - O busca "ChileCompra API documentación"

2. **Revisa los endpoints:**
   - La documentación debería explicar cómo obtener el ticket
   - Generalmente hay un endpoint de autenticación o registro

### Opción 3: Contacto Directo

Si no encuentras el portal de desarrolladores:

**Email:**
- soporte@chilecompra.cl
- contacto@mercadopublico.cl
- api@chilecompra.cl

**Teléfono:**
- Busca en el sitio oficial de ChileCompra

**Mensaje sugerido:**
```
Hola,

Estoy desarrollando una aplicación para analizar licitaciones públicas 
y necesito acceso a la API de Mercado Público. ¿Cómo puedo obtener 
un ticket de acceso para desarrolladores?

Gracias.
```

## Cómo Usar el Ticket

Una vez que tengas el ticket:

1. **Abre tu archivo `.env.local`**

2. **Agrega o actualiza:**
```env
CHILECOMPRA_API_KEY=tu-ticket-aqui
CHILECOMPRA_API_URL=https://api.mercadopublico.cl
```

3. **Reinicia el servidor:**
```bash
npm run dev
```

## Estructura de la API

Según el código que tenemos, la API funciona así:

**Endpoint de ejemplo:**
```
GET https://api.mercadopublico.cl/licitaciones/v1/Licitaciones.svc?ticket=TU_TICKET&pagina=1
```

**Parámetros comunes:**
- `ticket`: Tu ticket de acceso (obligatorio)
- `pagina`: Número de página (opcional)
- `fechaDesde`: Fecha inicial (opcional, formato: YYYY-MM-DD)
- `fechaHasta`: Fecha final (opcional, formato: YYYY-MM-DD)
- `estado`: Estado de la licitación (opcional)
- `codigoOrganismo`: Código del organismo (opcional)

## Probar la API (Una vez tengas el ticket)

Puedes probar directamente en el navegador o con curl:

```bash
curl "https://api.mercadopublico.cl/licitaciones/v1/Licitaciones.svc?ticket=TU_TICKET&pagina=1"
```

O desde el dashboard de tu aplicación:
1. Ve a http://localhost:3000/dashboard
2. Haz clic en "Ingresar Licitaciones"
3. Debería funcionar si el ticket está configurado correctamente

## Mientras Tanto...

Puedes probar la aplicación sin el ticket:

1. **Agregar datos manualmente:**
   - Ve a Supabase Dashboard → Table Editor → licitaciones
   - Haz clic en "Insert row"
   - Agrega una licitación de prueba

2. **Probar la interfaz:**
   - El dashboard debería funcionar
   - Los filtros y búsqueda funcionan
   - Puedes probar el análisis con IA (si tienes OpenAI configurado)

## Notas Importantes

- ⚠️ El ticket puede tener límites de uso (rate limiting)
- ⚠️ Algunos tickets pueden ser temporales y necesitar renovación
- ⚠️ Revisa los términos de uso de la API
- ✅ El código ya está preparado para usar el ticket correctamente

## ¿Necesitas Ayuda?

Si tienes problemas para obtener el ticket:
1. Revisa la documentación oficial de ChileCompra
2. Contacta directamente con su soporte
3. Mientras tanto, puedes usar datos de prueba manuales
