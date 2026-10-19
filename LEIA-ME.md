# Lista de Compras — Lumanoids (padrão oficial)

Envie **todos** os arquivos e pastas deste pacote para a raiz do repositório GitHub Pages, preservando `css/`, `js/`, `icons/` e `fonts/`. Ative HTTPS e Pages.

- Carrinho: adicionar diretamente, editar quantidade/preço, devolver e excluir.
- Lista: planejar compras, selecionar catálogo e transferir produtos ao carrinho.
- Informações: finalidade, privacidade, links Lumanoids e instalação PWA.
- Configurações: importar, mesclar, restaurar, exportar JSON, gerenciar dados e lembrete de backup.
- Armazenamento: IndexedDB com compatibilidade/migração de dados anteriores em localStorage. Não limpe os dados do navegador sem exportar.
- Backups periódicos: **lembretes ao abrir o aplicativo**, não downloads silenciosos em segundo plano.
- Instalação: Android Chrome menu Instalar app; iPhone Safari Compartilhar > Adicionar à Tela de Início. O botão é ocultado no modo instalado.
- Offline: o service worker guarda os recursos locais após o primeiro acesso com internet.
- A instalação depende do navegador, HTTPS e de publicar o site. Abrir index.html diretamente do disco não instala o PWA.
