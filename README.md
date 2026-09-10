# Reviere Studio — sito web

Sito statico in HTML, CSS e JavaScript puro. **Nessun build step, nessuna dipendenza:**
si carica così com'è su qualsiasi hosting (Netlify, Vercel, GitHub Pages, Aruba, cPanel…).

```
site/
├── index.html         Home: hero a tutta pagina, i due spazi, tutte le foto della struttura
├── galleria.html      Galleria completa (44 foto) con filtri e lightbox
├── contatti.html      Modulo, WhatsApp, email, indirizzo
├── robots.txt / sitemap.xml
└── assets/
    ├── brand/         Logo e favicon
    ├── css/style.css  Design system completo (token, componenti, responsive)
    ├── js/main.js     Navigazione, galleria, validazione modulo, mappa
    └── img/
        ├── hero/      Foto dell'hero: orizzontale 2400px + ritaglio verticale per telefoni
        ├── studio/    14 foto della struttura (1800px)
        ├── gallery/   44 foto a piena risoluzione per il lightbox (1700px)
        └── gallery-thumb/ Le stesse 44 in miniatura (800px)
```

## ⚠️ Da compilare prima di pubblicare

Questi valori sono **segnaposto**. Cerca e sostituisci in tutti e tre i file `.html`:

| Cosa | Valore attuale (finto) |
|------|------------------------|
| Instagram | `https://www.instagram.com/reviere.studio/` |
| Dominio | `https://revierestudio.com` (anche in `robots.txt` e `sitemap.xml`) |
| Partita IVA | `00000000000` (nel footer) |
| Orari di risposta | `Tutti i giorni, 9:00 – 21:00` |

Telefono, WhatsApp e indirizzo sono invece quelli reali:
**+39 331 962 3778** — **Via Montevergine 161, 70018 Rutigliano (BA)**.

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

I collegamenti a Google Maps sono **due, con compiti diversi**:

| Dove | URL | Cosa fa |
|---|---|---|
| Pulsante *Indicazioni* | `https://www.google.com/maps/dir/?api=1&destination=Revi%C3%A8re+Studio,+Via+Montevergine+161,+70018+Rutigliano+BA` | avvia il percorso dalla posizione di chi clicca |
| Riga *Dove siamo*, `hasMap` | `https://maps.google.com/?cid=9562823861597996504` | apre la scheda dell'attività |

**Non usare il link lungo che Maps copia dalla barra degli indirizzi**
(`/maps/place/.../data=!3m1!4b1!4m6...`). Contiene un blocco `data=` che Google
interpreta solo dentro una sessione attiva: aperto a freddo lo ignora e mostra
la mappa centrata sulle coordinate dopo la `@`, che sono il **centro
dell'inquadratura**, non il locale — nel nostro caso 215 m più a ovest.
Ha anche i parametri `entry` e `g_ep`, token di sessione che scadono.

Il `cid` è l'identificativo stabile dell'attività: è la conversione in decimale
di `0x84b5f9a2d82d85d8`, la seconda metà del campo `!1s` di quel link lungo.

Le coordinate reali dell'attività sono **41.0021787, 16.9991612** (prese da `!3d`/`!4d`
dello stesso link) e stanno nei dati strutturati di tutte e tre le pagine. Le
precedenti, ricavate geocodificando la via, erano **130 metri fuori posto**.

Se un giorno la scheda Google cambia indirizzo o nome, vanno aggiornati: il link
della scheda in tutte e tre le pagine, `ll=` di Apple Maps e `q=`/`ll=` della mappa
incorporata in `contatti.html`.

## Modulo di contatto

Il sito è statico, quindi il modulo non ha un server proprio. Le richieste
arrivano **su WhatsApp**.

**Come funziona.** Il modulo valida i campi, poi apre WhatsApp con la richiesta
già scritta nella chat di `+39 331 962 3778`. È il visitatore a premere invio dal
proprio account: da lì la conversazione continua normalmente in chat.
Sotto il pulsante c'è il numero da chiamare per chi non usa WhatsApp.

Il messaggio che parte è formattato per essere leggibile in chat, con la data
convertita in formato italiano e i campi vuoti omessi:

```
Ciao Reviere Studio, vorrei informazioni per un evento.

Nome: Mario Rossi
Tipo di evento: Laurea
Data: 12/06/2026
Ospiti: circa 60
Email: mario.rossi@example.it
Telefono: +39 340 1112223

Vorrei festeggiare la laurea di mia figlia, siamo circa 60.
```

**Il limite da conoscere:** il messaggio non parte da solo, si apre la chat già
compilata e l'utente deve premere invio. Se chiude prima, la richiesta si perde.
Su telefono è un attrito minimo (WhatsApp è già aperto e loggato); da computer
serve WhatsApp Web attivo, altrimenti resta il collegamento email.

**Numero di destinazione:** attributo `data-whatsapp` sul `<form>` in
`contatti.html`, in formato internazionale senza `+` e senza spazi
(`393319623778`).

**Se un giorno vuoi riceverle su un server** (per avere uno storico e non
dipendere dall'invio manuale), incolla l'URL di un servizio per form statici —
[Formspree](https://formspree.io), [Basin](https://usebasin.com), Netlify Forms —
in `data-endpoint`:

```html
<form class="form" data-contact-form novalidate
      data-endpoint="https://formspree.io/f/xxxxxxxx"
      data-whatsapp="393319623778">
```

Da quel momento l'invio avviene in background con conferma sulla pagina, e
WhatsApp non viene più aperto dal pulsante.

## Quando modifichi CSS o JavaScript

`style.css` e `main.js` sono richiamati con un numero di versione
(`?v=2`) nelle tre pagine. **Alzalo di uno** dopo ogni modifica a quei due file,
altrimenti chi ha già visitato il sito continua a vedere la versione in cache:

```bash
cd site && sed -i '' 's/?v=2/?v=3/g' *.html
```

## Anteprima in locale

```bash
python3 -m http.server 4321 --directory site
```

Poi apri <http://localhost:4321>.

## Note tecniche

- **Immagini**: ottimizzate in JPEG dai file originali in `Media/` (che restano intatti).
  Gli originali pesavano fino a 23 MB l'uno; qui il totale è ~24 MB con lazy loading.
  Se aggiungi foto, ridimensionale prima di caricarle.
- **Titolo dell'hero — marquee**: la frase *Sanctuary of sound, light, private
  vibes* scorre da bordo a bordo, sul modello di `times-event.de`. La pista
  (`.marquee__track`) contiene **due sequenze identiche** e scorre di `-50%`:
  arrivata in fondo riparte esattamente dov'era, quindi il ciclo non ha stacchi.
  È tutto CSS, nessun JavaScript.
  **Se cambi la frase, modificala in tutte e sei le ripetizioni** (tre per
  sequenza) e anche nell'`aria-label` dell'`<h1>`: le ripetizioni sono
  `aria-hidden`, il testo che leggono gli screen reader è solo quello.
  Il movimento si ferma al passaggio del mouse e sul focus da tastiera; con
  `prefers-reduced-motion` l'animazione sparisce e resta una sola frase
  centrata su tre righe.
- **Hero**: una sola immagine fissa, `foto-drone-1.jpg`. La foto è più larga del
  riquadro, quindi il ritaglio avviene ai lati: su desktop resta visibile l'89% della
  larghezza, su un telefono scenderebbe al **26%** e la struttura non si
  riconoscerebbe. Per questo `index.html` usa un `<picture>` che sotto i 768px
  serve `foto-drone-1-mobile.jpg`, un ritaglio verticale centrato sull'edificio.
  Se cambi la foto dell'hero, rigenera entrambe le versioni.
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


## SEO

- **Dominio canonico: `https://revierestudio.com`** (senza `www`). Canonical, `og:url`,
  sitemap, robots e dati strutturati usano tutti questo indirizzo: il `www` deve
  reindirizzare qui, mai il contrario.
- **Ogni pagina** ha title e description propri, `robots` con `max-image-preview:large`,
  Open Graph e Twitter con un'immagine dedicata 1200×630 (`assets/img/og-reviere-studio.jpg`).
- **Dati strutturati** (JSON-LD `@graph`, uguali nella parte "attività" su tutte le pagine):
  `LocalBusiness` + `EventVenue` con indirizzo, telefono, coordinate e scheda Google;
  `WebSite`; la pagina (`WebPage`, `ImageGallery`, `ContactPage`); breadcrumb sulle
  pagine interne. `alternateName: "Revière Studio"` lega il sito alla scheda Google,
  che usa quella grafia.
- **H1 della home** è testuale e nascosto (`.visually-hidden`): il marquee è decorativo,
  `aria-hidden` e `data-nosnippet`, così la frase ripetuta non finisce negli snippet.
- `sitemap.xml` elenca pagine e immagini; `vercel.json` imposta la cache degli asset e il
  redirect `/index.html` → `/`; `404.html` è la pagina di errore (non indicizzata).
- **Se cambi indirizzo, telefono o orari**, aggiornali in tre posti insieme: JSON-LD delle
  tre pagine, piè di pagina, scheda Google. Devono coincidere alla lettera.
- **Se aggiungi pagine o foto**, aggiungile a `sitemap.xml` e aggiorna `<lastmod>`.
