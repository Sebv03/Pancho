/**
 * Servicio para consumir la API de ChileCompra (Mercado Público)
 *
 * IMPORTANTE: Reemplaza CHILECOMPRA_API_KEY con tu API key real
 * Puedes obtenerla en: https://www.mercadopublico.cl
 *
 * NOTA sobre CodigoTipo y Tratos Directos:
 * - CodigoTipo 1 = Licitación Pública
 * - CodigoTipo 2 = Licitación Privada / Trato Directo
 * No filtrar solo por CodigoTipo 1: las Compra Ágil y COT pueden reportarse
 * bajo trato directo simplificado por otras vías administrativas.
 *
 * Para datos más completos de Compra Ágil, ver también: lib/services/chilecompra-ocds.ts (API OCDS)
 */

export interface ChileCompraLicitacion {
  CodigoExterno: string;
  Nombre: string;
  Descripcion?: string;
  FechaCierre?: string;
  Comprador?: {
    NombreOrganismo?: string;
  };
  MontoEstimado?: number;
  Estado?: string;
  CodigoEstado?: number;
  Link?: string;
}

export interface ChileCompraResponse {
  Listado: ChileCompraLicitacion[];
  TotalPaginas: number;
  PaginaActual: number;
  CantidadRegistros: number;
}

/** Orden de Compra (incluye Compra Ágil - Tipo AG) */
export interface ChileCompraOrdenCompra {
  Codigo: string;
  Nombre: string;
  Descripcion?: string;
  CodigoEstado?: number;
  Estado?: string;
  Tipo?: string;
  CodigoTipo?: number;
  Total?: number;
  TotalNeto?: number;
  Comprador?: { NombreOrganismo?: string };
  Fechas?: Record<string, string>;
  CodigoLicitacion?: string;
}

export class ChileCompraService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.CHILECOMPRA_API_KEY || 'YOUR_API_KEY_HERE';
    this.baseUrl =
      process.env.CHILECOMPRA_API_URL ||
      'https://api.mercadopublico.cl';
  }

  /**
   * Obtiene licitaciones desde la API de ChileCompra
   * 
   * Documentación: https://api.mercadopublico.cl/modules/ejemplo_08.aspx
   */
  async obtenerLicitaciones(params: {
    pagina?: number;
    fechaDesde?: string;
    fechaHasta?: string;
    estado?: string;
    codigoOrganismo?: string;
    codigoProveedor?: string;
  }): Promise<ChileCompraResponse> {
    const {
      pagina = 1,
      fechaDesde,
      fechaHasta,
      estado,
      codigoOrganismo,
      codigoProveedor,
    } = params;

    // Endpoint correcto según documentación oficial
    const url = new URL(`${this.baseUrl}/servicios/v1/publico/licitaciones.json`);
    url.searchParams.append('ticket', this.apiKey);

    // Formato de fecha: ddmmaaaa
    if (fechaDesde) {
      const fecha = this.formatearFecha(fechaDesde);
      url.searchParams.append('fecha', fecha);
    }

    if (estado) {
      url.searchParams.append('estado', estado);
    }
    if (codigoOrganismo) {
      url.searchParams.append('CodigoOrganismo', codigoOrganismo);
    }
    if (codigoProveedor) {
      url.searchParams.append('CodigoProveedor', codigoProveedor);
    }

    try {
      const response = await fetch(url.toString(), {
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(
          `Error en API ChileCompra: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      
      // Verificar si hay error de rate limiting
      if (data.Codigo && data.Mensaje) {
        throw new Error(
          `ChileCompra API Error (${data.Codigo}): ${data.Mensaje}. 
          Tip: El ticket de prueba tiene limitaciones de tasa. 
          Espera 1-2 minutos entre peticiones o solicita tu propio ticket en api.mercadopublico.cl`
        );
      }
      
      // La API retorna directamente un objeto con Listado
      return {
        Listado: Array.isArray(data.Listado) ? data.Listado : [],
        TotalPaginas: 1,
        PaginaActual: pagina,
        CantidadRegistros: Array.isArray(data.Listado) ? data.Listado.length : 0,
      };
    } catch (error) {
      console.error('Error al obtener licitaciones de ChileCompra:', error);
      throw error;
    }
  }

  /**
   * Obtiene órdenes de compra (incluye Compra Ágil - Tipo AG, COT, C2, F2, G2).
   * Documentación: https://api.mercadopublico.cl/modules/ejemplo_10.aspx
   */
  async obtenerOrdenesDeCompra(params: {
    fechaDesde?: string;
    estado?: string;
    codigoProveedor?: string;
  }): Promise<{ Listado: ChileCompraOrdenCompra[] }> {
    const { fechaDesde, estado, codigoProveedor } = params;
    const url = new URL(`${this.baseUrl}/servicios/v1/publico/ordenesdecompra.json`);
    url.searchParams.append('ticket', this.apiKey);

    if (fechaDesde) {
      url.searchParams.append('fecha', this.formatearFecha(fechaDesde));
    }
    if (codigoProveedor) {
      url.searchParams.append('CodigoProveedor', codigoProveedor);
    }
    if (estado && estado !== 'activas') {
      const mapEstado: Record<string, string> = {
        aceptada: 'aceptada',
        enviadaproveedor: 'enviadaproveedor',
        cancelada: 'cancelada',
        recepcionconforme: 'recepcionconforme',
      };
      url.searchParams.append('estado', mapEstado[estado] || 'todos');
    } else {
      url.searchParams.append('estado', 'todos');
    }

    const response = await fetch(url.toString(), {
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Error en API ChileCompra: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    if (data.Codigo && data.Mensaje) {
      throw new Error(`ChileCompra API: ${data.Mensaje}`);
    }

    return {
      Listado: Array.isArray(data.Listado) ? data.Listado : [],
    };
  }

  /**
   * Obtiene detalle de una orden de compra por código.
   * ordenesdecompra.json?codigo=XXX
   */
  async obtenerDetalleOrdenCompra(codigo: string): Promise<ChileCompraOrdenCompra | null> {
    try {
      const url = new URL(`${this.baseUrl}/servicios/v1/publico/ordenesdecompra.json`);
      url.searchParams.append('ticket', this.apiKey);
      url.searchParams.append('codigo', codigo);

      const response = await fetch(url.toString(), {
        headers: { Accept: 'application/json' },
      });

      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error(`Error al obtener detalle OC: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      if (data.Codigo && data.Mensaje) {
        throw new Error(`ChileCompra API: ${data.Mensaje}`);
      }

      const listado = Array.isArray(data.Listado) ? data.Listado : [];
      return (listado[0] ?? null) as ChileCompraOrdenCompra | null;
    } catch (error) {
      console.error('Error al obtener detalle orden de compra:', error);
      throw error;
    }
  }

  /**
   * Formatea una fecha de YYYY-MM-DD a ddmmaaaa
   */
  private formatearFecha(fecha: string): string {
    const [year, month, day] = fecha.split('-');
    return `${day}${month}${year}`;
  }

  /**
   * Obtiene detalles de una licitación específica por código.
   * Usa licitaciones.json?codigo=XXX según documentación oficial (ejemplo_08.aspx).
   */
  async obtenerDetalleLicitacion(
    codigoExterno: string
  ): Promise<ChileCompraLicitacion | null> {
    try {
      const url = new URL(`${this.baseUrl}/servicios/v1/publico/licitaciones.json`);
      url.searchParams.append('ticket', this.apiKey);
      url.searchParams.append('codigo', codigoExterno);

      const response = await fetch(url.toString(), {
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(
          `Error al obtener detalle: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();

      if (data.Codigo && data.Mensaje) {
        throw new Error(`ChileCompra API: ${data.Mensaje}`);
      }

      const listado = Array.isArray(data.Listado) ? data.Listado : [];
      const licitacion = listado[0] ?? null;
      return licitacion as ChileCompraLicitacion | null;
    } catch (error) {
      console.error('Error al obtener detalle de licitación:', error);
      throw error;
    }
  }

  /**
   * Normaliza los datos de ChileCompra al formato de nuestra base de datos
   */
  normalizarLicitacion(
    licitacion: ChileCompraLicitacion
  ): {
    codigo_externo: string;
    nombre: string;
    descripcion: string | null;
    fecha_cierre: string;
    organismo: string;
    monto_estimado: number | null;
    estado: string;
    link_oficial: string | null;
  } {
    return {
      codigo_externo: licitacion.CodigoExterno,
      nombre: licitacion.Nombre,
      descripcion: licitacion.Descripcion || null,
      fecha_cierre: licitacion.FechaCierre
        ? new Date(licitacion.FechaCierre).toISOString()
        : new Date().toISOString(),
      organismo: licitacion.Comprador?.NombreOrganismo || 'No especificado',
      monto_estimado: licitacion.MontoEstimado || null,
      estado: this.mapearEstado(licitacion.CodigoEstado || 0),
      link_oficial: licitacion.Link || null,
    };
  }

  private mapearEstado(codigoEstado: number): string {
    const estados: Record<number, string> = {
      1: 'activa',
      2: 'cerrada',
      3: 'desierta',
      4: 'adjudicada',
      5: 'revocada',
    };
    return estados[codigoEstado] || 'desconocido';
  }

  /**
   * Busca el código de proveedor por RUT.
   * Usar para consultar licitaciones/órdenes adjudicadas a un proveedor.
   * RUT debe incluir puntos, guión y dígito verificador (ej: 70.017.820-k)
   */
  async buscarProveedor(rut: string): Promise<{ CodigoEmpresa: number; NombreEmpresa: string } | null> {
    const url = new URL(`${this.baseUrl}/servicios/v1/Publico/Empresas/BuscarProveedor`);
    url.searchParams.append('ticket', this.apiKey);
    url.searchParams.append('rutempresaproveedor', rut.trim());

    try {
      const res = await fetch(url.toString(), { headers: { Accept: 'application/json' } });
      if (!res.ok) return null;
      const data = await res.json();
      if (data.Codigo && data.Mensaje) return null;
      const codigo = data.CodigoEmpresa ?? data.Codigo;
      const nombre = data.NombreEmpresa ?? data.Nombre ?? '';
      return codigo != null ? { CodigoEmpresa: Number(codigo), NombreEmpresa: String(nombre) } : null;
    } catch {
      return null;
    }
  }
}
