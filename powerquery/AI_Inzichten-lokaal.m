// Querynaam: AI_Inzichten. Gebruikt de bestaande DataFolder-parameter.
let
    Bron = Json.Document(File.Contents(DataFolder & "ai-insights.json")),
    Tabel = Table.FromRecords(Bron),
    Typen = Table.TransformColumnTypes(Tabel, {{"Context_ID", type text}, {"Peilmaand", type date}, {"KPI_ID", Int64.Type}, {"KPI_Code", type text}, {"Scope", type text}, {"Scope_Omschrijving", type text}, {"Bron", type text}, {"Model", type text}, {"Gegenereerd_Op", type text}, {"Review_Status", type text}, {"Bron_Hash", type text}, {"Generatie_Methode", type text}, {"Titel", type text}, {"Inzicht", type text}, {"Onderbouwing", type text}, {"Waarde", type number}, {"Target", type number}, {"Waarde_VJ", type number}, {"Eenheid", type text}, {"Periode_Definitie", type text}}, "en-US")
in
    Typen
