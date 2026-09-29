# Donderdam · werkafspraken voor voortzetting

Lees eerst README.md, docs/OVERDRACHT.md en docs/02-groepsopdrachten.md. De huidige workshopopdracht gaat boven oudere Claude-gesprekken en oude bron-CLAUDE.md.

- Doel: circa 45 minuten, 2–3 gemengde groepjes, zelf echte AI-output ontsluiten, modelleren en combineren met BI.
- Houd de bestaande fictieve dataset en kernmeasures. Originalen buiten deze repository niet wijzigen. Werk alleen in herkenbare kopieën.
- Gewone Power BI Desktop-visuals. Geen SVG/customvisuals, Power Apps, Fabric-infrastructuur, chat of actieketen toevoegen.
- Negen echte opgeslagen Gemini-contexten voor WON/WLH/CO2 × juni–augustus 2026; geen simulatie als vervanging. Gemeentelijke scope expliciet houden.
- Kosten: gratis Gemini-project door gebruiker bevestigd. Geen billing activeren, betaalde fallback of onbegrensde retries. Geen API-key in Git, browser, Power Query of Power BI.
- Node-app serveert alleen data; iedere GET is zonder LLM-aanroep. Contextgevoelige selectie verplicht niet tot live generatie.
- Measures in _Meetwaarden; actieve relaties één richting van dimensie naar feit/AI. Geen relatie Focus_Wijk_ID → Dim_Wijk als scopefilter.
- Houd teksten kort. Geef exacte bestandslocaties, bediening en verwacht resultaat. Uitgebreide naslag in docs, niet in elk chatantwoord.
- Test echte Desktop-lading en visuals; een regexvalidator is geen bewijs. Maak zichtbaar wat getest, ongetest en inhoudelijk twijfelachtig is.
- Lees de bekende AI-inhoudsfouten in de begeleiderskaart. Label output niet automatisch goedgekeurd.
- Bewaak resterende voorbereidingstijd; het oorspronkelijke budget van 150 minuten is geen nieuw budget bij hervatten.
