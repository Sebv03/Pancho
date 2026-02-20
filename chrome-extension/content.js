/**
 * Content Script - Extractor Universal de Productos
 * Funciona en cualquier e-commerce detectando datos estructurados
 */

class UniversalProductExtractor {
  constructor() {
    this.extractedData = null;
    this.strategies = [
      this.extractFromSiteSpecific.bind(this),
      this.extractFromSchemaOrg.bind(this),
      this.extractFromCommonSelectors.bind(this),
      this.extractFromMicrodata.bind(this),
      this.extractFromOpenGraph.bind(this),
      this.extractFromFallback.bind(this),
    ];
  }

  /** Selectores específicos para sitios chilenos problemáticos */
  extractFromSiteSpecific() {
    const host = window.location.hostname.replace('www.', '');
    const main = this.getMainContent();

    const siteConfig = {
      'lider.cl': {
        title: ['h1[class*="product"], [class*="product-name"]', '[class*="ProductName"]', 'h1'],
        price: ['[class*="price"]', '[class*="Price"]', '[data-price]', '[class*="precio"]', 'span[class*="amount"]'],
        image: ['[class*="product-image"] img', '[class*="gallery"] img', '[class*="carousel"] img', 'img[class*="product"]', 'main img', '[class*="pdp"] img'],
      },
      'centralmayorista.cl': {
        title: ['h1', '[class*="product-title"]', '[class*="product-name"]', '[class*="titulo"]'],
        price: ['[class*="price"]', '[class*="precio"]', '[class*="valor"]', '[itemprop="price"]', '[data-price]'],
        image: ['[class*="product"] img', '[class*="gallery"] img', '[class*="image"] img', 'img[src*="product"], img[src*="Product"]'],
      },
      'laoferta.cl': {
        title: ['h1', '.product_title', '[class*="product-title"]', '[class*="product-name"]'],
        price: ['.price', '[class*="price"]', '.amount', '[itemprop="price"]', 'ins .amount', '.woocommerce-Price-amount'],
        image: ['.woocommerce-product-gallery img', '[class*="product"] img', 'img.attachment-woocommerce_single'],
      },
      'distribuidoranico.cl': {
        title: ['h1', '.product_title', '[class*="product-title"]', '[class*="product-name"]', '.entry-title'],
        price: ['.summary .price bdi', '.summary .price .amount', '.price ins bdi', '.price ins .amount', '.price bdi', '.price .woocommerce-Price-amount', '.price .amount', 'p.price bdi', 'p.price', '.summary .price', '[itemprop="price"]'],
        image: ['.woocommerce-product-gallery img', '.product img', '[class*="gallery"] img', 'img.attachment-woocommerce_single'],
      },
    };

    const config = siteConfig[host];
    if (!config) return null;

    const nombre = this.getFirstMatch(config.title, (el) => el.textContent?.trim(), main, true);
    if (!nombre || this.isLikelySiteName(nombre)) return null;

    let precio = this.extractPrice(this.getFirstMatch(config.price, (el) => el.textContent, main));
    if (!precio) precio = this.extractPriceFromWooCommerce(main);
    if (!precio) precio = this.extractPriceFromProductSummary(main);
    if (!precio) precio = this.extractPriceFirstInDOM(main);
    if (!precio) precio = this.extractPriceFromPage(main);

    let imgEl = null;
    for (const sel of config.image) {
      try {
        const el = main.querySelector(sel);
        if (el && (el.src || el.getAttribute?.('data-src') || el.getAttribute?.('srcset'))) {
          imgEl = el;
          break;
        }
      } catch (e) {}
    }
    const imagen = imgEl ? this.resolveImageUrl(imgEl) : null;

    if (!precio || precio === 0) {
      const productBlock = main.querySelector?.('.product, .single-product, [class*="product-detail"]') || main;
      precio = this.extractPriceFromPage(productBlock);
    }
    if (!precio || precio === 0) {
      precio = this.extractPriceFromSchema();
    }
    return {
      nombre,
      descripcion: this.getFirstMatch(['[class*="description"]', '[class*="descripcion"]', '[itemprop="description"]'], (el) => el.textContent?.trim().slice(0, 500), main) || '',
      precio: precio ?? 0,
      imagen,
      url: window.location.href,
      sitio: this.getSiteName(),
      source: 'site-specific',
      confidence: 'high',
    };
  }

  /** Resuelve URL de imagen (lazy-load, srcset, data-src, etc.) */
  resolveImageUrl(el) {
    if (!el) return null;
    const attrs = ['src', 'data-src', 'data-lazy-src', 'data-original', 'data-zoom-image', 'data-srcset'];
    for (const attr of attrs) {
      const val = el.getAttribute?.(attr);
      if (val) {
        const url = val.split(',')[0].trim().split(/\s+/)[0];
        if (url && url.startsWith('http')) return url;
        if (url && url.startsWith('//')) return 'https:' + url;
        if (url && url.startsWith('/')) return window.location.origin + url;
      }
    }
    const srcset = el.getAttribute?.('srcset');
    if (srcset) {
      const first = srcset.split(',')[0]?.trim().split(/\s+/)[0];
      if (first) {
        if (first.startsWith('http')) return first;
        if (first.startsWith('//')) return 'https:' + first;
        if (first.startsWith('/')) return window.location.origin + first;
      }
    }
    return el.src || null;
  }

  extractPriceFromSchema() {
    const scripts = document.querySelectorAll('script[type="application/ld+json"]');
    for (const script of scripts) {
      try {
        const data = JSON.parse(script.textContent);
        const product = this.findProductInSchema(data);
        if (product) {
          const p = this.extractPrice(product.offers?.price || product.offers?.lowPrice || product.price);
          if (p && p > 0) return p;
        }
      } catch (e) {}
    }
    return null;
  }

  extractFromSchemaOrg() {
    const scripts = document.querySelectorAll('script[type="application/ld+json"]');
    
    for (const script of scripts) {
      try {
        const data = JSON.parse(script.textContent);
        const product = this.findProductInSchema(data);
        if (product) {
          let precio = this.extractPrice(product.offers?.price || product.offers?.lowPrice || product.price);
          if (!precio) precio = this.extractPriceFromPage(this.getMainContent());
          let imagen = product.image?.url || product.image || (Array.isArray(product.image) ? product.image[0] : null);
          if (imagen && !imagen.startsWith('http')) imagen = new URL(imagen, window.location.href).href;
          return {
            nombre: product.name,
            descripcion: product.description || '',
            precio: precio ?? 0,
            imagen,
            sku: product.sku,
            marca: product.brand?.name || product.brand,
            categoria: product.category,
            url: window.location.href,
            sitio: this.getSiteName(),
            source: 'schema.org',
            confidence: 'high',
            rawData: product,
          };
        }
      } catch (e) {}
    }
    return null;
  }

  findProductInSchema(data) {
    const currentUrl = window.location.href;
    const products = this.findAllProductsInSchema(data);
    for (const product of products) {
      const productUrl = product.url || product.offers?.url || product.identifier;
      if (productUrl && (currentUrl.includes(productUrl) || productUrl.includes(currentUrl.split('?')[0]))) {
        return product;
      }
    }
    return products[0] || null;
  }

  findAllProductsInSchema(data) {
    const results = [];
    const scan = (obj) => {
      if (!obj) return;
      if (Array.isArray(obj)) {
        obj.forEach(item => scan(item));
        return;
      }
      if (obj['@type'] === 'Product' || obj.type === 'Product') {
        results.push(obj);
        return;
      }
      for (const key in obj) {
        if (typeof obj[key] === 'object') scan(obj[key]);
      }
    };
    scan(data);
    return results;
  }

  isLikelySiteName(text) {
    if (!text || text.length < 3) return true;
    const sitePatterns = [/\.cl\b/i, /\.com\b/i, /te conviene/i, /bienvenido/i, /bienvenida/i, /home\s*[-|]/i];
    if (sitePatterns.some(p => p.test(text))) return true;
    if (text.length < 25 && /^[A-Za-z\s.]+$/.test(text)) return true;
    return false;
  }

  extractFromOpenGraph() {
    const ogTitle = this.getMetaContent('og:title');
    if (!ogTitle || this.isLikelySiteName(ogTitle)) return null;

    const ogUrl = this.getMetaContent('og:url');
    const currentUrl = window.location.href;
    if (ogUrl) {
      try {
        const fullOgUrl = ogUrl.startsWith('http') ? ogUrl : new URL(ogUrl, currentUrl).href;
        if (!currentUrl.startsWith(fullOgUrl.split('?')[0]) && !fullOgUrl.includes(currentUrl.split('?')[0])) {
          return null;
        }
      } catch (e) {}
    }

    const ogDesc = this.getMetaContent('og:description');
    if (ogDesc && this.isLikelySiteName(ogDesc)) return null;

    const ogPrice = this.getMetaContent('og:price:amount') || this.getMetaContent('product:price:amount');
    let precio = this.extractPrice(ogPrice);
    if (!precio) precio = this.extractPriceFromPage(this.getMainContent());

    let ogImage = this.getMetaContent('og:image');
    if (ogImage && !ogImage.startsWith('http')) ogImage = new URL(ogImage, window.location.href).href;

    return {
      nombre: ogTitle,
      descripcion: this.isLikelySiteName(ogDesc) ? '' : (ogDesc || ''),
      precio: precio ?? 0,
      imagen: ogImage || null,
      url: window.location.href,
      sitio: this.getSiteName(),
      source: 'open-graph',
      confidence: 'medium',
    };
  }

  extractFromMicrodata() {
    const itemScope = document.querySelector('[itemscope][itemtype*="Product"]');
    if (!itemScope) return null;

    let precio = this.extractPrice(this.getItemprop(itemScope, 'price'));
    if (!precio) precio = this.extractPriceFromPage(this.getMainContent());

    const imgEl = itemScope.querySelector('[itemprop="image"]');
    const imagen = imgEl ? (imgEl.src ? imgEl.src : this.resolveImageUrl(imgEl)) : this.getItemprop(itemScope, 'image');

    return {
      nombre: this.getItemprop(itemScope, 'name'),
      descripcion: this.getItemprop(itemScope, 'description'),
      precio: precio ?? 0,
      imagen: imagen || null,
      sku: this.getItemprop(itemScope, 'sku'),
      marca: this.getItemprop(itemScope, 'brand'),
      url: window.location.href,
      sitio: this.getSiteName(),
      source: 'microdata',
      confidence: 'medium',
    };
  }

  extractFromCommonSelectors() {
    const titleSelectors = [
      'h1[class*="product"]', '[class*="product-name"]', '[class*="product-title"]',
      '[class*="productName"]', '[class*="ProductName"]',
      '[itemprop="name"]', '[data-testid*="product"] h1',
      '[class*="pdp"] h1', '[class*="detail"] h1',
      'h1', 'h2[class*="product"]', '[class*="titulo"]',
    ];
    const priceSelectors = [
      '[class*="price"] [class*="current"]', '[class*="price-current"]', '[class*="price-now"]',
      '[class*="price-sale"]', '[class*="precio"]', '[class*="Precio"]',
      '[itemprop="price"]', '[data-testid*="price"]', '[data-price]', '[data-precio]',
      '[class*="price"]', '[class*="Price"]', '[class*="value"]',
      'span[class*="amount"]', '[class*="valor"]', '[class*="Valor"]',
      '.woocommerce-Price-amount', '.price .amount', 'ins .amount',
    ];
    const imageSelectors = [
      '[class*="product-image"] img', '[class*="main-image"] img', '[itemprop="image"]',
      'img[class*="product"]', '[class*="gallery"] img', 'img[class*="Product"]',
      '[class*="carousel"] img', '[class*="pdp"] img', 'main img[src]',
    ];

    const main = this.getMainContent();
    const nombre = this.getFirstMatch(titleSelectors, (el) => el.textContent?.trim(), main, true);
    let precio = this.extractPrice(this.getFirstMatch(priceSelectors, (el) => el.textContent, main));
    if (!precio) precio = this.extractPriceFromPage(main);
    let imgEl = null;
    for (const sel of imageSelectors) {
      try {
        const el = main.querySelector(sel);
        if (el && (el.src || el.getAttribute?.('data-src') || el.getAttribute?.('srcset'))) {
          imgEl = el;
          break;
        }
      } catch (e) {}
    }
    const imagen = imgEl ? this.resolveImageUrl(imgEl) : null;

    const descSelectors = [
      '[class*="product-description"]', '[class*="productDescription"]',
      '[itemprop="description"]', '[class*="descripcion"]',
      '[class*="description"]', '[class*="detail"] p',
    ];
    const descripcion = this.getFirstMatch(descSelectors, (el) => el.textContent?.trim().slice(0, 500), main) || '';

    if (nombre && !this.isLikelySiteName(nombre) && (precio !== null || imagen)) {
      return {
        nombre,
        descripcion,
        precio,
        imagen,
        url: window.location.href,
        sitio: this.getSiteName(),
        source: 'selectors',
        confidence: 'medium',
      };
    }
    return null;
  }

  getNameFromUrl() {
    const path = window.location.pathname;
    const segments = path.split('/').filter(Boolean);
    let slug = segments.pop() || segments[segments.length - 1] || '';
    slug = slug.split('?')[0];
    if (!slug || slug.length < 3) return null;
    let name = slug
      .replace(/-/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase())
      .replace(/(\d+)\s*g\b/gi, (_, n) => ` ${n} g`)
      .replace(/(\d+)\s*kg\b/gi, (_, n) => ` ${n} kg`);
    return name.length > 4 ? name.trim() : null;
  }

  urlMatchesProduct(nameFromDom) {
    const urlName = this.getNameFromUrl();
    if (!urlName || !nameFromDom) return true;
    const urlWords = urlName.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    const domWords = nameFromDom.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    const match = urlWords.some(uw => domWords.some(dw => dw.includes(uw) || uw.includes(dw)));
    return match;
  }

  extractFromFallback() {
    const titleSelectors = [
      'h1', 'h2', '[class*="title"]', '[class*="product-name"]', '[itemprop="name"]',
      '[data-testid*="product"]', '[class*="Product"]', '[class*="titulo"]',
    ];
    const priceSelectors = [
      '[class*="price"]', '[class*="Price"]', '[itemprop="price"]',
      '[class*="precio"]', '[class*="valor"]', '[data-price]',
    ];

    const main = this.getMainContent();
    let nombre = this.getFirstMatch(titleSelectors, (el) => el.textContent?.trim(), main, true);
    if (!nombre || this.isLikelySiteName(nombre)) {
      nombre = this.getNameFromUrl() || document.title?.split('|')[0]?.trim() || document.title;
    }
    let precio = this.extractPrice(this.getFirstMatch(priceSelectors, (el) => el.textContent, main));
    if (!precio) precio = this.extractPriceFromPage(main);
    const imgEl = main.querySelector('img[src*="product"], img[src*="Product"], img[class*="product"], img[class*="gallery"], img[src*="lider"], img[src*="centralmayorista"], main img') || document.querySelector('img[src*="product"], img[src*="Product"]');
    const imagen = imgEl ? this.resolveImageUrl(imgEl) : null;

    const descSelectors = ['[itemprop="description"]', '[class*="descripcion"]', '[class*="description"]'];
    const descripcion = this.getFirstMatch(descSelectors, (el) => el.textContent?.trim().slice(0, 500), main) || '';

    return {
      nombre: (nombre && !this.isLikelySiteName(nombre)) ? nombre : (this.getNameFromUrl() || 'Producto sin nombre'),
      descripcion,
      precio: precio ?? 0,
      imagen: imagen || null,
      url: window.location.href,
      sitio: this.getSiteName(),
      source: 'fallback',
      confidence: 'low',
    };
  }

  getMetaContent(property) {
    const meta = document.querySelector(`meta[property="${property}"], meta[name="${property}"]`);
    return meta?.getAttribute('content');
  }

  getItemprop(scope, prop) {
    const el = scope?.querySelector(`[itemprop="${prop}"]`);
    return el?.textContent?.trim() || el?.getAttribute('content');
  }

  getMainContent() {
    const mainSelectors = [
      'main', '[role="main"]', 'article',
      '[class*="product-detail"]', '[class*="productDetail"]', '[class*="ProductDetail"]',
      '[class*="product-page"]', '[class*="productPage"]',
      '[id*="product"]', '[id*="Product"]',
      '.product-page', '#main', '#content',
      '[class*="pdp"]', '[class*="PDP"]',
      '[class*="item-detail"]', '[class*="articulo"]',
      '.single-product', '.product', '[class*="producto"]',
      '#product', '[class*="product-content"]',
      '.type-product', '.product.type-product',
    ];
    for (const sel of mainSelectors) {
      const el = document.querySelector(sel);
      if (el && el.offsetParent !== null && el.getBoundingClientRect().width > 200) {
        return el;
      }
    }
    return document.body;
  }

  isInMainContent(el) {
    const main = this.getMainContent();
    if (main === document.body) return true;
    return main.contains(el);
  }

  isInHeader(el) {
    return el.closest('header, nav, [role="banner"], [class*="header"], [class*="Header"], [id*="header"]');
  }

  getFirstMatch(selectors, extractor, root = document, skipHeader = false) {
    const scope = root === document ? document : root;
    for (const selector of selectors) {
      try {
        const els = scope.querySelectorAll?.(selector) || document.querySelectorAll(selector);
        for (const el of els || []) {
          if (el && (!skipHeader || !this.isInHeader(el))) {
            const result = extractor(el);
            if (result != null && String(result).trim()) return result;
          }
        }
      } catch (e) {}
    }
    for (const selector of selectors) {
      try {
        const el = (scope.querySelector || document.querySelector).call(scope, selector);
        if (el) {
          const result = extractor(el);
          if (result != null && String(result).trim()) return result;
        }
      } catch (e) {}
    }
    return null;
  }

  /** Extrae precio de estructura WooCommerce: .price ins (oferta) o .price */
  extractPriceFromWooCommerce(root = document.body) {
    const priceEl = root.querySelector?.('.price ins .woocommerce-Price-amount, .price ins .amount, .price .woocommerce-Price-amount, .price .amount, p.price');
    if (!priceEl) return null;
    const text = priceEl.textContent || '';
    return this.extractPrice(text);
  }

  /** Busca precio en el área del producto principal (summary) - evita precios de productos relacionados */
  extractPriceFromProductSummary(root = document.body) {
    const summarySelectors = ['.summary', '.product-summary', '.product .summary', '.woocommerce-product-details__short-description', '[class*="product-details"]', '.single-product .summary', '.product', '.product-details', '[class*="single-product"]'];
    const pricePatterns = [
      /\$\s*([\d.,\s]+)/,
      /([\d]{1,3}(?:[.\s]\d{3})*(?:,\d+)?)\s*CLP/i,
      /precio[:\s]*\$?\s*([\d.,\s]+)/i,
      /valor[:\s]*\$?\s*([\d.,\s]+)/i,
      /([\d]{1,3}(?:\.\d{3})+(?:,\d+)?)/,
      /([\d]{2,}\s*[\d]{3})/,
    ];
    for (const sel of summarySelectors) {
      const summary = root.querySelector?.(sel);
      if (!summary) continue;
      const text = (summary.innerText || summary.textContent || '').replace(/\s+/g, ' ');
      for (const pattern of pricePatterns) {
        const match = text.match(pattern);
        if (match) {
          const num = this.extractPrice(match[1] || match[0]);
          if (num && num > 0 && num < 50000000) return num;
        }
      }
      const priceEls = summary.querySelectorAll?.('.price, [class*="price"], [itemprop="price"], bdi, .amount');
      for (const el of priceEls || []) {
        const txt = el.textContent?.trim() || '';
        if (txt.length > 0 && txt.length < 20 && /[\d]/.test(txt)) {
          const num = this.extractPrice(txt);
          if (num && num > 0) return num;
        }
      }
    }
    return null;
  }

  extractPrice(priceString) {
    if (!priceString) return null;
    let cleaned = String(priceString).replace(/\s/g, '').replace(/[^\d,.]/g, '');
    if (!cleaned) return null;
    if (cleaned.includes(',')) {
      cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    } else if (cleaned.match(/\.\d{3}$/) || cleaned.split('.').length > 2) {
      cleaned = cleaned.replace(/\./g, '');
    }
    const number = parseFloat(cleaned);
    return isNaN(number) ? null : number;
  }

  /**
   * Busca precios en el área (formato chileno: $49.990, $1.299.990)
   * Si root es el main content, evita precios de productos relacionados
   */
  extractPriceFromPage(root = document.body) {
    const pricePatterns = [
      /\$\s*([\d.,\s]+)/g,
      /(\d{1,3}(?:[.\s]\d{3})*(?:,\d+)?)\s*CLP/gi,
      /precio[:\s]*\$?\s*([\d.,\s]+)/gi,
      /valor[:\s]*\$?\s*([\d.,\s]+)/gi,
      /precio\s+actual[:\s]*\$?\s*([\d.,\s]+)/gi,
      /precio\s+internet[:\s]*\$?\s*([\d.,\s]+)/gi,
      /data-price=["']([\d.,]+)["']/gi,
      /data-value=["']([\d.,]+)["']/gi,
      /data-precio=["']([\d.,]+)["']/gi,
      /content=["']([\d.,]+)["'][^>]*itemprop=["']price["']/gi,
      /(?:precio|valor|total)[:\s]*([\d]{1,3}(?:[.\s]\d{3})*(?:,\d+)?)/gi,
    ];

    const prices = new Set();
    const scope = root || document.body;
    const text = scope.innerText || scope.textContent || '';
    const html = scope.innerHTML || '';

    for (const pattern of pricePatterns) {
      const regex = new RegExp(pattern.source, pattern.flags);
      let match;
      const str = pattern.source.includes('data-') ? html : text;
      while ((match = regex.exec(str)) !== null) {
        const num = this.extractPrice(match[1]);
        if (num && num > 0 && num < 100000000) prices.add(num);
      }
    }

    const scopeEl = scope.querySelector ? scope : document;
    (scopeEl.querySelectorAll?.('[data-price], [data-value], [data-precio]') || []).forEach(el => {
      const val = el.getAttribute('data-price') || el.getAttribute('data-value') || el.getAttribute('data-precio');
      const num = this.extractPrice(val);
      if (num && num > 0) prices.add(num);
    });

    if (prices.size === 0) return null;
    const sorted = [...prices].sort((a, b) => a - b);
    return sorted[0];
  }

  /** Obtiene el primer precio válido en orden DOM (útil cuando el principal está antes que productos relacionados) */
  extractPriceFirstInDOM(root = document.body) {
    const priceSelectors = ['.price ins .woocommerce-Price-amount', '.price ins .amount', '.price .woocommerce-Price-amount', '.price .amount', 'p.price', '.summary .price', '[class*="price"]', '[itemprop="price"]'];
    for (const sel of priceSelectors) {
      const els = root.querySelectorAll?.(sel) || [];
      for (const el of els) {
        const num = this.extractPrice(el.textContent);
        if (num && num > 0 && num < 50000000) return num;
      }
    }
    return null;
  }

  getSiteName() {
    return window.location.hostname.replace('www.', '');
  }

  extract() {
    for (const strategy of this.strategies) {
      const result = strategy();
      if (result && result.nombre) {
        const urlName = this.getNameFromUrl();
        if (urlName) {
          if (this.isLikelySiteName(result.nombre) || !this.urlMatchesProduct(result.nombre)) {
            result.nombre = urlName;
            result.source = (result.source || '') + '+url';
          }
        }
        this.extractedData = result;
        console.log('✅ LicitIA: Producto extraído:', result);
        return result;
      }
    }
    const urlName = this.getNameFromUrl();
    if (urlName) {
      const precio = this.extractPriceFromPage(this.getMainContent());
      return {
        nombre: urlName,
        descripcion: '',
        precio: precio ?? 0,
        imagen: null,
        url: window.location.href,
        sitio: this.getSiteName(),
        source: 'url-only',
        confidence: 'low',
      };
    }
    return null;
  }

  isProductPage() {
    const urlPatterns = [
      /\/product\//i, /\/p\//i, /\/item\//i, /\/pd\//i, /-p-\d+/i,
      /\/ip\//i, /\/catalogo\/product\//i, /\/producto\//i, /\/prod\//i,
    ];
    if (urlPatterns.some(p => p.test(window.location.href))) return true;

    const scripts = document.querySelectorAll('script[type="application/ld+json"]');
    for (const script of scripts) {
      try {
        const data = JSON.parse(script.textContent);
        if (this.findProductInSchema(data)) return true;
      } catch (e) {}
    }

    // Verificar h1 + precio (páginas de producto típicas)
    const hasH1 = document.querySelector('h1');
    const hasPrice = document.querySelector('[class*="price"], [itemprop="price"]');
    if (hasH1 && (hasPrice || document.body.innerText.match(/\$\s*[\d.,]+/))) return true;

    return false;
  }
}

class UIInjector {
  constructor(extractor) {
    this.extractor = extractor;
    this.buttonInjected = false;
  }

  injectButton() {
    if (this.buttonInjected) return;
    
    const logoUrl = chrome.runtime.getURL('LOGOWH.png');
    const container = document.createElement('div');
    container.id = 'licitia-extension-container';
    container.innerHTML = `
      <button id="licitia-capture-btn" class="licitia-btn">
        <img src="${logoUrl}" alt="Albaterra" class="licitia-btn-img" />
      </button>
      <div id="licitia-toast" class="licitia-toast"></div>
    `;

    document.body.appendChild(container);
    this.buttonInjected = true;

    document.getElementById('licitia-capture-btn').addEventListener('click', () => this.handleCapture());
  }

  async handleCapture() {
    const btn = document.getElementById('licitia-capture-btn');
    
    btn.classList.add('loading');
    btn.disabled = true;
    
    let productData = this.extractor.extract();
    
    // Reintentar tras 1.5s si falló precio/imagen (SPA pueden cargar tarde)
    if (productData && (!productData.precio || productData.precio === 0) && !productData.imagen) {
      await new Promise(r => setTimeout(r, 1500));
      productData = this.extractor.extract();
    }
    
    if (!productData) {
      this.showToast('❌ No se pudo detectar el producto', 'error');
      btn.classList.remove('loading');
      btn.disabled = false;
      return;
    }

    try {
      const settings = await chrome.storage.sync.get(['apiUrl', 'apiKey']);
      const apiUrl = (settings.apiUrl || 'http://localhost:3000').replace(/\/$/, '');
      
      const response = await fetch(`${apiUrl}/api/productos/capture`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': settings.apiKey || '',
        },
        body: JSON.stringify(productData),
      });

      const data = await response.json();

      if (response.ok) {
        this.showToast('Agregado correctamente', 'success');
      } else {
        this.showToast(`❌ ${data.error || 'Error al guardar'}`, 'error');
      }
    } catch (error) {
      this.showToast('❌ Error de conexión. ¿Servidor corriendo?', 'error');
      console.error('LicitIA Error:', error);
    } finally {
      btn.classList.remove('loading');
      btn.disabled = false;
    }
  }

  showToast(message, type = 'info') {
    const toast = document.getElementById('licitia-toast');
    if (toast) {
      toast.textContent = message;
      toast.className = `licitia-toast ${type} show`;
      setTimeout(() => toast.classList.remove('show'), 3000);
    }
  }
}

function init() {
  const extractor = new UniversalProductExtractor();
  const injector = new UIInjector(extractor);
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => injector.injectButton());
  } else {
    injector.injectButton();
  }
}

init();
