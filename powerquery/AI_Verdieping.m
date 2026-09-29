// Querynaam: AI_Verdieping. Vervang localhost door de gedeelde workshop-URL.
let
    Bron = Json.Document(Web.Contents("http://localhost:3000/", [RelativePath = "api/deep-dives"])),
    Tabel = Table.FromRecords(Bron),
    Typen = Table.TransformColumnTypes(Tabel, {{"Context_ID", type text}, {"Peilmaand", type date}, {"KPI_ID", Int64.Type}, {"KPI_Code", type text}, {"Scope", type text}, {"Scope_Omschrijving", type text}, {"Bron", type text}, {"Model", type text}, {"Gegenereerd_Op", type text}, {"Review_Status", type text}, {"Bron_Hash", type text}, {"Generatie_Methode", type text}, {"Focus_Wijk_ID", Int64.Type}, {"Focus_Wijk", type text}, {"Observatie", type text}, {"Hypothese", type text}, {"Ontbrekende_Data", type text}, {"Onderbouwing", type text}, {"Wijk_Waarde", type number}, {"Wijk_Target", type number}, {"Wijk_Waarde_VJ", type number}}, "en-US")
in
    Typen
