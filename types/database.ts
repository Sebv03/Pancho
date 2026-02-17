export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      licitaciones: {
        Row: {
          id: string;
          codigo_externo: string;
          nombre: string;
          descripcion: string | null;
          fecha_cierre: string;
          organismo: string;
          monto_estimado: number | null;
          estado: string;
          link_oficial: string | null;
          resumen_ia: Json | null;
          garantias_seriedad: string[] | null;
          plazos_entrega: string | null;
          criterios_evaluacion: string[] | null;
          riesgos_detectados: string[] | null;
          puntos_clave: string[] | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          codigo_externo: string;
          nombre: string;
          descripcion?: string | null;
          fecha_cierre: string;
          organismo: string;
          monto_estimado?: number | null;
          estado?: string;
          link_oficial?: string | null;
          resumen_ia?: Json | null;
          garantias_seriedad?: string[] | null;
          plazos_entrega?: string | null;
          criterios_evaluacion?: string[] | null;
          riesgos_detectados?: string[] | null;
          puntos_clave?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          codigo_externo?: string;
          nombre?: string;
          descripcion?: string | null;
          fecha_cierre?: string;
          organismo?: string;
          monto_estimado?: number | null;
          estado?: string;
          link_oficial?: string | null;
          resumen_ia?: Json | null;
          garantias_seriedad?: string[] | null;
          plazos_entrega?: string | null;
          criterios_evaluacion?: string[] | null;
          riesgos_detectados?: string[] | null;
          puntos_clave?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      documentos: {
        Row: {
          id: string;
          licitacion_id: string;
          url_archivo: string;
          nombre_archivo: string | null;
          tipo_documento: string | null;
          contenido_extraido: string | null;
          procesado_ia: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          licitacion_id: string;
          url_archivo: string;
          nombre_archivo?: string | null;
          tipo_documento?: string | null;
          contenido_extraido?: string | null;
          procesado_ia?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          licitacion_id?: string;
          url_archivo?: string;
          nombre_archivo?: string | null;
          tipo_documento?: string | null;
          contenido_extraido?: string | null;
          procesado_ia?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      config_usuario: {
        Row: {
          id: string;
          user_id: string;
          palabras_clave: string[];
          regiones_interes: string[];
          notificaciones_activas: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          palabras_clave?: string[];
          regiones_interes?: string[];
          notificaciones_activas?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          palabras_clave?: string[];
          regiones_interes?: string[];
          notificaciones_activas?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}
