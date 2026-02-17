import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import type { ConfigEmpresa } from "@/lib/config/empresa";
import path from "path";
import fs from "fs";

export interface ItemCotizacion {
  descripcion: string;
  unidades: number;
  precioUnitario: number;
}

export interface DatosCotizacion {
  empresa: ConfigEmpresa;
  items: ItemCotizacion[];
  fechaEmision: Date;
}

function formatCLP(value: number): string {
  return new Intl.NumberFormat("es-CL", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatFecha(date: Date): string {
  return date.toLocaleDateString("es-CL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).replace(/\//g, "-");
}

async function loadLogo(): Promise<Uint8Array | null> {
  try {
    const logoPath = path.join(process.cwd(), "img", "logopng.png");
    if (fs.existsSync(logoPath)) {
      return fs.readFileSync(logoPath);
    }
    const altPath = path.join(process.cwd(), "public", "img", "logopng.png");
    if (fs.existsSync(altPath)) {
      return fs.readFileSync(altPath);
    }
  } catch {
    /* ignore */
  }
  return null;
}

export async function generarPDFCotizacion(datos: DatosCotizacion): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const page = doc.addPage([595, 842]); // A4
  const { width, height } = page.getSize();
  const margin = 50;
  const contentWidth = width - margin * 2;
  let y = height - margin;

  const fontSize = 10;
  const lineHeight = 13;
  const fontSizeSmall = 9;

  // --- LOGO ---
  let logoImage: Awaited<ReturnType<PDFDocument["embedPng"]>> | null = null;
  const logoBytes = await loadLogo();
  if (logoBytes) {
    try {
      logoImage = await doc.embedPng(logoBytes);
    } catch {
      /* fallback sin logo */
    }
  }

  // --- HEADER: Empresa a la izquierda, Logo + Días a la derecha ---
  const headerY = y;
  const logoSize = 90;

  // Datos empresa (izquierda)
  const empresaStartX = margin;
  const empresaLines = [
    { label: "Razón social", value: datos.empresa.razonSocial },
    { label: "RUT", value: datos.empresa.rut },
    { label: "Contacto", value: datos.empresa.contacto },
    { label: "Email", value: datos.empresa.email },
    { label: "Teléfono", value: datos.empresa.telefono },
    { label: "Dirección", value: datos.empresa.direccion },
    { label: "Fecha emisión", value: formatFecha(datos.fechaEmision) },
  ];

  let ey = headerY;
  empresaLines.forEach(({ label, value }) => {
    page.drawText(`${label}: `, {
      x: empresaStartX,
      y: ey - 2,
      size: fontSizeSmall,
      font: fontBold,
      color: rgb(0.25, 0.25, 0.25),
    });
    const labelW = fontBold.widthOfTextAtSize(`${label}: `, fontSizeSmall);
    page.drawText(value, {
      x: empresaStartX + labelW,
      y: ey - 2,
      size: fontSizeSmall,
      font,
      color: rgb(0.1, 0.1, 0.1),
    });
    ey -= lineHeight;
  });

  // Logo (derecha, arriba)
  let logoBottomY = headerY;
  if (logoImage) {
    const logoScale = Math.min(logoSize / logoImage.width, logoSize / logoImage.height);
    const logoW = logoImage.width * logoScale;
    const logoH = logoImage.height * logoScale;
    const logoX = width - margin - logoW;
    page.drawImage(logoImage, {
      x: logoX,
      y: headerY - logoH,
      width: logoW,
      height: logoH,
    });
    logoBottomY = headerY - logoH;
  }

  // Días entrega (debajo del logo, derecha)
  const diasTexto = `${datos.empresa.diasEntrega} ${datos.empresa.diasEntrega === 1 ? "día" : "días"} hábiles de entrega`;
  const diasW = fontBold.widthOfTextAtSize(diasTexto, fontSize);
  const diasBoxW = Math.max(diasW + 24, logoImage ? logoSize : 120);
  const diasBoxX = width - margin - diasBoxW;
  const diasBoxY = logoBottomY - 32;
  page.drawRectangle({
    x: diasBoxX,
    y: diasBoxY,
    width: diasBoxW,
    height: 24,
    color: rgb(0.95, 0.97, 1),
    borderColor: rgb(0.4, 0.5, 0.7),
    borderWidth: 0.5,
  });
  page.drawText(diasTexto, {
    x: diasBoxX + 12,
    y: diasBoxY + 5,
    size: fontSize,
    font: fontBold,
    color: rgb(0.2, 0.3, 0.5),
  });

  // --- TÍTULO COTIZACIÓN ---
  const headerBottom = Math.min(ey, diasBoxY);
  y = headerBottom - 28;
  page.drawText("COTIZACIÓN", {
    x: margin,
    y,
    size: 16,
    font: fontBold,
    color: rgb(0.15, 0.15, 0.15),
  });
  y -= 8;

  // Línea separadora
  page.drawLine({
    start: { x: margin, y },
    end: { x: width - margin, y },
    thickness: 0.5,
    color: rgb(0.7, 0.7, 0.7),
  });
  y -= 24;

  // --- TABLA DE ITEMS (centrada) ---
  const colWidths = {
    item: 36,
    descripcion: 260,
    unidades: 56,
    precioUnit: 88,
    precioTotal: 100,
  };
  const rowHeight = 26;
  const tableWidth = colWidths.item + colWidths.descripcion + colWidths.unidades + colWidths.precioUnit + colWidths.precioTotal;
  const tableX = (width - tableWidth) / 2;
  const headerBg = rgb(0.25, 0.25, 0.28);

  const itemsCalculados = datos.items.map((item, i) => {
    const precioTotal = Math.round(item.unidades * item.precioUnitario);
    return {
      item: i + 1,
      descripcion: item.descripcion,
      unidades: item.unidades,
      precioUnitario: item.precioUnitario,
      precioTotal,
    };
  });

  const neto = itemsCalculados.reduce((sum, i) => sum + i.precioTotal, 0);
  const iva = Math.round(neto * 0.19);
  const total = neto + iva;

  // Header de tabla (dibujar rectángulo y texto con padding correcto)
  const headerRectY = y - rowHeight;
  page.drawRectangle({
    x: tableX,
    y: headerRectY,
    width: tableWidth,
    height: rowHeight,
    color: headerBg,
  });

  const headerPadding = 8;
  const headerTextY = headerRectY + (rowHeight / 2) - 4;
  const headers = [
    { text: "ITEM", x: tableX + headerPadding },
    { text: "DESCRIPCIÓN", x: tableX + colWidths.item + headerPadding },
    { text: "UNIDADES", x: tableX + colWidths.item + colWidths.descripcion + headerPadding },
    { text: "PRECIO UNIT.", x: tableX + colWidths.item + colWidths.descripcion + colWidths.unidades + headerPadding },
    { text: "PRECIO TOTAL", x: tableX + colWidths.item + colWidths.descripcion + colWidths.unidades + colWidths.precioUnit + headerPadding },
  ];
  headers.forEach((h) => {
    page.drawText(h.text, {
      x: h.x,
      y: headerTextY,
      size: 9,
      font: fontBold,
      color: rgb(1, 1, 1),
    });
  });
  y = headerRectY - 16;

  // Filas de items
  const maxDescLen = 70;
  let currentPage = page;
  const rowPadding = 6;

  for (const row of itemsCalculados) {
    let desc = row.descripcion;
    const lines: string[] = [];
    while (desc.length > maxDescLen) {
      const breakAt = desc.lastIndexOf(" ", maxDescLen);
      lines.push(desc.slice(0, breakAt > 0 ? breakAt : maxDescLen));
      desc = desc.slice(breakAt > 0 ? breakAt + 1 : maxDescLen);
    }
    if (desc) lines.push(desc);

    const rowStartY = y;
    for (let i = 0; i < lines.length; i++) {
      if (y < margin + 100) {
        currentPage = doc.addPage([595, 842]);
        y = height - margin;
      }
      const cellY = y;
      if (i === 0) {
        currentPage.drawText(String(row.item), {
          x: tableX + rowPadding,
          y: cellY,
          size: fontSize,
          font,
          color: rgb(0.1, 0.1, 0.1),
        });
        currentPage.drawText(lines[i], {
          x: tableX + colWidths.item + rowPadding,
          y: cellY,
          size: fontSize,
          font,
          color: rgb(0.1, 0.1, 0.1),
        });
        currentPage.drawText(formatCLP(row.unidades), {
          x: tableX + colWidths.item + colWidths.descripcion + rowPadding,
          y: cellY,
          size: fontSize,
          font,
          color: rgb(0.1, 0.1, 0.1),
        });
        currentPage.drawText("$ " + formatCLP(row.precioUnitario), {
          x: tableX + colWidths.item + colWidths.descripcion + colWidths.unidades + rowPadding,
          y: cellY,
          size: fontSize,
          font,
          color: rgb(0.1, 0.1, 0.1),
        });
        currentPage.drawText("$ " + formatCLP(row.precioTotal), {
          x: tableX + colWidths.item + colWidths.descripcion + colWidths.unidades + colWidths.precioUnit + rowPadding,
          y: cellY,
          size: fontSize,
          font,
          color: rgb(0.1, 0.1, 0.1),
        });
      } else {
        currentPage.drawText(lines[i], {
          x: tableX + colWidths.item + rowPadding,
          y: cellY,
          size: fontSize,
          font,
          color: rgb(0.1, 0.1, 0.1),
        });
      }
      y -= lineHeight;
    }
    y -= 6;
  }

  // --- VALIDEZ ---
  y -= 24;
  if (y < margin + 100) {
    currentPage = doc.addPage([595, 842]);
    y = height - margin;
  }
  const validezTexto = `Cotización válida hasta ${datos.empresa.validezDias} días después de su emisión.`;
  const validezW = font.widthOfTextAtSize(validezTexto, fontSize);
  currentPage.drawRectangle({
    x: margin,
    y: y - 6,
    width: validezW + 24,
    height: 22,
    color: rgb(0.98, 0.98, 0.99),
    borderColor: rgb(0.85, 0.85, 0.9),
    borderWidth: 0.5,
  });
  currentPage.drawText(validezTexto, {
    x: margin + 12,
    y: y - 2,
    size: fontSize,
    font,
    color: rgb(0.3, 0.3, 0.35),
  });

  // --- TOTALES ---
  y -= 36;
  const totalesBoxW = 180;
  const totalesBoxX = width - margin - totalesBoxW;
  const totalesBoxH = 88;

  currentPage.drawRectangle({
    x: totalesBoxX,
    y: y - totalesBoxH,
    width: totalesBoxW,
    height: totalesBoxH,
    color: rgb(0.98, 0.99, 0.98),
    borderColor: rgb(0.2, 0.45, 0.3),
    borderWidth: 1,
  });

  let ty = y - 18;
  currentPage.drawText("TOTALES", {
    x: totalesBoxX + 16,
    y: ty,
    size: 12,
    font: fontBold,
    color: rgb(0.15, 0.4, 0.25),
  });
  ty -= 22;

  const totalesLabelW = 70;
  currentPage.drawText("Neto:", {
    x: totalesBoxX + 16,
    y: ty,
    size: fontSize,
    font: fontBold,
    color: rgb(0.2, 0.2, 0.2),
  });
  currentPage.drawText("$ " + formatCLP(neto), {
    x: totalesBoxX + totalesBoxW - 16 - font.widthOfTextAtSize("$ " + formatCLP(neto), fontSize),
    y: ty,
    size: fontSize,
    font,
    color: rgb(0.2, 0.2, 0.2),
  });
  ty -= 18;

  currentPage.drawText("I.V.A. 19%:", {
    x: totalesBoxX + 16,
    y: ty,
    size: fontSize,
    font: fontBold,
    color: rgb(0.2, 0.2, 0.2),
  });
  currentPage.drawText("$ " + formatCLP(iva), {
    x: totalesBoxX + totalesBoxW - 16 - font.widthOfTextAtSize("$ " + formatCLP(iva), fontSize),
    y: ty,
    size: fontSize,
    font,
    color: rgb(0.2, 0.2, 0.2),
  });
  ty -= 18;

  currentPage.drawText("Total:", {
    x: totalesBoxX + 16,
    y: ty,
    size: 11,
    font: fontBold,
    color: rgb(0.1, 0.1, 0.1),
  });
  currentPage.drawText("$ " + formatCLP(total), {
    x: totalesBoxX + totalesBoxW - 16 - font.widthOfTextAtSize("$ " + formatCLP(total), 11),
    y: ty,
    size: 11,
    font: fontBold,
    color: rgb(0.1, 0.1, 0.1),
  });

  return doc.save();
}
