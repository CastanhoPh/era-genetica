# Era Genética - Aplicação de Gerenciamento de Personagem

## Sobre o Projeto

Era Genética é uma aplicação web desenvolvida para gerenciar fichas de personagem, ideal para jogos de RPG de mesa. A plataforma permite que jogadores visualizem e atualizem suas estatísticas em tempo real, enquanto administradores podem monitorar todos os personagens através de um dashboard centralizado.

## ✨ Funcionalidades Principais

-   **Login de Usuário:** Sistema de autenticação para garantir que cada usuário acesse apenas sua ficha de personagem.
-   **Ficha de Personagem Detalhada:** Exibição clara de atributos vitais como Vida (HP) e Chakra, foto do personagem, e outras estatísticas.
-   **Atualizações em Tempo Real:** Modifique a vida e o chakra instantaneamente com botões de `+` e `-`. As alterações são salvas automaticamente no banco de dados.
-   **Gerenciamento de Jutsus/Ataques:**
    -   Crie novos ataques ou habilidades com custo de chakra e dano associados.
    -   Edite ou exclua jutsus existentes.
    -   O sistema impede o uso de um jutsu se o chakra for insuficiente.
-   **Dashboard de Administrador:** Uma visão geral de todos os personagens do jogo, atualizada em tempo real, permitindo que mestres ou administradores acompanhem o estado de cada jogador.
-   **Persistência de Dados:** Todas as informações são salvas de forma segura e persistente no Firestore.

## 🚀 Tecnologias Utilizadas

-   **Frontend:**
    -   [**React**](https://react.dev/)
    -   [**TypeScript**](https://www.typescriptlang.org/)
    -   [**Vite**](https://vitejs.dev/) - Build tool para desenvolvimento rápido.
-   **Backend & Banco de Dados:**
    -   [**Firebase**](https://firebase.google.com/)
        -   **Firestore:** Banco de dados NoSQL para armazenar os dados dos personagens.
        -   **Firebase Authentication:** Para o sistema de login.
        -   **Firebase Hosting:** Para hospedar a aplicação com CDN global e SSL automático.
-   **Estilização:**
    -   [**Tailwind CSS**](https://tailwindcss.com/) - Framework CSS utility-first.
    -   [**Lucide React**](https://lucide.dev/) - Biblioteca de ícones.

## ⚙️ Estrutura do Projeto

```
/
├── public/
├── src/
│   ├── components/
│   │   ├── AdminDashboard.tsx  # Dashboard para admin
│   │   └── CharacterSheet.tsx  # Componente principal da ficha de personagem
│   ├── App.tsx                 # Roteamento principal da aplicação
│   ├── LoginPage.tsx           # Página de login
│   ├── firebase.ts             # Configuração e inicialização do Firebase
│   └── main.tsx                # Ponto de entrada da aplicação React
├── firebase.json               # Configurações de deploy do Firebase (Hosting, Firestore)
├── firestore.rules             # Regras de segurança do banco de dados
└── package.json                # Dependências e scripts do projeto
```

## 🏁 Como Executar o Projeto Localmente

1.  **Clone o repositório:**
    ```bash
    git clone https://github.com/CastanhoPh/era-genetica.git
    cd era-genetica
    ```

2.  **Instale as dependências:**
    ```bash
    npm install
    ```

3.  **Configure o Firebase:**
    -   Crie um projeto no [console do Firebase](https://console.firebase.google.com/).
    -   Vá para as configurações do seu projeto e encontre suas credenciais de configuração web.
    -   Copie essas credenciais para o arquivo `src/firebase.ts`, substituindo os valores de exemplo.

4.  **Inicie o servidor de desenvolvimento:**
    ```bash
    npm run dev
    ```
    A aplicação estará disponível em `http://localhost:5173` (ou uma porta similar).

## 🌐 Deploy

A aplicação está configurada para deploy simplificado através do Firebase Hosting.

Para fazer o deploy da sua versão, certifique-se de ter o Firebase CLI instalado e autenticado:

```bash
# Comando para fazer o build e o deploy
firebase deploy
```

O comando `firebase deploy` automaticamente executa o script `predeploy` (`npm run build`), que gera a pasta `dist` otimizada para produção, e em seguida sobe o conteúdo para o Hosting. A configuração em `firebase.json` garante que a navegação da SPA funcione corretamente através de reescritas de URL.
