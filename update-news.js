const fs = require('fs').promises;
const path = require('path');
const { JSDOM } = require('jsdom');

class NewsUpdater {
    constructor(sourceDir = './source', indexFile = './index.html') {
        this.sourceDir = sourceDir;
        this.indexFile = indexFile;
    }

    /**
     * Busca todos os arquivos ntc[número].html na pasta source
     */
    async findNewsFiles() {
        try {
            const files = await fs.readdir(this.sourceDir);
            const newsFiles = files
                .filter(file => /^ntc\d+\.html$/.test(file))
                .sort((a, b) => {
                    const numA = parseInt(a.match(/\d+/)[0]);
                    const numB = parseInt(b.match(/\d+/)[0]);
                    return numB - numA; // Ordem decrescente (mais recente primeiro)
                });
            
            console.log(`Encontrados ${newsFiles.length} arquivos de notícias:`, newsFiles);
            return newsFiles;
        } catch (error) {
            console.error('Erro ao ler diretório de notícias:', error);
            return [];
        }
    }

    /**
     * Extrai metadados de um arquivo HTML de notícia
     */
    async extractNewsMetadata(filename) {
        try {
            const filePath = path.join(this.sourceDir, filename);
            const htmlContent = await fs.readFile(filePath, 'utf8');
            const dom = new JSDOM(htmlContent);
            const document = dom.window.document;

            // Extrai informações do HTML
            const title = this.extractTitle(document);
            const description = this.extractDescription(document);
            const image = this.extractImage(document, filename);
            const date = this.extractDate(document, filename);

            return {
                id: filename.replace('.html', ''),
                title,
                description,
                image,
                date,
                link: `source/${filename}`
            };
        } catch (error) {
            console.error(`Erro ao processar ${filename}:`, error);
            return null;
        }
    }

    /**
     * Extrai título da notícia
     */
    extractTitle(document) {
        // Prioridades: meta title, h1, title tag
        let title = document.querySelector('meta[name="title"]')?.content ||
                   document.querySelector('meta[property="og:title"]')?.content ||
                   document.querySelector('h1')?.textContent ||
                   document.querySelector('title')?.textContent ||
                   'Notícia sem título';
        
        return title.trim().substring(0, 100); // Limita a 100 caracteres
    }

    /**
     * Extrai descrição da notícia
     */
    extractDescription(document) {
        // Prioridades: meta description, primeiro parágrafo, texto do body
        let description = document.querySelector('meta[name="description"]')?.content ||
                         document.querySelector('meta[property="og:description"]')?.content ||
                         document.querySelector('.news-description')?.textContent ||
                         document.querySelector('.description')?.textContent ||
                         document.querySelector('p')?.textContent ||
                         'Descrição não disponível';
        
        return description.trim().substring(0, 200); // Limita a 200 caracteres
    }

    /**
     * Extrai imagem da notícia
     */
    extractImage(document, filename) {
        // Prioridades: meta image, primeira img, imagem padrão
        let imagePath = document.querySelector('meta[property="og:image"]')?.content ||
                       document.querySelector('meta[name="twitter:image"]')?.content ||
                       document.querySelector('.news-image img')?.src ||
                       document.querySelector('.featured-image img')?.src ||
                       document.querySelector('img')?.src;

        if (imagePath) {
            // Se for caminho relativo, ajusta para o diretório source
            if (!imagePath.startsWith('http') && !imagePath.startsWith('/')) {
                imagePath = `source/${imagePath}`;
            }
            return imagePath;
        }

        // Tenta encontrar imagem com mesmo nome do arquivo
        const baseFilename = filename.replace('.html', '');
        const possibleExtensions = ['jpg', 'jpeg', 'png', 'webp'];
        
        for (const ext of possibleExtensions) {
            const possibleImage = `source/${baseFilename}.${ext}`;
            // Retorna o caminho esperado (verificação de existência seria feita no frontend)
            return possibleImage;
        }

        return 'source/default-news.jpg'; // Imagem padrão
    }

    /**
     * Extrai data da notícia
     */
    extractDate(document, filename) {
        // Prioridades: meta date, data no HTML, data do arquivo
        let dateStr = document.querySelector('meta[name="date"]')?.content ||
                     document.querySelector('meta[property="article:published_time"]')?.content ||
                     document.querySelector('.news-date')?.textContent ||
                     document.querySelector('.date')?.textContent ||
                     document.querySelector('time')?.textContent;

        if (dateStr) {
            try {
                const date = new Date(dateStr);
                if (!isNaN(date.getTime())) {
                    return this.formatDate(date);
                }
            } catch (error) {
                console.log(`Data inválida em ${filename}: ${dateStr}`);
            }
        }

        // Usa data atual como fallback
        return this.formatDate(new Date());
    }

    /**
     * Formata data para exibição
     */
    formatDate(date) {
        const options = { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric',
            timeZone: 'America/Sao_Paulo'
        };
        return date.toLocaleDateString('pt-BR', options);
    }

    /**
     * Gera o HTML para o carrossel de notícias
     */
    generateNewsHTML(newsItems) {
        if (newsItems.length === 0) {
            return '<p class="text-center text-gray-600">Nenhuma notícia disponível.</p>';
        }

        let newsHTML = '';
        let dotsHTML = '';

        newsItems.forEach((news, index) => {
            // Card HTML
            newsHTML += `
                <a href="${news.link}" class="news-card bg-white rounded-lg overflow-hidden shadow-md transition duration-300 block">
                    <img src="${news.image}" alt="${news.title}" class="news-image">
                    <div class="p-4">
                        <h3 class="font-medium text-gray-800 mb-1">${news.title}</h3>
                        <p class="text-gray-600 text-sm mb-2">${news.description}</p>
                        <p class="text-gray-500 text-xs">${news.date}</p>
                    </div>
                </a>
            `;

            // Dot HTML
            dotsHTML += `<span class="dot ${index === 0 ? 'active' : ''}" data-index="${index}"></span>`;
        });

        return { newsHTML, dotsHTML };
    }

    /**
     * Atualiza o arquivo index.html com as notícias
     */
    async updateIndexHTML() {
        console.log('Iniciando atualização das notícias no index.html...');
        
        const newsFiles = await this.findNewsFiles();
        const newsData = [];

        for (const filename of newsFiles) {
            const metadata = await this.extractNewsMetadata(filename);
            if (metadata) {
                newsData.push(metadata);
            }
        }

        // Limita a 10 notícias mais recentes
        const limitedNews = newsData.slice(0, 10);
        const { newsHTML, dotsHTML } = this.generateNewsHTML(limitedNews);

        try {
            // Lê o arquivo index.html
            let indexContent = await fs.readFile(this.indexFile, 'utf8');
            
            // Substitui o conteúdo do carrossel de notícias usando JSDOM
            const dom = new JSDOM(indexContent);
            const document = dom.window.document;
            
            // Atualiza o container de notícias
            const newsContainer = document.getElementById('news-container');
            if (newsContainer) {
                newsContainer.innerHTML = newsHTML;
            } else {
                console.error('Elemento #news-container não encontrado no index.html');
            }
            
            // Atualiza os pontos de navegação
            const dotsContainer = document.getElementById('carousel-dots');
            if (dotsContainer) {
                dotsContainer.innerHTML = dotsHTML;
            } else {
                console.error('Elemento #carousel-dots não encontrado no index.html');
            }
            
            // Serializa o documento atualizado
            const updatedHTML = dom.serialize();
            
            // Escreve o conteúdo atualizado de volta ao arquivo
            await fs.writeFile(this.indexFile, updatedHTML, 'utf8');
            console.log(`✅ Arquivo ${this.indexFile} atualizado com ${limitedNews.length} notícias`);
            
            // Log das notícias processadas
            limitedNews.forEach((news, index) => {
                console.log(`${index + 1}. ${news.title} (${news.date})`);
            });
            
        } catch (error) {
            console.error('❌ Erro ao atualizar o arquivo index.html:', error);
        }
    }

    /**
     * Cria estrutura de pastas se não existir
     */
    async ensureDirectoryStructure() {
        try {
            await fs.access(this.sourceDir);
        } catch (error) {
            console.log(`Criando diretório ${this.sourceDir}...`);
            await fs.mkdir(this.sourceDir, { recursive: true });
            
            // Cria arquivo de exemplo
            const exampleContent = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nova Coleção de Pelúcias Chegou!</title>
    <meta name="description" content="Confira nossa mais nova coleção de pelúcias com designs exclusivos e materiais de alta qualidade.">
    <meta name="date" content="${new Date().toISOString()}">
</head>
<body>
    <article>
        <h1>Nova Coleção de Pelúcias Chegou!</h1>
        <div class="news-date">${this.formatDate(new Date())}</div>
        <img src="ntc1.jpg" alt="Nova coleção" class="featured-image">
        <p class="description">Estamos muito animados em apresentar nossa mais nova coleção de pelúcias, com designs únicos e materiais de primeira qualidade.</p>
        <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
    </article>
</body>
</html>`;
            
            await fs.writeFile(path.join(this.sourceDir, 'ntc1.html'), exampleContent, 'utf8');
            console.log('✅ Arquivo de exemplo criado: ntc1.html');
        }
    }

    /**
     * Monitora mudanças na pasta de notícias
     */
    watchForChanges() {
        const fs = require('fs');
        
        console.log(`🔍 Monitorando mudanças em ${this.sourceDir}...`);
        
        fs.watch(this.sourceDir, { recursive: true }, (eventType, filename) => {
            if (filename && filename.match(/^ntc\d+\.html$/)) {
                console.log(`📝 Mudança detectada: ${filename} (${eventType})`);
                setTimeout(() => {
                    this.updateIndexHTML();
                }, 1000); // Delay para garantir que o arquivo foi completamente salvo
            }
        });
    }
}

// Função principal
async function main() {
    const updater = new NewsUpdater();
    
    // Argumentos da linha de comando
    const args = process.argv.slice(2);
    const command = args[0] || 'update';
    
    try {
        // Garante que a estrutura de diretórios existe
        await updater.ensureDirectoryStructure();
        
        switch (command) {
            case 'update':
                await updater.updateIndexHTML();
                break;
                
            case 'watch':
                await updater.updateIndexHTML(); // Primeira atualização
                updater.watchForChanges();
                console.log('Pressione Ctrl+C para parar o monitoramento...');
                
                // Mantém o processo rodando
                process.on('SIGINT', () => {
                    console.log('\n👋 Parando monitoramento...');
                    process.exit(0);
                });
                break;
                
            case 'init':
                console.log('Inicializando estrutura de notícias...');
                // Cria alguns arquivos de exemplo adicionais
                await createExampleNews();
                await updater.updateIndexHTML();
                break;
                
            default:
                console.log(`
Uso: node update-news.js [comando]

Comandos disponíveis:
  update    Atualiza o arquivo index.html com as notícias (padrão)
  watch     Monitora mudanças e atualiza automaticamente
  init      Inicializa com arquivos de exemplo
  
Exemplos:
  node update-news.js
  node update-news.js watch
  node update-news.js init
                `);
        }
    } catch (error) {
        console.error('❌ Erro durante execução:', error);
        process.exit(1);
    }
}

// Função para criar notícias de exemplo
async function createExampleNews() {
    const newsExamples = [
        {
            filename: 'ntc1.html',
            title: 'Nova Coleção de Pelúcias Chegou!',
            description: 'Confira nossa mais nova coleção de pelúcias com designs exclusivos e materiais de alta qualidade.',
            content: 'Estamos muito animados em apresentar nossa mais nova coleção de pelúcias, com designs únicos e materiais de primeira qualidade. Cada peça foi cuidadosamente desenvolvida para proporcionar máximo conforto e durabilidade.'
        },
        {
            filename: 'ntc2.html',
            title: 'Promoção Especial do Mês',
            description: 'Aproveite descontos de até 30% em pelúcias selecionadas durante todo o mês.',
            content: 'Durante todo este mês, você pode aproveitar descontos especiais em nossa seleção de pelúcias premium. Uma oportunidade única de presentear alguém especial ou renovar sua coleção pessoal.'
        },
        {
            filename: 'ntc3.html',
            title: 'Lançamento: Linha Eco-Friendly',
            description: 'Apresentamos nossa nova linha de pelúcias sustentáveis, feitas com materiais reciclados.',
            content: 'Com o compromisso de cuidar do meio ambiente, lançamos nossa linha eco-friendly de pelúcias. Produzidas com materiais 100% reciclados, mantendo a mesma qualidade e fofura que você já conhece.'
        }
    ];

    for (const news of newsExamples) {
        const htmlContent = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${news.title}</title>
    <meta name="description" content="${news.description}">
    <meta name="date" content="${new Date().toISOString()}">
    <meta property="og:title" content="${news.title}">
    <meta property="og:description" content="${news.description}">
    <meta property="og:image" content="${news.filename.replace('.html', '.jpg')}">
</head>
<body>
    <article>
        <h1>${news.title}</h1>
        <div class="news-date">${new Date().toLocaleDateString('pt-BR', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        })}</div>
        <img src="${news.filename.replace('.html', '.jpg')}" alt="${news.title}" class="featured-image">
        <p class="description">${news.description}</p>
        <p>${news.content}</p>
        <p>Para mais informações, entre em contato conosco através de nossos canais oficiais ou visite nossa loja física.</p>
    </article>
</body>
</html>`;

        await fs.writeFile(`./source/${news.filename}`, htmlContent, 'utf8');
        console.log(`✅ Criado: ${news.filename}`);
    }
}

// Exporta a classe para uso em outros módulos
module.exports = NewsUpdater;

// Executa se chamado diretamente
if (require.main === module) {
    main();
}