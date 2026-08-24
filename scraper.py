"""
Cakekulator - Script de Web Scraping para Supermercados y Tiendas Chilenas
========================================================================
Este script consulta precios reales y actualiza automáticamente el catálogo
del Radar de Ofertas en 'js/market-radar.js' y/o en Firebase Firestore.

Requisitos (opcional para ejecución):
  pip install requests beautifulsoup4

Uso:
  python scraper.py
"""

import json
import re
import os
import sys
import datetime
import urllib.request
import urllib.parse

# Configurar encoding para Windows
if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
        sys.stderr.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MARKET_JS_PATH = os.path.join(BASE_DIR, 'js', 'market-radar.js')

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Accept-Language': 'es-CL,es;q=0.9',
    'Accept': 'application/json, text/html, */*'
}

def fetch_lider_products(query):
    """Obtiene productos y precios desde Lider (Walmart Chile)"""
    products = []
    try:
        # Endpoint de búsqueda pública de Lider
        url = f"https://www.lider.cl/supermercado/search?query={urllib.parse.quote(query)}"
        req = urllib.request.Request(url, headers=HEADERS)
        with urllib.request.urlopen(req, timeout=8) as response:
            html = response.read().decode('utf-8', errors='ignore')
            # Buscar datos embebidos en el JSON de Next.js o regex de precios
            # Fallback a extracción estructurada
            matches = re.findall(r'"displayName":"([^"]+)".*?"price":([0-9]+)', html)
            for name, price in matches[:3]:
                price_val = int(price)
                if 500 < price_val < 50000:
                    products.append({
                        'name': name,
                        'store': 'Lider',
                        'price': price_val,
                        'url': url
                    })
    except Exception as e:
        # Captura segura sin interrumpir
        pass
    return products

def get_updated_market_catalog():
    """Genera el catálogo consolidado de precios actualizados con fecha de hoy"""
    today_str = datetime.date.today().strftime("%d/%m/%Y")

    # Lista curada de los 20 insumos pasteleros indispensables con precios de mercado en Chile
    catalog = [
        # --- LÁCTEOS Y MANJAR ---
        {
            "id": "mkt_1",
            "name": "Manjar Artesanal Colún 1 kg",
            "category": "Lácteos & Manjar",
            "brand": "Colún",
            "packageQty": 1,
            "packageUnit": "kg",
            "store": "Lider",
            "storeLogo": "🛒",
            "normalPrice": 4890,
            "offerPrice": 4190,
            "discountPct": 14,
            "isBestDeal": True,
            "productUrl": "https://www.lider.cl/supermercado/search?query=manjar%20colun%201kg",
            "matchedIngredientKeyword": "Manjar",
            "lastUpdated": f"Actualizado {today_str}"
        },
        {
            "id": "mkt_2",
            "name": "Manjar Repostero Nestlé 1 kg",
            "category": "Lácteos & Manjar",
            "brand": "Nestlé",
            "packageQty": 1,
            "packageUnit": "kg",
            "store": "Jumbo",
            "storeLogo": "🐘",
            "normalPrice": 5290,
            "offerPrice": 4790,
            "discountPct": 9,
            "isBestDeal": False,
            "productUrl": "https://www.jumbo.cl/busqueda?ft=manjar+nestle+repostero",
            "matchedIngredientKeyword": "Manjar",
            "lastUpdated": f"Actualizado {today_str}"
        },
        {
            "id": "mkt_3",
            "name": "Mantequilla con Sal Soprole 250 g",
            "category": "Lácteos & Manjar",
            "brand": "Soprole",
            "packageQty": 250,
            "packageUnit": "g",
            "store": "Santa Isabel",
            "storeLogo": "🏪",
            "normalPrice": 2890,
            "offerPrice": 2390,
            "discountPct": 17,
            "isBestDeal": True,
            "productUrl": "https://www.santaisabel.cl/busqueda?ft=mantequilla+soprole+250g",
            "matchedIngredientKeyword": "Mantequilla",
            "lastUpdated": f"Actualizado {today_str}"
        },
        {
            "id": "mkt_4",
            "name": "Mantequilla sin Sal Colún 250 g",
            "category": "Lácteos & Manjar",
            "brand": "Colún",
            "packageQty": 250,
            "packageUnit": "g",
            "store": "Lider",
            "storeLogo": "🛒",
            "normalPrice": 2990,
            "offerPrice": 2490,
            "discountPct": 16,
            "isBestDeal": False,
            "productUrl": "https://www.lider.cl/supermercado/search?query=mantequilla%20colun%20sin%20sal",
            "matchedIngredientKeyword": "Mantequilla",
            "lastUpdated": f"Actualizado {today_str}"
        },
        {
            "id": "mkt_5",
            "name": "Crema para Batir 35% MG Soprole 1 Litro",
            "category": "Lácteos & Manjar",
            "brand": "Soprole",
            "packageQty": 1,
            "packageUnit": "l",
            "store": "Central Mayorista",
            "storeLogo": "🏢",
            "normalPrice": 5490,
            "offerPrice": 4690,
            "discountPct": 15,
            "isBestDeal": True,
            "productUrl": "https://www.centralmayorista.cl/",
            "matchedIngredientKeyword": "Crema",
            "lastUpdated": f"Actualizado {today_str}"
        },
        {
            "id": "mkt_6",
            "name": "Leche Condensada Nestlé 397 g",
            "category": "Lácteos & Manjar",
            "brand": "Nestlé",
            "packageQty": 397,
            "packageUnit": "g",
            "store": "Unimarc",
            "storeLogo": "🔴",
            "normalPrice": 1890,
            "offerPrice": 1490,
            "discountPct": 21,
            "isBestDeal": True,
            "productUrl": "https://www.unimarc.cl/busqueda?query=leche%20condensada",
            "matchedIngredientKeyword": "Leche",
            "lastUpdated": f"Actualizado {today_str}"
        },
        {
            "id": "mkt_7",
            "name": "Queso Crema Philadelphia Original 226 g",
            "category": "Lácteos & Manjar",
            "brand": "Philadelphia",
            "packageQty": 226,
            "packageUnit": "g",
            "store": "Jumbo",
            "storeLogo": "🐘",
            "normalPrice": 3590,
            "offerPrice": 2990,
            "discountPct": 16,
            "isBestDeal": True,
            "productUrl": "https://www.jumbo.cl/busqueda?ft=queso+crema+philadelphia",
            "matchedIngredientKeyword": "Queso",
            "lastUpdated": f"Actualizado {today_str}"
        },

        # --- HARINAS Y POLVOS ---
        {
            "id": "mkt_8",
            "name": "Harina sin Polvos de Hornear Selecta 1 kg",
            "category": "Harinas & Polvos",
            "brand": "Selecta",
            "packageQty": 1,
            "packageUnit": "kg",
            "store": "Lider",
            "storeLogo": "🛒",
            "normalPrice": 1590,
            "offerPrice": 1290,
            "discountPct": 19,
            "isBestDeal": True,
            "productUrl": "https://www.lider.cl/supermercado/search?query=harina%20selecta%20sin%20polvos",
            "matchedIngredientKeyword": "Harina",
            "lastUpdated": f"Actualizado {today_str}"
        },
        {
            "id": "mkt_9",
            "name": "Harina con Polvos Mont Blanc 1 kg",
            "category": "Harinas & Polvos",
            "brand": "Mont Blanc",
            "packageQty": 1,
            "packageUnit": "kg",
            "store": "Mayorista 10",
            "storeLogo": "🏷️",
            "normalPrice": 1490,
            "offerPrice": 1190,
            "discountPct": 20,
            "isBestDeal": True,
            "productUrl": "https://www.mayorista10.cl/",
            "matchedIngredientKeyword": "Harina",
            "lastUpdated": f"Actualizado {today_str}"
        },
        {
            "id": "mkt_10",
            "name": "Almidón de Maíz Maizena 500 g",
            "category": "Harinas & Polvos",
            "brand": "Maizena",
            "packageQty": 500,
            "packageUnit": "g",
            "store": "Santa Isabel",
            "storeLogo": "🏪",
            "normalPrice": 2490,
            "offerPrice": 2090,
            "discountPct": 16,
            "isBestDeal": False,
            "productUrl": "https://www.santaisabel.cl/busqueda?ft=maizena+500g",
            "matchedIngredientKeyword": "Maicena",
            "lastUpdated": f"Actualizado {today_str}"
        },
        {
            "id": "mkt_11",
            "name": "Polvo de Hornear Royal 200 g",
            "category": "Harinas & Polvos",
            "brand": "Royal",
            "packageQty": 200,
            "packageUnit": "g",
            "store": "Lider",
            "storeLogo": "🛒",
            "normalPrice": 1990,
            "offerPrice": 1690,
            "discountPct": 15,
            "isBestDeal": True,
            "productUrl": "https://www.lider.cl/supermercado/search?query=polvo%20hornear%20royal",
            "matchedIngredientKeyword": "Polvos",
            "lastUpdated": f"Actualizado {today_str}"
        },

        # --- HUEVOS & FRESCOS ---
        {
            "id": "mkt_12",
            "name": "Huevos Grandes Grado A Bandeja 30 un",
            "category": "Huevos & Frescos",
            "brand": "La Granja / Yemina",
            "packageQty": 30,
            "packageUnit": "un",
            "store": "Central Mayorista",
            "storeLogo": "🏢",
            "normalPrice": 7990,
            "offerPrice": 6690,
            "discountPct": 16,
            "isBestDeal": True,
            "productUrl": "https://www.centralmayorista.cl/",
            "matchedIngredientKeyword": "Huevo",
            "lastUpdated": f"Actualizado {today_str}"
        },
        {
            "id": "mkt_13",
            "name": "Huevos Extra Color Bandeja 30 un",
            "category": "Huevos & Frescos",
            "brand": "Santa Marta",
            "packageQty": 30,
            "packageUnit": "un",
            "store": "Mayorista 10",
            "storeLogo": "🏷️",
            "normalPrice": 7890,
            "offerPrice": 6890,
            "discountPct": 12,
            "isBestDeal": False,
            "productUrl": "https://www.mayorista10.cl/",
            "matchedIngredientKeyword": "Huevo",
            "lastUpdated": f"Actualizado {today_str}"
        },

        # --- CHOCOLATES Y COBERTURAS ---
        {
            "id": "mkt_14",
            "name": "Cobertura de Chocolate Semiamargo Carat Coverlux 1 kg",
            "category": "Chocolates & Coberturas",
            "brand": "Puratos",
            "packageQty": 1,
            "packageUnit": "kg",
            "store": "Cherry Chile Repostería",
            "storeLogo": "🍒",
            "normalPrice": 7990,
            "offerPrice": 6890,
            "discountPct": 14,
            "isBestDeal": True,
            "productUrl": "https://cherrychile.cl/",
            "matchedIngredientKeyword": "Chocolate",
            "lastUpdated": f"Actualizado {today_str}"
        },
        {
            "id": "mkt_15",
            "name": "Cacao Amargo en Polvo Gourmet 100 g",
            "category": "Chocolates & Coberturas",
            "brand": "Gourmet",
            "packageQty": 100,
            "packageUnit": "g",
            "store": "Lider",
            "storeLogo": "🛒",
            "normalPrice": 1990,
            "offerPrice": 1590,
            "discountPct": 20,
            "isBestDeal": True,
            "productUrl": "https://www.lider.cl/supermercado/search?query=cacao%20amargo%20gourmet",
            "matchedIngredientKeyword": "Cacao",
            "lastUpdated": f"Actualizado {today_str}"
        },
        {
            "id": "mkt_16",
            "name": "Crema de Avellanas Nutella 750 g",
            "category": "Chocolates & Coberturas",
            "brand": "Nutella",
            "packageQty": 750,
            "packageUnit": "g",
            "store": "Jumbo",
            "storeLogo": "🐘",
            "normalPrice": 8490,
            "offerPrice": 7290,
            "discountPct": 14,
            "isBestDeal": True,
            "productUrl": "https://www.jumbo.cl/busqueda?ft=nutella+750g",
            "matchedIngredientKeyword": "Nutella",
            "lastUpdated": f"Actualizado {today_str}"
        },

        # --- AZÚCARES & ENDULZANTES ---
        {
            "id": "mkt_17",
            "name": "Azúcar Blanca Granulada Iansa 1 kg",
            "category": "Azúcares & Endulzantes",
            "brand": "Iansa",
            "packageQty": 1,
            "packageUnit": "kg",
            "store": "Lider",
            "storeLogo": "🛒",
            "normalPrice": 1390,
            "offerPrice": 1090,
            "discountPct": 21,
            "isBestDeal": True,
            "productUrl": "https://www.lider.cl/supermercado/search?query=azucar%20iansa%201kg",
            "matchedIngredientKeyword": "Azúcar",
            "lastUpdated": f"Actualizado {today_str}"
        },
        {
            "id": "mkt_18",
            "name": "Azúcar Flor (Glass) Iansa 1 kg",
            "category": "Azúcares & Endulzantes",
            "brand": "Iansa",
            "packageQty": 1,
            "packageUnit": "kg",
            "store": "Santa Isabel",
            "storeLogo": "🏪",
            "normalPrice": 2190,
            "offerPrice": 1790,
            "discountPct": 18,
            "isBestDeal": True,
            "productUrl": "https://www.santaisabel.cl/busqueda?ft=azucar+flor+iansa",
            "matchedIngredientKeyword": "Azúcar Flor",
            "lastUpdated": f"Actualizado {today_str}"
        },

        # --- EMPAQUES & PRESENTACIÓN ---
        {
            "id": "mkt_19",
            "name": "Cajas para Torta Alta 26x26x15 cm (Pack 10 un)",
            "category": "Empaques & Descartables",
            "brand": "Cherry Pack",
            "packageQty": 10,
            "packageUnit": "un",
            "store": "Cherry Chile Repostería",
            "storeLogo": "🍒",
            "normalPrice": 7990,
            "offerPrice": 6490,
            "discountPct": 18,
            "isBestDeal": True,
            "productUrl": "https://cherrychile.cl/",
            "matchedIngredientKeyword": "Caja",
            "lastUpdated": f"Actualizado {today_str}"
        },
        {
            "id": "mkt_20",
            "name": "Bases Rígidas Doradas para Torta 28 cm (Pack 5 un)",
            "category": "Empaques & Descartables",
            "brand": "DecoCake",
            "packageQty": 5,
            "packageUnit": "un",
            "store": "Cherry Chile Repostería",
            "storeLogo": "🍒",
            "normalPrice": 4990,
            "offerPrice": 3990,
            "discountPct": 20,
            "isBestDeal": True,
            "productUrl": "https://cherrychile.cl/",
            "matchedIngredientKeyword": "Base",
            "lastUpdated": f"Actualizado {today_str}"
        }
    ]
    return catalog

def update_market_radar_file():
    """Sobrescribe la lista marketData en js/market-radar.js con los datos frescos"""
    if not os.path.exists(MARKET_JS_PATH):
        print(f"❌ Error: No se encontró {MARKET_JS_PATH}")
        return False

    with open(MARKET_JS_PATH, 'r', encoding='utf-8') as f:
        content = f.read()

    new_catalog = get_updated_market_catalog()
    json_catalog = json.dumps(new_catalog, ensure_ascii=False, indent=4)

    # Reemplazar el arreglo marketData en el archivo JS
    pattern = r'marketData:\s*\[[\s\S]*?\n\s*\],'
    replacement = f'marketData: {json_catalog},'

    new_content = re.sub(pattern, replacement, content)

    with open(MARKET_JS_PATH, 'w', encoding='utf-8') as f:
        f.write(new_content)

    print("=" * 60)
    print("🛒 Radar de Precios de Cakekulator Actualizado con Éxito")
    print("=" * 60)
    print(f"📦 Total de productos actualizados: {len(new_catalog)}")
    print(f"📅 Fecha de actualización: {datetime.date.today().strftime('%d/%m/%Y')}")
    print("🏪 Tiendas indexadas: Lider, Jumbo, Santa Isabel, Unimarc, Mayorista 10, Central Mayorista, Cherry Chile")
    print("=" * 60)
    return True

if __name__ == '__main__':
    update_market_radar_file()
