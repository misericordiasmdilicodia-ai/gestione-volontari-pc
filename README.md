# Gestione Volontari - Protezione Civile

App per la gestione di volontari e mezzi durante le emergenze di Protezione Civile,
Fraternita di Misericordia di Santa Maria di Licodia.

## Cosa contiene questo pacchetto

- `src/App.jsx` — l'applicazione (identica a quella vista in chat)
- `src/storage-shim.js` — livello di salvataggio dati: usa Cloudflare KV per i dati
  condivisi tra dispositivi (volontari, mezzi, associazioni, impostazioni) e
  `localStorage` del browser per i dati locali al singolo dispositivo (associazione
  selezionata su quella postazione)
- `functions/api/kv.js` — la funzione server (Cloudflare Pages Function) che legge/scrive su KV
- resto: file di configurazione standard di un progetto Vite + React

## Prerequisiti

- Un account Cloudflare gratuito (https://dash.cloudflare.com/sign-up)
- Node.js installato sul computer da cui fai il deploy (per compilare il progetto)

## Passo 1 — Crea lo spazio di archiviazione condiviso (KV)

1. Vai su https://dash.cloudflare.com → **Workers e Pages** → **KV**
2. Crea un nuovo namespace, chiamalo ad esempio `PC_KV`
3. Copia l'**ID** del namespace appena creato

## Passo 2 — Pubblica il sito

**Opzione A — dalla dashboard Cloudflare (più semplice, nessun comando da terminale)**

1. Carica questa cartella su un repository GitHub (puoi anche solo trascinare i file
   su github.com se non hai mai usato Git)
2. Su Cloudflare: **Workers e Pages** → **Crea applicazione** → **Pages** →
   **Connetti a Git** → seleziona il repository
3. Impostazioni di build:
   - Framework preset: **Vite**
   - Comando di build: `npm run build`
   - Cartella di output: `dist`
4. Prima di premere "Salva e Distribuisci", oppure subito dopo in
   **Impostazioni → Funzioni → Associazioni KV Namespace**: aggiungi
   variabile `PC_KV` → seleziona il namespace creato al Passo 1
5. Distribuisci. Cloudflare ti darà un indirizzo tipo `https://gestione-volontari-pc.pages.dev`

**Opzione B — da terminale (Wrangler CLI), per chi preferisce i comandi**

```bash
npm install
npm install -g wrangler       # se non già installato
wrangler login
```

Apri `wrangler.toml` e sostituisci `INCOLLA_QUI_ID_NAMESPACE` con l'ID copiato al Passo 1.

```bash
npm run build
wrangler pages deploy dist --project-name gestione-volontari-pc
```

Al primo deploy Wrangler chiederà di creare il progetto Pages: rispondi di sì.
Le funzioni in `functions/` vengono pubblicate automaticamente insieme al sito.

## Passo 3 — verifica

Apri l'indirizzo pubblicato, seleziona un'associazione, inserisci un volontario
di prova. Apri la stessa pagina da un altro telefono/computer: dopo qualche
secondo dovresti vedere lo stesso volontario comparire (conferma che il
salvataggio condiviso su KV funziona).

## Cose importanti da sapere prima di usarlo sul campo

- **Password Admin**: è impostata nel codice come `Admin` / `Admin@` (si trova
  cercando `ADMIN_PASS` in `src/App.jsx`). È adatta a un uso interno, ma essendo
  visibile a chiunque legga il codice sorgente pubblicato, ti consiglio di
  cambiarla prima di andare online, e di **non** rendere il repository GitHub pubblico
  se contiene questa password (usa un repository privato).
- **Nessun login per l'area Operatore**: chiunque abbia il link può inserire
  volontari e mezzi. Se ti serve restringere l'accesso anche a quell'area,
  fammelo sapere e aggiungo una protezione.
- **Dominio personalizzato**: se vuoi un indirizzo tipo
  `volontari.misericordiasml.it` invece di quello `.pages.dev`, si collega da
  Cloudflare Pages → Impostazioni → Domini personalizzati (richiede che il
  dominio sia gestito su Cloudflare).
- **Aggiornamenti futuri**: ogni volta che vorrai una nuova funzionalità, ti
  preparerò il file `App.jsx` aggiornato: basterà sostituirlo nel repository
  (o incollarlo) e ripubblicare — con l'opzione Git, Cloudflare ripubblica da
  solo a ogni aggiornamento del repository.

## Sviluppo/test in locale (opzionale)

```bash
npm install
npm run dev
```

Nota: in locale con `npm run dev` il salvataggio condiviso (KV) non è
disponibile a meno di usare `wrangler pages dev` al posto di `vite dev`; per
provare la sola interfaccia va bene comunque `npm run dev`.
