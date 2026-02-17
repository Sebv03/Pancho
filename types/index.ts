import { Database } from './database';

export type Licitacion = Database['public']['Tables']['licitaciones']['Row'];
export type Documento = Database['public']['Tables']['documentos']['Row'];
export type ConfigUsuario = Database['public']['Tables']['config_usuario']['Row'];

export interface Producto {
  id: string;
  nombre: string;
  descripcion: string | null;
  precio_capturado: number;
  precio_venta: number | null;
  url_origen: string;
  sitio_origen: string | null;
  imagen_url: string | null;
  sku: string | null;
  marca: string | null;
  categoria: string | null;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface ResumenIA {
  garantias_seriedad?: string[];
  plazos_entrega?: string;
  criterios_evaluacion?: string[];
  riesgos_detectados?: string[];
  puntos_clave?: string[];
  resumen_completo?: string;
}

export interface LicitacionWithDocuments extends Licitacion {
  documentos?: Documento[];
}
