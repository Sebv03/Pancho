/**
 * Configuración de la empresa para cotizaciones PDF
 * Valores por defecto editables - se mantienen en todos los PDFs
 */
export interface ConfigEmpresa {
  razonSocial: string;
  rut: string;
  contacto: string;
  email: string;
  telefono: string;
  direccion: string;
  diasEntrega: number;
  validezDias: number;
}

export const EMPRESA_DEFAULT: ConfigEmpresa = {
  razonSocial: "ALBATERRA SPA",
  rut: "78.167.034-0",
  contacto: "FRANCISCO IGNACIO SOLAR MORENO",
  email: "FSOLAR94@GMAIL.COM",
  telefono: "56986037230",
  direccion: "SAN RIGOBERTO #271, MAIPU",
  diasEntrega: 2,
  validezDias: 20,
};
