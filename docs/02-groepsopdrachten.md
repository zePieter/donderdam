# Uitdagingen · 30 minuten stoeien

**Uitgangspunt.** Het klassieke dashboard werkt. Een taalmodel (Gemini) heeft de Donderdam-data bekeken en zijn output staat al als tabellen in het model: gestructureerd, met sleutels en herkomst. Er zijn nog geen relaties, measures of visuals voor. Dat is jullie werk.

**Waar het om draait:** het punt waar drie vragen samenkomen.

| | Vraag |
|---|---|
| **Waarmee** | Wat voor output is dit? Een label, een tekst of een selectie? Op welk niveau (grain) en met welke sleutels? |
| **Hoe** | Waar hangt het aan in het model? Welke measure en welke bestaande visual wordt er rijker van? |
| **Waarom** | Wat wint de gebruiker? En wanneer vertrouw je het niet? |

**Opzet:** gemengde groepjes van 2 à 4, één uitdaging per groep. Open `Donderdam.pbip`, klik **Refresh** en kies bij de vraag om toegang **Anonymous**. Werken jullie vast, pak dan het [spiekbriefje](04-spiekbriefje.md). Het uitgewerkte voorbeeld laat de begeleider aan het eind zien.

---

## A · Signaal: de AI kijkt mee bij de KPI

**Tabel:** `AI_Signaal`, één rij per KPI per maand. Velden: Signaal (Afwijkende trend, Aandacht of Op koers), Kop, Duiding, Zekerheid, Maanden_Op_Rij, Model.

**Gebruikersvraag:** "Ik kijk 30 seconden naar dit dashboard. Waar moet ik op letten?"

**Uitdaging:** laat het AI-signaal zichtbaar worden bíj de KPI-kaarten die er al staan, zodat het bij de gekozen KPI en maand verandert.

- Waar hangt deze tabel aan? En waarom níet aan Dim_Wijk?
- Hoe laat je zien dat dit een oordeel van een model is en geen gemeten cijfer?
- Kies Werkloosheid in augustus. Klopt de duiding met de cijfers?

## B · Wijkduiding: de AI wijst een wijk aan

**Tabel:** `AI_Wijkduiding`, alleen de opvallende combinaties van wijk × KPI × maand. Velden: Observatie, Hypothese, Bewijs (projecten, leeftijdsgroepen, branches), Te_Toetsen.

**Gebruikersvraag:** "Welke wijk verdient aandacht, en waarom zou dat zo zijn?"

**Uitdaging:** koppel de duiding aan de wijkgrafiek, zodat een klik op een wijk laat zien wat de AI erover zegt.

- Waarom heeft niet elke wijk een rij? Wat betekent een lege plek voor de gebruiker?
- Toets één hypothese aan de pagina **Onderbouwing**. Welke houdt stand en welke klinkt alleen overtuigend?
- Welke data zou de AI nodig hebben om de zwakke hypothese te onderbouwen?

## C · Aanbeveling: de AI stuurt de aandacht

**Tabellen:** `AI_Aanbeveling` (drie per maand) en `AI_Aanbeveling_Wijk` (per aanbeveling de wijken waar het om gaat).

**Gebruikersvraag:** "Wat is een zinnige volgende stap, en waar?"

**Uitdaging:** toon de aanbevelingen zo, dat de gekozen aanbeveling de bijbehorende wijken zichtbaar maakt in de bestaande wijkgrafiek.

- Dit is een veel-op-veel-situatie. Hoe loop het filter van aanbeveling naar wijk? En wat gebeurt er met de rest van het dashboard als je dat met tweerichtingsfiltering oplost?
- Filteren of markeren: wat helpt de gebruiker meer?
- Zou je deze aanbeveling zo aan een wethouder voorleggen? Wat ontbreekt er?

---

## Delen · 3 minuten per groep

Laat één werkende interactie zien en vul jullie rij in de gezamenlijke tabel:

| Groep | Waarmee (vorm, grain, sleutels) | Hoe (relaties, measure, visual) | Waarom (winst voor de gebruiker) | Waar moet je de AI begrenzen? |
|---|---|---|---|---|

Noem daarna één **do** en één **don't** voor AI-output in een BI-oplossing.
