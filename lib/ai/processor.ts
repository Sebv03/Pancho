import OpenAI from 'openai';
import { ResumenIA } from '@/types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface DocumentAnalysis {
  garantias_seriedad: string[];
  plazos_entrega: string;
  criterios_evaluacion: string[];
  riesgos_detectados: string[];
  puntos_clave: string[];
  resumen_completo: string;
}

export class AIProcessor {
  private client: OpenAI;

  constructor() {
    this.client = openai;
  }

  async analyzeLicitacionDocument(
    contenido: string,
    nombreLicitacion: string
  ): Promise<DocumentAnalysis> {
    const prompt = `Eres un experto en análisis de licitaciones públicas. Analiza el siguiente documento de licitación y extrae información estructurada.

Nombre de la licitación: ${nombreLicitacion}

Contenido del documento:
${contenido.substring(0, 15000)} ${contenido.length > 15000 ? '...[truncado]' : ''}

Por favor, extrae y devuelve SOLO un JSON válido con la siguiente estructura:
{
  "garantias_seriedad": ["garantía 1", "garantía 2", ...],
  "plazos_entrega": "texto descriptivo de plazos",
  "criterios_evaluacion": ["criterio 1", "criterio 2", ...],
  "riesgos_detectados": ["riesgo 1", "riesgo 2", ...],
  "puntos_clave": ["punto clave 1", "punto clave 2", ...],
  "resumen_completo": "resumen ejecutivo de máximo 500 palabras"
}

IMPORTANTE: Responde ÚNICAMENTE con el JSON, sin texto adicional antes o después.`;

    try {
      const completion = await this.client.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content:
              'Eres un asistente experto en análisis de documentos de licitaciones públicas. Siempre respondes con JSON válido.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      });

      const responseContent = completion.choices[0]?.message?.content;
      if (!responseContent) {
        throw new Error('No se recibió respuesta de OpenAI');
      }

      const parsed = JSON.parse(responseContent) as DocumentAnalysis;

      // Validar y limpiar la respuesta
      return {
        garantias_seriedad: Array.isArray(parsed.garantias_seriedad)
          ? parsed.garantias_seriedad
          : [],
        plazos_entrega: parsed.plazos_entrega || 'No especificado',
        criterios_evaluacion: Array.isArray(parsed.criterios_evaluacion)
          ? parsed.criterios_evaluacion
          : [],
        riesgos_detectados: Array.isArray(parsed.riesgos_detectados)
          ? parsed.riesgos_detectados
          : [],
        puntos_clave: Array.isArray(parsed.puntos_clave)
          ? parsed.puntos_clave
          : [],
        resumen_completo: parsed.resumen_completo || 'No disponible',
      };
    } catch (error) {
      console.error('Error en análisis de IA:', error);
      throw new Error(
        `Error al procesar documento con IA: ${error instanceof Error ? error.message : 'Error desconocido'}`
      );
    }
  }

  async extractTextFromPDF(pdfBuffer: Buffer): Promise<string> {
    // Esta función debería usar pdf-parse o similar
    // Por ahora retornamos un placeholder
    const pdfParse = require('pdf-parse');
    try {
      const data = await pdfParse(pdfBuffer);
      return data.text;
    } catch (error) {
      throw new Error(
        `Error al extraer texto del PDF: ${error instanceof Error ? error.message : 'Error desconocido'}`
      );
    }
  }
}
