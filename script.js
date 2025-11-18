document.addEventListener('DOMContentLoaded', () => {
    // Referências aos elementos do DOM
    const itemInput = document.getElementById('item-input');
    const addButton = document.getElementById('add-btn');
    const shoppingListBody = document.getElementById('shopping-list');
    const clearButton = document.getElementById('clear-btn');
    const shareButton = document.getElementById('share-btn');
    const messageDiv = document.getElementById('message');

    // Variável para armazenar a lista de compras (Array de Objetos)
    let shoppingList = [];

    // Função para renderizar a lista na tabela (exibe o estado atual da lista)
    function renderList() {
        // Limpa a tabela antes de redesenhar
        shoppingListBody.innerHTML = ''; 

        if (shoppingList.length === 0) {
            shoppingListBody.innerHTML = '<tr><td colspan="3" style="text-align: center;">Lista vazia. Adicione seu primeiro item!</td></tr>';
            return;
        }

        shoppingList.forEach((item, index) => {
            // Cria a linha (tr)
            const newRow = shoppingListBody.insertRow();
            
            // 1. Célula do Checkbox
            const checkboxCell = newRow.insertCell(0);
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = item.completed;
            checkbox.addEventListener('change', () => {
                // Alterna o status e salva
                item.completed = checkbox.checked;
                saveAndRender();
            });
            checkboxCell.appendChild(checkbox);

            // 2. Célula do Nome do Item (onde a taxação é aplicada)
            const itemNameCell = newRow.insertCell(1);
            itemNameCell.textContent = item.name;
            if (item.completed) {
                itemNameCell.classList.add('completed');
            } else {
                itemNameCell.classList.remove('completed');
            }

            // 3. Célula do Botão de Remover
            const actionCell = newRow.insertCell(2);
            const removeButton = document.createElement('button');
            removeButton.textContent = 'Remover';
            removeButton.className = 'remove-btn';
            removeButton.addEventListener('click', () => {
                // Remove o item da lista pelo índice
                shoppingList.splice(index, 1); 
                saveAndRender();
            });
            actionCell.appendChild(removeButton);
        });
    }

    // Função que salva a lista no localStorage e atualiza a interface
    function saveAndRender() {
        localStorage.setItem('shoppingList', JSON.stringify(shoppingList));
        renderList();
    }

    // Função para carregar a lista do localStorage OU da URL (compartilhamento)
    function loadList() {
        const urlList = getListFromUrl();
        
        if (urlList && urlList.length > 0) {
            // Se houver lista na URL, usa ela (prioridade para a lista compartilhada)
            shoppingList = urlList;
            saveAndRender(); // Salva a lista carregada da URL no localStorage
            showMessage("Lista compartilhada carregada com sucesso!");
            
            // Limpa a URL para evitar recarregar a lista compartilhada a cada atualização
            history.pushState(null, '', location.pathname + location.search);
            
        } else {
            // Caso contrário, carrega do localStorage
            const savedList = localStorage.getItem('shoppingList');
            if (savedList) {
                shoppingList = JSON.parse(savedList);
            }
        }
        renderList();
    }

    // --- FUNÇÕES DE AÇÃO ---

    function addItem() {
        const itemName = itemInput.value.trim();
        if (itemName === "") {
            showMessage("Por favor, digite o nome do item.", 'error');
            return;
        }

        // Adiciona um novo objeto à lista
        shoppingList.push({ name: itemName, completed: false });
        
        // Salva e renderiza
        saveAndRender(); 
        
        itemInput.value = '';
        itemInput.focus();
        showMessage(`Item "${itemName}" adicionado!`);
    }

    function clearList() {
        if (shoppingList.length === 0) {
            showMessage("A lista já está vazia.", 'error');
            return;
        }
        if (confirm("Tem certeza que deseja limpar toda a lista de compras?")) {
            shoppingList = []; // Esvazia a lista
            saveAndRender();
            showMessage("Lista limpa com sucesso!", 'warning');
        }
    }

    // --- FUNÇÕES DE COMPARTILHAMENTO ---

    // 1. Converte a lista para uma string compacta para a URL
    function encodeListForUrl(list) {
        // Formato simples: "item1:0|item2:1|item3:0" (item:concluido)
        const data = list.map(item => `${item.name}:${item.completed ? 1 : 0}`).join('|');
        return btoa(encodeURIComponent(data)); // btoa/encodeURIComponent para segurança e caracteres especiais
    }

    // 2. Converte a string da URL de volta para um array de lista
    function decodeListFromUrl(encodedData) {
        try {
            const decodedData = decodeURIComponent(atob(encodedData));
            const items = decodedData.split('|');
            return items.map(itemString => {
                const parts = itemString.split(':');
                return {
                    name: parts[0],
                    completed: parts[1] === '1'
                };
            }).filter(item => item.name); // Filtra itens vazios
        } catch (e) {
            console.error("Erro ao decodificar a lista da URL:", e);
            return null;
        }
    }

    // 3. Obtém a lista da URL ao carregar a página
    function getListFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        const encodedList = urlParams.get('list');
        if (encodedList) {
            return decodeListFromUrl(encodedList);
        }
        return null;
    }

    // 4. Cria e exibe o link de compartilhamento
    function shareList() {
        if (shoppingList.length === 0) {
            showMessage("Adicione itens à lista antes de compartilhar.", 'error');
            return;
        }
        
        const encodedList = encodeListForUrl(shoppingList);
        // Cria a URL de compartilhamento com a lista codificada
        const shareUrl = `${window.location.origin}${window.location.pathname}?list=${encodedList}`;

        // Copia a URL para a área de transferência do navegador
        navigator.clipboard.writeText(shareUrl).then(() => {
            showMessage("Link da lista copiado para a área de transferência! Envie para quem você quiser. 🔗");
        }).catch(err => {
            console.error('Erro ao copiar:', err);
            showMessage("Não foi possível copiar o link automaticamente. Copie-o manualmente: " + shareUrl, 'warning');
        });
    }

    // Função para exibir mensagens temporárias
    function showMessage(msg, type = 'success') {
        messageDiv.textContent = msg;
        messageDiv.className = `message ${type}`;
        setTimeout(() => {
            messageDiv.textContent = '';
            messageDiv.className = 'message';
        }, 5000); // Mensagem desaparece após 5 segundos
    }


    // --- Inicialização ---

    // Carrega a lista ao iniciar
    loadList();

    // Event Listeners
    addButton.addEventListener('click', addItem);
    itemInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            addItem();
        }
    });
    clearButton.addEventListener('click', clearList);
    shareButton.addEventListener('click', shareList);
});