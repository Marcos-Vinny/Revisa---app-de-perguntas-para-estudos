# 🐾 Revisa

**App de flashcards para estudar com perguntas e respostas.** Você cria suas próprias perguntas, o app mostra uma de cada vez, você tenta lembrar a resposta e vira o cartão para conferir. Serve para revisar matéria de prova, vocabulário de idiomas, fórmulas, datas, conceitos, o que você quiser decorar.

Funciona no navegador (online) ou instalado no celular como um app de verdade (Android), inclusive **sem internet**.

---

## O que o app faz

- **Mostra uma pergunta por vez.** Toque no cartão para virar e ver a resposta.
- **Avaliação rápida:** depois de ver a resposta, marque se você **Acertou**, **Errou** ou deixou **Incompleta**.
- **Resumo no final:** ao terminar, o app mostra quantas você acertou e lista as que precisam de mais revisão.
- **Embaralhar:** mistura a ordem dos cartões para você não decorar só pela sequência.
- **Conjuntos:** organize as perguntas por assunto (Biologia, Inglês, História...). Crie, renomeie, escolha e apague conjuntos.
- **Editar perguntas:** adicione, altere e apague cartões quando quiser.
- **Funciona offline** depois da primeira vez que for aberto.
- **Seus dados ficam só no seu aparelho.** Nada é enviado para a internet.

---

## Como usar

1. Toque em **✏️ Editar perguntas**.
2. Toque em **+ Nova pergunta**, escreva a pergunta e a resposta e salve.
3. Se quiser separar por assunto, use **Novo conjunto** e **Escolher conjunto**.
4. Toque em **✔ Concluir** para voltar a estudar.
5. Toque no cartão para ver a resposta e marque **Acertou**, **Errou** ou **Incompleta**.
6. Use **🔀 Embaralhar** para misturar tudo e recomeçar.

---

## Usar online (no navegador)

Abra o endereço do app em qualquer navegador, no celular ou no computador:

**👉 SEU-LINK-AQUI**

Não precisa instalar nada. Seus cartões ficam salvos no navegador daquele aparelho.

> **Dica:** se você usa o app no navegador, não limpe os dados do site, senão os cartões são apagados.

### Colocar na tela inicial (sem baixar APK)

- **Android (Chrome):** menu ⋮ → *Instalar app* ou *Adicionar à tela inicial*.
- **iPhone (Safari):** botão de compartilhar → *Adicionar à Tela de Início*.

---

## Baixar e instalar no celular (Android)

O instalador (`.apk`) é gerado automaticamente pelo GitHub.

1. Abra a aba **Actions** deste repositório.
2. Clique na execução mais recente do workflow **Gerar APK** (a que tiver o ✅ verde).
3. No final da página, em **Artifacts**, clique em **flashcards-apk** para baixar.
4. Extraia o zip. Dentro tem o arquivo **`app-debug.apk`**.
5. Passe o arquivo para o celular (WhatsApp, Drive ou cabo) e toque nele para instalar.
6. Se o Android pedir, permita **instalar apps de fontes desconhecidas**.

Depois de instalado, o app aparece na lista de aplicativos com ícone próprio, abre em tela cheia e funciona sem internet.

> **iPhone:** o APK é só para Android. No iPhone, use a opção *Adicionar à Tela de Início* pelo Safari.

---

## Para quem quer mexer no código

Não precisa instalar nada para editar o app: é só abrir os arquivos em um editor de texto (como o VSCode).

| Arquivo | Para que serve |
|---|---|
| `index.html` | Estrutura das telas |
| `style.css` | Visual do app |
| `app.js` | Funcionamento (cartões, conjuntos, embaralhar, avaliação) |
| `manifest.json` | Diz ao celular o nome, as cores e os ícones do app |
| `sw.js` | Guarda uma cópia dos arquivos para o app abrir sem internet |
| `icon-192.png`, `icon-512.png` | Ícones do app |
| `capacitor.config.json`, `package.json`, `scripts/` | Configuração para transformar o app em APK |
| `.github/workflows/build-apk.yml` | Receita que o GitHub usa para gerar o APK sozinho |

Cada vez que você enviar mudanças para o GitHub (`git push`), um novo APK é gerado automaticamente na aba **Actions**.

### Como funciona por dentro

- **Onde ficam os cartões:** no armazenamento do próprio aparelho (`localStorage`).
- **Embaralhar:** a ordem dos cartões é uma lista separada; o botão só mistura essa lista, sem alterar os cartões.
- **Virar o cartão:** cada cartão tem frente e verso, e o giro é feito com CSS.
- **Funcionar offline:** o `sw.js` salva os arquivos no aparelho. Com internet, o app busca a versão mais nova; sem internet, usa a cópia salva.
- **Virar app nativo:** o [Capacitor](https://capacitorjs.com) empacota os arquivos web dentro de um app Android.

---

## Autor

Desenvolvido por **Marcos Vinícius** · [GitHub](https://github.com/Marcos-Vinny/Revisa---app-de-perguntas-para-estudos)