# Begeleiderskaart · compact draaiboek

## Opening · maximaal vijf minuten

“Dit is een bestaande BI-basis voor een fictieve gemeente. Vandaag voegen we AI-output toe als data. Jullie maken de verbinding, het model en de visual. De cijfers blijven uit BI komen; de AI helpt met duiding, verdieping of suggesties.”

Toon woningbouw augustus: 91 tegenover circa 107. Open het voorbeeld en laat dezelfde selectie plus AI-inzicht zien. Wissel naar juni. Leg in één zin uit: vooraf gegenereerde contexten, geen live-aanroep per klik. Toon de JSON-bron heel kort zodat men sleutels, peilmaand en herkomst herkent. Open daarna de startversie.

## Tijdens het bouwen

| Checkpunt | Interventie |
|---|---|
| Na 12 minuten nog geen tabel | Geef de plakbare query. Laat het groepje zelf typen/relaties controleren. |
| Na 20 minuten tekst verandert niet | Controleer de twee relaties, richting Single, datumtype Date en filters uit gedeelde dimensies. |
| Dezelfde tekst bij elke wijk | De analyse heeft gemeentelijke scope. Gebruik de wijkgrafiek als bewijs; doe niet alsof de tekst op wijkniveau gegenereerd is. |
| Gebrek aan tijd | Gewone Table met tekstterugloop is voldoende. Geen opmaakwedstrijd. |
| Hosting/netwerk valt uit | Lokale `ai-*.json` via dezelfde DataFolder. Dit is dezelfde echte AI-output. |
| Groep blijft technisch vastlopen | Open de voorbeeldoplossing; laat hen de relatiekeuze en inhoud controleren en één visual wijzigen. |

## Inhoudelijke controle · bekend uit de echte responses

Gemini gaf geldige JSON en de gemeentelijke hoofdclaims sluiten voor de negen contexten aan op de berekende waarde/doel/VJ. Dat bewijst niet dat alle tekst inhoudelijk correct is. Houd de conceptstatus zichtbaar.

- WON augustus: 91 versus doel 106,67, vorig jaar 105. Zuidrand 13 versus doel 20 en vorig jaar 22. Dit is de sterkste openingscontext.
- WON juni: Donderdam West 2 versus vorig jaar 4; “gehalveerd” klopt, maar de kleine absolute omvang verdient nuance.
- WON juli: “grootste negatieve afwijking” bij Donderdam West is onduidelijk. Relatief versus absoluut maakt uit; Zuidrand heeft een groter absoluut gat. Goed toetsvoorbeeld.
- CO2 juli/augustus: de verdieping zegt “als enige” over Binnenstede, terwijl ook De Havenmeent boven doel en vorig jaar ligt. **Deze claim is onjuist en moet worden afgewezen.** Bewaar hem als herkenbaar reviewvoorbeeld; presenteer hem niet als geverifieerd inzicht.
- Meerdere hypotheses noemen een gesloten werkgever of een bouwproject. Daarvoor zit geen bewijs in de dataset. Het hypotheselabel is essentieel, maar inhoudelijk onderzoek blijft nodig.
- Het ontbreken van cijfers in AI-tekst voorkomt verzonnen getallen, niet verzonnen vergelijkingen, oorzaken of onterecht sterke woorden.

Verander onjuiste modeltekst niet stilzwijgend en blijf die daarna “ruwe AI-output” noemen. De oorspronkelijke API-responses zijn lokaal bewaard. Voor een klant is een review-/publicatiestap nodig; die bouwen we niet in deze workshop.

## Afsluiting · vier minuten

Vraag per groep: welk bestaand dashboard zou hierdoor bruikbaarder worden, welke extra sleutel/context is daarvoor nodig en wat is de kleinste test die je deze week kunt doen? Geen verplichte keuze voor live generatie, cloudplatform of volledige actieketen.
