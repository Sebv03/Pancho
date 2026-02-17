#!/usr/bin/env python3
"""
Script de Python para ingerir licitaciones desde la API de ChileCompra
y almacenarlas en Supabase.

Uso:
    python scripts/ingest-licitaciones.py --pagina 1 --fecha-desde 2024-01-01

Requisitos:
    pip install requests python-dotenv supabase
"""

import argparse
import os
import sys
from datetime import datetime, timedelta
from typing import Optional
import requests
from supabase import create_client, Client
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

# Configuración
CHILECOMPRA_API_URL = os.getenv(
    "CHILECOMPRA_API_URL", "https://api.mercadopublico.cl"
)
CHILECOMPRA_API_KEY = os.getenv("CHILECOMPRA_API_KEY", "YOUR_API_KEY_HERE")
SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")


def mapear_estado(codigo_estado: int) -> str:
    """Mapea el código de estado de ChileCompra a nuestro formato."""
    estados = {
        1: "activa",
        2: "cerrada",
        3: "desierta",
        4: "adjudicada",
        5: "revocada",
    }
    return estados.get(codigo_estado, "desconocido")


def normalizar_licitacion(licitacion: dict) -> dict:
    """Normaliza los datos de ChileCompra al formato de nuestra BD."""
    fecha_cierre = licitacion.get("FechaCierre")
    if fecha_cierre:
        try:
            fecha_cierre = datetime.fromisoformat(
                fecha_cierre.replace("Z", "+00:00")
            ).isoformat()
        except:
            fecha_cierre = datetime.now().isoformat()
    else:
        fecha_cierre = datetime.now().isoformat()

    return {
        "codigo_externo": licitacion.get("CodigoExterno", ""),
        "nombre": licitacion.get("Nombre", ""),
        "descripcion": licitacion.get("Descripcion"),
        "fecha_cierre": fecha_cierre,
        "organismo": licitacion.get("Comprador", {}).get("NombreOrganismo")
        or "No especificado",
        "monto_estimado": licitacion.get("MontoEstimado"),
        "estado": mapear_estado(licitacion.get("CodigoEstado", 0)),
        "link_oficial": licitacion.get("Link"),
    }


def obtener_licitaciones(
    pagina: int = 1,
    fecha_desde: Optional[str] = None,
    fecha_hasta: Optional[str] = None,
) -> dict:
    """Obtiene licitaciones de la API de ChileCompra."""
    url = f"{CHILECOMPRA_API_URL}/licitaciones/v1/Licitaciones.svc"
    params = {"ticket": CHILECOMPRA_API_KEY, "pagina": pagina}

    if fecha_desde:
        params["fechaDesde"] = fecha_desde
    if fecha_hasta:
        params["fechaHasta"] = fecha_hasta

    try:
        response = requests.get(url, params=params, timeout=30)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error al obtener licitaciones: {e}")
        sys.exit(1)


def main():
    parser = argparse.ArgumentParser(
        description="Ingerir licitaciones desde ChileCompra API"
    )
    parser.add_argument(
        "--pagina", type=int, default=1, help="Página a procesar (default: 1)"
    )
    parser.add_argument(
        "--fecha-desde",
        type=str,
        help="Fecha desde (YYYY-MM-DD). Default: hace 30 días",
    )
    parser.add_argument(
        "--fecha-hasta",
        type=str,
        help="Fecha hasta (YYYY-MM-DD). Default: hoy",
    )
    parser.add_argument(
        "--todas-las-paginas",
        action="store_true",
        help="Procesar todas las páginas disponibles",
    )

    args = parser.parse_args()

    # Validar configuración
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("Error: SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY deben estar configurados")
        sys.exit(1)

    if CHILECOMPRA_API_KEY == "YOUR_API_KEY_HERE":
        print("Error: CHILECOMPRA_API_KEY debe estar configurado")
        sys.exit(1)

    # Configurar fechas por defecto
    fecha_hasta = args.fecha_hasta or datetime.now().strftime("%Y-%m-%d")
    fecha_desde = (
        args.fecha_desde
        or (datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d")
    )

    print(f"Obteniendo licitaciones desde {fecha_desde} hasta {fecha_hasta}")

    # Inicializar cliente de Supabase
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

    pagina_actual = args.pagina
    total_nuevas = 0
    total_actualizadas = 0

    while True:
        print(f"\nProcesando página {pagina_actual}...")
        response = obtener_licitaciones(
            pagina=pagina_actual, fecha_desde=fecha_desde, fecha_hasta=fecha_hasta
        )

        listado = response.get("Listado", [])
        if not listado:
            print("No hay más licitaciones para procesar")
            break

        print(f"Encontradas {len(listado)} licitaciones en esta página")

        # Procesar cada licitación
        for licitacion in listado:
            licitacion_normalizada = normalizar_licitacion(licitacion)

            # Verificar si ya existe
            existing = (
                supabase.table("licitaciones")
                .select("id")
                .eq("codigo_externo", licitacion_normalizada["codigo_externo"])
                .execute()
            )

            if existing.data:
                # Actualizar existente
                supabase.table("licitaciones").update(licitacion_normalizada).eq(
                    "codigo_externo", licitacion_normalizada["codigo_externo"]
                ).execute()
                total_actualizadas += 1
            else:
                # Insertar nueva
                supabase.table("licitaciones").insert(licitacion_normalizada).execute()
                total_nuevas += 1

        print(
            f"Página {pagina_actual}: {len(listado)} procesadas "
            f"({total_nuevas} nuevas, {total_actualizadas} actualizadas en total)"
        )

        # Verificar si hay más páginas
        total_paginas = response.get("TotalPaginas", 1)
        if not args.todas_las_paginas or pagina_actual >= total_paginas:
            break

        pagina_actual += 1

    print(f"\n✅ Proceso completado!")
    print(f"   Total nuevas: {total_nuevas}")
    print(f"   Total actualizadas: {total_actualizadas}")


if __name__ == "__main__":
    main()
