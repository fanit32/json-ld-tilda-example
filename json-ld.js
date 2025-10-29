<script>
(function() {
    'use strict';
    
    // Список страниц с наличием товара (можно дополнять)
    const inStockPages = [
        // Добавьте сюда URL страниц, где товар в наличии
        // Например: '/summit-adrenaline-2026', '/can-am-maverick-2024'
    ];
    
    // Функция для извлечения бренда из названия товара
    function extractBrand(productName) {
        const brands = ['SKI-DOO', 'CAN-AM'];
        for (const brand of brands) {
            if (productName.toUpperCase().includes(brand)) {
                return brand;
            }
        }
        return null;
    }
    
    // Функция для очистки и нормализации текста
    function cleanText(text) {
        return text ? text.trim().replace(/\s+/g, ' ') : '';
    }
    
    // Функция для извлечения цены
    function extractPrice(priceElement) {
        if (!priceElement) return null;
        const priceText = priceElement.textContent || priceElement.innerText || '';
        const price = priceText.replace(/[^\d]/g, '');
        return price ? parseInt(price) : null;
    }
    
    // Функция для извлечения изображений
    function extractImages() {
        const images = [];
        
        // Извлечение из галереи товара
        const galleryItems = document.querySelectorAll('.t-slds__item .t-slds__wrapper meta[itemprop="image"]');
        galleryItems.forEach(meta => {
            const imageUrl = meta.getAttribute('content');
            if (imageUrl && !images.includes(imageUrl)) {
                images.push(imageUrl);
            }
        });
        
        // Если изображений в галерее нет, ищем основное изображение товара
        if (images.length === 0) {
            const mainImage = document.querySelector('.js-product-img');
            if (mainImage) {
                const bgImage = mainImage.style.backgroundImage;
                if (bgImage) {
                    const imageUrl = bgImage.replace(/url\(['"]?(.*?)['"]?\)/, '$1');
                    if (imageUrl) images.push(imageUrl);
                }
            }
        }
        
        return images;
    }
    
    // Функция для извлечения хлебных крошек
    function extractBreadcrumbs() {
        const breadcrumbs = [];
        const breadcrumbItems = document.querySelectorAll('.t758__list_item .t-menu__link-item');
        
        breadcrumbItems.forEach((item, index) => {
            const text = cleanText(item.textContent);
            const link = item.closest('a');
            const url = link ? link.getAttribute('href') : null;
            
            if (text) {
                breadcrumbs.push({
                    "@type": "ListItem",
                    "position": index + 1,
                    "name": text,
                    "item": url ? (url.startsWith('http') ? url : window.location.origin + url) : window.location.href
                });
            }
        });
        
        return breadcrumbs;
    }
    
    // Функция для извлечения опций товара (вариантов)
    function extractProductOptions() {
        const options = [];
        const optionSelects = document.querySelectorAll('.js-product-option-variants');
        
        optionSelects.forEach(select => {
            const optionName = select.closest('.js-product-option')?.querySelector('.js-product-option-name')?.textContent?.trim();
            const selectedOption = select.options[select.selectedIndex];
            
            if (optionName && selectedOption) {
                options.push({
                    name: optionName,
                    value: selectedOption.textContent.trim()
                });
            }
        });
        
        return options;
    }
    
    // Функция для извлечения дополнительных свойств из таблиц и блоков описания
    function extractAdditionalProperties() {
        const properties = [];
        
        // Поиск таблиц с характеристиками
        const tables = document.querySelectorAll('table, .t-table');
        tables.forEach(table => {
            const rows = table.querySelectorAll('tr, .t-table__row');
            rows.forEach(row => {
                const cells = row.querySelectorAll('td, th, .t-table__cell');
                if (cells.length >= 2) {
                    const name = cleanText(cells[0].textContent);
                    const value = cleanText(cells[1].textContent);
                    if (name && value) {
                        properties.push({
                            "@type": "PropertyValue",
                            "name": name,
                            "value": value
                        });
                    }
                }
            });
        });
        
        // Поиск блоков с характеристиками (списки)
        const lists = document.querySelectorAll('.t-text ul li, .t-text ol li');
        lists.forEach(item => {
            const text = cleanText(item.textContent);
            if (text.includes(':')) {
                const [name, value] = text.split(':').map(s => s.trim());
                if (name && value) {
                    properties.push({
                        "@type": "PropertyValue",
                        "name": name,
                        "value": value
                    });
                }
            }
        });
        
        return properties;
    }
    
    // Главная функция для генерации микроразметки
    function generateProductSchema() {
        // Проверяем, что мы на странице товара
        const productContainer = document.querySelector('.js-product.js-product-single.js-store-product.js-store-product_single');
        if (!productContainer) {
            return null;
        }
        
        // Извлекаем данные товара
        const productName = cleanText(document.querySelector('.js-product-name')?.textContent || '');
        const productDescription = cleanText(document.querySelector('.t744__descr[field="descr"]')?.textContent || '');
        const productUrl = window.location.href;
        const productSku = cleanText(document.querySelector('.js-product-sku')?.textContent || '');
        
        // Извлекаем цену
        const priceElement = document.querySelector('.js-product-price');
        const price = extractPrice(priceElement);
        const currency = cleanText(document.querySelector('.js-product-price-currency')?.textContent || 'RUB');
        
        // Извлекаем бренд
        const brand = extractBrand(productName);
        
        // Извлекаем изображения
        const images = extractImages();
        
        // Определяем наличие
        const currentPath = window.location.pathname;
        const availability = inStockPages.includes(currentPath) ? "InStock" : "PreOrder";
        
        // Извлекаем хлебные крошки
        const breadcrumbs = extractBreadcrumbs();
        
        // Извлекаем опции товара
        const productOptions = extractProductOptions();
        
        // Извлекаем дополнительные свойства
        const additionalProperties = extractAdditionalProperties();
        
        // Создаем схему товара
        const productSchema = {
            "@context": "https://schema.org",
            "@type": "Product",
            "name": productName,
            "description": productDescription,
            "url": productUrl
        };
        
        // Добавляем SKU если есть
        if (productSku) {
            productSchema.sku = productSku;
        }
        
        // Добавляем бренд
        if (brand) {
            productSchema.brand = {
                "@type": "Brand",
                "name": brand
            };
        }
        
        // Добавляем изображения
        if (images.length > 0) {
            productSchema.image = images.length === 1 ? images[0] : images;
        }
        
        // Добавляем предложение с ценой
        if (price) {
            productSchema.offers = {
                "@type": "Offer",
                "url": productUrl,
                "priceCurrency": currency,
                "price": price,
                "availability": `https://schema.org/${availability}`,
                "seller": {
                    "@type": "Organization",
                    "name": "MotoRush"
                }
            };
        }
        
        // Добавляем дополнительные свойства
        if (additionalProperties.length > 0 || productOptions.length > 0) {
            const allProperties = [...additionalProperties];
            
            // Добавляем опции товара как свойства
            productOptions.forEach(option => {
                allProperties.push({
                    "@type": "PropertyValue",
                    "name": option.name,
                    "value": option.value
                });
            });
            
            if (allProperties.length > 0) {
                productSchema.additionalProperty = allProperties;
            }
        }
        
        // Создаем схему хлебных крошек
        let breadcrumbSchema = null;
        if (breadcrumbs.length > 0) {
            breadcrumbSchema = {
                "@context": "https://schema.org",
                "@type": "BreadcrumbList",
                "itemListElement": breadcrumbs
            };
        }
        
        // Возвращаем массив схем
        const schemas = [productSchema];
        if (breadcrumbSchema) {
            schemas.push(breadcrumbSchema);
        }
        
        return schemas;
    }
    
    // Функция для вставки микроразметки в head
    function insertSchema(schemas) {
        if (!schemas || schemas.length === 0) return;
        
        // Удаляем существующие схемы, если есть
        const existingSchemas = document.querySelectorAll('script[type="application/ld+json"][data-schema="product"]');
        existingSchemas.forEach(script => script.remove());
        
        // Вставляем новые схемы
        schemas.forEach((schema, index) => {
            const script = document.createElement('script');
            script.type = 'application/ld+json';
            script.setAttribute('data-schema', 'product');
            script.setAttribute('data-schema-index', index);
            script.textContent = JSON.stringify(schema, null, 2);
            document.head.appendChild(script);
        });
        
        console.log('Schema.org микроразметка добавлена:', schemas);
    }
    
    // Функция инициализации
    function init() {
        // Ждем полной загрузки DOM
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
            return;
        }
        
        // Дополнительная задержка для загрузки Tilda-скриптов
        setTimeout(() => {
            const schemas = generateProductSchema();
            if (schemas) {
                insertSchema(schemas);
            }
        }, 1000);
        
        // Отслеживаем изменения в DOM (для случаев, когда Tilda динамически обновляет контент)
        const observer = new MutationObserver((mutations) => {
            let shouldRegenerate = false;
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList' && mutation.target.classList) {
                    const classList = Array.from(mutation.target.classList);
                    if (classList.some(cls => cls.includes('product') || cls.includes('store'))) {
                        shouldRegenerate = true;
                    }
                }
            });
            
            if (shouldRegenerate) {
                setTimeout(() => {
                    const schemas = generateProductSchema();
                    if (schemas) {
                        insertSchema(schemas);
                    }
                }, 500);
            }
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
    
    const SEO_SCHEMA_EXT = {
  // Раскладка валют/символов -> ISO 4217
  currencyMap: {
    'RUB':'RUB','₽':'RUB','RUR':'RUB','РУБ':'RUB','руб':'RUB','руб.':'RUB',
    'USD':'USD','$':'USD',
    'EUR':'EUR','€':'EUR'
  },
  defaultCurrency: 'RUB',

  // 'daily' | 'weekly' | 'static' (для static не проставляем поле)
  priceValidStrategy: 'daily',

  // Ссылка на страницу с политикой возврата (подставь свою; можно оставить пустым)
  returnPolicyUrl: '/policy/returns',

  shipping: {
    pickupCity: 'Москва',
    pickupRegionText: 'Москва', // человекочитаемо
    country: 'RU',
    // Усреднённые сроки для ТК
    handlingDays: { min: 0, max: 1 },
    transitDays:  { min: 1, max: 14 }
  }
};

function normalizeCurrencyOnOffer(offer) {
  if (!offer) return;
  let cur = (offer.priceCurrency || '').toString().trim();
  const map = SEO_SCHEMA_EXT.currencyMap;
  // если валюта не трёхбуквенная — попробуем распознать по карте
  if (!/^[A-Z]{3}$/.test(cur)) {
    cur = map[cur] || map[cur.toUpperCase()] || SEO_SCHEMA_EXT.defaultCurrency;
  }
  // финальная проверка
  if (!/^[A-Z]{3}$/.test(cur)) {
    cur = SEO_SCHEMA_EXT.defaultCurrency;
  }
  offer.priceCurrency = cur;
}

function computePriceValidUntil(strategy) {
  if (strategy === 'static') return null;
  const d = new Date();
  if (strategy === 'daily') {
    d.setDate(d.getDate() + 1);
  } else if (strategy === 'weekly') {
    d.setDate(d.getDate() + 7);
  }
  // schema.org: Date (YYYY-MM-DD) достаточно
  return d.toISOString().slice(0, 10);
}

function buildShippingDetails(cfg) {
  const pickup = {
    "@type": "OfferShippingDetails",
    "availableDeliveryMethod": "https://schema.org/OnSitePickup",
    "shippingDestination": {
      "@type": "DefinedRegion",
      "addressCountry": cfg.country,
      "addressRegion": cfg.pickupRegionText
    },
    "deliveryTime": {
      "@type": "ShippingDeliveryTime",
      "handlingTime": {
        "@type": "QuantitativeValue",
        "minValue": cfg.handlingDays.min,
        "maxValue": cfg.handlingDays.max,
        "unitCode": "DAY"
      },
      "transitTime": {
        "@type": "QuantitativeValue",
        "minValue": 0,
        "maxValue": 0,
        "unitCode": "DAY"
      }
    }
  };

  const freight = {
    "@type": "OfferShippingDetails",
    "availableDeliveryMethod": "https://schema.org/DeliveryModeFreight",
    "shippingDestination": {
      "@type": "DefinedRegion",
      "addressCountry": cfg.country
    },
    "deliveryTime": {
      "@type": "ShippingDeliveryTime",
      "handlingTime": {
        "@type": "QuantitativeValue",
        "minValue": cfg.handlingDays.min,
        "maxValue": cfg.handlingDays.max,
        "unitCode": "DAY"
      },
      "transitTime": {
        "@type": "QuantitativeValue",
        "minValue": cfg.transitDays.min,
        "maxValue": cfg.transitDays.max,
        "unitCode": "DAY"
      }
    }
  };

  return [pickup, freight];
}

function buildReturnPolicy(url) {
  const absUrl = url ? new URL(url, window.location.origin).href : undefined;
  const policy = {
    "@type": "MerchantReturnPolicy",
    "returnPolicyCategory": "https://schema.org/MerchantReturnUnspecified"
  };
  if (absUrl) {
    // Официальное поле для ссылки на политику
    policy.merchantReturnLink = absUrl;
  }
  return policy;
}

/* Перехватываем insertSchema и безболезненно дополняем оффер */
(function patchInsertSchema() {
  // если функции ещё не объявлены (редкие гонки), повесим попытку позже
  if (typeof insertSchema !== 'function') {
    document.addEventListener('DOMContentLoaded', patchInsertSchema, { once: true });
    return;
  }
  const originalInsert = insertSchema;
  insertSchema = function(schemas) {
    try {
      const augmented = (schemas || []).map(sch => {
        if (sch && sch['@type'] === 'Product' && sch.offers && typeof sch.offers === 'object') {
          // 1) Валюта
          normalizeCurrencyOnOffer(sch.offers);

          // 2) priceValidUntil
          const until = computePriceValidUntil(SEO_SCHEMA_EXT.priceValidStrategy);
          if (until) {
            sch.offers.priceValidUntil = until;
          }

          // 3) shippingDetails
          sch.offers.shippingDetails = buildShippingDetails(SEO_SCHEMA_EXT.shipping);

          // 4) hasMerchantReturnPolicy
          sch.offers.hasMerchantReturnPolicy = buildReturnPolicy(SEO_SCHEMA_EXT.returnPolicyUrl);
        }
        return sch;
      });
      return originalInsert(augmented);
    } catch (e) {
      // на всякий — не ломаем поток, вставляем как есть
      return originalInsert(schemas);
    }
  };
})();
    
    // Запускаем скрипт
    init();
    
})();
</script>