# Reviere Studio — sito web

Sito statico in HTML, CSS e JavaScript puro. **Nessun build step, nessuna dipendenza:**
si carica così com'è su qualsiasi hosting (Netlify, Vercel, GitHub Pages, Aruba, cPanel…).

```
site/
├── index.html         Home: hero con carosello, i due spazi, tutte le foto della struttura
├── galleria.html      Galleria completa (44 foto) con filtri e lightbox
├── contatti.html      Modulo, WhatsApp, email, indirizzo
├── robots.txt / sitemap.xml
└── assets/
    ├── brand/         Logo e favicon
    ├── css/style.css  Design system completo (token, componenti, responsive)
    ├── js/main.js     Navigazione, carosello, galleria, validazione modulo
    └── img/
        ├── hero/      3 immagini del carosello (2400px)
        ├── studio/    14 foto della struttura (1800px)
        ├── gallery/   44 foto a piena risoluzione per il lightbox (1700px)
        └── gallery-thumb/ Le stesse 44 in miniatura (800px)
```

## ⚠️ Da compilare prima di pubblicare

Questi valori sono **segnaposto**. Cerca e sostituisci in tutti e tre i file `.html`:

| Cosa | Valore attuale (finto) |
|------|------------------------|
| Email | `info@revierestudio.it` |
| Instagram | `https://www.instagram.com/reviere.studio/` |
| Dominio | `https://www.revierestudio.it` (anche in `robots.txt` e `sitemap.xml`) |
| Partita IVA | `00000000000` (nel footer) |
| Orari di risposta | `Tutti i giorni, 9:00 – 21:00` |

Telefono, WhatsApp e indirizzo sono invece quelli reali:
**+39 331 962 3778** — **Via Montevergine 159, 70018 Rutigliano (BA)**.

## Mappa

Nella pagina contatti c'è una sezione **Come arrivare** con l'indirizzo, i pulsanti
*Indicazioni* (Google Maps) e *Apple Maps*, e una mappa incorporata.

La mappa si carica **solo dopo un clic** su "Mostra la mappa": in questo modo Google
non installa cookie di terze parti su chi apre la pagina senza chiedere la mappa,
il che evita di dover gestire un banner di consenso solo per quello. Fino al clic si
vede una foto della struttura con l'avviso.

Se vuoi caricarla subito all'apertura (ricordandoti però del consenso cookie),
in `contatti.html` sostituisci il blocco `<div class="map" …>` con l'iframe diretto,
oppure in `assets/js/main.js`, dentro `initMap()`, chiama `button.click()` all'avvio.

Le coordinate usate nei dati strutturati sono `41.0032095, 16.9998911`. Se il civico
159 cade leggermente fuori posto, correggile lì e nel link `MAPS_QUERY`.

## Modulo di contatto

Il sito è statico, quindi il modulo non ha un server proprio.

**Come funziona ora (senza configurazione):** il modulo valida i campi e poi apre
il programma di posta dell'utente con la richiesta già compilata. Funziona ovunque,
ma dipende dal client email di chi visita il sito.

**Come riceverlo via server (consigliato):** apri `contatti.html`, trova
`data-endpoint=""` e incolla l'URL di un servizio per form statici — per esempio
[Formspree](https://formspree.io), [Basin](https://usebasin.com) o Netlify Forms:

```html
<form class="form" data-contact-form novalidate
      data-endpoint="https://formspree.io/f/xxxxxxxx"
      data-mailto="info@revierestudio.it">
```

Da quel momento l'invio avviene in background e l'utente vede il messaggio di conferma
sulla pagina, senza aprire il client di posta. Il fallback email resta attivo se
l'endpoint è vuoto o se la chiamata fallisce.

## Anteprima in locale

```bash
python3 -m http.server 4321 --directory site
```

Poi apri <http://localhost:4321>.

## Note tecniche

- **Immagini**: ottimizzate in JPEG dai file originali in `Media/` (che restano intatti).
  Gli originali pesavano fino a 23 MB l'uno; qui il totale è ~24 MB con lazy loading.
  Se aggiungi foto, ridimensionale prima di caricarle.
- **Carosello**: si ferma al passaggio del mouse, quando riceve il focus da tastiera,
  quando la scheda è in secondo piano e quando il sistema chiede `prefers-reduced-motion`.
  Ha comandi avanti/indietro/pausa e supporta le frecce della tastiera e lo swipe.
- **Accessibilità**: contrasto verificato, focus visibile, tutte le immagini con testo
  alternativo, riepilogo errori del modulo collegato ai campi, lightbox con trappola
  di focus e chiusura con `Esc`.
- **Tipografia**: due famiglie, tre ruoli.
  **Archivo** variabile con asse di larghezza (`wdth 62–125`): i titoli girano a
  `font-stretch: 125%`, maiuscoli, interlinea 0.88–0.94 — è il grottesco esteso
  che dà il tono alla pagina; il corpo resta a larghezza normale.
  **Cormorant Garamond corsivo** fa gli occhielli di sezione e la parola in
  corsivo dentro i titoli.
  Quella parola è la firma del sito: riprende la costruzione del marchio
  (blocco maiuscolo + "studio" manoscritto) e la porta a scala di pagina —
  `PIÙ DI UNA *sala* PER EVENTI`, `OGNI ANGOLO, PER *intero*.`
  Si usa una volta per titolo, mai due: è la classe `.script`.
- **Geometria**: nessun raggio, `--radius: 0`. Bottoni, campi, chip e riquadri
  sono rettangoli netti. Le sezioni condividono una testata
  (`.section-head`): occhiello corsivo + titolo esteso a sinistra, testo o
  collegamento allineati a destra sulla stessa linea di base, filetto sotto.
- **Colori**: variabili CSS in cima a `style.css`. Nero `#0B0B0C`, avorio `#F2EDE6`,
  sabbia `#C8BCAA` (la pietra dei muri) e il **rosso del marchio a pennello**,
  campionato dal logo secondario: mediana `#670001`, corpo `#500000`–`#800000`,
  luci fino a `#9F1A1C`. Da lì la scala del sito:
  `--red #7A0509` (riempimenti: bottoni, selezione), `--red-hover #9A0F14`,
  `--red-line #C0292F` (bordi, sottolineature, anello di focus).
  È un oxblood da riempimento: i segni sottili in quel rosso su fondo nero
  sarebbero illeggibili, quindi gli accenti minuti (icone, etichette "Sala 01")
  usano `--sand`. Gli errori del modulo hanno un rosso funzionale separato dal
  brand, `--danger #E5484D`. Contrasti verificati: testo sul bottone 9,7:1,
  bordo bottone 3,4:1, accenti sabbia 10,5:1, errori 4,7:1.

## Aggiungere foto alla galleria

1. Ottimizza l'immagine in due misure: lato lungo 1700px in `assets/img/gallery/`
   e 800px con lo stesso nome in `assets/img/gallery-thumb/`.
2. In `galleria.html` duplica un blocco `<button class="masonry__item" …>`, aggiornando
   `data-full`, `src`, `alt`, `width`, `height` e `data-cat`
   (`serate`, `ospiti` o `spazi`).
