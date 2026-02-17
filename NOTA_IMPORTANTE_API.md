# ⚠️ Limitaciones del Ticket de Prueba de ChileCompra

## Problema Actual

El ticket de prueba de ChileCompra (`F8537A18-6766-4DEF-9E59-426B4FEE2844`) tiene limitaciones de tasa (rate limiting):

- **Error común**: "Lo sentimos. Hemos detectado que existen peticiones simultáneas."
- **Causa**: Múltiples usuarios usan el mismo ticket de prueba
- **Solución**: Esperar 1-2 minutos entre peticiones

## Soluciones

### Opción 1: Esperar entre peticiones (Rápida)

1. En el dashboard, haz clic en "Ingresar Licitaciones"
2. Si aparece error de peticiones simultáneas, espera 1-2 minutos
3. Intenta de nuevo

### Opción 2: Obtener tu propio ticket (Recomendado)

1. Ve a https://api.mercadopublico.cl
2. Haz clic en "Participa" (esquina superior derecha)
3. Completa el formulario:
   - **Motivo**: "Solicitud de Ticket"
   - **RUT**: Tu RUT
   - **Email**: Tu correo electrónico
4. Recibirás tu ticket personal por email
5. Actualiza `.env.local`:
   ```env
   CHILECOMPRA_API_KEY=TU_NUEVO_TICKET_AQUI
   ```
6. Reinicia el servidor: `npm run dev`

### Opción 3: Agregar datos de prueba manualmente (Desarrollo)

Mientras obtienes tu ticket o esperas el rate limit:

1. Ve a Supabase Dashboard: https://app.supabase.com/project/ldqpkveyonltzcdshvsf
2. Ve a **Table Editor** → **licitaciones**
3. Haz clic en **"Insert row"**
4. Agrega una licitación de prueba:
   ```
   codigo_externo: TEST-001
   nombre: Licitación de Prueba para Desarrollo
   organismo: Ministerio de Pruebas
   fecha_cierre: 2026-03-15 23:59:59+00
   estado: activa
   monto_estimado: 5000000
   descripcion: Esta es una licitación de prueba para desarrollo
   link_oficial: https://www.mercadopublico.cl
   ```

## Verificar que el código esté correcto

El código ya está actualizado con los endpoints correctos:

✅ Endpoint correcto: `https://api.mercadopublico.cl/servicios/v1/publico/licitaciones.json`  
✅ Formato de fecha correcto: `ddmmaaaa`  
✅ Parámetros correctos: `ticket`, `fecha`, `estado`  
✅ Manejo de errores mejorado  

## Probar el endpoint manualmente

Puedes probar directamente en el navegador o con curl:

```bash
# Espera 2 minutos si recibiste el error antes
# Luego prueba:
curl "https://api.mercadopublico.cl/servicios/v1/publico/licitaciones.json?estado=activas&ticket=F8537A18-6766-4DEF-9E59-426B4FEE2844"
```

## Estado del Proyecto

- ✅ Código actualizado con endpoints correctos
- ✅ Servidor funcionando
- ✅ Manejo de errores mejorado
- ⚠️ Limitado por rate limiting del ticket de prueba
- 🎯 **Siguiente paso**: Obtener ticket personal o agregar datos de prueba

## ¿Qué hacer ahora?

1. **Opción más rápida**: Agrega datos de prueba manualmente (Opción 3)
2. **Opción para producción**: Obtén tu propio ticket (Opción 2)
3. **Si tienes tiempo**: Espera 1-2 minutos y prueba el botón de nuevo (Opción 1)
