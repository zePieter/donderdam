# Spiekbriefje · alleen als je vastloopt

## Relaties (Model view → Manage relationships → New)

| AI-tabel | Kolom | → Dimensie | Let op |
|---|---|---|---|
| AI_Signaal | Peilmaand | Dim_Datum[Datum] | Peilmaand is de 1e van de maand |
| AI_Signaal | KPI_ID | Dim_KPI[KPI_ID] | |
| AI_Wijkduiding | Peilmaand, KPI_ID, Wijk_ID | Dim_Datum, Dim_KPI, Dim_Wijk | |
| AI_Aanbeveling | Peilmaand, KPI_ID | Dim_Datum, Dim_KPI | |
| AI_Aanbeveling_Wijk | Aanbeveling_ID | AI_Aanbeveling[Aanbeveling_ID] | Brugtabel |
| AI_Aanbeveling_Wijk | Wijk_ID | Dim_Wijk[Wijk_ID] | Eén richting, dan blijft de rest van het dashboard heel |

Steeds **Many to one**, **Single**. Controleer of Desktop zelf geen extra relaties heeft gelegd.

## DAX-patronen (Home → New measure; plaats ze in `_Meetwaarden`)

```dax
AI Signaal Tekst =
IF ( COUNTROWS ( AI_Signaal ) = 1,
    SELECTEDVALUE ( AI_Signaal[Kop] ) & UNICHAR ( 10 ) & SELECTEDVALUE ( AI_Signaal[Duiding] ),
    "Geen AI-signaal voor deze selectie." )

AI Signaal Kleur =
SWITCH ( SELECTEDVALUE ( AI_Signaal[Signaal] ),
    "Afwijkende trend", "#E8603C", "Aandacht", "#EF9F27", "Op koers", "#3BAA5C" )

AI Aanbevolen Wijk = IF ( NOT ISEMPTY ( AI_Aanbeveling_Wijk ), 1 )

Werkelijk AI-aanbevolen = IF ( [AI Aanbevolen Wijk] = 1, [KPI Waarde] )
Werkelijk overig        = IF ( ISBLANK ( [AI Aanbevolen Wijk] ), [KPI Waarde] )
```

## Visuals

- **Lange tekst:** gebruik een **Table** met één measure of een paar kolommen. Zet **Values → Text wrap** aan en **Totals** uit. Een Card kapt lange tekst af.
- **Kleur via AI:** klik de kaart aan en kies **Format → Callout value → Color → fx → Field value → AI Signaal Kleur**.
- **Wijken markeren:** kleuren via een measure werkt niet in een grafiek met meerdere measures. Vervang daarom *Werkelijk* door de twee measures *Werkelijk AI-aanbevolen* en *Werkelijk overig*, elk met een eigen vaste kleur.
- **Klik op een aanbeveling om te markeren:** kies **Format → Edit interactions**, klik de aanbevelingentabel aan en zet de wijkgrafiek op **Filter**.
