// Querynaam: AI_Aanbevelingen. Leest de workshop-API. Zonder internet: gebruik de -lokaal-variant.
let
    Bron = Json.Document(Web.Contents("https://donderdam.brusseedesign.nl/", [RelativePath = "api/recommendations"])),
    Tabel = Table.FromRecords(Bron),
    Typen = Table.TransformColumnTypes(Tabel, {{"Context_ID", type text}, {"Peilmaand", type date}, {"KPI_ID", Int64.Type}, {"KPI_Code", type text}, {"Scope", type text}, {"Scope_Omschrijving", type text}, {"Bron", type text}, {"Model", type text}, {"Gegenereerd_Op", type text}, {"Review_Status", type text}, {"Bron_Hash", type text}, {"Generatie_Methode", type text}, {"Advies_ID", type text}, {"Volgorde", Int64.Type}, {"Titel", type text}, {"Suggestie", type text}, {"Te_Toetsen", type text}, {"Onderbouwing", type text}}, "en-US")
in
    Typen
