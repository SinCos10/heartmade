const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
    // Folder to scan for product pages
    sourceFolder: './', 
    
    // Images folder
    imagesFolder: './img/',
    
    // Output file name
    outputFile: 'catalogocompleto.html',
    
    // Template file (optional - if you want to use a template)
    templateFile: 'catalog-template.html',
    
    // Product page pattern (regex to match product files)
    productPagePattern: /^p(\d+)\.html$/,
    
    // Product image pattern (regex to match image files)
    productImagePattern: /^p(\d+)\.(png|jpg|jpeg|gif|webp)$/i,
    
    // Maximum product ID to check (prevents infinite checking)
    maxProductId: 100,
    
    // Default image if no product image is found
    defaultImage: 'https://via.placeholder.com/250x250?text=No+Image'
};

// Product data template - you can customize this
const PRODUCT_DATA_TEMPLATE = {
    getProductData: (id, imagePath) => ({
        id: parseInt(id),
        name: `Pelúcia ${id}`,
        price: Math.floor(Math.random() * 55) + 25, // Random price between 25-80
        image: imagePath,
        category: `Categoria ${Math.floor(Math.random() * 3) + 1}`, // Random category 1-3
        deliveryDays: Math.floor(Math.random() * 8) + 3 // Random 3-10 days
    })
};

// Scan folder for product images
function scanForProductImages(folderPath) {
    const productImages = {};
    
    try {
        if (!fs.existsSync(folderPath)) {
            console.log(`⚠️  Images folder not found: ${folderPath}`);
            console.log(`   Creating images folder...`);
            fs.mkdirSync(folderPath, { recursive: true });
            return productImages;
        }
        
        const files = fs.readdirSync(folderPath);
        console.log(`Scanning images folder: ${folderPath}`);
        console.log(`Found ${files.length} files in images folder`);
        
        files.forEach(file => {
            const match = file.match(CONFIG.productImagePattern);
            if (match) {
                const productId = parseInt(match[1]);
                const extension = match[2];
                if (productId <= CONFIG.maxProductId) {
                    // Use relative path for web compatibility
                    productImages[productId] = `img/${file}`;
                    console.log(`🖼️  Found product image: ${file} (ID: ${productId})`);
                }
            }
        });
        
    } catch (error) {
        console.error(`Error scanning images folder: ${error.message}`);
        return {};
    }
    
    return productImages;
}

// Scan folder for product pages
function scanForProductPages(folderPath) {
    const availableProducts = [];
    
    try {
        const files = fs.readdirSync(folderPath);
        console.log(`Scanning folder: ${folderPath}`);
        console.log(`Found ${files.length} files`);
        
        files.forEach(file => {
            const match = file.match(CONFIG.productPagePattern);
            if (match) {
                const productId = parseInt(match[1]);
                if (productId <= CONFIG.maxProductId) {
                    availableProducts.push(productId);
                    console.log(`✓ Found product page: ${file} (ID: ${productId})`);
                }
            }
        });
        
        // Sort by product ID
        availableProducts.sort((a, b) => a - b);
        
    } catch (error) {
        console.error(`Error scanning folder: ${error.message}`);
        return [];
    }
    
    return availableProducts;
}

// Generate product data for available products
function generateProductData(availableProductIds, productImages) {
    const productData = {};
    
    availableProductIds.forEach(id => {
        // Use found image or default placeholder
        const imagePath = productImages[id] || CONFIG.defaultImage;
        productData[id] = PRODUCT_DATA_TEMPLATE.getProductData(id, imagePath);
    });
    
    return productData;
}

// Generate the complete HTML catalog
function generateCatalogHTML(availableProductIds, productData) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Heartmade Pelúcias - Premium Plush Collection</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        .plush-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
        }
        .plush-image {
            height: 250px;
            object-fit: contain;
            transition: all 0.3s ease;
            margin-bottom: 0.5rem;
        }
        .plush-card:hover .plush-image {
            transform: scale(1.05);
        }
        .nav-link:hover {
            color: #f59e0b;
        }
        .logo-img {
            height: 60px;
            width: auto;
            transition: transform 0.3s ease;
        }
        .logo-img:hover {
            transform: scale(1.05);
        }
        .lettering-logo {
            height: 60px;
            width: auto;
            transition: transform 0.3s ease;
        }
        .lettering-logo:hover {
            transform: scale(1.05);
        }
        input[type="range"]::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 16px;
            height: 16px;
            background: #f59e0b;
            cursor: pointer;
            border-radius: 50%;
        }
        input[type="range"]::-moz-range-thumb {
            width: 16px;
            height: 16px;
            background: #f59e0b;
            cursor: pointer;
            border-radius: 50%;
        }
    </style>
</head>
<body class="bg-gray-50 font-sans">
    <!-- Header -->
    <header class="bg-white shadow-md sticky top-0 z-50">
        <div class="container mx-auto px-4 py-3 flex justify-between items-center">
            <div class="flex items-center">
                <a href="index.html" class="flex items-center space-x-3">
                    <img src="logo.png" alt="Heartmade Pelúcias" class="logo-img">
                    <img src="letteringlogo.png" alt="Heartmade Pelúcias Lettering" class="lettering-logo">
                </a>
            </div>
            
            <nav class="hidden md:flex space-x-8">
                <a href="catalogocompleto.html" class="nav-link text-gray-700 hover:text-amber-600 font-medium">Catálogo completo</a>
                <a href="maisvendidos.html" class="nav-link text-gray-700 hover:text-amber-600 font-medium">Mais vendidos</a>
                <a href="categorias.html" class="nav-link text-gray-700 hover:text-amber-600 font-medium">Categorias</a>
                <a href="contato.html" class="nav-link text-gray-700 hover:text-amber-600 font-medium">Contato</a>
            </nav>
            
            <div class="flex items-center space-x-4">
                <div class="relative flex-grow max-w-xl mx-4">
                    <div class="flex items-center bg-white rounded-md shadow-sm overflow-hidden">
                        <input type="text" placeholder="Buscar na Heartmade..." 
                            class="w-full px-4 py-2 focus:outline-none">
                        <button class="bg-amber-600 text-white px-4 py-2 hover:bg-amber-700 transition">
                            <i class="fas fa-search"></i>
                        </button>
                    </div>
                </div>
                <button class="md:hidden p-2 text-gray-600" id="mobile-menu-button">
                    <i class="fas fa-bars"></i>
                </button>
            </div>
        </div>
        
        <!-- Mobile menu -->
        <div class="md:hidden hidden bg-white py-2 px-4 shadow-md" id="mobile-menu">
            <a href="catalogocompleto.html" class="block py-2 text-gray-700 hover:text-amber-600">Catálogo completo</a>
            <a href="maisvendidos.html" class="block py-2 text-gray-700 hover:text-amber-600">Mais vendidos</a>
            <a href="categorias.html" class="block py-2 text-gray-700 hover:text-amber-600">Categorias</a>
            <a href="contato.html" class="block py-2 text-gray-700 hover:text-amber-600">Contato</a>
        </div>
    </header>

    <!-- Main Content Area -->
    <main class="container mx-auto px-4 py-8">
        <div class="flex flex-col md:flex-row gap-8">
            <!-- Filters Section -->
            <div class="w-full md:w-64 bg-white p-6 rounded-lg shadow-md h-fit">
                <h3 class="font-bold text-lg mb-4 text-gray-800">Filtros</h3>
                
                <!-- Categories Filter -->
                <div class="mb-6">
                    <h4 class="font-medium text-gray-700 mb-3">Categorias</h4>
                    <div class="space-y-2">
                        <label class="flex items-center space-x-2">
                            <input type="checkbox" class="rounded text-amber-600" value="Categoria 1">
                            <span>Categoria 1</span>
                        </label>
                        <label class="flex items-center space-x-2">
                            <input type="checkbox" class="rounded text-amber-600" value="Categoria 2">
                            <span>Categoria 2</span>
                        </label>
                        <label class="flex items-center space-x-2">
                            <input type="checkbox" class="rounded text-amber-600" value="Categoria 3">
                            <span>Categoria 3</span>
                        </label>
                    </div>
                </div>
                
                <!-- Price Filter -->
                <div class="mb-6">
                    <h4 class="font-medium text-gray-700 mb-3">Preço Máximo (R$)</h4>
                    <input type="range" min="20" max="200" value="200" class="w-full mb-2" id="price-range">
                    <div class="flex justify-between text-sm text-gray-600">
                        <span>R$20</span>
                        <span id="price-value">R$200</span>
                        <span>R$200</span>
                    </div>
                </div>
                
                <button class="w-full bg-amber-600 hover:bg-amber-700 text-white py-2 px-4 rounded transition" id="apply-filters">
                    Aplicar filtros
                </button>
            </div>
            
            <!-- Products Section -->
            <div class="flex-1">
                <!-- Sorting Options -->
                <div class="bg-white p-4 rounded-lg shadow-md mb-6 flex justify-between items-center">
                    <div class="text-gray-600">
                        Mostrando <span class="font-medium" id="product-count">${availableProductIds.length}</span> produtos
                        <span class="text-xs text-gray-400">(Atualizado automaticamente)</span>
                    </div>
                    <div class="flex items-center space-x-2">
                        <span class="text-gray-600">Ordenar por:</span>
                        <select class="border rounded px-3 py-1 focus:outline-none focus:ring-2 focus:ring-amber-200" id="sort-by">
                            <option value="relevance">Mais relevantes</option>
                            <option value="latest">Mais recentes</option>
                            <option value="price-asc">Menor preço</option>
                            <option value="price-desc">Maior preço</option>
                        </select>
                    </div>
                </div>
                
                <!-- Product Grid -->
                <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6" id="plush-catalog">
                    ${availableProductIds.length === 0 ? `
                    <div class="col-span-full text-center py-12">
                        <i class="fas fa-info-circle text-4xl text-gray-300 mb-4"></i>
                        <h3 class="text-xl font-medium text-gray-700 mb-2">Nenhum produto disponível</h3>
                        <p class="text-gray-500">Adicione arquivos p*.html para ver produtos aqui.</p>
                    </div>
                    ` : ''}
                </div>
            </div>
        </div>
    </main>

    <!-- Footer -->
    <footer class="bg-gray-800 text-white py-10">
        <div class="container mx-auto px-4">
            <div class="text-center">
                <h3 class="text-xl font-bold mb-4">Heartmade Pelúcias</h3>
                <p class="text-gray-400 max-w-2xl mx-auto">PLACEHOLDERDESCRICAOCORP.</p>
                <div class="flex justify-center space-x-4 mt-4">
                    <a href="#" class="text-gray-400 hover:text-white"><i class="fab fa-whatsapp"></i></a>
                    <a href="#" class="text-gray-400 hover:text-white"><i class="fab fa-instagram"></i></a>
                </div>
            </div>
            <div class="border-t border-gray-700 mt-10 pt-6 text-center text-gray-400">
                <p>&copy; 2025 Heartmade Pelúcias. Todos direitos reservados.</p>
            </div>
        </div>
    </footer>

    <script>
        // Auto-generated product data - DO NOT MODIFY MANUALLY
        // This section is automatically updated by the build script
        // Generated on: ${new Date().toLocaleString('pt-BR')}
        const availableProducts = [
${availableProductIds.map(id => {
    const product = productData[id];
    return `            { id: ${product.id}, name: "${product.name}", price: ${product.price}, image: "${product.image}", category: "${product.category}" }`;
}).join(',\n')}
        ];

        let currentFilteredProducts = [...availableProducts];
        let maxPrice = 200;

        // Mobile menu toggle
        document.getElementById('mobile-menu-button').addEventListener('click', function() {
            const menu = document.getElementById('mobile-menu');
            menu.classList.toggle('hidden');
        });

        // Update range slider values
        const priceRange = document.getElementById('price-range');
        const priceValue = document.getElementById('price-value');

        priceRange.oninput = function() {
            priceValue.innerHTML = "R$" + this.value;
        }

        // Filter products by max price and category
        function applyFilters() {
            const selectedCategories = Array.from(document.querySelectorAll('input[type="checkbox"]:checked'))
                .map(cb => cb.value);
            
            let filtered = availableProducts;
            
            // Filter by price
            if (maxPrice < 200) {
                filtered = filtered.filter(item => item.price <= maxPrice);
            }
            
            // Filter by category
            if (selectedCategories.length > 0) {
                filtered = filtered.filter(item => selectedCategories.includes(item.category));
            }
            
            currentFilteredProducts = filtered;
            renderPlushItems(currentFilteredProducts);
        }

        // Function to render plush items
        function renderPlushItems(items) {
            const catalogContainer = document.getElementById('plush-catalog');
            const productCountSpan = document.getElementById('product-count');
            
            if (catalogContainer) {
                catalogContainer.innerHTML = '';
                
                if (items.length === 0) {
                    catalogContainer.innerHTML = \`
                        <div class="col-span-full text-center py-12">
                            <i class="fas fa-search text-4xl text-gray-300 mb-4"></i>
                            <h3 class="text-xl font-medium text-gray-700 mb-2">Nenhum produto encontrado</h3>
                            <p class="text-gray-500">Tente ajustar os filtros para ver mais produtos.</p>
                        </div>
                    \`;
                    productCountSpan.textContent = '0';
                    return;
                }
                
                items.forEach((item) => {
                    const itemElement = document.createElement('div');
                    itemElement.className = 'bg-white rounded-lg overflow-hidden shadow-md plush-card transition duration-300';
                    itemElement.innerHTML = \`
                        <a href="p\${item.id}.html" class="block">
                            <div class="p-4">
                                <img src="\${item.image}" alt="\${item.name}" class="plush-image w-full rounded-lg mb-4">
                                <h3 class="font-medium text-gray-800 mb-1">\${item.name}</h3>
                                <p class="text-amber-600 font-bold">R\${item.price.toFixed(2)}</p>
                                <p class="text-gray-500 text-sm mt-1">Prazo: \${Math.floor(Math.random() * 8) + 3} dias</p>
                            </div>
                        </a>
                    \`;
                    catalogContainer.appendChild(itemElement);
                });

                productCountSpan.textContent = items.length;
            }
        }

        // Sorting functionality
        const sortBySelect = document.getElementById('sort-by');

        sortBySelect.addEventListener('change', function() {
            const sortValue = this.value;
            let sortedItems = [...currentFilteredProducts];

            switch (sortValue) {
                case 'relevance':
                case 'latest':
                    sortedItems.sort((a, b) => a.id - b.id);
                    break;
                case 'price-asc':
                    sortedItems.sort((a, b) => a.price - b.price);
                    break;
                case 'price-desc':
                    sortedItems.sort((a, b) => b.price - a.price);
                    break;
            }
            renderPlushItems(sortedItems);
        });

        // Filter button handler
        document.getElementById('apply-filters').addEventListener('click', function() {
            maxPrice = parseInt(priceRange.value);
            priceValue.innerHTML = "R$" + maxPrice;
            applyFilters();
        });

        // Category filter handlers
        document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', applyFilters);
        });

        // Initial render
        document.addEventListener('DOMContentLoaded', function() {
            renderPlushItems(availableProducts);
        });
    </script>
</body>
</html>`;
}

// Main function
function generateCatalog() {
    console.log('🚀 Starting catalog generation...');
    console.log('==========================================');
    
    // Check if source folder exists
    if (!fs.existsSync(CONFIG.sourceFolder)) {
        console.error(`❌ Source folder not found: ${CONFIG.sourceFolder}`);
        return;
    }
    
    // Scan for product pages
    const availableProductIds = scanForProductPages(CONFIG.sourceFolder);
    
    // Scan for product images
    const productImages = scanForProductImages(CONFIG.imagesFolder);
    
    console.log('==========================================');
    console.log(`📦 Found ${availableProductIds.length} product pages:`);
    if (availableProductIds.length > 0) {
        console.log(`   Product IDs: ${availableProductIds.join(', ')}`);
    } else {
        console.log('   No product pages found (looking for p*.html files)');
    }
    
    console.log(`🖼️  Found ${Object.keys(productImages).length} product images:`);
    if (Object.keys(productImages).length > 0) {
        Object.entries(productImages).forEach(([id, path]) => {
            console.log(`   Product ${id}: ${path}`);
        });
    } else {
        console.log('   No product images found (looking for p*.png/jpg/jpeg/gif/webp in img/ folder)');
    }
    
    // Check which products have both pages and images
    const productsWithImages = availableProductIds.filter(id => productImages[id]);
    const productsWithoutImages = availableProductIds.filter(id => !productImages[id]);
    
    if (productsWithoutImages.length > 0) {
        console.log(`⚠️  Products without images (will use placeholder): ${productsWithoutImages.join(', ')}`);
    }
    if (productsWithImages.length > 0) {
        console.log(`✅ Products with images: ${productsWithImages.join(', ')}`);
    }
    
    // Generate product data
    const productData = generateProductData(availableProductIds, productImages);
    
    // Generate HTML
    const htmlContent = generateCatalogHTML(availableProductIds, productData);
    
    // Write to file
    try {
        fs.writeFileSync(CONFIG.outputFile, htmlContent, 'utf8');
        console.log('==========================================');
        console.log(`✅ Catalog generated successfully!`);
        console.log(`📄 Output file: ${CONFIG.outputFile}`);
        console.log(`🌐 Open ${CONFIG.outputFile} in your browser to view the catalog`);
        
        if (availableProductIds.length > 0) {
            console.log(`📈 Summary:`);
            console.log(`   - ${availableProductIds.length} products total`);
            console.log(`   - ${productsWithImages.length} with custom images`);
            console.log(`   - ${productsWithoutImages.length} using placeholder images`);
        }
        console.log('==========================================');
    } catch (error) {
        console.error(`❌ Error writing file: ${error.message}`);
    }
}

// Run the script
if (require.main === module) {
    generateCatalog();
}

module.exports = { generateCatalog, CONFIG, PRODUCT_DATA_TEMPLATE };