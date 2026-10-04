import { useState, useEffect, useMemo, useRef } from "react";
import { ShieldPlus, Truck, Users, LogIn, LogOut, Search, Download, Printer, RotateCcw, X, Clock, Archive, LayoutGrid, Maximize2, Plus, Radio } from "lucide-react";

// ---------- costanti ----------
const SPECIALIZZAZIONI = ["Capo Squadra", "Autista", "Soccorritore", "Volontario", "Altro"];
const SI_NO = ["No", "Sì"];
const TIPI_MEZZO = ["Ambulanza", "Fuoristrada", "Furgone", "Auto", "Moto", "Altro"];
const TIPI_ALIMENTAZIONE = ["Super senza Pb", "Diesel", "GPL", "Metano", "Elettrica", "Nessuna"];
const ABBREVIAZIONI_ALIMENTAZIONE = { "Super senza Pb": "Sp", Diesel: "D", GPL: "Gpl", Metano: "M", Elettrica: "E", Nessuna: "-" };
function abbreviaAlimentazione(valore) {
  return ABBREVIAZIONI_ALIMENTAZIONE[valore] || valore || "";
}
// Converte una data ISO (yyyy-mm-dd, dall'input type="date") in formato GG-MM-AAAA per la stampa.
// Se il valore non è in quel formato (es. già testo libero), lo restituisce invariato.
function fmtDataItaliana(valore) {
  if (!valore) return "";
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(valore.trim());
  if (!m) return valore;
  const [, anno, mese, giorno] = m;
  return `${giorno}-${mese}-${anno}`;
}
const MAX_LOGHI_EVENTO = 3;
function loghiEventoValidi(loghi) {
  return (Array.isArray(loghi) ? loghi : []).filter(Boolean).slice(0, MAX_LOGHI_EVENTO);
}
// Costruisce il blocco loghi per intestazioni "a riga" (ticket, attestati): 0 loghi = niente,
// altrimenti si dividono automaticamente lo spazio disponibile (object-fit: contain, niente deformazioni).
function buildLoghiRigaHtml(loghi, altezzaPx) {
  const validi = loghiEventoValidi(loghi);
  if (!validi.length) return "";
  const h = altezzaPx || 44;
  return `<div class="loghi-riga" style="height:${h}px;">${validi
    .map((src) => `<img src="${src}" alt="" />`)
    .join("")}</div>`;
}
// Blocco loghi per la cella di intestazione del registro (spazio riservato, resta bianco se non configurati).
function buildLoghiCellaHtml(loghi) {
  const validi = loghiEventoValidi(loghi);
  if (!validi.length) return "";
  return `<div class="loghi-cella">${validi.map((src) => `<img src="${src}" alt="" />`).join("")}</div>`;
}
const MACRO_AREE_SPECIALIZZAZIONI = ["Sanitario", "Protezione Civile", "Logistica", "Comunicazione", "Amministrativa", "Specializzazioni tecniche", "Altro"];
const MACRO_AREE_MEZZI = ["Sanitario", "Protezione Civile", "Logistica", "Comunicazione", "Altro"];
const ASSOCIAZIONE_DEFAULT = "Misericordia di Santa Maria di Licodia";
const TIPI_SQUADRA = [
  { id: "appiedate", label: "Appiedate", conMezzo: false },
  { id: "ambulanze", label: "Ambulanze", conMezzo: true },
  { id: "logistiche-tecniche", label: "Logistiche-Tecniche", conMezzo: true },
];
const ADMIN_USER_DEFAULT = "Admin";
const ADMIN_PASS_DEFAULT = "Admin@";
const OPERATORE_USER_DEFAULT = "operatore";
const OPERATORE_PASS_DEFAULT = "Operatore@";
const ADMINCOC_USER = "admincoc";
const ADMINCOC_PASS = "Admincoc@";
const COORDINATORECOC_USER = "coordinatorecoc";
const COORDINATORECOC_PASS = "Coordinatorecoc@";
const COC_FUNZIONI_DEFAULT = [
  { id: "f1", nome: "F1 – Tecnico-scientifica e Pianificazione", descrizione: "Analizza gli scenari di rischio sul territorio, monitora l'evoluzione dell'evento calamitoso e aggiorna il Piano di Protezione Civile Comunale.", attiva: false },
  { id: "f2", nome: "F2 – Sanità, Assistenza Sociale e Veterinaria", descrizione: "Coordina i soccorsi medici d'urgenza sul posto, gestisce il trasporto dei feriti, l'assistenza psicologica e le problematiche veterinarie.", attiva: false },
  { id: "f3", nome: "F3 – Volontariato", descrizione: "Organizza e impiega le associazioni locali di volontariato iscritte all'albo regionale per attività di monitoraggio, presidio e primo soccorso.", attiva: false },
  { id: "f4", nome: "F4 – Materiali e Mezzi", descrizione: "Monitora e distribuisce le risorse logistiche, i mezzi d'opera (es. escavatori, idrovore) e i materiali necessari a fronteggiare l'evento critico.", attiva: false },
  { id: "f5", nome: "F5 – Servizi Essenziali e Attività Produttive", descrizione: "Garantisce la continuità o il rapido ripristino di reti elettriche, idriche, telefoniche e del gas, oltre a monitorare le scuole e le aziende critiche.", attiva: false },
  { id: "f6", nome: "F6 – Censimento Danni, Persone e Beni", descrizione: "Valuta l'agibilità degli edifici pubblici e privati dopo una calamità (es. terremoto o alluvione) e quantifica i danni subiti dalle infrastrutture.", attiva: false },
  { id: "f7", nome: "F7 – Strutture Operative Locali, Viabilità e Forze dell'Ordine", descrizione: "Presieduta in genere dalla Polizia Municipale, gestisce la chiusura delle strade a rischio, regola il traffico e garantisce i percorsi per i mezzi di soccorso.", attiva: false },
  { id: "f8", nome: "F8 – Telecomunicazioni e Reti Radio", descrizione: "Assicura i collegamenti radio di emergenza tra il C.O.C., i presidi sul territorio e le Sale Operative superiori anche in caso di blackout delle linee telefoniche ordinarie.", attiva: false },
  { id: "f9", nome: "F9 – Assistenza alla Popolazione", descrizione: "Coordina l'evacuazione dei cittadini, allestisce le aree di attesa e di ricovero (es. palestre, tendopoli), e fornisce cibo, coperte e generi di prima necessità agli sfollati.", attiva: false },
];
const POLL_MS = 8000;

const KEY_VOL = (eventId) => `protcivile:volontari:${eventId}`;
const KEY_MEZZI = (eventId) => `protcivile:mezzi:${eventId}`;
const KEY_CONFIG = (eventId) => `protcivile:config:${eventId}`;
const KEY_SQUADRE = (eventId) => `protcivile:squadre:${eventId}`;
const KEY_REGISTRO_RADIO = (eventId) => `protcivile:registro-radio:${eventId}`;
const KEY_EVENTI = "protcivile:eventi";
const KEY_ASSOC_DB = "protcivile:associazioni-db";
const KEY_EVENTO_ADMIN = "protcivile:evento-admin";
const KEY_ADMIN_CREDS = "protcivile:admin-credenziali";
const KEY_OPERATORI = "protcivile:operatori";
const KEY_COC_FUNZIONI = (eventId) => `protcivile:coc-funzioni:${eventId}`;
const KEY_COC_UTENTI = (eventId) => `protcivile:coc-utenti:${eventId}`;
const KEY_COC_DIARIO = (eventId) => `protcivile:coc-diario:${eventId}`;
const KEY_COC_NOTE = (eventId) => `protcivile:coc-note:${eventId}`;
const KEY_IMPOSTAZIONI_GLOBALI = "protcivile:impostazioni-globali";

const ASSOCIAZIONI_DB = [["5", "ASSOCIAZIONE NAZIONALE S.S.T. - SEARCH AND RESCUE – ODV DELEGAZIONE DI SCIACCA", "C / o S t a dio Comunale L. Gurrera, s.n.c.", "Sciacca", "AG"], ["6", "ASSOCIAZIONE NAZIONALE CARABINIERI SEZIONE DI VIZZINI", "Via Roma, 35", "Vizzini", "CT"], ["7", "ARCI CACCIA FEDERAZIONE PROVINCIALE DI CATANIA", "Via Felice Paradiso, 3 c/o Com Acireale", "Acireale", "CT"], ["10", "ASSOCIAZIONE PALERMO 4X4 ODV", "Via del Melograno, 18/A", "Palermo", "PA"], ["14", "ORGANIZZAZIONE NAZIONALE DI VOLONTARIATO GIUBBE D'ITALIA", "Via Orto S. Antonino, 7", "Chiusa Sclafani", "PA"], ["16", "FRATERNITA DI MISERICORDIA DI VALLEDOLMO", "Via G Garibaldi, 165", "Valledolmo", "PA"], ["24", "ASSOCIAZIONE NAZIONALE VIGILI DEL FUOCO IN CONGEDO DELEGAZIONE TORREGROTTA – ODV", "V i a M e z z a s a l ma, 27 c/o Municipio di Torregrotta", "Torregrotta", "ME"], ["28", "ASSOCIAZIONE CULTURALE NUOVA ACROPOLI SIRACUSA", "Viale Zecchino, 72", "Siracusa", "SR"], ["38", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI MASCALUCIA", "Piazza Leonardo Da Vinci", "Mascalucia", "CT"], ["39", "ASSOCIAZIONE NAZIONALE VIGILI DEL FUOCO IN CONGEDO DELEGAZIONE DI NARO", "Piazza Cesare Battisti, 1", "Naro", "AG"], ["47", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI ACICATENA", "Via Sottotenente Barbagallo, 2", "Acicatena", "CT"], ["52", "ASSOCIAZIONE NAZIONALE VIGILI DEL FUOCO IN CONGEDO", "Piazza Macello, 3", "Lercara Friddi", "PA"], ["54", "NUCLEO PRONTO INTERVENTO SCIARESE", "Via Lo Varco, 25", "Sciara", "PA"], ["56", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI MODICA", "Piazza Principe di Napoli, 17", "Modica", "RG"], ["64", "PROTEZIONE CIVILE ADRANO", "Piazza S. Francesco, 13", "Adrano", "CT"], ["65", "ASSOCIAZIONE DI VOLONTARIATO “RADIO VALLE ALCANTARA”", "Piazza Raggia, 13", "Taormina", "ME"], ["70", "ASSOCIAZIONE VOLONTARIATO MILAZZO", "Via Francesco Crispi, 81", "Milazzo", "ME"], ["73", "ORGANIZZAZIONE NAZIONALE VOLONTARIATO GIUBBE D'ITALIA SEZIONE DI ALTAVILLA MILICIA", "Via Crocifisso, 24", "Altavilla Milicia", "PA"], ["90", "PROTEZIONE CIVILE CENTRO OPERATIVO ISIDE", "Viale Madre Teresa di Calcutta, s.n.", "Mineo", "CT"], ["92", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI VITTORIA", "Via S. Incardona c/o Mercato Ortofrutticolo", "Vittoria", "RG"], ["96", "ASSOCIAZIONE VOLONTARI CITTA'DI NOTO", "Via Silvio Spaventa, 2", "Noto", "SR"], ["101", "STRUTTURA REGIONALE SICILIA - FEDERAZIONE ITALIANA RICETRASMISSIONI – CITIZEN'S BAND – F.I.R. C.B. ODV", "V ia XXIV Maggio, 56", "Messina", "ME"], ["106", "ASSOCIAZIONE VOLONTARI DEL SOCCORSO", "Circonvallazione Costa degli Archi, s.n.c.", "Santa Croce Camerina", "RG"], ["107", "CORPO AUSILIARIO PROTEZIONE CIVILE “G. CARUANO”", "C.da Mendolilli Capitina", "Vittoria", "RG"], ["108", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI SANTA CROCE DI CAMERINA", "Via Carmine, 95", "Santa Croce Camerina", "RG"], ["109", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI RAGUSA", "Corso Italia, 72", "Ragusa", "RG"], ["120", "CORPO VOLONTARI PROTEZIONE CIVILE ENNA PUBBLICA ASSISTENZA", "Via Scifitello, snc", "Enna", "EN"], ["124", "FRATERNITA DI MISERICORDIA DI SAN PIERO PATTI", "Via Primo Maggio, 2", "San Piero Patti", "ME"], ["130", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI PRIOLO GARGALLO", "C.e.r.i.c.a c/da Cava Sorciaro, s.n.", "Priolo Gargallo", "SR"], ["132", "ORGANIZZAZIONE WHISKEY MIKE", "Via Grotta del Toro, 48", "Marsala", "TP"], ["136", "EKOS SICILIA AMBIENTE E CULTURA", "Via Fiorita , 7/A", "Catania", "CT"], ["138", "PUBBICA ASSISTENZA SICILIA SOCCORSO O.N.L.U.S.", "C.da Bellia, 2", "Piazza Armerina", "EN"], ["143", "FRATERNITA DI MISERICORDIA DI PEDARA", "Via Pizzo Ferro, 5", "Pedara", "CT"], ["154", "VOLONTARIATO SICILIANO PER LA PROTEZIONE CIVILE SEZIONE DI FRANCOFONTE", "Via Onorevole Sebastiano Franco", "Francofonte", "SR"], ["155", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI COMISO", "Via G. Bufalino", "Comiso", "RG"], ["159", "RANGERS INTERNATIONAL- DELEGAZIONE 552.005 UCRIA", "Via Padre Bernardino", "Ucria", "ME"], ["172", "PUBBLICA ASSISTENZA AMICO SOCCORSO ALDO INGALA", "Via Signore Ritrovato, 4", "Barrafranca", "EN"], ["181", "E.R.A.P. EMERGENZA RADIOAMATORI ASSOCIATI PALERMO ODV", "Via Monte Mario, 5", "Palermo", "PA"], ["196", "ORGANIZZAZIONE NAZIONALE DI VOLONTARIATO GIUBBE D'ITALIA – SEZIONE COMUNALE DI ARAGONA", "Via B. Naselli, 173", "Aragona", "AG"], ["200", "ENTE SALVAGUARDIA AMBIENTE E FORESTE ESAF-GRUPPO VOLONTARI EMERGENZE", "Via Felice Fontana, 23", "Catania", "CT"], ["207", "NUCLEO DIOCESANO DI PROTEZIONE CIVILE", "Via Emilia, 21", "Messina", "ME"], ["208", "ORGANIZZAZIONE VOLONTARI DI P.C. RAGUSA O.N.L.U.S", "Via Achille Grandi, s.n.c", "Ragusa", "RG"], ["214", "ORGANIZZAZIONE EUROPEA COORDINAMENTO NAZIONALE VOLONTARIATO E IMPRESA SOCIALE E.T.S.-DISTACCAMENTO DI PARTINICO", "Via Papa Paolo VI, 3", "Partinico", "PA"], ["220", "ORGANIZZAZIONE NAZIONALE VOLONTARIATO GIUBBE D'ITALIA – SEZIONE DI CEFALU'", "Via Vitaliano Brancati, 19", "Cefalù", "PA"], ["222", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI SCORDIA", "Via Aldo Moro", "Scordia", "CT"], ["225", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI GIARDINI NAXOS", "Via Jannuzzo palazzo VV.UU.", "Giardini Naxos", "ME"], ["228", "GOS MODICA AVCM DELL'ASSOCIAZIONE NAZIONALE VIGILI DEL FUOCO VOLONTARI ODV", "Via Furio Camillo, 3", "Modica", "RG"], ["231", "GRUPPO VOLONTARIO CINOFILO ACESE ODV", "Via Manzoni, 13", "Acireale", "CT"], ["239", "REPARTO OPERATIVO SOCCORSO E SOLIDARIETA'", "Via Modica, 72", "Siracusa", "SR"], ["245", "PUBBLICA ASSISTENZA VOLONTARI RIUNITI RACALMUTO", "Via Vincenzo Scimè, 5", "Racalmuto", "AG"], ["250", "CLUB 27 CATANIA", "Viale F. Fontana", "Catania", "CT"], ["267", "ORGANIZZAZIONE NAZIONALE DI VOLONTARIATO GIUBBE D'ITALIA – SEZIONE COMUNALE DI CALASCIBETTA", "Via Nazionale, 139", "Calascibetta", "EN"], ["268", "NUCLEO DI PROTEZIONE CIVILE ANC DI NICOLOSI", "Via Garibaldi, 40", "Nicolosi", "CT"], ["269", "PUBBLICA ASSISTENZA “IL SOCCORSO”", "V i a A n t o n i n o I n corvaia, 2", "Misiliscemi", "TP"], ["275", "LEGAMBIENTE PROTEZIONE CIVILE FILIPPO SALIMENI", "Via Cortile S. Agostino, 17", "Agira", "EN"], ["289", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI ISPICA", "Via dell'Arte, s.n.c.", "Ispica", "RG"], ["295", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI PALAZZOLO ACREIDE", "Via G. Campailla, s.n.", "Palazzolo Acreide", "SR"], ["306", "GRIFONE, GRUPPO DI CORLEONE ADERENTE PROCIV – ARCI NAZIONALE", "Via S. Lucia c/o ufficio tecnico", "Corleone", "PA"], ["326", "CONFRATERNITA DI MISERICORDIA DI NICOLOSI", "Piazza Vittorio Emanuele, 26", "Nicolosi", "CT"], ["342", "ORGANIZZAZIONE MAGNA VIS PER LA LOGISTICA ED I MEZZI SPECIALI", "Piazza Mulini, 13", "Trabia", "PA"], ["356", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DEL COMUNE DI SINAGRA", "Piazza S. Teodoro", "Sinagra", "ME"], ["389", "ASSOCIAZIONE DI VOLONTARIATO PROTEZIONE CIVILE DI BIANCAVILLA", "Via dei Peloritani, 1", "Biancavilla", "CT"], ["401", "VOLO CLUB ALBATROS ASSOCIAZIONE ONLUS DI VOLONTARIATO PER LA P.ROTEZIONE CIVILE", "C.da Canne Masche", "Termini Imerese", "PA"], ["410", "“S.E.R. L.A.N.C.E. C.B.” SERVIZIO EMERGENZA RADIO VOLONTARI DI PROTEZIONE CIVILE", "Via La Porta, 19", "Porto Empedocle", "AG"], ["441", "NUCLEO DI PROTEZIONE CIVILE ANC", "Via Marcello Paternò, s.n.", "Biancavilla", "CT"], ["445", "ASSOCIAZIONE NAZ. CARABINIERI GRUPPO DI PROTEZIONE CIVILE GUARDIA MANGANO", "Via Tolmezzo, 10", "Acireale Guardia Mangano", "CT"], ["459", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI SORTINO", "Viale Mario Giardino", "Sortino", "SR"], ["460", "CONFRATERNITA DI MISERICORDIA DI PORTOPALO DI CAPOPASSERO", "Via Garibaldi, 53", "Portopalo di Capo Passero", "SR"], ["463", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI ACI SANT'ANTONIO", "Via Regina Margherita, 8", "Aci Sant'Antonio", "CT"], ["464", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI LICODIA EUBEA", "Via Piersanti Mattarella, 4", "Licodia Eubea", "CT"], ["472", "CROCE D'ORO PORTO EMPEDOCLE ORGANIZZAZIONE VOLONTARIA", "Via Roma, 42", "Porto Empedocle", "AG"], ["473", "GRUPPO” ETNA” - CLUB – C.B.- S. VENERINA", "Via Mazzini, 75", "Santa Venerina", "CT"], ["478", "FORUM REGIONALE DELLE ASSOCIAZIONI DI VOLONTARIATO DELLA PROTEZIONE CIVILE", "Via Trieste, 25", "Palermo", "PA"], ["481", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI RANDAZZO", "Piazza Municipio, 1", "Randazzo", "CT"], ["483", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI CANICATTINI BAGNI", "Piazza Caduti di Nassiriya", "Canicattini Bagni", "SR"], ["494", "DELEGAZIONE L.A.N.C.E. C.B. TUSA", "Via Roma", "Tusa", "ME"], ["495", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI NICOLOSI", "Via Calvario, 27", "Nicolosi", "CT"], ["498", "GRUPPO ALFA REGIONE SICILIA", "Via Santa Teresa, 3", "Chiaramonte Gulfi", "RG"], ["502", "ASSOCIAZIONE VOLONTARI CITTA' DI SIRACUSA", "Via Beneventano, 1", "Siracusa", "SR"], ["505", "PUBBLICA ASSISTENZA PROCIVIS", "Via Vico la Mantia, 5", "Gela", "CL"], ["508", "A.P.A.S. PATERNO'", "Via Giovanni Verga, 91", "Paternò", "CT"], ["509", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI TRECASTAGNI", "Via Benedetto Croce, 5", "Trecastagni", "CT"], ["510", "C.B. G. MARCONI", "Via Spiaggia, 319", "Mascali", "CT"], ["601", "SMAV - SAN MAURO ASSOCIAZIONE VOLONTARIATO ONLUS", "Via Acqua Nuova, 7", "San Mauro Castelverde", "PA"], ["602", "CONFRATERNITA DI MISERICORDIA SAN GREGORIO DI CATANIA – ONLUS", "Via Umberto, 67", "San Gregorio di Catania", "CT"], ["603", "RANGERS EUROPA DIVISIONE DI NICOLOSI", "Via Montearso, 1", "Nicolosi", "CT"], ["604", "“RANGERS EUROPA” DIVISIONE DI MONTEROSSO ALMO", "C.da Margi, snc (sede COM)", "Monterosso Almo", "RG"], ["605", "SOCIETA' NAZIONALE DI SALVAMENTO SEZIONE DI LENTINI/CARLENTINI – CAPITANERIA DI PORTO DI AUGUSTA", "Via San Francesco D'Assisi, 151", "Lentini", "SR"], ["606", "CONFRATERNITA DI MISERICORDIA", "Via Lombardia, 1", "Bronte", "CT"], ["608", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI RESUTTANO", "Piazza Vittorio Emanuele III, 1", "Resuttano", "CL"], ["610", "CENTRO ASCOLTO SOLIDARIETA' S. PAOLO APOSTOLO – O.N.L.U.S.", "Via Piave, 4", "Solarino", "SR"], ["611", "ASSOCIAZIONE VOLONTARIATO E PROTEZIONE CIVILE VILLA GRAZIA DI CARINI", "Via Garita, 13", "Carini", "PA"], ["612", "CLUB RADIO C.B. - ODV", "Via Sant'Andrea, 96", "Barcellona Pozzo di Gotto", "ME"], ["614", "OPERE DI ASSISTENZA, SOCCORSO E SOLIDARIETA' DELLA CROCE GIOVANNEA", "Via Libertà, 24", "Partinico", "PA"], ["615", "PLUTIA EMERGENZA", "Via Alessandro Manzoni, 94", "Piazza Armerina", "EN"], ["616", "O.N.L.U.S. VOLONTARI OPERATORI DI SOCCORSO CERAMI", "Via Tomasi di Lampedusa, 2", "Cerami", "EN"], ["617", "ASSOCIAZIONE CATTOLICA CULTURALE ITALIANA RADIOPERATORI", "Via Garibaldi, 379", "Messina", "ME"], ["618", "RANGERS INTERNATIONAL DELEGAZIONE 555.001 NICOSIA", "Via Sant'Anna , 61", "Nicosia", "EN"], ["619", "FRATERNITA DI MISERICORDIA DI GRAVINA DI CATANIA", "Via Zangrì, 10", "Gravina di Catania", "CT"], ["622", "ASSOCIAZIONE PROVINCIALE VIGILI DEL FUOCO DISCONTINUI VOLONTARI", "Via Seneca, 8", "Trapani", "TP"], ["624", "ORGANIZZAZIONE NAZIONALE DI VOLONTARIATO GIUBBE D'ITALIA – SEZIONE COMUNALE DI AGIRA", "C.da Tre Fontane, snc", "Agira", "EN"], ["629", "ASSOCIAZIONE VOLONTARIATO FUTURA", "Via Campania, 20", "Ispica", "RG"], ["630", "ANTRAS ASSOCIAZIONE NAZIONALE DI NUCLEI OPERATIVI NEL SETTORE DEI TRASPORTI E DELLA PROTEZIONE", "Viale Regione Siciliana. 64", "Palermo", "PA"], ["634", "FRATERNITA DI MISERICORDIA FLORIDIA", "Via Labriola", "Floridia", "SR"], ["635", "ASSOCIAZIONE DI VOLONTARIATO PER LA PROTEZIONE CIVILE ED AMBIENTALE", "Via Libertà, 3", "Zafferana Etnea", "CT"], ["636", "PROTEZIONE CIVILE GERACI SICULO", "Via Don Orione, 1", "Geraci Siculo", "PA"], ["639", "CAVALIERI DI SICILIA ODV", "Via Francesco Crispi, 1", "Borgetto", "PA"], ["640", "A.R.I. ASSOCIAZIONE RADIOAMATORI ITALIANI", "Via F. Fontana, 23", "Catania", "CT"], ["641", "TRAVEL SOCCORSO ORGANIZZAZIONE NON LUCRATIVA DI UTILITA' SOCIALE", "Via Volontari Italiani del Sangue, 7/9", "Termini Imerese", "PA"], ["645", "PROCIV ARCI GRUPPO ANTHARES BOLOGNETTA", "Via Pietro Novelli, 108", "Bolognetta", "PA"], ["648", "GUARDIE AMBIENTALI COMANDO ITALIA", "V i a S e r r a d i f a l c o , 55", "Palermo", "PA"], ["654", "ASSOCIAZIONE VOLONTARIATO PER LA PROTEZIONE CIVILE TRIPI", "Via F. Todaro, 127", "Tripi", "ME"], ["655", "MISTRAL", "Via Francesco Crispi, 28", "Belpasso", "CT"], ["657", "PEGASO", "Via Pezzingoli, 4", "Monreale", "PA"], ["658", "GRUPPO INTERCOMUNALE DI VOLONTARIATO DI PROTEZIONE CIVILE DEI COMUNI DI BOMPENSIERE, MILENA E MONTEDORO-BO.MI.MO.", "Via Principe di Scalea, 126", "Bompensiere", "CL"], ["661", "PROTEZIONE CIVILE MONTE LA STELLA", "Via P. Nenni, s.n.c.", "Assoro", "EN"], ["664", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI TROINA", "Via Conte Ruggero, 2", "Troina", "EN"], ["665", "“LA PANTERA” GRUPPO DI VOLONTARIATO PROTEZIONE CIVILE ASSISTENZIALE E CULTURALE", "Via Mezzasalma, 10", "Rometta Marea", "ME"], ["668", "GUARDIA COSTIERA AUSILIARIA- ONLUS - CENTRO REGIONALE DELLA SICILIA - GRUPPO OPERATIVO ISOLA DELLA FEMMINE", "Via Palermo, 63", "Isola delle Femmine", "PA"], ["669", "CONFRATERNITA DI MISERICORDIA DI SPADAFORA", "Via Provinciale San Martino", "Spadafora", "ME"], ["670", "PUBBLICA ASSISTENZA PACECO SOCCORSO ODV", "V i a L eonardo Pizzardi, 15", "Misiliscemi", "TP"], ["672", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI POGGIOREALE", "Via Ximenes, 1", "Poggioreale", "TP"], ["673", "VOLONTARI PROTEZIONE CIVILE SAMBUCA", "Viale Giovanni XXIII c/o UTC", "Sambuca di Sicilia", "AG"], ["675", "ASSOCIAZIONE NAZIONALE CARABINIERI NUCLEO VOLONTARI VIGILANZA E PROTEZIONE CIVILE", "Via Vittorio Emanuele, 71", "Aci Sant'Antonio", "CT"], ["677", "CONFRATERNITA DI MISERICORDIA DI BOMPIETRO", "Via Roma, 27", "Bompietro", "PA"], ["680", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI MANIACE", "Via Beato Placido, 13", "Maniace", "CT"], ["682", "CLUB ELETTRA", "Viale Epicarmo Corbino, 50", "Augusta", "SR"], ["683", "C.B. OMEGA CANICATTINI BAGNI", "Via Pipernice, s.n.c.", "Canicattini Bagni", "SR"], ["684", "RANGERS INTERNATIONAL DELEGAZIONE 553-005 DI CALATABIANO", "Via Garibaldi, 4", "Calatabiano", "CT"], ["686", "FEDERAZIONE - PROCIV - SICILIA - ADERENTE ALL'ASSOCIAZIONE NAZIONALE VOLONTARI PER LA P.C. PROCIV - ARCI NAZIONALE", "V i a Pietro Novelli, 108", "Bolognetta", "PA"], ["687", "NUCLEO DI PROTEZIONE CIVILE A.D.M.I. ASSOCIAZIONE DIPENDENTI MINISTERO DELL'INTERNO – DI SAN PIETRO CLARENZA", "V ia Felice Fontana, 23", "Catania", "CT"], ["688", "AQUILE DELL'ETNA", "Via Pierre De Coubertin, 15", "Catania", "CT"], ["689", "A.M.A. ONLUS (ASSOCIAZIONE MEDITERRANEA ASSISTENZA)", "Via Calasanzio, 3", "Ragusa", "RG"], ["691", "I CAVALIERI DELLA SIKANIA – ONLUS", "C/da Canale, 3", "Sant'Angelo Muxaro", "AG"], ["693", "ORGANIZZAZIONE NAZIONALE. VOLONTARI GIUBBE D'ITALIA SEZIONE SANTA ELISABETTA", "Via Kennedy, 21", "Santa Elisabetta", "AG"], ["696", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI LENTINI", "Piazza Umberto I, 31", "Lentini", "SR"], ["701", "ORGANIZZAZIONE EUROPEA VOLONTARI DI PREVENZIONE E PROTEZIONE CIVILE", "Piazza Garibaldi, 1", "Camastra", "AG"], ["702", "ORGANIZZAZIONE NAZIONALE VOLONTARIATO GIUBBE D'ITALIA SEZIONE COMUNALE DI VILLAROSA", "Via Cossa, s.n.c.", "Villarosa", "EN"], ["703", "ASSOCIAZIONE VOLONTARIATO PROTEZIONE CIVILE GRIFONI", "Via Umberto, 170", "Favara", "AG"], ["706", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI BELPASSO", "Piazza Municipio, 9", "Belpasso", "CT"], ["709", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI SAN PIETRO CLARENZA", "Via Padre Somma, 9", "San Pietro Clarenza", "CT"], ["711", "FRATERNITA DI MISERICORDIA DI BARRAFRANCA", "Via Montello, 42", "Barrafranca", "EN"], ["712", "ORGANIZZAZIONE NAZIONALE VOLONTARIATO GIUBBE D'ITALIA – COORDINAMENTO NAZIONALE", "Via Indipendenza, 35", "Aragona", "AG"], ["718", "PUBBLICA ASSISTENZA AMICO SOCCORSO O.N.L.U.S.", "Via Segesta, 3", "Trapani", "TP"], ["721", "FRATERNITA DI MISERICORDIA SAN LEONE", "Via S. Leone, 1", "Catania", "CT"], ["723", "ASSOCIAZIONE NAZIONALE S.S.T. - SEARCH AND RESCUE – ODV DELEGAZIONE DI CASTELVETRANO", "Via Nicolò Copernico, 36", "Castelvetrano", "TP"], ["725", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI SOLARINO", "Piazza del Plebiscito, 1", "Solarino", "SR"], ["726", "“AGESCI SICILIA - ASSOCIAZIONE GUIDE E SCOUT CATTOLICI ITALIANI”", "Via F.lli Bandiera, 82", "Gravina di Catania", "CT"], ["727", "E.R.A. T. EMERGENZA RADIOAMATORI ASSOCIATI TRAPANI ODV", "V i a T r e S a n t i , 7", "Alcamo", "TP"], ["729", "V.A.B. VIGILANZA ANTINCENDI BOSCHIVI MILITELLO ODV", "C.da Rena Rossa presso Elipista", "Militello Val Di Catania", "CT"], ["730", "FRATERNITA DI MISERICORDIA MARIA IMMACOLATA", "Via A. de Gasperi, 2", "Catenanuova", "EN"], ["731", "FONTANA DELLE ROSE ODV", "Piazza San Francesco, 7", "Campofranco", "CL"], ["733", "ASSOCIAZIONE P.A. S.O.S. VALDERICE ONLUS", "Via S. Barnaba, 43", "Valderice", "TP"], ["734", "FRATERNITA DI MISERICORDIA DI MESSINA", "Via Taormina Palazzina IACP", "Messina", "ME"], ["737", "ARETUSA SOCCORSO O.D.V.", "Via Elorina, 148", "Siracusa", "SR"], ["738", "RANGERS INTERNATIONAL DELEGAZIONE 552.002 GALATI MAMERTINO", "Via Cavour località Contura, s.n.c.", "Galati Mamertino", "ME"], ["740", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI ITALA", "Via Principe Umberto", "Itala", "ME"], ["742", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI VILLAFRANCA SICULA", "Via Vittorio Emanuele, 126", "Villafranca Sicula", "AG"], ["743", "ASSOCIAZIONE INTERNAZIONALE “PANTERE VERDI O.N.L.U.S.” RAGGRUPPAMENTO PROVINCIALE DI TRAPANI", "C/da Cozzaro, 52", "Marsala", "TP"], ["744", "ASSOCIAZIONE INTERNAZIONALE \"PANTERE VERDI O.N.L.U.S.\" RAGGRUPPAMENTO PROVINCIALE DI CALTANISSETTA", "Via Napoleone Colajanni, 208", "Caltanissetta", "CL"], ["746", "FRATERNITA DI MISERICORDIA", "Via Concerie, 35", "Melilli", "SR"], ["750", "CONFRATERNITA DI MISERICORDIA DI REALMONTE", "Via dei Gerani, 11/13", "Realmonte", "AG"], ["759", "VOLONTARI PROTEZIONE CIVILE DELIA", "Via Pola, 13", "Delia", "CL"], ["760", "ASSOCIAZIONE INTERNAZIONALE PANTERE VERDI ONLUS RAGGRUPPAMENTO PROVINCIALE DI CATANIA", "Via Felice Fontana, 23", "Catania", "CT"], ["761", "FRATERNITA DELLE MISERICORDIE DI ACIREALE", "Via Paolo Vasta, 180", "Acireale", "CT"], ["765", "ASSOCIAZIONE INTERNAZIONALE “PANTERE VERDI ONLUS” - RAGGRUPPAMENTO PROVINCIALE DI ENNA", "Via Bandiera, 72", "Valguarnera Caropepe", "EN"], ["771", "ASSOCIAZIONE AVULSS DI AGIRA", "Via Roma, 22", "Agira", "EN"], ["773", "ASSOCIAZIONE EUROPEA OPERATORI POLIZIA - GRUPPO VOLONTARIATO E PROTEZIONE CIVILE SEZIONE SICUREZZA", "Via S. Gregorio, 10", "Aci Castello", "CT"], ["774", "P.A. AURORA O.N.L.U.S", "Via Vita, 26", "Marsala", "TP"], ["775", "ODV GRUPPO DI VOLONTARIATO E PROTEZIONE CIVILE DELL'ASSOCIAZIONE NAZIONALE DELLA POLIZIA DI STATO – SEZIONE DI CALTANISSETTA", "Via Trieste, 82", "Caltanissetta", "CL"], ["778", "ASSOCIAZIONE VOLONTARI EUROPEI TUTELA AMBIENTE ODV-ETS", "V i a d e g l i A r c hi, 28", "Mazara del Vallo", "TP"], ["782", "FRATERNITA DI MISERICORDIA SANTA MARIA DI OGNINA", "Piazza Ognina, 11", "Catania", "CT"], ["786", "RANGERS INTERNATIONAL DELEGAZIONE SAN FILIPPO MONGIUFFI MELIA N° 552-018", "Piazza San Nicolò, 6", "Mongiuffi Melia", "ME"], ["788", "PUBBLICA ASSISTENZA TRINACRIA EMERGENCY", "Via Falcone, s.n.c. C/da Brucazzi", "Gela", "CL"], ["789", "GUARDIE AMBIENTALI D'ITALIA - DELEGAZIONE PROVINCIALE DI TRAPANI", "Via Ponte Salemi, 23/A", "Trapani", "TP"], ["792", "PUBBLICA ASSISTENZA INTERLAND MADONITA", "C.da Sant'Elia, s.n.c.", "Petralia Sottana", "PA"], ["794", "CONFRATERNITA DI MISERICORDIA DI MODICA", "Via Mercè, 53", "Modica", "RG"], ["796", "NUCLEO OPERATIVO DI PROTEZIONE CIVILE EMERGENZA AMBIENTALE", "Via Papa Giovanni XXIII, 54", "Terrasini", "PA"], ["798", "FRATERNITA DI MISERICORDIA DI TRECASTAGNI", "Via Arciprete Torrisi, 5", "Trecastagni", "CT"], ["800", "FRATERNITA DI MISERICORDIA DI ZAFFERANA ETNEA", "Via Libertà, 3", "Zafferana Etnea", "CT"], ["805", "ORGANIZZAZIONE DI VOLONTARIATO “MARI E MONTI 2004”", "Via E. Cianciolo, 26", "Messina", "ME"], ["806", "ASSOCIAZIONE DI PROTEZIONE CIVILE AMBIENTALE RICERCA E SOCCORSO O.N.L.U.S. A.P.C.A.R.S.", "Corso Garibaldi, 186", "San Filippo del Mela", "ME"], ["807", "ASSOCIAZIONE PUBBLICA ASSISTENZA LA PROVVIDENZA ONLUS", "C.da Damusello, 568", "Marsala", "TP"], ["808", "ORGANIZZAZIONE DI PROTEZIONE CIVILE \"OVERLAND\"", "Fondo Pasqualino, 5", "Monreale", "PA"], ["809", "ASSOCIAZIONE NAZIONALE VIGILI DEL FUOCO IN CONGEDO – DELEGAZIONE CAPACI ODV”", "Via del Fante, 17", "Capaci", "PA"], ["814", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI FICARAZZI", "Corso Umberto I, 412", "Ficarazzi", "PA"], ["817", "CONFRATERNITA DI MISERICORDIA DI ROCCAPALUMBA", "Via Garibaldi, 40", "Roccapalumba", "PA"], ["822", "ORGANIZZAZIONE PER LA PROTEZIONE CIVILE LE ALI", "Via Rosa Balistreri, 5", "Palermo", "PA"], ["823", "ARCAVERDE", "Via Luigi Manfredi, 2/G-H", "Palermo", "PA"], ["824", "ASSOCIAZIONE VOLONTARI DEL MEDITERRANEO -ODV-ETS", "Via Itria, 88/B", "Marsala", "TP"], ["828", "C.E.S.U.L. CORPO EUROPEO SOCCORSO UMANITARIO LOGISTICO – ODV", "Viale S. Panagia, 162", "Siracusa", "SR"], ["835", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI RIESI", "Piazza Don Pietro D'Altariva", "Riesi", "CL"], ["836", "COMITATO REGIONALE A.N.P.A.S. SICILIA", "Via Sardegna, 36", "Enna", "EN"], ["837", "GRUPPO OPERATIVO EMERGENZA 837 ODV", "C.da Fallari Mugno S.P. 25", "Ragusa", "RG"], ["838", "ASSOCIAZIONE GUARDIE ITTICHE VENATORIE ENDAS “G.I.S.E. ODV ETS”", "Via degli Asteroidi, 2", "Agrigento", "AG"], ["839", "ORGANIZZAZIONE NAZIONALE DI VOLONTARIATO GIUBBE D'ITALIA", "Via Tivoli, 125", "Raffadali", "AG"], ["843", "SOS BUSETO ODV", "Via Murfi, 4", "Buseto Palizzolo", "TP"], ["844", "GUARDIE AMBIENTALI TRINACRIA", "Via Pantelleria, 24", "Mazara del Vallo", "TP"], ["847", "ASSOCIAZIONE VOLONTARI S. MARCO ONLUS", "Via Cappuccini, 92", "San Marco D'Alunzio", "ME"], ["848", "E.R.A. CITTA' DI ANTILLO E VALLE D'AGRO'", "Via Cesare Battisti, 1", "Antillo", "ME"], ["850", "GRUPPO COMUNALE DI VOLONTARIATO DI PROTEZIONE CIVILE DI TERMINI IMERESE", "Piazza Duomo", "Termini Imerese", "PA"], ["854", "GARIBALDINI A CAVALLO -ODV", "Via Giuseppe Di Matteo, 371", "Castellana Sicula", "PA"], ["856", "CORPO PROTEZIONE AMBIENTALE SICILIA- ODV SEZIONE DI MAZARA DEL VALLO", "Via S.Maria delle Giumarre, 19", "Mazara del Vallo", "TP"], ["858", "NUOVA ACROPOLI FLORIDIA -ODV (ETS)", "Via F. Turati, 60/A", "Floridia", "SR"], ["861", "NUCLEO OPERATIVO EMERGENZA SICILIA O.N.L.U.S.", "S.P. Nunziata Piedimonte, 255", "Mascali", "CT"], ["862", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI MELILLI", "Via Concerie, 1", "Melilli", "SR"], ["866", "RINASCITA VENTIMIGLIESE - ONLUS", "Via Umberto I, 60", "Ventimiglia di Sicilia", "PA"], ["868", "RANGERS INTERNATIONAL DELEGAZIONE 552.021 MOJO ALCANTARA", "Via Vanella Mojo, 19", "Mojo Alcantara", "ME"], ["869", "ELIOS COMITATO PROVINCIALE MESSINA", "V i a N i c o l ò P a t t i , 1 3", "Rometta Marea", "ME"], ["873", "RANGERS INTERNATIONAL - DELEGAZIONE N. 553-010", "Via San Francesco, s.n.c.", "Castiglione di Sicilia", "CT"], ["874", "FRATERNITA MISERICORDIA MISTERBIANCO", "Via V. Veneto, 245", "Misterbianco", "CT"], ["877", "CONFRATERNITA DI MISERICORDIA DI FERLA", "Via Pessina, s.n.c.", "Ferla", "SR"], ["881", "AQUILE DEGLI EREI REGALBUTO", "Via Vittorio Emanuele, 88", "Regalbuto", "EN"], ["883", "ORGANIZZAZIONE EUROPEA VIGILI DEL FUOCO VOLONTARI DI PROTEZIONE CIVILE – DISTACCAMENTO COMUNALE DI", "Via Piazza, 27", "Corleone", "PA"], ["893", "CORLEONE NUCLEO OPERATIVO INTERFORZE SICILIA – VOLONTARI DI PREVENZIONE E PROTEZIONE CIVILE", "C.da Piana", "Sant'Agata di Militello", "ME"], ["895", "CROCE DEL SUD", "Vicolo Pantelleria, 19", "Palermo", "PA"], ["896", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI BAUCINA", "Via Umberto ,78", "Baucina", "PA"], ["898", "ASSOCIAZIONE NAZIONALE VIGILI DEL FUOCO VOLONTARI DELEGAZIONE DI BISACQUINO", "Via Collegio, 9", "Bisacquino", "PA"], ["900", "FRATERNITA DI MISERICORDIA DI SANTA MARIA DI LICODIA", "Via Isonzo, 4", "Santa Maria di Licodia", "CT"], ["907", "ORGANIZZAZIONE NAZIONALE DI VOLONTARIATO GIUBBE D'ITALIA - SEZIONE COMUNALE DI CORLEONE", "Via Federico de Maria, 2", "Corleone", "PA"], ["908", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI CAPO D'ORLANDO", "Via Vittorio Emanuele, 7", "Capo D'orlando", "ME"], ["912", "CONFRATERNITA DI MISERICORDIA DI PATTI", "Via XX Settembre, 34", "Patti", "ME"], ["913", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI LIBRIZZI", "Piazza Catena, 4", "Librizzi", "ME"], ["914", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI SANTA LUCIA DEL MELA", "Via Pietro Nenni", "Santa Lucia del Mela", "ME"], ["917", "RANGERS INTERNATIONAL DELEGAZIONE 552.024 LETOJANNI", "Via IV Novembre, 84", "Letojanni", "ME"], ["918", "ASSOCIAZIONE VOLONTARI DI PROTEZIONE CIVILE - BEATO V. SALANITRO - O.N.L.U.S.", "Cortile Traina, 5", "Ciminna", "PA"], ["919", "ASSOCIAZIONE PREVENZIONE FORESTE SICILIA", "Via Provinciale per Riposto, 34", "Acireale", "CT"], ["923", "PUBBLICA ASSISTENZA SOCCORSO ALCAMO", "Via Ruggero Settimo, 125", "Alcamo", "TP"], ["926", "ASSOCIAZIONE NAZIONALE ANGELI PER LA VITA DELEGAZIONE DI CASTELVETRANO", "Via Gaspare Parrino, 13", "Castelvetrano", "TP"], ["927", "FRATERNITA MISERICORDIA DI ADRANO", "Via Pietro Nenni, 20/E", "Adrano", "CT"], ["931", "PROTEZIONE CIVILE P.A. CALTANISSETTA", "Via Melfa, 19", "Caltanissetta", "CL"], ["933", "ASSOCIAZIONE GUARDIA NAZIONALE O.N.L.U.S.", "Via Umberto", "Francavilla di Sicilia", "ME"], ["934", "ASSOCIAZIONE VOLONTARI DONATORI SANGUE -AVIS", "Piazzetta del Volontariato, 1", "Piazza Armerina", "EN"], ["935", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI SANT'ALFIO", "Via V. Emanuele, 4", "Sant'Alfio", "CT"], ["938", "GRUPPO COMUNALE VOLONTARIATO DELLA PROTEZIONE CIVILE DI CASTELDACCIA", "Piazza Matrice", "Casteldaccia", "PA"], ["939", "ASSOCIAZIONE GIOVANILE RIGENERHA", "Via Rosolino Siragusa, 48", "Montemaggiore Belsito", "PA"], ["940", "ARMERINA EMERGENZA", "Via Don Lorenzo Milani, snc presso Parco Urbano San Pietro", "Piazza Armerina", "EN"], ["941", "A.N.T.R.A.S. - ASSOCIAZIONE NAZIONALE DI NUCLEI OPERATIVI DEL SETTORE DEI TRASPORTI E DELLA PROTEZIONE CIVILE - NUCLEO DI COORDINAMENTO CITTA' DI TRAPANI", "Viale Marche, 15", "Trapani", "TP"], ["943", "ASSOCIAZIONE NAZIONALE S.S.T.- SEARCH AND RESCUE - DELEGAZIONE DI RIBERA - ODV", "C / o V illa Comunale ex Ufficio Agricoltura", "Ribera", "AG"], ["946", "FRATERNITA DI MISERICORDIA DI AUGUSTA", "Via Gramsci, 21/23", "Augusta", "SR"], ["950", "ASSOCIAZIONE DI SOCCORSO E VOLONTARIATO ORIZZONTI", "C.da San Filippo, s.n.c.", "Furnari", "ME"], ["951", "RANGERS INTERNATIONAL DELEGAZIONE 552.027 “KALFA“ ROCCAFIORITA", "Via Fontana Nuova", "Roccafiorita", "ME"], ["952", "FALCHI D'ITALIA", "Piazza M. Guidara", "Sant'Angelo di Brolo", "ME"], ["954", "FRATERNITA MISERICORDIA DI VALVERDE", "Via Calì, 43", "Valverde", "CT"], ["956", "IL SOCCORSO - CAVE DI CUSA - ONLUS", "Via Fiume, 5", "Campobello di Mazara", "TP"], ["959", "CONFRATERNITA DI MISERICORDIA DI MARINEO", "Via Agrigento, 42", "Marineo", "PA"], ["961", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI LASCARI", "Piazza Aldo Moro, 6", "Lascari", "PA"], ["962", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI SALAPARUTA", "Via Regione Siciliana", "", "TP"], ["964", "GRUPPO INTERNAZIONALE VOLONTARIATO ARCOBALENO DELEGAZIONE DI MAZARA DEL VALLO 2010 ODV", "Via Inghilterra, 7", "Mazara del Vallo", "TP"], ["966", "ASSOCIAZIONE ITALIANA BELVEDERE", "Via G.Verga, 24", "Piedimonte Etneo", "CT"], ["968", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE E ANTINCENDIO DI ALTOFONTE", "Piazza Falcone e Borsellino, 18", "Altofonte", "PA"], ["969", "GRUPPO SPELEOLOGICO SANTA ELISABETTA", "Via Rosario Livatino, 2", "Santa Elisabetta", "AG"], ["970", "ASSOCIAZIONE NAZIONALE G.O.E. GRUPPO OPERATIVO DI EMERGENZA", "Via G.Amendola, 22", "Salemi", "TP"], ["976", "ASSOCIAZIONE NAZIONALE VIGILI DEL FUOCO IN CONGEDO - VOLONTARIATO E PROTEZIONE CIVILE – DELEGAZIONE DI MAZARA DEL VALLO", "Via Guglielmo Marconi, 37", "Mazara del Vallo", "TP"], ["977", "ASSOCIAZIONE NAZIONALE S.S.T.- SEARCH AND RESCUE-ODV DELEGAZIONE DI PETROSINO", "Via Lazio, 9", "Petrosino", "TP"], ["978", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI AUGUSTA", "Via Principe Umberto, 89", "Augusta", "SR"], ["981", "P.A. SICILIA EMERGENZA ONE", "Via Piedimonte, 13", "Catania", "CT"], ["982", "PEGASO ONLUS", "Via Pietro Castelli, 284", "Messina", "ME"], ["983", "ASSOCIAZIONE AMBIENTE E SALUTE ONLUS", "Via Siracusa, 15", "Siracusa", "SR"], ["987", "E.R.A. SEZIONE DI CALTANISSETTA", "Villaggio Faina, 8/4", "Campofranco", "CL"], ["988", "PROCIV - ARCI N.P.N. ASSOCIAZIONE VOLONTARI PROTEZIONE CIVILE", "Via E.Toti, 6", "Sommatino", "CL"], ["990", "CASTEL GONZAGA ASSOCIAZIONE VOLONTARIATO PROTEZIONE CIVILE", "Via Montepiselli c/o Parrocchia S.Teresa di Gesù Bambino", "Messina", "ME"], ["995", "CONFRATERNITA DI MISERICORDIA DI CATANIA - PORTO", "Piazza San Francesco di Paola, s.n.", "Catania", "CT"], ["998", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI CARLENTINI", "Via F.Morelli", "Carlentini", "SR"], ["999", "ASSOCIAZIONE EUROPEA OPERATORI POLIZIA - SEZIONE DI PORTO EMPEDOCLE", "Via Marconi, 10", "Porto Empedocle", "AG"], ["1000", "P.A. HUMANITAS TRAPANI ODV", "Via Benedetto Valenza,, 27/A", "Trapani", "TP"], ["1004", "P.A. GRUPPO VOLONTARI PROTEZIONE CIVILE NICOSIA", "Via Bernardo di Falco, 20", "Nicosia", "EN"], ["1007", "CONFRATERNITA DI MISERICORDIA DI PALERMO", "Via Salvatore Corleone, 9", "Palermo", "PA"], ["1008", "O.N.V.G.I. ORGANIZZAZIONE NAZIONALE VOLONTARI GIUBBE D'ITALIA - SEZIONE COMUNALE DI PALAZZO ADRIANO", "Via Vittorio Veneto, 11", "Palazzo Adriano", "PA"], ["1010", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI GRATTERI", "Via delle Scuole", "Gratteri", "PA"], ["1014", "ELIGIO' SOCCORSO", "Vico Fusatina, 11", "Gela", "CL"], ["1015", "ASSOCIAZIONE NAZIONALE SAN MARCO", "Vicolo del Castellaccio, 21", "Palermo", "PA"], ["1024", "GUARDIA MARINA NAZIONALE ONLUS", "Via Filippo Patti, 19", "Palermo", "PA"], ["1025", "ATTIVITA' OPERATIVA DI PROTEZIONE CIVILE E SOCIALE", "Via Normanni, 5", "Palermo", "PA"], ["1029", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI SAN TEODORO", "Via Vittorio Emanuele, 13", "San Teodoro", "ME"], ["1032", "CISAR IQ9PX – SEZIONE DI PANTELLERIA", "Corso Umberto, I", "Pantelleria", "TP"], ["1034", "GRUPPO DI VOLONTARI DELLA PROTEZIONE CIVILE ELIMO ERICINI ODV", "Via Alessandro Volta, 47", "Erice", "TP"], ["1036", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI ACIREALE", "Via Felice Paradiso, 55/B", "Acireale", "CT"], ["1038", "ASSOCIAZIONE NAZIONALE VOLONTARIATO E COMUNICAZIONE SOLIDALE RETE 100 PASSI ODV", "Via Giosuè Carducci, 8", "Palermo", "PA"], ["1043", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI FURCI SICULO", "Via Roma, 56", "Furci Siculo", "ME"], ["1044", "ASSOCIAZIONE NAZIONALE VOLONTARIATO ASSISTENZA SOCCORSO SICILIA", "Via Signore Ritrovato, 4", "Barrafranca", "EN"], ["1047", "ASSOCIAZIONE SICILY PROTEZIONE CIVILE AIDONE", "Via Lorenzo D'Arena, 18", "Aidone", "EN"], ["1051", "O. D.V. ASSOCIAZIONE VOLONTARI PROTEZIONE COSTIERA AMBIENTALE", "Via Don Primo Mazzolari, 101", "Mazara del Vallo", "TP"], ["1052", "FIRE RESCUE ALCAMO", "Via Autonomia Siciliana, 12", "Alcamo", "TP"], ["1053", "CONFRATERNITA DI MISERICORDIA DI PIANA DEGLI ALBANESI", "V i a l e R egione Siciliana Sud-Est, 900", "Palermo", "PA"], ["1054", "ASSOCIAZIONE VOLONTARI DI PROTEZIONE CIVILE AQUILE MONTESERRA", "Via della Regione, 26", "Viagrande", "CT"], ["1056", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI SAN GIOVANNI LA PUNTA", "Piazza Europa, 1", "San Giovanni La Punta", "CT"], ["1063", "VOLONTARI DEL TERZO SETTORE", "Via Polveriera, 63", "Messina", "ME"], ["1067", "ASSOCIAZIONE MISERICORDIA DI ENNA", "Via della Resistenza, 111", "Enna", "EN"], ["1071", "ASSOCIAZIONE ORGANIZZAZIONE VOLONTARI DI PROTEZIONE CIVILE DI MONTELEPRE", "Via Circonvallazione, 98", "Montelepre", "PA"], ["1072", "ASSOCIAZIONE NAZIONALE VIGILI DEL FUOCO IN CONGEDO VOLONTARIATO E PROTEZIONE CIVILE DELEGAZIONE DI PALERMO CITTA'", "Piazzetta Pietro Speciale, 9", "Palermo", "PA"], ["1073", "A.V.I.S.P. - ASSOCIAZIONE VOLONTARI ITALIANI SOCCORSO PRIZZI - A.V.I.S.P. - ONLUS", "Parco Urbano Madonna", "Prizzi", "PA"], ["1078", "CORPO VOLONTARI PER IL SOCCORSO", "Via della Passiflora C.da Manfria", "Gela", "CL"], ["1080", "RANGERS INTERNATIONAL DI S. SALVATORE DI FITALIA", "C.da Scrisera", "San Salvatore di Fitalia", "ME"], ["1081", "PSICOLOGI PER I POPOLI - REGIONE SICILIA", "Via G. D'Annunzio, 52", "Piazza Armerina", "EN"], ["1082", "FRATERNITA DI MISERICORDIA “S. MASSIMILIANO KOLBE “ DI REGALBUTO", "Via Palermo, 4", "Regalbuto", "EN"], ["1083", "CORPO VOLONTARI PROTEZIONE CIVILE LEONFORTE", "Via Zona Torretta (ex scuola elementare)", "Leonforte", "EN"], ["1084", "PENSIAMO IN POSITIVO – ODV PALERMO", "Via C. Airoldi 45/47", "Palermo", "PA"], ["1086", "COMUNIONE FRATERNA", "Via Maddalena, 36", "Messina", "ME"], ["1088", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE CITTA' DI PACHINO", "Via dello Stadio, s.n.c.", "Pachino", "SR"], ["1089", "FRATERNITA DI MISERICORDIA DI SAN GIUSEPPE", "Via Monte Bianco", "Letojanni", "ME"], ["1092", "IL GABBIANO ONLUS", "Via C. Barbagallo, 128", "Acireale", "CT"], ["1093", "SEZIONE DI CATANIA ONLUS DEL C.N.G.E.I", "Piazza Santa Maria della Guardia, 25", "Catania", "CT"], ["1096", "FRATERNITA DI MISERICORDIA DI BELPASSO", "Via A. De Gasperi, 5", "Belpasso", "CT"], ["1098", "ASSOCIAZIONE NAZIONALE S.S.T.( SQUADRE DI SOCCORSO TECNICO) ODV SEARCH AND RESCUE", "Via Oberdan, 42", "Canicattì", "AG"], ["1101", "RANGERS SEZIONE PROVINCIALE DI ENNA", "Via Legnano, 22", "Enna", "EN"], ["1103", "CENTRO CINOAGONISTICO SIRACUSANO", "Strada Carancino, 73", "Siracusa", "SR"], ["1104", "ASSOCIAZIONE DI PROTEZIONE ED EMERGENZE CIVILI INGEGNERI", "Via Francesco Crispi, 120", "Palermo", "PA"], ["1107", "EUROPEAN RADIOAMATEURS ASSOCIATION SEZIONE CITTA' DI MISTRETTA", "Via Libertà, 249", "Mistretta", "ME"], ["1112", "ASSOCIAZIONE NUOVA ACROPOLI ODV", "Via Verona, 19", "Catania", "CT"], ["1115", "N.O.E. - NUCLEO OPERATIVO EMERGENZE", "Via XXIV Maggio, 56", "Messina", "ME"], ["1116", "GRUPPO VOLONTARI ITALIA", "Via Forcile, 5", "Catania", "CT"], ["1118", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI POLLINA POEFI", "Piazza Maddalena", "Pollina", "PA"], ["1120", "RANGERS INTERNATIONAL DELEGAZIONE 556-001 NISCEMI", "Viale Mario Gori, 83", "Niscemi", "CL"], ["1121", "ODV/ETS ASSOCIAZIONE EUROPEA OPERATORI POLIZIA (A.E.O.P.) - SEZIONE COMUNALE DI TRAPANI", "Via Luigi Ferrari, 6/A", "Trapani", "TP"], ["1124", "LE AQUILE DI CATANIA SEZIONE LUIGI RULLO", "Viale Mario Rapisardi, 558", "Catania", "CT"], ["1127", "ORGANIZZAZIONE EUROPEA COORDINAMENTO NAZIONALE VOLONTARIATO E IMPRESA SOCIALE E.T.S. DISTACCAMENTO DI MISILMERI", "Via Madonna del Carmelo, 25", "Misilmeri", "PA"], ["1128", "NUCLEO OPERATIVO INTERFORZE SICILIA VOLONTARI DI PREVENZIONE E PROTEZIONE CIVILE", "Via San Giuseppe, 4", "Gangi", "PA"], ["1132", "MARI E MONTI 2004", "C.da Bagni", "Rometta", "ME"], ["1133", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI LONGI", "Via Roma, 2", "Longi", "ME"], ["1135", "CORPO VOLONTARIO DI SOCCORSO IN MARE", "Viale Mario Rapisardi, 14", "Ispica", "RG"], ["1136", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI SICULIANA", "Via Roma, plesso ex scuola elementare", "Siculiana", "AG"], ["1137", "ASSOCIAZIONE NAZIONALE FINANZIERI D'ITALIA SEZIONE DI AGRIGENTO - PROTEZIONE CIVILE", "Via G. Amendola, 2", "Agrigento", "AG"], ["1140", "CROCE COSTANTINIANA DI SAN GIORGIO - SICILIA - ONLUS", "Piazza Unità d'Italia, 11", "Palermo", "PA"], ["1145", "ORGANIZZAZIONE NAZIONALE DI VOLONTARIATO GIUBBE D'ITALIA – SEZIONE COMUNALE DI SANTA FLAVIA", "Via Antonio Carcione, 3", "Santa Flavia", "PA"], ["1148", "V.A.B. VIGILANZA ANTINCENDI BOSCHIVI", "Via Siracusa, 28", "Scordia", "CT"], ["1150", "AIDONE SOCCORSO", "Via Papa Giovanni XXIII, s.n.c.", "Aidone", "EN"], ["1152", "LABORATORIO VERDE DI FAREAMBIENTE TRAPANI", "Piazza Umberto I, 52", "Trapani", "TP"], ["1154", "AVIS COMUNALE DI VILLAFRATI", "Piazza Fratelli Rosselli, 4/A", "Villafrati", "PA"], ["1157", "ASSOCIAZIONE NAZIONALE DI AZIONE SOCIALE", "Via Veronica Gambara, 6", "Palermo", "PA"], ["1161", "CATANIA SUB", "Via G.D'Annunzio, 77", "Catania", "CT"], ["1162", "CORPO VOLONTARI SICILIA TRINACRIA PROTEZIONE CIVILE AIDONE", "Via Giordano, 36", "Aidone", "EN"], ["1163", "A.C.S.A. ASSOCIAZIONE CROCE SICILIANA ASSISTENZA", "Corso dei Mille, 313", "Palermo", "PA"], ["1164", "CONFRATERNITA DI MISERICORDIA DI RAGALNA", "Piazza Cisterna, 1", "Ragalna", "CT"], ["1165", "A.I.Z.A. GUARDIA NAZIONALE (ASSOCIAZIONE ITTICA- ZOOFILA - AMBIENTALE)", "Via Simone Catalano, 113", "Valderice", "TP"], ["1167", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI PETRALIA SOPRANA", "Piazza del Popolo", "Petralia Soprana", "PA"], ["1168", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI MEZZOJUSO", "Piazza Umberto I, 6", "Mezzojuso", "PA"], ["1169", "CONFRATERNITA DI MISERICORDIA DI SANT'ANGELO DI BROLO", "Piazzale Michele Guidara, s.n.c.", "Sant'Angelo di Brolo", "ME"], ["1171", "CONFRATERNITA DI MISERICORDIA DI CATANIA SANTA CROCE", "Villaggio S.Agata zona B, 26/B", "Catania", "CT"], ["1174", "GUARDIE AMBIENTALI SICILIA", "Villaggio Zia Lisa II, 55", "Catania", "CT"], ["1175", "ASSOCIAZIONE DI VOLONTARIATO AMICI DEL SOCCORSO MONSIGNOR VITO PERNICONE", "Piazza Marconi, 8", "Regalbuto", "EN"], ["1177", "GLI ANGELI", "Via S.Vincenzo De Paoli, 15", "Termini Imerese", "PA"], ["1178", "ASSOCIAZIONE NAZIONALE VIGILI DEL FUOCO IN CONGEDO – DELEGAZIONE DI PARTINICO ODV", "Via Scupara, 13", "Partinico", "PA"], ["1180", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI ALCARA LI FUSI", "Via della Rinascita, 16", "Alcara Li Fusi", "ME"], ["1181", "VIGILANTES", "Largo Pescheria ex Mercato Ittico, s.n.c.", "Termini Imerese", "PA"], ["1182", "ASSOCIAZIONE NAZIONALE NUCLEO OPERATIVO EMERGENZE", "Via A. Bertani, 31", "Castelvetrano", "TP"], ["1183", "ORGANIZZAZIONE DI VOLONTARIATO NOVA MILITIA CHRISTI ORDINE DEI CAVALIERI TEMPLARI GUARDIANI DI PACE", "Via Felice Bisazza, 91", "Messina", "ME"], ["1187", "G.I.V.A. - DELEGAZIONE DI CASTELLANA SICULA ODV", "C.da Passo L'Abate, s.n.c.", "Castellana Sicula", "PA"], ["1189", "ULTREYA PEDARA ODV", "Via dei Garofani, 4", "Pedara", "CT"], ["1190", "ASSOCIAZIONE NAZIONALE MARINAI D'ITALIA", "Via Papa Giovanni Paolo II, 3", "Fiumefreddo di Sicilia", "CT"], ["1191", "ASSOCIAZIONE SOCIALE CULTURALE RICREATIVA RISTOWORLD ITALY", "Via Zia Lisa, 153", "Catania", "CT"], ["1192", "ASSOCIAZIONE EUROPEA OPERATORI POLIZIA GRUPPO VALVERDE ONLUS", "Via Seminara, 32", "Valverde", "CT"], ["1193", "A.V.Y. ASSOCIAZIONE VOLONTARIATO YPSIGRO", "Via Li Volsi, 59", "Castelbuono", "PA"], ["1194", "CONFRATERNITA DI MISERICORDIA DI LIBRINO", "Viale Castagnola, 2", "Catania", "CT"], ["1195", "P.A. ANGELI DEL SOCCORSO", "Strada Palermo, 144", "Trapani", "TP"], ["1197", "COORDINAMENTO ASSOCIAZIONI DI VOLONTARIATO FORZA INTERVENTO RAPIDO", "V iale Castagnola, 2", "Catania", "CT"], ["1198", "ASSOCIAZIONE EUROPEA OPERATORI POLIZIA GRUPPO ITTICO VENATORIO ZOOFILO AMBIENTALE SEZIONE NICOLOSI” (CT)", "Via Giacomo Leopardi, 5", "Nicolosi", "CT"], ["1201", "CONFRATERNITA DI MISERICORDIA DI PRIOLO GARGALLO", "Via del Fico 2/4", "Priolo Gargallo", "SR"], ["1202", "A.E.O.P. ASSOCIAZIONE EUROPEA OPERATORI POLIZIA - SEZIONE AMBIENTALE PALERMO", "Via Ugo la Malfa, 62", "Palermo", "PA"], ["1204", "G.I.V.A. GRUPPO INTERNAZIONALE VOLONTARIATO ARCOBALENO DELEGAZIONE DI TRAPANI – ODV", "Via Tito Livio, 7", "Trapani", "TP"], ["1205", "GUARDIA NAZIONALE A.E.Z.A – ASSOCIAZIONE ECOLOGICA ZOOFILA AMBIENTALE", "C.da Bosco, 499", "Marsala", "TP"], ["1207", "NUOVA ACROPOLI AUGUSTA ODV (ETS)", "Viale Italia, 262", "Augusta", "SR"], ["1208", "LEGAMBIENTE DEI PELORITANI", "C/o CAI Via Natoli, 20", "Messina", "ME"], ["1209", "GRUPPO VOLONTARI SICILIA", "Via Felice Fontana, 23", "Catania", "CT"], ["1212", "A.VO.TE.AM. GRUPPO VOLONTARI PROTEZIONE CIVILE AMBIENTALE E TERRITORIALE", "Via Messina, 142", "Bronte", "CT"], ["1214", "G.I.V.A - GRUPPO INTERNAZIONALE VOLONTARIATO ARCOBALENO DELEGAZIONE DI MARSALA – ODV", "C.da Darà, 422", "Marsala", "TP"], ["1216", "U.G.E.S. S.O.S. PALERMO - URGENTE GESTIONE EMERGENZE SOCIALI E SERVIZI OPERATIVI DI SOCCORSO PALERMO", "Via Alcide de Gasperi, 70", "Palermo", "PA"], ["1217", "ASSOCIAZIONE NAZIONALE VIGILI DEL FUOCO IN CONGEDO VOLONTARIATO E PROTEZIONE CIVILE DELEGAZIONE ZISA", "Via Sebastiano Camarrone, 47/A", "Palermo", "PA"], ["1222", "RIVIVERE A COLORI SAPONARA", "Via Dafne, s.n.c.", "Saponara", "ME"], ["1224", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI LICATA", "P i a zza Progresso, 10", "Licata", "AG"], ["1225", "ASSOCIAZIONE MAGNA VIS", "V i a Marco Polo, 54", "Catania", "CT"], ["1227", "ELPIS NAVE OSPEDALE ONLUS", "Via Generale Domenico Giglio, 3", "Trapani", "TP"], ["1228", "RANGERS INTERNATIONAL DELEGAZIONE 552.029 BROLO", "Via Statale, 38", "Brolo", "ME"], ["1229", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI TORRENOVA", "Via Benedetto Caputo", "Torrenova", "ME"], ["1232", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI PIRAINO", "Via Dante Alighieri, 7", "Piraino", "ME"], ["1233", "GUARDIA NAZIONALE A.E.Z.A", "Via Cavour, 119", "Noto", "SR"], ["1234", "I CARE ONLUS", "Via Malta, 8", "Cefalù", "PA"], ["1235", "ORGANIZZAZIONE PER LA LOGISTICA E MEZZI SPECIALI MAGNA VIS BAGHERIA OdV", "Vicolo Palma, 2", "Bagheria", "PA"], ["1237", "A.I.C.E.S. ASSOCIAZIONE PER L'IMPEGNO CIVILE E SOCIALE", "Via San Lorenzo, 154", "Palermo", "PA"], ["1239", "RANGERS INTERNATIONAL DELEGAZIONE 552.020 GIOIOSA MAREA", "Corso Uliveto", "Gioiosa Marea", "ME"], ["1240", "SAFETY-E.T.S.", "Piazza Stazione, s.n.c.", "Brolo", "ME"], ["1241", "CONFEDERAZIONE G.I.V.A.", "Piazza Graziella Campagna, 13", "Rometta Marea", "ME"], ["1242", "ORGANIZZAZIONE EUROPEA COORDINAMENTO NAZIONALE VOLONTARIATO E IMPRESA SOCIALE ETS", "P i a z z a S t a z i o n e , s . n . c .", "Brolo", "ME"], ["1246", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI POZZALLO", "Viale Australia, s.n.c. c/o centro C.O.M.", "Pozzallo", "RG"], ["1247", "MILO DOG SPORTING", "Via Salemi, 135 c/da Crociferi", "Trapani", "TP"], ["1248", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI FORZA D'AGRO'", "Piazza Giovanni XXIII", "Forza D'Agrò", "ME"], ["1249", "RANGERS INTERNATIONAL DELEGAZIONE 552.001 CASTELL'UMBERTO", "Via Generale Cascino, s.n.c.", "Castell'Umberto", "ME"], ["1250", "GUARDIA COSTIERA AUSILIARIA O.N.L.U.S. - REGIONE SICILIA", "Via Giuseppe La Villa, 11", "Palermo", "PA"], ["1251", "COORDINAMENTO MAGNA VIS - SICILIA", "Piazza Mulini, 13", "Trabia", "PA"], ["1253", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI SCALETTA ZANCLEA", "Piazza Municipio, s.n.c.", "Scaletta Zanclea", "ME"], ["1254", "VOLONTARI ISOLA DI STROMBOLI", "Via Fabio Filzi, 35", "Lipari", "ME"], ["1257", "ASSISTENZA E VOLONTARIATO SOLIDALE", "Via Vittorio Emanuele, 58", "Montelepre", "PA"], ["1259", "I FALCHI - ONLUS DI PROTEZIONE CIVILE E VIGILANZA AMBIENTALE (ENTE UMANITARIO )", "Via Capitini, 46", "Palma di Montechiaro", "AG"], ["1261", "GUARDIA COSTIERA AUSILIARIA CENTRO OPERATIVO DI SCIACCA", "Via Marche, 3", "Sciacca", "AG"], ["1262", "NEW CITTA' DI CATANIA – ONLUS", "Via Cardi, 98/100", "Catania", "CT"], ["1264", "P.A. EUROSOCCORSO – ODV", "Piazzale Papa Giovanni II", "Trapani", "TP"], ["1265", "ODV FLY TEAM", "Strada Brisciano, 21 C/da Marausa", "Misiliscemi", "TP"], ["1266", "ORGANIZZAZIONE EUROPEA COORDINAMENTO NAZIONALE VOLONTARIATO IMPRESA SOCIALE ETS – DISTACCAMENTO DI MESSINA", "Via La Farina, 280", "Messina", "ME"], ["1267", "GRUPPO VOLONTARIO DI PROTEZIONE CIVILE DELL'ASSOCIAZIONE NAZIONALE DELLA POLIZIA DI STATO- SEZIONE DI CATANIA", "Via Monsignor Ventimiglia,18", "Catania", "CT"], ["1268", "COMUNITA' MASCI MESSINA 3 – STELLA POLARE", "Via Comunale Santo, s.n. c/o parrocchia S. Maria della Consolazione", "Messina", "ME"], ["1269", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI LIPARI", "Piazza Mazzini, 1", "Lipari", "ME"], ["1270", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI RACCUJA", "Piazza 2 Giugno, 1", "Raccuja", "ME"], ["1273", "ASSOCIAZIONE RADIOAMATORI PELORITANI – ODV", "Via Scite, 13 – 9b scala C", "Messina", "ME"], ["1274", "FRATERNITA DI MISERICORDIA DI CATANIA", "Via Etnea, 595", "Catania", "CT"], ["1276", "G.E.P.A.- SICILIA-ODV", "Via Centamore, 159", "Biancavilla", "CT"], ["1277", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI PALMA DI MONTECHIARO", "Via Fiorentino, 89", "Palma di Montechiaro", "AG"], ["1278", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI GRAMMICHELE", "Piazza Carlo Maria Carafa, 1", "Grammichele", "CT"], ["1279", "GRUPPO INTERNAZIONALE VOLONTARIATO ARCOBALENO – G.I.V.A DELEGAZIONE DI PARTANNA – ODV", "Via Palermo, 126", "Partanna", "TP"], ["1280", "MISERICORDIA DI MAZARA DEL VALLO – SAN VITO", "Via Giotto, 23", "Mazara del Vallo", "TP"], ["1282", "ASSOCIAZIONE NAZIONALE VIGILI DEL FUOCO IN CONGEDO -DELEGAZIONE TORRETTA ODV", "Via S.Quasimodo, 20", "Torretta", "PA"], ["1284", "GRUPPO COMUNALE VOLONTARITO DI PROTEZIONE CIVILE DI VILLAFRANCA TIRRENA", "Via Don Luigi Sturzo, 3", "Villafranca Tirrena", "ME"], ["1285", "M.A.S.C.I. PALERMO 3 AQUILE RANDAGIE", "Via Mura di San Vito, 12", "Palermo", "PA"], ["1287", "CROCE BIANCA", "Via Pelligra, s.n.c.", "Misilmeri", "PA"], ["1288", "GUARDIA COSTIERA VOLONTARIA C. O. MESSINA", "Via Consolare Pompea – Località Fortino, s.n.", "Messina", "ME"], ["1289", "FRATERNITA' DI MISERICORDIA DI GIARRE", "Piazza Ungheria, 11", "Giarre", "CT"], ["1290", "FARMACISTI VOLONTARI PER LA PROTEZIONE CIVILE SEZ IONE CATANIA", "Via G. D'Annunzio, 43/A", "Catania", "CT"], ["1292", "CROCE ROSSA ITALIANA COMITATO DI CATANIA", "Via Etnea, 353", "Catania", "CT"], ["1293", "ASSOCIAZIONE NAZIONALE VIGILI DEL FUOCO IN CONGEDO VOLONTARIATO E PROTEZIONE CIVILE - COORDINAMENTO REGIONALE SICILIA", "P i a z z e tta Pietro Speciale, 9", "Palermo", "PA"], ["1294", "CROCE ROSSA ITALIANA - COMITATO DI PALERMO", "Via Pietro Nenni, 75", "Palermo", "PA"], ["1295", "TRISCELE NUCLEO PROTEZIONE CIVILE AUTONOMA SICILIANA", "Via Fratelli Campo, 46", "Palermo", "PA"], ["1296", "P.A EMERGENCY LIFE", "Via Firenze, 6", "Porto Empedocle", "AG"], ["1300", "S.S.T. SQUADRE DI SOCCORSO TECNICO – DELEGAZIONE CINOFILI ARCHIMEDE SIRACUSA ODV", "Via Romagna, 41", "Siracusa", "SR"], ["1301", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI MOTTA SANT'ANASTASIA", "Piazza Umberto, 22", "Motta Sant'Anastasia", "CT"], ["1303", "ASSOCIAZIONE PUBBLICA ASSISTENZA TUTELA AMBIENTE VOLONTARIATO E PROTEZIONE CIVILE PALERMO 4", "Passaggio Gino Marinuzzi, 4", "Palermo", "PA"], ["1305", "ASSOCIAZIONE VOLONTARI NUCLEO OPERATIVO VALLE JATO", "Via Acquanuova, 44", "San Giuseppe Jato", "PA"], ["1306", "ASSOCIAZIONE NAZIONALE VIGILI DEL FUOCO IN CONGEDO DELEGAZIONE DI BAGHERIA 1 ODV", "Via Giuseppe Mulè, 43", "Bagheria", "PA"], ["1308", "ASSOCIAZIONE NAZIONALE PUBBLICA ASSISTENZA E PROTEZIONE CIVILE LUCE", "Via Domenico La Bruna, 1", "Trapani", "TP"], ["1310", "G.I.V.A. - GRUPPO INTERNAZIONALE VOLONTARIATO ARCOBALENO - DELEGAZIONE COMUNALE DI PACECO", "Via L.Ariosto, 26", "Paceco", "TP"], ["1312", "GUARDIA COSTIERA AUSILIARIA DI TRAPANI- ODV", "Via Giuseppe La Russa, 28", "Erice", "TP"], ["1315", "A.C.S. ASSOCIAZIONE CANI DA SALVATAGGIO", "Via Apollo, 34", "Palermo", "PA"], ["1316", "A.E.Z.A. GUARDIA NAZIONALE COMANDO PROVINCIALE MONREALE", "Via Casale Settimo, 6/Q", "Palermo", "PA"], ["1319", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI LENI", "Via Libertà, 33", "Leni (Isola Salina)", "ME"], ["1323", "CROCE ROSSA ITALIANA - COMITATO DEL TIRRENO NEBRODI", "Piazza Stazione, s.n.c.", "Brolo", "ME"], ["1324", "CROCE ROSSA ITALIANA – COMITATO DI MILAZZO - ISOLE EOLIE – ODV", "Via San Paolino, 1", "Milazzo", "ME"], ["1325", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI PIETRAPERZIA", "Via San Domenico, 9", "Pietraperzia", "EN"], ["1326", "P.A. PROCIVIS", "Via Barrile, 9", "Licata", "AG"], ["1327", "TYNDARIS ONLUS", "Via Case Nuove Russo, 5", "Patti", "ME"], ["1328", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI SAVOCA", "Piazza D'Annunzio, 1", "Savoca", "ME"], ["1330", "NUCLEO OPERATIVO INTERFORZE SICILIA", "Via Suffia, 11", "Aidone", "EN"], ["1331", "CROCE ROSSA ITALIANA- COMITATO DI CALTANISSETTA", "Via Xiboli, 345 ex stabilimento Averna", "Caltanissetta", "CL"], ["1332", "PUBBLICA ASSISTENZA PROCIVIS DI RIPOSTO", "Via Archimede, s.n.", "Riposto", "CT"], ["1333", "ASSOCIAZIONE PROTEZIONE CIVILE SECURITY", "Via dei Peloritani, 118", "Biancavilla", "CT"], ["1335", "RANGER SEZIONE PROVINCIALE DI CATANIA", "C.da Pernicotto", "Adrano", "CT"], ["1336", "ORGANIZZAZIONE EUROPEA VOLONTARI DI PREVENZIONE E PROTEZIONE CIVILE- DISTACCAMENTO DI SANT'AGATA DI MILITELLO", "Via Duca D'Aosta, 66", "Sant'Agata di Militello", "ME"], ["1337", "C.O.E.S. COORDINAMENTO OPERATIVO EMERGENZE", "Via Oliveto I, 30", "Sant'Agata di Militello", "ME"], ["1338", "V.A.B. VIGILANZA ANTINCENDI BOSCHIVI SICILIA", "Viale Madre Teresa di Calcutta, s.n.c.", "Mineo", "CT"], ["1339", "UNITI PER LA VITA", "Corso Umberto, 94", "Sciara", "PA"], ["1340", "ASSOCIAZIONE NAZIONALE VIGILI DEL FUOCO IN CONGEDO CARINI ODV", "Via Pastificio, 5/A", "Carini", "PA"], ["1341", "ASSOCIAZIONE NAZIONALE VOLONTARIATO E COMUNICAZIONE SOLIDALE SFERRACAVALLO ODV", "Via Tabò, 39", "Palermo", "PA"], ["1342", "GRUPPO COMUNALE DI VOLONTARIATO DI PROTEZIONE CIVILE DI PANTELLERIA", "Piazza Cavour, 15", "Pantelleria", "TP"], ["1343", "A.R.I. CASTELVETRANO", "Via Piersanti Mattarella, 110", "Castelvetrano", "TP"], ["1344", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI SALEMI", "Via San Matteo", "Salemi", "TP"], ["1345", "ASSOCIAZIONE NAZIONALE CARABINIERI SEZIONE DI MESSINA GRUPPO DI FATTO ODV", "Via San Giovanni di Malta, 1/B", "Messina", "ME"], ["1347", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI SAN CATALDO", "Piazza Papa Giovanni XXIII", "San Cataldo", "CL"], ["1348", "GUARDIA COSTIERA AUSILIARIA ONLUS CENTRO REGIONALE DELLA SICILIA -GRUPPO OPERATIVO DI LICATA", "Via Martiri della Libertà, 21", "Licata", "AG"], ["1350", "ROYAL WOLF RANGERS", "Via Fratelli Belleo, 58/B", "Ragusa", "RG"], ["1351", "ITALIAN HELP SYSTEM FOR LIFE - IHS ODV", "V i a A . Sangiuliano, 319/321", "Catania", "CT"], ["1354", "PSICOLOGI PER I POPOLI SICILIA - ODV", "Via Maletto, 3", "Palermo", "PA"], ["1356", "ERA ACQUEDOLCI", "Via Dante, 28", "Acquedolci", "ME"], ["1357", "EUROPEAN RADIOAMATEURS ASSOCIATION – E.R.A. SEZIONE PROVINCIALE DI AGRIGENTO", "Via Michelangelo, 3", "Santa Margherita del Belice", "AG"], ["1360", "IL CAMMINO", "Via Leonardo da Vinci, 20", "Ragalna", "CT"], ["1361", "ASSOCIAZIONE NUCLEO OPERATIVO ASSISTENZA E SOCCORSO", "Via S. D'Acquisto, s.n.", "Castellammare del Golfo", "TP"], ["1362", "GUARDIA RURALE AUSILIARA CATANIA ODV", "Via Fontanelle, 94", "Caltagirone", "CT"], ["1364", "CROCE ROSSA ITALIANA - COMITATO MASCALUCIA ODV", "Via Francesco Petrarca, 26", "Mascalucia", "CT"], ["1365", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI MARIANOPOLI", "Viale della Regione Siciliana, 5", "Marianopoli", "CL"], ["1366", "FLY TEAM DELEGAZIONE CASTELLAMMARE DEL GOLFO", "Via Segesta, 11", "Castellammare del Golfo", "TP"], ["1367", "ASSOCIAZIONE DI VOLONTARIATO E PROTEZIONE CIVILE GODRANO", "Via Raffaele Jozzino, s.n.c.", "Godrano", "PA"], ["1368", "EVERGREEN", "Via San Giuseppe, 38", "Monreale", "PA"], ["1369", "ANVCS GUARDIE AMBIENTALI ODV", "Via Costanza, 26", "Borgetto", "PA"], ["1370", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI ISNELLO", "Corso Vittorio Emanuele, 14", "Isnello", "PA"], ["1371", "OVERLAND", "Via Domenico Faucello, 16/B", "Messina", "ME"], ["1372", "A.R.E. ASSOCIAZIONE RADIOAMATORI EOLIANI", "Via Culia, s.n.c.", "Lipari", "ME"], ["1373", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI GIBELLINA", "Via Luigi Sturzo, 1", "Gibellina", "TP"], ["1374", "RANGERS D’ITALIA SEZIONE SICILIA ODV", "Via Padre Giordano Cascini, s.n.", "Palermo", "PA"], ["1375", "GIUBBE VERDI COMPAGNIA DI CASTROFILIPPO -ODV", "Via Michelangelo, 9", "Castrofilippo", "AG"], ["1376", "CONFRATERNITA DI MISERICORDIA DI ROSOLINI ODV", "Via Maltese, 65", "Rosolini", "SR"], ["1377", "COORDINAMENTO ZONALE DELLE MISERICORDIE CATANIA -ODV", "Via Pizzo Ferro, 5", "Pedara", "CT"], ["1378", "ASSOCIAZIONE NAZIONALE SST NPCA CASTELDACCIA ODV", "Via Strada Quattro Finaite, 4", "Casteldaccia", "PA"], ["1379", "NUCLEO OPERATIVO INTERFORZE SICILIA – VOLONTARI DI PREVENZIONE E PROTEZIONE CIVILE", "Via Vittorio Emanuele, 7", "Castel di Lucio", "ME"], ["1380", "COMPAGNIA GIUBBE VERDI S. CROCE DI CASTELTERMINI -ODV", "Via G.Matteotti, s.n .", "Casteltermini", "AG"], ["1381", "G.I.V.A. DELEGAZIONE MAZARA DEL VALLO 2019 – ODV", "Via del Fenicottero, 15", "Mazara del Vallo", "TP"], ["1382", "A.N.GI.V. SICILIA ODV", "Via Scibilia, 1", "Bronte", "CT"], ["1383", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI MONTALBANO ELICONA", "Piazza Maria SS.della Provvidenza, s.n.c.", "Montalbano Elicona", "ME"], ["1384", "ASSOCIAZIONE NAZIONALE VIGILI DEL FUOCO IN CONGEDO DELEGAZIONE DI CONTESSA ENTELLINA", "Via Cucci, 23", "Contessa Entellina", "PA"], ["1385", "SDAV – SECURITY DEPARTMENT ASSOCIAZIONE DI VOLONTARIATO - ODV", "Via Antonio Mongitore, 1", "Agrigento", "AG"], ["1387", "ODV- ASSOCIAZIONE VOLONTARI PROTEZIONE CIVILE BUTERA", "Via Boscaglia, 1", "Butera", "CL"], ["1388", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI CASTRONOVO DI SICILIA", "Vioa Luigi Tirrito, 1", "Castronovo di Sicilia", "PA"], ["1389", "GRUPPO INTERNAZIONALE DEL VOLONTARIATO ARCOBALENO DELEGAZIONE DI VALDINA – ODV", "Via San Nicola, 40/B", "Valdina", "ME"], ["1390", "PUBBLICA ASSISTENZA PROTEZIONE CIVILE NISSORIA", "Via Torre, s.n.c.", "Nissoria", "EN"], ["1391", "AFCT ASSOCIAZIONE FALCO CATANIA – ODV", "Via Spoto, 28", "Catania", "CT"], ["1392", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI RAGALNA", "Via Claudio Monteverdi, 2", "Ragalna", "CT"], ["1393", "ASSOCIAZIONE ITALIANA DELLA CROCE ROSSA COMITATO DI ENNA", "Via Legnano, 22 bis", "Enna", "EN"], ["1394", "G.I.V.A. GRUPPO INTERNAZIONALE VOLONTARIATO ARCOBALENO – DELEGAZIONE DI SALEMI", "Via Monaci, 45", "Salemi", "TP"], ["1395", "CORPO DI PUBBLICA ASSISTENZA PROTEZIONE CIVILE TEMPLARE FEDERICIANA ODV", "Via Alessandro Italia, s.n.c.", "Palazzolo Acreide", "SR"], ["1396", "GUARDIE TERRITORIALI E.T.S.", "V ia G. Crispi, 131", "Palermo", "PA"], ["1397", "VERA ODV", "Via Alfredo Maria Mazzei, 14", "Nicolosi", "CT"], ["1398", "OASI DEL CAVALLO ENGEA GARIBALDINI VOLONTARI", "Via Ceraulo, 23", "Monreale", "PA"], ["1399", "ODV GANZARIA EMERGENZA", "Via Salvatore Lo Tauro, 10", "San Michele di Ganzaria", "CT"], ["1400", "COORDINAMENTO TERRITORIALE VOLONTARIATO PROTEZIONE CIVILE E SOCIALE CO.TE.R ODV", "Via Normanni, 5", "Palermo", "PA"], ["1401", "E.R.A. (EUROPEAN RADIOAMATEURS ASSOCIATION) -SEZIONE DI CORLEONE ODV", "Via Salvatore Aldisio, 161", "Corleone", "PA"], ["1402", "ASSOCIAZIONE VIGILI DEL FUOCO VOLONTARI SEZIONE DI ENNA", "Via Basilicata, 6", "Troina", "EN"], ["1405", "ATTIVITA' OPERATIVA PROTEZIONE CIVILE E SOCIALE ODV", "Via Vinciguerra, 35", "Polizzi Generosa", "PA"], ["1406", "SERVIZI PROTEZIONE CIVILE E SOCIALE ODV", "Via Bergamo, 27", "Palermo", "PA"], ["1407", "O.A.S.S. DELLA CROCE GIOVANNEA ODV – SEZIONE DI BORGETTO (PA)", "Via della Resistenza, 3", "Borgetto", "PA"], ["1408", "GRUPPO COMUNALE VOLONTARI DI PROTEZIONE CIVILE DI OLIVERI", "Piazza Luigi Pirandello, 1", "Oliveri", "ME"], ["1409", "NUCLEO PROTEZIONE CIVILE SANTA MARIA DI LICODIA ODV", "Strada Trainara, 3", "Santa Maria di Licodia", "CT"], ["1410", "NOIS ODV MILITELLO ROSMARINO NUCLEO OPERATIVO INTERFORZE SICILIA", "C.da Santa Maria, s.n.", "Militello Rosmarino", "ME"], ["1411", "RANGERS INTERNATIONAL DELEGAZIONE PIRAINO", "Via Dante Alighieri, 16", "Piraino", "ME"], ["1412", "AMBULANZE MESSINA SOCCORSO ODV", "Via Edoardo Boner, isolato 480, 35", "Messina", "ME"], ["1414", "ASSOCIAZIONE NAZIONALE ELIOS DELEGAZIONE COMUNALE DI ROCCAVALDINA ODV", "Via Panoramica, 6", "Roccavaldina", "ME"], ["1415", "APS DIPARTIMENTO SOLIDARIETA' EMERGENZE FIC SICILIA", "Via Sardegna, 36", "Enna", "EN"], ["1416", "NOIS ODV CAPIZZI NUCLEO OPERATIVO INTERFORZE SICILIA", "Via Piazza San Giacomo, 1", "Capizzi", "ME"], ["1417", "CORPO SANITARIO EMERGENZA E SOCCORSO ODV - ETS", "Corso IV aprile, 11", "Misilmeri", "PA"], ["1418", "ARI RAGUSA ODV ASSOCIAZIONE RADIOAMATORI ITALIANI", "Via S.P. 2 5 k m 6 + 450 c.da T r ib a st o n e", "Ragusa", "RG"], ["1419", "VIGILANZA AMBIENTALE PELORITANI ODV", "Viale della Pace, 12", "Monforte San Giorgio", "ME"], ["1420", "CROCE ROSSA ITALIANA- COMITATO DI ACIREALE - ODV", "Via Lazzaretto, 14 B/C", "Acireale", "CT"], ["1421", "ASSOCIAZIONE NAZIONALE VIGILI DEL FUOCO VOLONTARI DELEGAZIONE DI SALEMI", "C.da Gorgazzo, s.n.c.", "Salemi", "TP"], ["1422", "ODV GRUPPO DI VOLONTARIATO – PROTEZIONE CIVILE E AMBIENTALE ASSOCIAZIONE NAZIONALE DEL FANTE SEZIONE PROVINCIALE DI PALERMO", "Piazza San Francesco di Paola, 37", "Palermo", "PA"], ["1423", "ORGANIZZAZIONE PER LA LOGISTICA E MEZZI SPECIALI MAGNAVIS ODV- GRUPPO MONFORTE SAN GIORGIO", "Viale della Pace, 12", "Monforte San Giorgio", "ME"], ["1424", "CROCE ROSSA ITALIANA- COMITATO DI ROCCALUMERA E TAORMINA", "Via Collegio, 1", "Roccalumera", "ME"], ["1425", "G.I.V.A. GRUPPO INTERNAZIONALE VOLONTARIATO ARCOBALENO DELEGAZIONE DI ROMETTA", "Piazza Graziella Campagna, 13", "Rometta", "ME"], ["1426", "CROCE ROSSA ITALIANA- COMITATO DI TRAPANI", "Viale delle Province Casa Santa", "Erice", "TP"], ["1427", "ASS. ALBATROSA PACECO 2024 – ODV – SICILIA", "Via Marsala, 54", "Paceco", "TP"], ["1428", "CROCE ROSSA ITALIANA - COMITATO DI ALCAMO", "Strada Statale 113 km 326,00, 47", "Alcamo", "TP"], ["1429", "FIF SICILIA 4x4 – PROTEZIONE CIVILE", "XIII Traversa, 41", "Belpasso", "CT"], ["1430", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI LINGUAGLOSSA", "Piazza Municipio, 23", "Linguaglossa", "CT"], ["1431", "ASSOCIAZIONE NAZIONALE VIGILI DEL FUOCO IN CONGEDO – DELEGAZIONE DI CUSTONACI ODV", "Via Scucina, 150", "Custonaci", "TP"], ["1432", "ASSOCIAZIONE NAZIONALE VIGILI DEL FUOCO IN CONGEDO - DELEGAZIONE DI VALDERICE ODV", "Piazza G.Verdi, s.n.c.", "Valderice", "TP"], ["1433", "OPERE DI ASSISTENZA SOCCORSO E SOLIDARIETA' DELLA CROCE GIOVANNEA SEZIONE DI CINISI ETS – ODV", "Piazza Pietro Venuti, s.n.c.", "Cinisi", "PA"], ["1434", "NEW GIOIOSA SOCCORSO ODV", "Via Umbero I, 66", "Gioiosa Marea", "ME"], ["1435", "ASSOCIAZIONE NAZIONALE CARABINIERI COORDINAMENTO REGIONALE SICILIA ODV", "Piazza degli Aragonesi, 19/A", "Palermo", "PA"], ["1436", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI BLUFI", "Piazza Municipio, 1", "Blufi", "PA"], ["1437", "ASSOCIAZIONE NAZIONALE S.S.T. SEARCH AND RESCUE", "Via G.Oberdan, 42", "Canicattì", "AG"], ["1438", "ORGANIZZAZIONE NAZIONALE GIUBBE D'ITALIA VOLONTARIATO - ODV SEZIONE PALERMO", "Via Calogero Nicastro, 1", "Palermo", "PA"], ["1439", "SOCCORIAMOLI ODV", "Via del Santo, 52", "Messina", "ME"], ["1440", "PIAZZA ARMERINA SOCCORSO-ODV", "Via Nino Martoglio, 2", "Piazza Armerina", "EN"], ["1441", "CNGEI SEZIONE SCOUT DI NISCEMI BADEN POWELL – APS", "Via Asti, s.n.c.", "Niscemi", "CL"], ["1442", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI S. STEFANO DI QUISQUINA", "Via Roma, 142", "Santo Stefano Quisquina", "AG"], ["1443", "GUARDIA COSTIERA AUSILIARIA CENTRO OPERATIVO DELLE ISOLE EOLIE LIPARI ODV", "Via Vittorio Emanuele, 30", "Lipari", "ME"], ["1444", "ORGANIZZAZIONE NAZIONALE VOLONTARIATO GIUBBE D'ITALIA ODV SEZIONE BAGHERIA", "Via Mulè, 2", "Bagheria", "PA"], ["1445", "ASSOCIAZIONE UNIONE NAZIONALE ARMA CARABINIERIVOLONTARIATO E PROTEZIONE CIVILE ODV – DELEGAZIONE DI LICATA", "Via Della Salvia, 26", "Licata", "AG"], ["1446", "ASSOCIAZIONE ITALIANA SICUREZZA AMBIENTALE “ODV”", "Via Rocca, 21", "Licata", "AG"], ["1447", "SALEMI SOCCORSO", "C.da Filci, 1083", "Trapani", "TP"], ["1448", "RANGERS INTERNATIONAL ODV DELEGAZIONE DI PATTI", "Via Cattaneo, 14", "Patti", "ME"], ["1449", "ARI-SEZIONE DI TERMNI IMERESE ODV", "Via Capaci, 11", "Bagheria", "PA"], ["1450", "RANGERS INTERNATIONAL DELEGAZIONE DI MOTTA D'AFFERMO ODV", "Via Santa Maria, 5", "Motta D'Affermo", "ME"], ["1451", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI CORLEONE", "Piazza Garibaldi, 1", "Corleone", "PA"], ["1452", "ASSOCIAZIONE NAZIONALE CARABINIERI – NUCLEO REGIONALE DI VOLONTARIATO E PROTEZIONE CIVILE – ISPETTORATO SICILIA ODV", "Piazza degli Aragonesi, 19/A", "Palermo", "PA"], ["1453", "CORPO NAZIONALE GUARDIA AI FUOCHI – G.O.I.-GUARDIA AI FUOCHI ETS/ODV", "Via Giove c/da Serroni, 2", "Mazara del Vallo", "TP"], ["1454", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI BRONTE", "Via Arcangelo Spedalieri, 40", "Bronte", "CT"], ["1455", "RANGERS INTERNATIONAL DISTRETTO 055 SICILIA O.D.V.", "Via Generale Cascino", "Castell'Umberto", "ME"], ["1456", "S.S.T. ODV SQUADRE DI SOCCORSO TECNICO – DELEGAZIONE DI PORTO EMPEDOCLE", "Via Siracusa, 12", "Porto Empedocle", "AG"], ["1457", "ORGANIZZAZIONE PER LA LOGISTICA E MEZZI SPECIALI “MAGNA VIS”- GRUPPO LOCALE DI PALAZZO ADRIANO", "C.da Aicella, s.n.c.", "Palazzo Adriano", "PA"], ["1459", "ASSOCIAZIONE PROMOZIONE SOCIALE GUARDIE AMBIENTALI EUROPEE E PROTEZIONE CIVILE", "Via A. De Gasperi, 52", "Trappeto", "PA"], ["1460", "ASSOCIAZIONE I FALCHI DELEGAZIONE DI SCIACCA -ODV", "Cortile Liguori, 63", "Sciacca", "AG"], ["1461", "ASSOCIAZIONE NAZIONALE VOLONTARIATO E COMUNICAZIONE SOLIDALE VILLABATE PFP ODV", "Via Giuseppe Mazzini, 1", "Villabate", "PA"], ["1462", "S.E.A. SERVIZI EMERGENZA ASSISTENZIALI", "Via Antonio Marinuzzi, 145", "Palermo", "PA L"], ["1463", "ASSOCIAZIONE NAZIONALE DI VOLONTARIATO DI PROTEZIONE CIVILE AQUILE", "Via Puglia, 1", "Campofelice di Roccella", "PA"], ["1464", "ODV PROCIV SANITA' BASCHI NERI", "Via Briseide, 1", "Palermo", "PA"], ["1466", "CROCE ROSSA ITALIANA – COMITATO DI MAZARA DEL VALLO ODV", "Corso Armando Diaz, 113", "Mazara del Vallo", "TP"], ["1468", "GUARDIA SICILIANA AMBIENTALE", "Via Foibe Istriane, 3", "Gravina di Catania", "CT"], ["1469", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI TERME VIGLIATORE", "Via del Mare n. 69", "Terme Vigliatore", "ME"], ["1470", "ASSOCIAZIONE ITALIANA PROTEZIONE ANIMALI A.I.P.A. - APS", "Via Serve della Divina Provvidenza, 18", "Catania", "CT"], ["1471", "GRUPPO DI VOLONTARIATO E PROTEZIONE CIVILE DELLA ASSOCIAZIONE NAZIONALE POLIZIA DI STATO", "Via Canonico Nunzio Agnello, 17", "Siracusa", "SR"], ["1472", "RANGERS INTERNATIONAL DELEGAZIONE HIDRA", "Via Dei Combattenti, 18", "Francofonte", "SR"], ["1473", "ASSOCIAZIONE VOLONTARI DI PROTEZIONE CIVILE FERLA ODV", "Via Calvario, 1", "Ferla", "SR"], ["1474", "ASSOCIAZIONE RANGERS INTERNATIONAL DELEGAZIONE TERRE SICANE SAMBUCA DI SICILIA", "Via Stazione, 44", "Sambuca di Sicilia", "AG"], ["1475", "CROCE ROSSA ITALIANA – COMITATO DI AVOLA ODV", "Via Santa Lucia, 86", "Avola", "SR"], ["1476", "ASSOCIAZIONE VOLONTARI EOLIE ORGANIZZAZIONE DI VOLONTARIATO", "Vicolo Diana, s.n.c.", "Lipari", "ME"], ["1477", "ON.V.G.I. SEZIONE DI TRAPANI", "Via Vincenzo Fazio, 22 Fulgatore", "Trapani", "TP"], ["1478", "AVIS PROVINCIALE AGRIGENTO", "Via Pompei, snc", "Sciacca", "AG"], ["1479", "GRUPPO SOCCORRITORI ONLUS", "Via Nicolò della Valle, 123", "Alcamo", "TP"], ["1480", "SEZIONE E.R.A. DI ALTAVILLA MILICIA ODV", "C.da Piano Olivo, s.n.c.", "Altavilla Milicia", "PA"], ["1481", "ASSOCIAZIONE DI VOLONTARIATO PER LA PROTEZIONE CIVILE (P.C.B.)", "Via Castriota, 60", "Biancavilla", "CT"], ["1482", "ASSOCIAZIONE RADIOAMATORI ITALIANI SEZIONE DI AGRIGENTO ODV", "Via Diodoro Siculo, 1", "Agrigento", "AG"], ["1483", "RANGERS INTERNATIONAL O.D.V. DELEGAZIONE DI LONGI", "Via F. Cottone, 13", "Longi", "ME"], ["1484", "SPELEO TEAM TRAPANI ETS", "Via Case di Grazia, 14", "Valderice", "TP"], ["1485", "NUOVA ACROPOLI RAGUSA ODV", "Via Del Gelso, 41", "Ragusa", "RG"], ["1486", "ASS. NUCLEO OPERATIVO PROTEZIONE CIVILE EMERGENZA AMBIENTALE O.D.V. (N.O.P.C.E.A.)", "Via Venuti, 7", "Cinisi", "PA"], ["1487", "PROTEZIONE CIVILE – ASSOCIAZIONE NAZIONALE BERSAGLIERI NUCLEO DI PALERMO ODV", "Via Galileo Galilei, 72", "Palermo", "PA"], ["1488", "ASSOCIAZIONE NUCLEO OPERATIVO VOLONTARI DI PROTEZIONE CIVILE ED EMERGENZA AMBIENTALE N.O.P.C.E.A. CARINI ODV", "Via Antonio Gagini, 44", "Carini", "PA"], ["1489", "C.N.G.E.I. SEZIONE SCOUT RAGUSA APS", "Via Diaz, 25", "Ragusa", "RG"], ["1490", "NUCLEO SOMMOZZATORI E SOCCORSO ACQUATICO DI PROTEZIONE CIVILE REGIONE SICILIA ODV", "Via Libertà, 129", "Isola delle Femmine", "PA"], ["1491", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI CASSARO", "Via Regina Margherita, 112", "Cassaro", "SR"], ["1492", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI SCICLI", "Via F. M. Penna, 2", "Scicli", "RG"], ["1493", "ASSOCIAZIONE CIVICI VOLONTARI ANTINCENDIO XIRBI", "C.da Pescazzo, s.n.c.", "Caltanissetta", "CL"], ["1494", "E.R.A. EUROPEAN RADIOAMATEURS ASSOCIATION - CITTA DI NASO ODV", "Via Marconi, 2", "Naso", "ME"], ["1495", "G.I.V.A. - GRUPPO INTERNAZIONALE VOLONTARIATO ARCOBALENO - DELEGAZIONE DI MESSINA -ODV", "Via Janni, 1A", "Messina", "ME"], ["1496", "PROTEZIONE CIVILE SANTO STEFANO QUISQUINA ODV", "Via Teatro, 6", "Santo Stefano Quisquina", "AG"], ["1497", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI CAMPOREALE", "Via Marco Minghetti, 85", "Camporeale", "PA"], ["1498", "PROTEZIONE CIVILE ANB NUCLEO DI TERME VIGLIATORE", "C.da Franchini, 3", "Terme Vigliatore", "ME"], ["1499", "ASSOCIAZIONE NAZIONALE S.S.T. “SEARCH AND RESCUE” ODV DELEGAZIONE MELILLI (SR)", "C.da Passo di Siracusa, s.n.c.", "Melilli", "SR"], ["1500", "ORGANIZZAZIONE DI VOLONTARIATO CROCE SOFIA", "Via Giacomo Besio, 123", "Palermo", "PA"], ["1501", "CROCE ROSSA ITALIANA - COMITATO DI FIUMEFREDDO DI SICILIA", "Via Nino Martoglio, 3", "Fiumefreddo di Sicilia", "CT"], ["1502", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI CAMMARATA", "Via Roma, s.n.c.", "Cammarata", "AG"], ["1503", "ORATORIO SALESIANO RAGUSA ADS- APS", "Corso Italia, 477", "Ragusa", "RG"], ["1504", "SOCCORSO ALPINO E SPELEOLOGO SICILIANO ODV", "Viale Minerva, 28", "Palermo", "PA"], ["1505", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI COLLESANO", "Via Vittorio Emanuele, 2", "Collesano", "PA"], ["1506", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI SANTA DOMENICA VITTORIA", "Piazza Aldo Moro, 29", "Santa Domenica Vittoria", "ME"], ["1507", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI CAMPOROTONDO ETNEO", "Via Umberto, 46", "Camporotondo Etneo", "CT"], ["1508", "CORPO FORESTALE VOLONTARIATO ENTE DI SORVEGLIANZA AMBIENTALE E FORESTALE ODV ETS STAZIONE MESSINA", "Via San Felice, 3", "Messina", "ME"], ["1509", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI GIULIANA", "C.da Licciardo, s.n.c.", "Giuliana", "PA"], ["1510", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI PIANA DEGLI ALBANESI", "Via Palmiro Togliatti, 2", "Piana degli Albanesi", "PA"], ["1511", "GISELLA APS", "Via Leonardo da Vinci, 150", "Partanna", "TP"], ["1512", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI MILAZZO", "Via Francesco Crispi, 9", "Milazzo", "ME"], ["1513", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI MESSINA", "Via Franza, 2", "Messina", "ME"], ["1514", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI GALATI MAMERTINO", "Via Roma, 90", "Galati Mamertino", "ME"], ["1515", "EUROPEAN RADIOAMATEURS ASSOCIATION ODV", "Via Porta Agrigento, 86/90", "Raffadali", "AG"], ["1516", "NUCLEO VOLONTARI DI PROTEZIONE CIVILE", "Via Alessandro Manzoni, 40", "Piazza Armerina", "EN"], ["1517", "INSIEME", "C.da Galice, 2", "Patti", "ME"], ["1518", "ASSOCIAZIONE PROTEZIONE CIVILE RAMACCA-ODV", "Via San Giuseppe, 16", "Ramacca", "CT"], ["1519", "ASSOCIAZIONE RANGERS INTERNATIONAL EUROPE-ODV", "Via Roma, 327", "Gagliano Castelferrato", "EN"], ["1520", "ODV GRUPPO VOLONTARIATO E PROTEZIONE CIVILE DELLA ASSOCIAZIONE NAZIONALE DELLA POLIZIA DI STATO – SEZIONE DI PALERMO", "Via Agostino Catalano, 26", "Palermo", "PA"], ["1521", "A.L.I. VOLONTARI IN EMERGENZA - ODV", "Via Cagliari, 12", "Catania", "CT"], ["1522", "LENTO VAGARE APS", "Via Crocci, 264", "Valderice", "TP"], ["1523", "ASSOCIAZIONE NAZIONALE VIGILI DEL FUOCO IN CONGEDO DELEGAZIONE DI PIAZZA ARMERINA ODV", "Contrada Piano Cannata, s.n.c.", "Piazza Armerina", "EN"], ["1524", "OLMS MAGNA VIS MONTELEPRE", "C.da Mandra di Mezzo, s.n.c.", "Montelepre", "PA"], ["1525", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI PORTOPALO DI CAPO PASSERO", "Via LucioTasca, 33", "Portopalo di Capo Passero", "SR"], ["1526", "ASSOCIAZIONE VOLONTARI PROTEZIONE CIVILE SAN CONO ODV", "Via Bruno Buozzi, 18", "San Cono", "CT"], ["1527", "CROCE ROSSA ITALIANA - COMITATO DI SIRACUSA", "Via Elorina, 39", "Siracusa", "SR"], ["1528", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI SAN GREGORIO DI CATANIA", "Piazza G. Marconi, 11", "San Gregorio di Catania", "CT"], ["1529", "ORGANIZZAZIONE NAZIONALE VOLONTARIATO GIUBBE D'ITALIA ODV SEZIONE - DI PALERMO 2", "Via Empedocle Restivo, 70", "Palermo", "PA"], ["1530", "S.S.T. ODV SQUADRE DI SOCCORSO TECNICO – DELEGAZIONE DI PALMA DI MONTECHIARO", "Via Rossini Gioacchino, 50", "Palma di Montechiaro", "AG"], ["1531", "CORPO FORESTALE VOLONTARIO ENTE DI SORVEGLIANZA AMBIENTALE E FORESTALE ODV", "Via Palermo, 168", "Palma di Montechiaro", "AG"]];
const PROVINCE_LIST = Array.from(new Set(ASSOCIAZIONI_DB.map((r) => r[4]))).filter(Boolean).sort();

const LOGO_DATA_URI = "data:image/png;base64,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";

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
function fmtTime(ts) {
  if (!ts) return "—";
  return new Date(ts).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
}
function fmtDate(ts) {
  if (!ts) return "—";
  return new Date(ts).toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit", year: "numeric" });
}
// Converte un timestamp nella data locale in formato yyyy-mm-dd, per popolare un input type="date".
function timestampADataInput(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
// Applica una nuova data (yyyy-mm-dd) a un timestamp esistente, mantenendo invariato l'orario.
function applicaDataATimestamp(ts, dataStr) {
  if (!dataStr) return ts;
  const [y, m, d] = dataStr.split("-").map(Number);
  if (!y || !m || !d) return ts;
  const base = ts ? new Date(ts) : new Date();
  return new Date(y, m - 1, d, base.getHours(), base.getMinutes(), base.getSeconds()).getTime();
}
// Indica se un turno è "coperto" dal periodo di servizio di un mezzo. Un mezzo normalmente ha
// inizioTurno/fineTurno coincidenti con un unico turno, ma può essere stato "prolungato" su più
// turni consecutivi (vedi "Prolunga al turno successivo" in Mezzi in campo) invece di essere
// riregistrato ad ogni cambio turno: in quel caso fineTurno coincide con la fine di un turno
// successivo nell'elenco turni del giorno, e questa funzione considera "coperti" anche i turni
// intermedi. turniGiorno è l'elenco ordinato dei turni per la giornata del record.
function turnoCopertoDaRecord(inizioRec, fineRec, turno, turniGiorno) {
  if (!turno) return true;
  if (inizioRec === turno.inizio && fineRec === turno.fine) return true;
  if (!Array.isArray(turniGiorno) || !turniGiorno.length) return false;
  const idxInizio = turniGiorno.findIndex((t) => t.inizio === inizioRec);
  const idxFine = turniGiorno.findIndex((t) => t.fine === fineRec);
  const idxTurno = turniGiorno.findIndex((t) => t.id === turno.id);
  if (idxInizio === -1 || idxFine === -1 || idxTurno === -1) return false;
  return idxTurno >= idxInizio && idxTurno <= idxFine;
}
// Trova, nell'elenco turni di una giornata, il turno immediatamente successivo a quello che
// termina a `fineRec` (i turni di uno stesso giorno sono contigui: il successivo inizia quando
// finisce il precedente).
function turnoSuccessivoPer(fineRec, turniGiorno) {
  if (!Array.isArray(turniGiorno) || !turniGiorno.length) return null;
  const idx = turniGiorno.findIndex((t) => t.inizio === fineRec);
  return idx !== -1 ? turniGiorno[idx] : null;
}
function trovaTurnoAttuale(turni) {
  if (!turni || !turni.length) return "tutti";
  const ora = new Date();
  const minutiOra = ora.getHours() * 60 + ora.getMinutes();
  function toMinuti(hhmm) {
    const [h, m] = (hhmm || "0:0").split(":").map((x) => parseInt(x, 10) || 0);
    return h * 60 + m;
  }
  for (const t of turni) {
    const inizio = toMinuti(t.inizio);
    const fine = toMinuti(t.fine);
    if (fine > inizio) {
      if (minutiOra >= inizio && minutiOra < fine) return t.id;
    } else {
      // turno che attraversa la mezzanotte (es. 20:00-08:00)
      if (minutiOra >= inizio || minutiOra < fine) return t.id;
    }
  }
  return "tutti";
}
// Restituisce i turni validi per una specifica giornata: se per quel giorno sono stati
// definiti turni personalizzati, usa quelli; altrimenti ricade sui turni generali dell'evento.
function turniPerGiorno(config, dataStr) {
  return config?.turniPerGiorno?.[dataStr] || [];
}
// Trova il turno effettivamente attivo in questo momento e la giornata operativa a cui appartiene.
// Controlla prima i turni di oggi; se nessuno corrisponde, controlla i turni di ieri: se uno di
// quelli attraversa la mezzanotte (es. 23:00-05:00) ed è ancora in corso, resta agganciato a ieri
// invece di "perdere" chi ha iniziato un turno notturno prima di mezzanotte.
function trovaTurnoEGiornoAttuale(config) {
  const ora = new Date();
  const oggiStr = ora.toISOString().slice(0, 10);
  const turnoOggi = trovaTurnoAttuale(turniPerGiorno(config, oggiStr));
  if (turnoOggi !== "tutti") {
    return { turnoId: turnoOggi, dataStr: oggiStr };
  }
  const ieri = new Date(ora);
  ieri.setDate(ieri.getDate() - 1);
  const ieriStr = ieri.toISOString().slice(0, 10);
  const minutiOra = ora.getHours() * 60 + ora.getMinutes();
  function toMinuti(hhmm) {
    const [h, m] = (hhmm || "0:0").split(":").map((x) => parseInt(x, 10) || 0);
    return h * 60 + m;
  }
  for (const t of turniPerGiorno(config, ieriStr)) {
    const inizio = toMinuti(t.inizio);
    const fine = toMinuti(t.fine);
    if (fine <= inizio && minutiOra < fine) {
      // turno di ieri a cavallo di mezzanotte, ancora in corso adesso
      return { turnoId: t.id, dataStr: ieriStr };
    }
  }
  return { turnoId: "tutti", dataStr: oggiStr };
}
function fmtDuration(start, end) {
  if (!start) return "—";
  const ms = (end || Date.now()) - start;
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return `${h}h ${String(m).padStart(2, "0")}m`;
}
function escapeHtmlQuadro(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
function apriFinestraQuadroOperativo(effEventoId, effEventoNome, tipiMezzoList, turniList, turnoForzato, dataForzata, eventoLoghi, eventoEnte) {
  if (!effEventoId) {
    window.alert("Nessun evento selezionato al momento (né lato pubblico né in Admin). Seleziona prima un evento per poter aprire il quadro operativo.");
    return;
  }
  const html = `<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="utf-8" />
<title>Quadro operativo - ${escapeHtmlQuadro(effEventoNome || "")}</title>
<style>
  * { box-sizing: border-box; }
  body { margin: 0; background: #F5F3EE; color: #14181F; font-family: 'Inter', Arial, sans-serif; min-height: 100vh; overflow-x: hidden; }
  .toolbar { display: flex; justify-content: flex-end; padding: 14px 24px 0; }
  .fs-btn { background: #1F3B57; color: #fff; border: none; border-radius: 8px; padding: 9px 16px; font-size: 13px; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; }
  .fs-btn:hover { background: #16293e; }
  .header { display: flex; align-items: center; justify-content: center; gap: 16px; padding: 12px 32px 20px; border-bottom: 2px solid #1F3B57; }
  .logo { width: 50px; height: 62px; background: transparent; border-radius: 8px; padding: 4px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .logo img { width: 100%; height: 100%; object-fit: contain; }
  .loghi-riga { display: flex; align-items: center; gap: 8px; height: 62px; flex-shrink: 0; }
  .loghi-riga img { height: 100%; width: auto; max-width: 70px; object-fit: contain; }
  .org-name { font-size: 16px; letter-spacing: 0.02em; text-transform: uppercase; font-weight: 700; color: #14181F; }
  .org-sub { font-size: 12px; color: #556; margin-top: 2px; font-weight: 500; }
  .evento-banner { text-align: center; padding: 20px 20px 2px; text-transform: uppercase; letter-spacing: 0.03em; font-size: clamp(18px, 2.4vw, 26px); font-weight: 700; color: #1F3B57; }
  .turno-banner { text-align: center; font-size: 14px; font-weight: 600; color: #E8622C; text-transform: uppercase; letter-spacing: 0.03em; margin-bottom: 4px; }
  .clock { text-align: center; font-variant-numeric: tabular-nums; font-size: 14px; font-weight: 600; color: #556; margin-bottom: 20px; }
  .center-wrap { max-width: 1180px; margin: 0 auto; padding: 0 24px; }
  .stats { display: flex; gap: 20px; flex-wrap: wrap; justify-content: center; margin-bottom: 24px; }
  .stat { text-align: center; background: #fff; border: 1px solid #D8D3C8; border-radius: 14px; padding: 16px 26px; min-width: 170px; flex: 1; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
  .stat-label { font-size: 13px; font-weight: 700; color: #445; letter-spacing: 0.02em; text-transform: uppercase; margin-bottom: 8px; }
  .stat-value { font-variant-numeric: tabular-nums; font-size: clamp(36px, 5vw, 56px); font-weight: 800; line-height: 1; color: #1F3B57; }
  .accent-orange { color: #E8622C; }
  .accent-green { color: #3F7D53; }
  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
  .panel { background: #fff; border: 1px solid #D8D3C8; border-radius: 14px; padding: 16px 20px; box-shadow: 0 1px 4px rgba(0,0,0,0.04); }
  .section-title { text-align: center; text-transform: uppercase; letter-spacing: 0.03em; font-size: 13px; font-weight: 700; color: #223; margin-bottom: 12px; }
  .chip-row { display: flex; gap: 8px; flex-wrap: wrap; justify-content: center; }
  .chip { background: #F5F3EE; border: 1px solid #D8D3C8; border-radius: 8px; padding: 8px 14px; font-size: 14px; font-weight: 600; color: #14181F; }
  .chip b { color: #1F3B57; margin-left: 6px; }
  .empty-note { text-align: center; color: #999; font-size: 13px; padding: 6px; }
  .spec-list { display: grid; gap: 8px; }
  .spec-row { display: flex; align-items: center; gap: 8px; font-size: 13px; }
  .spec-name { width: 130px; flex-shrink: 0; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .spec-bar-track { flex: 1; background: #EDE9E0; border-radius: 3px; height: 9px; overflow: hidden; }
  .spec-bar-fill { background: #1F3B57; height: 9px; }
  .spec-n { width: 20px; text-align: right; font-weight: 700; }
  .footer-pad { height: 20px; }
  .fullscreen-mode .toolbar { display: none; }
  #scale-wrapper { transform-origin: top center; width: 100%; margin: 0 auto; }
  @media (max-width: 760px) { .grid-2 { grid-template-columns: 1fr; } }
</style>
</head>
<body>
  <div class="toolbar">
    <button class="fs-btn" id="fs-toggle" onclick="toggleFullscreen()">⤢ Schermo intero</button>
  </div>
  <div id="scale-wrapper">
  <div class="header">
    ${
      loghiEventoValidi(eventoLoghi).length
        ? buildLoghiRigaHtml(eventoLoghi, 62)
        : `<div class="logo"><img src="${LOGO_DATA_URI}" alt="Stemma Misericordia" /></div>`
    }
    <div>
      <div class="org-name">${escapeHtmlQuadro(eventoEnte || "Fraternita di Misericordia di S.M. di Licodia - ODV")}</div>
      <div class="org-sub">Quadro operativo · Protezione Civile</div>
    </div>
  </div>
  <div class="evento-banner">${escapeHtmlQuadro(effEventoNome || "")}</div>
  <div class="turno-banner" id="turno-banner"></div>
  <div class="clock" id="clock"></div>
  <div class="center-wrap">
    <div class="stats">
      <div class="stat"><div class="stat-label">Volontari nel turno</div><div class="stat-value accent-orange" id="v-count">–</div></div>
      <div class="stat"><div class="stat-label">Associazioni nel turno</div><div class="stat-value" id="a-count">–</div></div>
      <div class="stat"><div class="stat-label">Mezzi nel turno</div><div class="stat-value accent-green" id="m-count">–</div></div>
    </div>
    <div class="grid-2">
      <div class="panel">
        <div class="section-title">Mezzi per tipo</div>
        <div class="chip-row" id="mezzi-tipo"></div>
      </div>
      <div class="panel">
        <div class="section-title">Squadre operative per tipologia</div>
        <div class="chip-row" id="squadre-tipo"></div>
      </div>
    </div>
    <div class="grid-2">
      <div class="panel">
        <div class="section-title">Impiego per specializzazione</div>
        <div class="spec-list" id="spec-list"></div>
      </div>
      <div class="panel">
        <div class="section-title">Associazioni presenti</div>
        <div class="chip-row" id="assoc-list"></div>
      </div>
    </div>
  </div>
  <div class="footer-pad"></div>
  </div>
  <script>
    var ASSOC_DEFAULT = "${escapeHtmlQuadro(ASSOCIAZIONE_DEFAULT)}";
    var TIPI_MEZZO = ${JSON.stringify(tipiMezzoList || TIPI_MEZZO)};
    var TIPI_SQUADRA = ${JSON.stringify(TIPI_SQUADRA)};
    var KEY_VOL = "protcivile:volontari:${effEventoId}";
    var KEY_MEZZI = "protcivile:mezzi:${effEventoId}";
    var KEY_SQUADRE = "protcivile:squadre:${effEventoId}";
    var TURNI = ${JSON.stringify(turniList || [])};
    var TURNO_FORZATO = ${turnoForzato ? JSON.stringify(turnoForzato) : "null"};
    var DATA_FORZATA = ${dataForzata ? JSON.stringify(dataForzata) : "null"};

    function toggleFullscreen() {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(function(){});
      } else {
        document.exitFullscreen().catch(function(){});
      }
    }
    document.addEventListener('fullscreenchange', function(){
      document.body.classList.toggle('fullscreen-mode', !!document.fullscreenElement);
      fitToScreen();
    });
    window.addEventListener('resize', fitToScreen);
    function fitToScreen() {
      var wrap = document.getElementById('scale-wrapper');
      if (!wrap) return;
      wrap.style.transform = '';
      wrap.style.width = '100%';
      if (!document.fullscreenElement) return;
      var contentHeight = wrap.scrollHeight;
      var contentWidth = wrap.scrollWidth;
      if (!contentHeight || !contentWidth) return;
      var scaleY = window.innerHeight / contentHeight;
      var scaleX = window.innerWidth / contentWidth;
      var scale = Math.min(scaleX, scaleY, 1);
      wrap.style.width = (100 / scale) + '%';
      wrap.style.transform = 'scale(' + scale + ')';
    }

    function toMinuti(hhmm) {
      var parti = (hhmm || "0:0").split(":");
      return (parseInt(parti[0], 10) || 0) * 60 + (parseInt(parti[1], 10) || 0);
    }
    // Un mezzo "prolungato" su più turni consecutivi (vedi "Prolunga al turno successivo") ha
    // fineTurno uguale alla fine di un turno successivo nell'elenco TURNI: lo consideriamo
    // comunque presente per ogni turno intermedio coperto da quell'intervallo.
    function turnoCopertoDaRecord(inizioRec, fineRec, turno) {
      if (!turno) return true;
      if (inizioRec === turno.inizio && fineRec === turno.fine) return true;
      if (!TURNI.length) return false;
      var idxInizio = -1, idxFine = -1, idxTurno = -1;
      for (var i = 0; i < TURNI.length; i++) {
        if (TURNI[i].inizio === inizioRec) idxInizio = i;
        if (TURNI[i].fine === fineRec) idxFine = i;
        if (TURNI[i].id === turno.id) idxTurno = i;
      }
      if (idxInizio === -1 || idxFine === -1 || idxTurno === -1) return false;
      return idxTurno >= idxInizio && idxTurno <= idxFine;
    }
    function turnoInCorso() {
      if (!TURNI.length) return null;
      var ora = new Date();
      var minutiOra = ora.getHours() * 60 + ora.getMinutes();
      for (var i = 0; i < TURNI.length; i++) {
        var t = TURNI[i];
        var inizio = toMinuti(t.inizio);
        var fine = toMinuti(t.fine);
        if (fine > inizio) {
          if (minutiOra >= inizio && minutiOra < fine) return t;
        } else {
          if (minutiOra >= inizio || minutiOra < fine) return t;
        }
      }
      return TURNI[0];
    }

    function updateClock() {
      var el = document.getElementById('clock');
      if (el) el.textContent = new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }
    updateClock();
    setInterval(updateClock, 1000);

    function toDataStr(ts) {
      var d = new Date(ts);
      var y = d.getFullYear();
      var m = String(d.getMonth() + 1).padStart(2, '0');
      var g = String(d.getDate()).padStart(2, '0');
      return y + '-' + m + '-' + g;
    }
    function render(volontari, mezzi, squadre) {
      var turno = TURNO_FORZATO || turnoInCorso();
      var oggiStr = toDataStr(Date.now());
      var dataRicerca = DATA_FORZATA && DATA_FORZATA !== oggiStr ? DATA_FORZATA : null;

      var etichettaTurno = turno ? (turno.nome + ' (' + turno.inizio + '–' + turno.fine + ')') : '';
      if (dataRicerca) {
        var partiData = dataRicerca.split('-');
        etichettaTurno += ' · ' + partiData[2] + '/' + partiData[1] + '/' + partiData[0];
      }
      document.getElementById('turno-banner').textContent = etichettaTurno;

      var vTurno = volontari.filter(function(v){
        var okTurno = !turno || (v.inizioTurno === turno.inizio && v.fineTurno === turno.fine);
        var okStato = dataRicerca ? true : v.stato === 'in campo';
        var okData = dataRicerca ? toDataStr(v.oraIngresso) === dataRicerca : true;
        return okTurno && okStato && okData;
      });
      var mTurno = mezzi.filter(function(m){
        var okTurno = !turno || turnoCopertoDaRecord(m.inizioTurno, m.fineTurno, turno);
        var okStato = dataRicerca ? true : m.stato === 'in servizio';
        var okData = dataRicerca ? toDataStr(m.oraIngresso) === dataRicerca : true;
        return okTurno && okStato && okData;
      });
      var sTurno = (squadre || []).filter(function(s){
        var okTurno = !turno || s.turnoId === turno.id;
        var okStato = dataRicerca ? true : !s.terminata;
        return okTurno && okStato;
      });
      var assocSet = {};
      vTurno.forEach(function(v){ assocSet[(v.associazione || ASSOC_DEFAULT).trim()] = true; });
      mTurno.forEach(function(m){ assocSet[(m.associazione || ASSOC_DEFAULT).trim()] = true; });
      var assocList = Object.keys(assocSet).sort();

      document.getElementById('v-count').textContent = vTurno.length;
      document.getElementById('a-count').textContent = assocList.length;
      document.getElementById('m-count').textContent = mTurno.length;

      var mezziTipoHtml = '';
      TIPI_MEZZO.forEach(function(t){
        var n = mTurno.filter(function(m){ return m.tipo === t; }).length;
        if (n > 0) mezziTipoHtml += '<div class="chip">' + t + '<b>' + n + '</b></div>';
      });
      document.getElementById('mezzi-tipo').innerHTML = mezziTipoHtml || '<div class="empty-note">Nessun mezzo nel turno in corso.</div>';

      var squadreTipoHtml = '';
      TIPI_SQUADRA.forEach(function(t){
        var n = sTurno.filter(function(s){ return s.tipo === t.id; }).length;
        if (n > 0) squadreTipoHtml += '<div class="chip">' + t.label + '<b>' + n + '</b></div>';
      });
      document.getElementById('squadre-tipo').innerHTML = squadreTipoHtml || '<div class="empty-note">Nessuna squadra operativa nel turno in corso.</div>';

      var specSet = {};
      vTurno.forEach(function(v){
        var s = v.specializzazione || 'Non specificata';
        specSet[s] = (specSet[s] || 0) + 1;
      });
      var specKeys = Object.keys(specSet).sort(function(a,b){ return specSet[b] - specSet[a]; });
      var specHtml = '';
      specKeys.forEach(function(s){
        var n = specSet[s];
        var pct = vTurno.length ? Math.round((n / vTurno.length) * 100) : 0;
        specHtml += '<div class="spec-row"><div class="spec-name">' + s + '</div>' +
          '<div class="spec-bar-track"><div class="spec-bar-fill" style="width:' + pct + '%"></div></div>' +
          '<div class="spec-n">' + n + '</div></div>';
      });
      document.getElementById('spec-list').innerHTML = specHtml || '<div class="empty-note">Nessun volontario nel turno in corso.</div>';

      var assocHtml = '';
      assocList.forEach(function(a){ assocHtml += '<div class="chip">' + a + '</div>'; });
      document.getElementById('assoc-list').innerHTML = assocHtml || '<div class="empty-note">Nessuna associazione presente nel turno in corso.</div>';
      fitToScreen();
    }

    function poll() {
      try {
        if (!window.opener || window.opener.closed || !window.opener.storage) return;
        Promise.all([
          window.opener.storage.get(KEY_VOL, true).catch(function(){ return null; }),
          window.opener.storage.get(KEY_MEZZI, true).catch(function(){ return null; }),
          window.opener.storage.get(KEY_SQUADRE, true).catch(function(){ return null; })
        ]).then(function(res){
          var volontari = res[0] && res[0].value ? JSON.parse(res[0].value) : [];
          var mezzi = res[1] && res[1].value ? JSON.parse(res[1].value) : [];
          var squadre = res[2] && res[2].value ? JSON.parse(res[2].value) : [];
          render(volontari, mezzi, squadre);
        });
      } catch (e) { /* silenzioso */ }
    }
    poll();
    setInterval(poll, 8000);
  </script>
</body>
</html>`;
  const winW = 1100;
  const winH = 800;
  const winLeft = Math.max(0, Math.round((window.screen.width - winW) / 2));
  const winTop = Math.max(0, Math.round((window.screen.height - winH) / 2));
  const win = window.open("", "_blank", `width=${winW},height=${winH},left=${winLeft},top=${winTop}`);
  if (!win) {
    window.alert("Il browser ha bloccato l'apertura della finestra. Consenti i popup per questo sito e riprova.");
    return;
  }
  win.document.open();
  win.document.write(html);
  win.document.close();
  win.focus();
}
function csvEscape(v) {
  const s = String(v ?? "");
  if (s.includes(",") || s.includes('"') || s.includes("\n")) return `"${s.replace(/"/g, '""')}"`;
  return s;
}
function downloadCsv(filename, rows) {
  const content = rows.map((r) => r.map(csvEscape).join(",")).join("\n");
  const blob = new Blob(["\uFEFF" + content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function App() {
  const [loading, setLoading] = useState(true);

  // ---------- eventi (condivisi) ----------
  const [eventi, setEventi] = useState([]);
  const [eventoOperatoreId, setEventoOperatoreId] = useState(null);
  const [eventoAdminId, setEventoAdminId] = useState(null);

  // ---------- dati evento OPERATORE ----------
  const [volontariOp, setVolontariOp] = useState([]);
  const [mezziOp, setMezziOp] = useState([]);
  const [configOp, setConfigOp] = useState(defaultConfig());
  const [squadreOp, setSquadreOp] = useState([]);

  // ---------- dati evento ADMIN ----------
  const [volontariAd, setVolontariAd] = useState([]);
  const [mezziAd, setMezziAd] = useState([]);
  const [configAd, setConfigAd] = useState(defaultConfig());
  const [squadreAd, setSquadreAd] = useState([]);
  const [registroRadioAd, setRegistroRadioAd] = useState([]);

  const [associazioneCorrente, setAssociazioneCorrente] = useState(null);
  const [associazioniDb, setAssociazioniDb] = useState(
    ASSOCIAZIONI_DB.map((r) => ({ cod: r[0], denominazione: r[1], sede: r[2], comune: r[3], provincia: r[4] }))
  );

  const [tab, setTab] = useState("operatore");
  const [ruoloAccesso, setRuoloAccesso] = useState(null); // null | "operatore" | "admin"
  const [nomeUtenteLoggato, setNomeUtenteLoggato] = useState("");
  const [loginUser, setLoginUser] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [loginError, setLoginError] = useState("");
  const [adminCredentials, setAdminCredentials] = useState({
    username: ADMIN_USER_DEFAULT,
    password: ADMIN_PASS_DEFAULT,
  });
  const [operatori, setOperatori] = useState([{ id: "op-default", nome: "Operatore", cognome: "Predefinito", username: OPERATORE_USER_DEFAULT, password: OPERATORE_PASS_DEFAULT }]);

  // ---------- COC (Centro Operativo Comunale) ----------
  const [cocEventoId, setCocEventoId] = useState(null);
  const [cocUtenteAttivo, setCocUtenteAttivo] = useState(null); // { id, nome, cognome, funzioneId } per il ruolo "coc-funzione"
  const [cocFunzioni, setCocFunzioni] = useState([]);
  const [cocUtenti, setCocUtenti] = useState([]);
  const [cocDiario, setCocDiario] = useState([]);
  const [cocNote, setCocNote] = useState([]);
  const [cocOpVolontari, setCocOpVolontari] = useState([]);
  const [cocOpMezzi, setCocOpMezzi] = useState([]);
  const [cocOpSquadre, setCocOpSquadre] = useState([]);

  // ---------- Filtro turno/data generale (Admin) ----------
  const [turnoGenerale, setTurnoGenerale] = useState("tutti");
  const [dataGenerale, setDataGenerale] = useState(() => new Date().toISOString().slice(0, 10));

  // ---------- Riepilogo: selezione manuale dell'evento da visualizzare ----------
  const [riepilogoEventoId, setRiepilogoEventoId] = useState(null);
  const [riepilogoVolontari, setRiepilogoVolontari] = useState([]);
  const [riepilogoMezzi, setRiepilogoMezzi] = useState([]);
  const [riepilogoSquadre, setRiepilogoSquadre] = useState([]);
  const [impostazioniGlobali, setImpostazioniGlobali] = useState({
    specializzazioni: SPECIALIZZAZIONI,
    tipiMezzo: TIPI_MEZZO,
    specializzazioniMacroAree: {},
    tipiMezzoMacroAree: {},
  });

  const [tick, setTick] = useState(0);
  const [toast, setToast] = useState(null);

  function defaultConfig() {
    return { associazioni: [ASSOCIAZIONE_DEFAULT], turniPerGiorno: {} };
  }
  function mergeConfig(parsed) {
    return { ...defaultConfig(), ...parsed };
  }

  async function caricaDatiEvento(eventId) {
    const [v, m, c, s, r] = await Promise.allSettled([
      window.storage.get(KEY_VOL(eventId), true),
      window.storage.get(KEY_MEZZI(eventId), true),
      window.storage.get(KEY_CONFIG(eventId), true),
      window.storage.get(KEY_SQUADRE(eventId), true),
      window.storage.get(KEY_REGISTRO_RADIO(eventId), true),
    ]);
    return {
      volontari: v.status === "fulfilled" && v.value ? JSON.parse(v.value.value) : [],
      mezzi: m.status === "fulfilled" && m.value ? JSON.parse(m.value.value) : [],
      config: c.status === "fulfilled" && c.value ? mergeConfig(JSON.parse(c.value.value)) : defaultConfig(),
      squadre: s.status === "fulfilled" && s.value ? JSON.parse(s.value.value) : [],
      registroRadio: r.status === "fulfilled" && r.value ? JSON.parse(r.value.value) : [],
    };
  }

  async function caricaDatiCoc(eventId) {
    const [f, u, d, n] = await Promise.allSettled([
      window.storage.get(KEY_COC_FUNZIONI(eventId), true),
      window.storage.get(KEY_COC_UTENTI(eventId), true),
      window.storage.get(KEY_COC_DIARIO(eventId), true),
      window.storage.get(KEY_COC_NOTE(eventId), true),
    ]);
    return {
      funzioni: f.status === "fulfilled" && f.value ? JSON.parse(f.value.value) : COC_FUNZIONI_DEFAULT,
      utenti: u.status === "fulfilled" && u.value ? JSON.parse(u.value.value) : [],
      diario: d.status === "fulfilled" && d.value ? JSON.parse(d.value.value) : [],
      note: n.status === "fulfilled" && n.value ? JSON.parse(n.value.value) : [],
    };
  }

  // ---------- caricamento iniziale ----------
  useEffect(() => {
    (async () => {
      try {
        const credRes = await window.storage.get(KEY_ADMIN_CREDS, true).catch(() => null);
        if (credRes && credRes.value) {
          const parsed = JSON.parse(credRes.value);
          setAdminCredentials({
            username: parsed.username || ADMIN_USER_DEFAULT,
            password: parsed.password || ADMIN_PASS_DEFAULT,
          });
        }
        const globRes = await window.storage.get(KEY_IMPOSTAZIONI_GLOBALI, true).catch(() => null);
        if (globRes && globRes.value) {
          const parsed = JSON.parse(globRes.value);
          setImpostazioniGlobali({
            specializzazioni: parsed.specializzazioni?.length ? parsed.specializzazioni : SPECIALIZZAZIONI,
            tipiMezzo: parsed.tipiMezzo?.length ? parsed.tipiMezzo : TIPI_MEZZO,
            specializzazioniMacroAree: parsed.specializzazioniMacroAree || {},
            tipiMezzoMacroAree: parsed.tipiMezzoMacroAree || {},
          });
        }
        const opRes = await window.storage.get(KEY_OPERATORI, true).catch(() => null);
        if (opRes && opRes.value) {
          const parsed = JSON.parse(opRes.value);
          setOperatori(parsed.length ? parsed : [{ id: "op-default", nome: "Operatore", cognome: "Predefinito", username: OPERATORE_USER_DEFAULT, password: OPERATORE_PASS_DEFAULT }]);
        } else {
          // primo avvio: crea e salva l'operatore predefinito
          const def = [{ id: "op-default", nome: "Operatore", cognome: "Predefinito", username: OPERATORE_USER_DEFAULT, password: OPERATORE_PASS_DEFAULT }];
          setOperatori(def);
          persist(KEY_OPERATORI, def);
        }
      } catch (e) {
        // usa i valori predefiniti in caso di errore
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const [ev, db, evAd] = await Promise.allSettled([
          window.storage.get(KEY_EVENTI, true),
          window.storage.get(KEY_ASSOC_DB, true),
          window.storage.get(KEY_EVENTO_ADMIN, false),
        ]);
        const eventiList = ev.status === "fulfilled" && ev.value ? JSON.parse(ev.value.value) : [];
        setEventi(eventiList);
        if (db.status === "fulfilled" && db.value) setAssociazioniDb(JSON.parse(db.value.value));

        // né l'associazione né l'evento operatore vengono ricordati tra un caricamento e l'altro:
        // ogni apertura/aggiornamento della pagina deve ripartire dalla selezione associazione/evento
        const adId = evAd.status === "fulfilled" && evAd.value ? JSON.parse(evAd.value.value) : null;
        if (adId && eventiList.some((e) => e.id === adId)) {
          setEventoAdminId(adId);
          const d = await caricaDatiEvento(adId);
          setVolontariAd(d.volontari);
          setMezziAd(d.mezzi);
          setConfigAd(d.config);
          setSquadreAd(d.squadre);
          setRegistroRadioAd(d.registroRadio);
        }
      } catch (e) {
        console.error("Errore caricamento dati", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // orologio / durate live
  useEffect(() => {
    const t = setInterval(() => setTick((x) => x + 1), 30000);
    return () => clearInterval(t);
  }, []);

  // aggiornamento periodico dati condivisi (multi-dispositivo, multi-evento)
  useEffect(() => {
    const poll = setInterval(async () => {
      try {
        const [ev, db] = await Promise.allSettled([window.storage.get(KEY_EVENTI, true), window.storage.get(KEY_ASSOC_DB, true)]);
        if (ev.status === "fulfilled" && ev.value) setEventi(JSON.parse(ev.value.value));
        if (db.status === "fulfilled" && db.value) setAssociazioniDb(JSON.parse(db.value.value));
        if (eventoOperatoreId) {
          const d = await caricaDatiEvento(eventoOperatoreId);
          setVolontariOp(d.volontari);
          setMezziOp(d.mezzi);
          setConfigOp(d.config);
          setSquadreOp(d.squadre);
        }
        if (ruoloAccesso && eventoAdminId) {
          const d = await caricaDatiEvento(eventoAdminId);
          setVolontariAd(d.volontari);
          setMezziAd(d.mezzi);
          setConfigAd(d.config);
          setSquadreAd(d.squadre);
          setRegistroRadioAd(d.registroRadio);
        }
      } catch (e) {
        // silenzioso: mantiene l'ultimo stato noto
      }
    }, POLL_MS);
    return () => clearInterval(poll);
  }, [eventoOperatoreId, eventoAdminId, ruoloAccesso]);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  async function persist(key, value, shared = true) {
    try {
      await window.storage.set(key, JSON.stringify(value), shared);
    } catch (e) {
      console.error("Errore salvataggio", key, e);
      showToast("Errore di salvataggio — riprova");
    }
  }

  // Rilegge la lista aggiornata dal server subito prima di scrivere, per evitare che due
  // dispositivi che registrano nello stesso momento si sovrascrivano a vicenda i dati.
  async function aggiornaListaCondivisa(keyBuilder, eventId, transformFn, setState) {
    if (!eventId) return null;
    let attuale = [];
    try {
      const res = await window.storage.get(keyBuilder(eventId), true);
      if (res && res.value) attuale = JSON.parse(res.value);
    } catch (e) {
      // chiave non ancora esistente o errore di lettura: si riparte da lista vuota
    }
    const next = transformFn(attuale);
    setState(next);
    await persist(keyBuilder(eventId), next);
    return next;
  }

  function saveConfigAd(next) {
    setConfigAd(next);
    if (eventoAdminId) persist(KEY_CONFIG(eventoAdminId), next);
  }
  function saveEventi(next) {
    setEventi(next);
    persist(KEY_EVENTI, next);
  }
  function saveAssociazioniDb(next) {
    setAssociazioniDb(next);
    persist(KEY_ASSOC_DB, next);
  }

  // ---------- azioni operatore (sull'evento operatore) ----------
  function combinaDataOra(dataStr) {
    if (!dataStr) return Date.now();
    const now = new Date();
    const [y, m, d] = dataStr.split("-").map(Number);
    if (!y || !m || !d) return Date.now();
    return new Date(y, m - 1, d, now.getHours(), now.getMinutes(), now.getSeconds()).getTime();
  }
  async function incorporaVolontario(data) {
    const eventoAttuale = eventi.find((e) => e.id === eventoOperatoreId);
    if (!eventoAttuale || eventoAttuale.chiuso) {
      showToast("Questo evento è stato chiuso: non è più possibile inserire volontari. Torna alla home e seleziona un evento attivo.");
      return false;
    }
    const rec = {
      id: genId(),
      nome: data.nome.trim(),
      cognome: data.cognome.trim(),
      dataNascita: data.dataNascita || "",
      luogoNascita: (data.luogoNascita || "").trim(),
      telefono: (data.telefono || "").trim(),
      associazione: (data.associazione || ASSOCIAZIONE_DEFAULT).trim(),
      codiceAssociazione: (data.codiceAssociazione || "").trim(),
      beneficiLegge: data.beneficiLegge || "No",
      specializzazione: data.specializzazione,
      caposquadra: !!data.caposquadra,
      altraSpecializzazione: (data.altraSpecializzazione || "").trim(),
      luogoAttivita: (data.luogoAttivita || "").trim(),
      inizioTurno: data.inizioTurno || "",
      fineTurno: data.fineTurno || "",
      pastoRichiesto: data.pastoRichiesto || "No",
      allergie: (data.allergie || "").trim(),
      oraIngresso: combinaDataOra(data.dataRegistrazione),
      oraUscita: null,
      stato: "in campo",
    };
    await aggiornaListaCondivisa(KEY_VOL, eventoOperatoreId, (attuale) => [rec, ...attuale], setVolontariOp);
    showToast(`${rec.nome} ${rec.cognome} incorporato/a`);
    return true;
  }
  async function metteMezzoInServizio(data) {
    const eventoAttuale = eventi.find((e) => e.id === eventoOperatoreId);
    if (!eventoAttuale || eventoAttuale.chiuso) {
      showToast("Questo evento è stato chiuso: non è più possibile inserire mezzi. Torna alla home e seleziona un evento attivo.");
      return false;
    }
    const rec = {
      id: genId(),
      targa: data.targa.trim(),
      tipo: data.tipo,
      alimentazione: data.alimentazione || "",
      associazione: (data.associazione || ASSOCIAZIONE_DEFAULT).trim(),
      codiceAssociazione: (data.codiceAssociazione || "").trim(),
      kmIniziali: data.kmIniziali || "",
      buonoBenzina: data.buonoBenzina || "No",
      referenteVolontarioId: data.referenteVolontarioId || "",
      inizioTurno: data.inizioTurno || "",
      fineTurno: data.fineTurno || "",
      oraIngresso: combinaDataOra(data.dataRegistrazione),
      oraUscita: null,
      stato: "in servizio",
    };
    await aggiornaListaCondivisa(KEY_MEZZI, eventoOperatoreId, (attuale) => [rec, ...attuale], setMezziOp);
    showToast(`Mezzo ${rec.targa} in servizio`);
    return true;
  }

  // ---------- azioni admin (sull'evento admin) ----------
  function scorporaVolontario(id) {
    aggiornaListaCondivisa(
      KEY_VOL,
      eventoAdminId,
      (attuale) => attuale.map((v) => (v.id === id ? { ...v, oraUscita: Date.now(), stato: "rientrato" } : v)),
      setVolontariAd
    );
  }
  function rimettiInCampoVolontario(id) {
    aggiornaListaCondivisa(
      KEY_VOL,
      eventoAdminId,
      (attuale) => attuale.map((v) => (v.id === id ? { ...v, oraUscita: null, stato: "in campo" } : v)),
      setVolontariAd
    );
  }
  function updateVolontario(id, patch) {
    aggiornaListaCondivisa(KEY_VOL, eventoAdminId, (attuale) => attuale.map((v) => (v.id === id ? { ...v, ...patch } : v)), setVolontariAd);
  }
  function deleteVolontario(id) {
    aggiornaListaCondivisa(KEY_VOL, eventoAdminId, (attuale) => attuale.filter((v) => v.id !== id), setVolontariAd);
  }
  function rientraMezzo(id) {
    aggiornaListaCondivisa(
      KEY_MEZZI,
      eventoAdminId,
      (attuale) => attuale.map((m) => (m.id === id ? { ...m, oraUscita: Date.now(), stato: "rientrato" } : m)),
      setMezziAd
    );
  }
  function rimettiInCampoMezzo(id) {
    aggiornaListaCondivisa(
      KEY_MEZZI,
      eventoAdminId,
      (attuale) => attuale.map((m) => (m.id === id ? { ...m, oraUscita: null, stato: "in servizio" } : m)),
      setMezziAd
    );
  }
  function checkoutMezzo(id, kmFinali) {
    aggiornaListaCondivisa(
      KEY_MEZZI,
      eventoAdminId,
      (attuale) => attuale.map((m) => (m.id === id ? { ...m, oraUscita: Date.now(), stato: "rientrato", kmFinali: kmFinali || "" } : m)),
      setMezziAd
    );
  }
  function updateMezzo(id, patch) {
    aggiornaListaCondivisa(KEY_MEZZI, eventoAdminId, (attuale) => attuale.map((m) => (m.id === id ? { ...m, ...patch } : m)), setMezziAd);
  }
  function deleteMezzo(id) {
    aggiornaListaCondivisa(KEY_MEZZI, eventoAdminId, (attuale) => attuale.filter((m) => m.id !== id), setMezziAd);
  }

  // ---------- squadre (admin) ----------
  function aggiungiSquadra(tipo, data) {
    const rec = {
      id: genId(),
      tipo,
      nome: (data.nome || "").trim(),
      codiceRadio: (data.codiceRadio || "").trim(),
      turnoId: data.turnoId || "",
      volontariIds: data.volontariIds || [],
      mezzoId: data.mezzoId || "",
      mezziExtraIds: Array.isArray(data.mezziExtraIds) ? data.mezziExtraIds.filter(Boolean).slice(0, 3) : [],
      createdAt: Date.now(),
    };
    aggiornaListaCondivisa(KEY_SQUADRE, eventoAdminId, (attuale) => [rec, ...attuale], setSquadreAd);
  }
  function aggiornaSquadra(id, patch) {
    aggiornaListaCondivisa(
      KEY_SQUADRE,
      eventoAdminId,
      (attuale) =>
        attuale.map((s) =>
          s.id === id
            ? { ...s, ...patch, mezziExtraIds: Array.isArray(patch.mezziExtraIds) ? patch.mezziExtraIds.filter(Boolean).slice(0, 3) : s.mezziExtraIds || [] }
            : s
        ),
      setSquadreAd
    );
  }
  function eliminaSquadra(id) {
    aggiornaListaCondivisa(KEY_SQUADRE, eventoAdminId, (attuale) => attuale.filter((s) => s.id !== id), setSquadreAd);
  }
  async function terminaSquadra(id, kmFinaliMap) {
    const squadra = squadreAd.find((s) => s.id === id);
    if (!squadra) return;
    const mezziSquadra = [squadra.mezzoId, ...(squadra.mezziExtraIds || [])].filter(Boolean);
    if (
      !window.confirm(
        mezziSquadra.length
          ? `Terminare l'operatività di questa squadra? I volontari assegnati verranno scorporati da "Volontari in campo" e ${
              mezziSquadra.length > 1 ? "i mezzi assegnati risulteranno" : "il mezzo assegnato risulterà"
            } rientrat${mezziSquadra.length > 1 ? "i" : "o"} con i km finali indicati.`
          : "Terminare l'operatività di questa squadra? I volontari assegnati verranno scorporati da \"Volontari in campo\"."
      )
    )
      return;
    await aggiornaListaCondivisa(
      KEY_SQUADRE,
      eventoAdminId,
      (attuale) => attuale.map((s) => (s.id === id ? { ...s, terminata: true, terminataAt: Date.now() } : s)),
      setSquadreAd
    );
    if (squadra.volontariIds && squadra.volontariIds.length) {
      const idsSet = new Set(squadra.volontariIds);
      await aggiornaListaCondivisa(
        KEY_VOL,
        eventoAdminId,
        (attuale) =>
          attuale.map((v) =>
            idsSet.has(v.id) && v.stato === "in campo"
              ? { ...v, oraUscita: Date.now(), stato: "rientrato" }
              : v
          ),
        setVolontariAd
      );
    }
    if (mezziSquadra.length) {
      const mezziSet = new Set(mezziSquadra);
      await aggiornaListaCondivisa(
        KEY_MEZZI,
        eventoAdminId,
        (attuale) =>
          attuale.map((m) =>
            mezziSet.has(m.id)
              ? { ...m, oraUscita: Date.now(), stato: "rientrato", kmFinali: (kmFinaliMap && kmFinaliMap[m.id]) || "" }
              : m
          ),
        setMezziAd
      );
    }
    showToast(mezziSquadra.length > 1 ? "Squadra archiviata: volontari scorporati e mezzi rientrati" : "Squadra archiviata: volontari scorporati e mezzo rientrato");
  }
  function riattivaSquadra(id) {
    aggiornaListaCondivisa(
      KEY_SQUADRE,
      eventoAdminId,
      (attuale) => attuale.map((s) => (s.id === id ? { ...s, terminata: false, terminataAt: null } : s)),
      setSquadreAd
    );
    showToast("Squadra riattivata");
  }

  // ---------- registro comunicazioni radio (admin) ----------
  function aggiungiMessaggioRadio(data) {
    aggiornaListaCondivisa(
      KEY_REGISTRO_RADIO,
      eventoAdminId,
      (attuale) => {
        const numero = attuale.length ? Math.max(...attuale.map((m) => m.numero)) + 1 : 1;
        const rec = {
          id: genId(),
          numero,
          timestamp: Date.now(),
          da: (data.da || "").trim(),
          a: (data.a || "").trim(),
          messaggio: (data.messaggio || "").trim(),
          priorita: data.priorita || "Normale",
          note: (data.note || "").trim(),
          registratoDa: (data.registratoDa || "").trim(),
        };
        return [...attuale, rec];
      },
      setRegistroRadioAd
    );
  }
  function aggiornaMessaggioRadio(id, patch) {
    aggiornaListaCondivisa(KEY_REGISTRO_RADIO, eventoAdminId, (attuale) => attuale.map((m) => (m.id === id ? { ...m, ...patch } : m)), setRegistroRadioAd);
  }
  function eliminaMessaggioRadio(id) {
    aggiornaListaCondivisa(KEY_REGISTRO_RADIO, eventoAdminId, (attuale) => attuale.filter((m) => m.id !== id), setRegistroRadioAd);
  }

  // ---------- admin: login ----------
  async function handleLogin(e) {
    e.preventDefault();
    const user = loginUser.trim().toLowerCase();
    let ruolo = null;
    let nomeVisualizzato = "";
    if (user === adminCredentials.username.toLowerCase() && loginPass === adminCredentials.password) {
      ruolo = "admin";
      nomeVisualizzato = adminCredentials.username;
    } else {
      const opMatch = operatori.find((o) => o.username.trim().toLowerCase() === user && o.password === loginPass);
      if (opMatch) {
        ruolo = "operatore";
        nomeVisualizzato = [opMatch.nome, opMatch.cognome].filter(Boolean).join(" ") || opMatch.username;
      } else if (user === ADMINCOC_USER.toLowerCase() && loginPass === ADMINCOC_PASS) {
        ruolo = "admincoc";
        nomeVisualizzato = "AdminCoc";
      } else if (user === COORDINATORECOC_USER.toLowerCase() && loginPass === COORDINATORECOC_PASS) {
        ruolo = "coordinatorecoc";
        nomeVisualizzato = "Coordinatore COC";
      }
    }
    if (ruolo) {
      setRuoloAccesso(ruolo);
      setNomeUtenteLoggato(nomeVisualizzato);
      setLoginError("");
      setLoginPass("");
      setEventoAdminId(null);
      setVolontariAd([]);
      setMezziAd([]);
      setConfigAd(defaultConfig());
      setSquadreAd([]);
      setRegistroRadioAd([]);
      setCocEventoId(null);
      setCocUtenteAttivo(null);
      return;
    }
    // nessuna corrispondenza tra i ruoli fissi: cerca tra gli utenti COC (responsabili di funzione) di ogni evento attivo
    for (const ev of eventi) {
      if (ev.chiuso) continue;
      try {
        const res = await window.storage.get(KEY_COC_UTENTI(ev.id), true);
        if (res && res.value) {
          const utenti = JSON.parse(res.value);
          const match = utenti.find((u) => u.username.trim().toLowerCase() === user && u.password === loginPass);
          if (match) {
            setRuoloAccesso("coc-funzione");
            setCocUtenteAttivo(match);
            setLoginError("");
            setLoginPass("");
            await impostaCocEvento(ev.id);
            return;
          }
        }
      } catch (err) {
        // evento senza utenti COC configurati: prosegui con il successivo
      }
    }
    setLoginError("Credenziali non valide");
  }
  function handleLogout() {
    setRuoloAccesso(null);
    setNomeUtenteLoggato("");
    setTab("operatore");
    setEventoAdminId(null);
    setVolontariAd([]);
    setMezziAd([]);
    setConfigAd(defaultConfig());
    setSquadreAd([]);
    setRegistroRadioAd([]);
    setCocEventoId(null);
    setCocUtenteAttivo(null);
    setCocFunzioni([]);
    setCocUtenti([]);
    setCocDiario([]);
    setCocNote([]);
    setCocOpVolontari([]);
    setCocOpMezzi([]);
    setCocOpSquadre([]);
  }
  async function impostaCocEvento(id) {
    setCocEventoId(id);
    const d = await caricaDatiCoc(id);
    setCocFunzioni(d.funzioni);
    setCocUtenti(d.utenti);
    setCocDiario(d.diario);
    setCocNote(d.note);
    const op = await caricaDatiEvento(id);
    setCocOpVolontari(op.volontari);
    setCocOpMezzi(op.mezzi);
    setCocOpSquadre(op.squadre);
  }
  function cambiaCocEvento() {
    setCocEventoId(null);
    setCocUtenteAttivo(null);
    setCocFunzioni([]);
    setCocUtenti([]);
    setCocDiario([]);
    setCocNote([]);
    setCocOpVolontari([]);
    setCocOpMezzi([]);
    setCocOpSquadre([]);
  }

  // ---------- Riepilogo: evento selezionato manualmente ----------
  function apriRiepilogoDiretto() {
    const idScelto = riepilogoEventoId || eventoOperatoreId || eventoAdminId;
    const nomeScelto = riepilogoEventoId
      ? eventi.find((e) => e.id === riepilogoEventoId)?.nome || ""
      : eventoOperatoreId
      ? eventi.find((e) => e.id === eventoOperatoreId)?.nome || ""
      : eventi.find((e) => e.id === eventoAdminId)?.nome || "";
    const oggiStr = new Date().toISOString().slice(0, 10);
    // se l'evento coincide con quello in gestione Admin, usa i turni della giornata impostata nel filtro generale lì;
    // altrimenti (lato pubblico) usa i turni della giornata odierna, non essendoci un filtro data condiviso in quel contesto
    const listaTurniEffettiva =
      idScelto === eventoAdminId
        ? turniPerGiorno(configAd, dataGenerale)
        : idScelto === eventoOperatoreId
        ? turniPerGiorno(configOp, oggiStr)
        : [];
    const turnoForzato = idScelto === eventoAdminId && turnoGenerale !== "tutti" ? listaTurniEffettiva.find((t) => t.id === turnoGenerale) : null;
    const dataForzata = idScelto === eventoAdminId ? dataGenerale : null;
    const eventoSceltoObj = eventi.find((e) => e.id === idScelto);
    apriFinestraQuadroOperativo(
      idScelto,
      nomeScelto,
      impostazioniGlobali.tipiMezzo,
      listaTurniEffettiva,
      turnoForzato,
      dataForzata,
      eventoSceltoObj && eventoSceltoObj.loghi,
      eventoSceltoObj && eventoSceltoObj.enteGestore
    );
  }
  async function selezionaRiepilogoEvento(id) {
    setRiepilogoEventoId(id);
    const d = await caricaDatiEvento(id);
    setRiepilogoVolontari(d.volontari);
    setRiepilogoMezzi(d.mezzi);
    setRiepilogoSquadre(d.squadre);
  }
  function cambiaRiepilogoEvento() {
    setRiepilogoEventoId(null);
    setRiepilogoVolontari([]);
    setRiepilogoMezzi([]);
    setRiepilogoSquadre([]);
  }
  function saveAdminCredentials(next) {
    setAdminCredentials(next);
    persist(KEY_ADMIN_CREDS, next);
  }

  // ---------- gestione account operatore (solo admin) ----------
  function saveOperatori(next) {
    setOperatori(next);
    persist(KEY_OPERATORI, next);
  }
  function creaOperatore(data) {
    const u = (data.username || "").trim();
    const p = (data.password || "").trim();
    const nome = (data.nome || "").trim();
    const cognome = (data.cognome || "").trim();
    if (!u || !p || !nome || !cognome) return false;
    if (operatori.some((o) => o.username.trim().toLowerCase() === u.toLowerCase())) return false;
    saveOperatori([...operatori, { id: genId(), nome, cognome, username: u, password: p }]);
    return true;
  }
  function modificaOperatore(id, patch) {
    saveOperatori(operatori.map((o) => (o.id === id ? { ...o, ...patch } : o)));
  }
  function eliminaOperatore(id) {
    if (operatori.length <= 1) {
      showToast("Deve rimanere almeno un operatore");
      return;
    }
    saveOperatori(operatori.filter((o) => o.id !== id));
  }

  // ---------- COC: funzioni di supporto (solo AdminCoc) ----------
  function toggleFunzioneCoc(id) {
    aggiornaListaCondivisa(
      KEY_COC_FUNZIONI,
      cocEventoId,
      (attuale) => (attuale.length ? attuale : COC_FUNZIONI_DEFAULT).map((f) => (f.id === id ? { ...f, attiva: !f.attiva } : f)),
      setCocFunzioni
    );
  }
  function aggiungiFunzioneCoc(nome) {
    const n = (nome || "").trim();
    if (!n) return;
    aggiornaListaCondivisa(
      KEY_COC_FUNZIONI,
      cocEventoId,
      (attuale) => [...(attuale.length ? attuale : COC_FUNZIONI_DEFAULT), { id: genId(), nome: n, descrizione: "", attiva: true }],
      setCocFunzioni
    );
  }

  // ---------- COC: utenti / responsabili di funzione (solo AdminCoc) ----------
  function creaUtenteCoc(data) {
    const username = (data.username || "").trim();
    const password = (data.password || "").trim();
    if (!data.nome?.trim() || !data.cognome?.trim() || !username || !password || !data.funzioneId) return false;
    if (cocUtenti.some((u) => u.username.trim().toLowerCase() === username.toLowerCase())) return false;
    aggiornaListaCondivisa(
      KEY_COC_UTENTI,
      cocEventoId,
      (attuale) => [
        ...attuale,
        { id: genId(), nome: data.nome.trim(), cognome: data.cognome.trim(), username, password, funzioneId: data.funzioneId },
      ],
      setCocUtenti
    );
    return true;
  }
  function modificaUtenteCoc(id, patch) {
    aggiornaListaCondivisa(KEY_COC_UTENTI, cocEventoId, (attuale) => attuale.map((u) => (u.id === id ? { ...u, ...patch } : u)), setCocUtenti);
  }
  function eliminaUtenteCoc(id) {
    aggiornaListaCondivisa(KEY_COC_UTENTI, cocEventoId, (attuale) => attuale.filter((u) => u.id !== id), setCocUtenti);
  }

  // ---------- COC: diario di sala (ogni responsabile scrive solo per la propria funzione) ----------
  function aggiungiDiarioCoc(funzioneId, autore, testo) {
    const t = (testo || "").trim();
    if (!t) return;
    aggiornaListaCondivisa(
      KEY_COC_DIARIO,
      cocEventoId,
      (attuale) => [{ id: genId(), funzioneId, autore, testo: t, timestamp: Date.now() }, ...attuale],
      setCocDiario
    );
  }
  function modificaDiarioCoc(id, testo) {
    aggiornaListaCondivisa(KEY_COC_DIARIO, cocEventoId, (attuale) => attuale.map((d) => (d.id === id ? { ...d, testo } : d)), setCocDiario);
  }
  function eliminaDiarioCoc(id) {
    aggiornaListaCondivisa(KEY_COC_DIARIO, cocEventoId, (attuale) => attuale.filter((d) => d.id !== id), setCocDiario);
  }

  // ---------- COC: note operative tra funzioni ----------
  function inviaNotaCoc(daFunzioneId, autore, testo, aFunzioneIds) {
    const t = (testo || "").trim();
    if (!t || !aFunzioneIds || !aFunzioneIds.length) return;
    aggiornaListaCondivisa(
      KEY_COC_NOTE,
      cocEventoId,
      (attuale) => [{ id: genId(), daFunzioneId, autore, testo: t, aFunzioneIds, timestamp: Date.now(), stato: "in attesa", motivazione: "" }, ...attuale],
      setCocNote
    );
  }
  function aggiornaStatoNotaCoc(id, stato, motivazione) {
    aggiornaListaCondivisa(
      KEY_COC_NOTE,
      cocEventoId,
      (attuale) => attuale.map((n) => (n.id === id ? { ...n, stato, motivazione: motivazione || "" } : n)),
      setCocNote
    );
  }

  // ---------- associazione corrente (operatore, locale al dispositivo) ----------
  function aggiungiAssociazione(nome) {
    const n = nome.trim();
    if (!n) return;
    const lista = configAd.associazioni || [];
    if (lista.some((a) => a.toLowerCase() === n.toLowerCase())) return;
    saveConfigAd({ ...configAd, associazioni: [...lista, n] });
  }
  function rimuoviAssociazione(nome) {
    saveConfigAd({ ...configAd, associazioni: (configAd.associazioni || []).filter((a) => a !== nome) });
  }
  function impostaAssociazioneCorrente(assoc) {
    setAssociazioneCorrente(assoc);
  }
  function cambiaAssociazione() {
    setAssociazioneCorrente(null);
  }

  // ---------- evento corrente: operatore ----------
  async function impostaEventoOperatore(id) {
    setEventoOperatoreId(id);
    const d = await caricaDatiEvento(id);
    setVolontariOp(d.volontari);
    setMezziOp(d.mezzi);
    setConfigOp(d.config);
    setSquadreOp(d.squadre);
  }
  function cambiaEventoOperatore() {
    setEventoOperatoreId(null);
    setVolontariOp([]);
    setMezziOp([]);
    setConfigOp(defaultConfig());
    setSquadreOp([]);
  }

  // ---------- evento corrente: admin ----------
  async function impostaEventoAdmin(id) {
    setEventoAdminId(id);
    try {
      await window.storage.set(KEY_EVENTO_ADMIN, JSON.stringify(id), false);
    } catch (e) {
      console.error("Errore salvataggio evento admin", e);
    }
    const d = await caricaDatiEvento(id);
    setVolontariAd(d.volontari);
    setMezziAd(d.mezzi);
    setConfigAd(d.config);
    setSquadreAd(d.squadre);
          setRegistroRadioAd(d.registroRadio);
    const { turnoId: turnoAuto, dataStr: dataAuto } = trovaTurnoEGiornoAttuale(d.config);
    setTurnoGenerale(turnoAuto);
    setDataGenerale(dataAuto);
  }
  async function cambiaEventoAdmin() {
    setEventoAdminId(null);
    setVolontariAd([]);
    setMezziAd([]);
    setConfigAd(defaultConfig());
    setSquadreAd([]);
    setRegistroRadioAd([]);
    try {
      await window.storage.delete(KEY_EVENTO_ADMIN, false);
    } catch (e) {
      // chiave già assente
    }
  }

  // ---------- gestione eventi (admin) ----------
  function creaEvento(nome, luogoAttivita, enteGestore, loghi) {
    const n = (nome || "").trim();
    if (!n) return;
    const nuovo = {
      id: genId(),
      nome: n,
      luogoAttivita: (luogoAttivita || "").trim(),
      enteGestore: (enteGestore || "").trim(),
      loghi: loghiEventoValidi(loghi),
      createdAt: Date.now(),
      chiuso: false,
    };
    saveEventi([nuovo, ...eventi]);
    showToast(`Evento "${n}" creato`);
    return nuovo.id;
  }
  function rinominaEvento(id, nome, luogoAttivita, enteGestore, loghi) {
    const n = (nome || "").trim();
    if (!n) return;
    saveEventi(
      eventi.map((e) =>
        e.id === id
          ? {
              ...e,
              nome: n,
              ...(luogoAttivita !== undefined ? { luogoAttivita: luogoAttivita.trim() } : {}),
              ...(enteGestore !== undefined ? { enteGestore: enteGestore.trim() } : {}),
              ...(loghi !== undefined ? { loghi: loghiEventoValidi(loghi) } : {}),
            }
          : e
      )
    );
    return;
  }
  function chiudiEvento(id) {
    if (!window.confirm("Chiudere questo evento? Rimarrà consultabile ma non comparirà più tra quelli selezionabili dagli operatori.")) return;
    saveEventi(eventi.map((e) => (e.id === id ? { ...e, chiuso: true } : e)));
  }
  function riapriEvento(id) {
    saveEventi(eventi.map((e) => (e.id === id ? { ...e, chiuso: false } : e)));
  }
  async function eliminaEvento(id) {
    if (!window.confirm("Eliminare definitivamente questo evento e tutti i suoi dati (volontari e mezzi)? L'operazione non è reversibile.")) return;
    saveEventi(eventi.filter((e) => e.id !== id));
    try {
      await window.storage.delete(KEY_VOL(id), true);
      await window.storage.delete(KEY_MEZZI(id), true);
      await window.storage.delete(KEY_CONFIG(id), true);
      await window.storage.delete(KEY_SQUADRE(id), true);
      await window.storage.delete(KEY_REGISTRO_RADIO(id), true);
    } catch (e) {
      // eliminazione best-effort delle chiavi dati
    }
    if (eventoAdminId === id) cambiaEventoAdmin();
  }

  // ---------- esportazione completa evento ----------
  async function esportaEvento(id) {
    const evento = eventi.find((e) => e.id === id);
    const nomeFile = (evento?.nome || "evento").trim().replace(/[^a-z0-9]+/gi, "_");
    let d;
    try {
      d = await caricaDatiEvento(id);
    } catch (e) {
      showToast("Errore durante l'esportazione — riprova");
      return;
    }

    function referenteNome(mezzoRefId) {
      const v = d.volontari.find((x) => x.id === mezzoRefId);
      return v ? `${v.cognome} ${v.nome}` : "";
    }
    function nomeVolontario(vid) {
      const v = d.volontari.find((x) => x.id === vid);
      return v ? `${v.cognome} ${v.nome}` : "";
    }

    const righeVolontari = [[
      "Cognome", "Nome", "Luogo nascita", "Data nascita", "Telefono", "Associazione", "Codice associazione",
      "Specializzazione", "Caposquadra", "Luogo attività", "Benefici L.266", "Pasto richiesto", "Inizio turno", "Fine turno",
      "Ingresso", "Uscita", "Stato",
    ]];
    d.volontari.forEach((v) =>
      righeVolontari.push([
        v.cognome, v.nome, v.luogoNascita || "", fmtDataItaliana(v.dataNascita), v.telefono || "",
        v.luogoAttivita || "", v.beneficiLegge || "No", v.pastoRichiesto || "No", v.inizioTurno || "", v.fineTurno || "",
        fmtDate(v.oraIngresso) + " " + fmtTime(v.oraIngresso),
        v.oraUscita ? fmtDate(v.oraUscita) + " " + fmtTime(v.oraUscita) : "", v.stato,
      ])
    );

    const righeMezzi = [["Targa", "Tipo", "Alimentazione", "Associazione", "Codice associazione", "Km iniziali", "Km finali", "Buono benzina", "Referente", "Ingresso", "Uscita", "Stato"]];
    d.mezzi.forEach((m) =>
      righeMezzi.push([
        m.targa, m.tipo, m.alimentazione || "", m.associazione || ASSOCIAZIONE_DEFAULT, m.codiceAssociazione || "",
        m.kmIniziali || "", m.kmFinali || "", m.buonoBenzina || "No", referenteNome(m.referenteVolontarioId),
        fmtDate(m.oraIngresso) + " " + fmtTime(m.oraIngresso), m.oraUscita ? fmtDate(m.oraUscita) + " " + fmtTime(m.oraUscita) : "", m.stato,
      ])
    );

    const tuttiITurni = Object.values(d.config.turniPerGiorno || {}).flat();
    const righeSquadre = [["Nome", "Tipo", "Turno", "Codice radio", "Mezzo", "Volontari", "Stato"]];
    (d.squadre || []).forEach((s) => {
      const meta = TIPI_SQUADRA.find((t) => t.id === s.tipo);
      const t = tuttiITurni.find((x) => x.id === s.turnoId);
      const mezziIdsSquadra = [s.mezzoId, ...(s.mezziExtraIds || [])].filter(Boolean);
      const mezziLabel = mezziIdsSquadra
        .map((mid) => d.mezzi.find((m) => m.id === mid))
        .filter(Boolean)
        .map((m) => `${m.targa} (${m.tipo})`)
        .join("; ");
      righeSquadre.push([
        s.nome, meta?.label || s.tipo, t ? `${t.nome} (${t.inizio}-${t.fine})` : "",
        s.codiceRadio || "", mezziLabel,
        (s.volontariIds || []).map(nomeVolontario).join("; "), s.terminata ? "Terminata" : "Attiva",
      ]);
    });

    const righeRadio = [["N°", "Ora", "Data", "Da", "A", "Messaggio", "Priorità", "Note/Azioni"]];
    (d.registroRadio || [])
      .sort((a, b) => a.numero - b.numero)
      .forEach((m) => righeRadio.push([m.numero, fmtTime(m.timestamp), fmtDate(m.timestamp), m.da, m.a, m.messaggio, m.priorita, m.note || ""]));

    downloadCsv(`${nomeFile}_volontari.csv`, righeVolontari);
    setTimeout(() => downloadCsv(`${nomeFile}_mezzi.csv`, righeMezzi), 400);
    setTimeout(() => downloadCsv(`${nomeFile}_squadre.csv`, righeSquadre), 800);
    setTimeout(() => downloadCsv(`${nomeFile}_registro_radio.csv`, righeRadio), 1200);
    showToast("Esportazione avviata: 4 file CSV in scaricamento");
  }

  // ---------- database associazioni (admin, condiviso e globale) ----------
  function aggiungiAssociazioneDb(obj) {
    const cod = (obj.cod || "").trim();
    if (!cod || associazioniDb.some((a) => a.cod === cod)) return false;
    saveAssociazioniDb([
      ...associazioniDb,
      { cod, denominazione: (obj.denominazione || "").trim(), sede: (obj.sede || "").trim(), comune: (obj.comune || "").trim(), provincia: (obj.provincia || "").trim().toUpperCase() },
    ]);
    return true;
  }
  function modificaAssociazioneDb(cod, patch) {
    saveAssociazioniDb(associazioniDb.map((a) => (a.cod === cod ? { ...a, ...patch } : a)));
  }
  function eliminaAssociazioneDb(cod) {
    saveAssociazioniDb(associazioniDb.filter((a) => a.cod !== cod));
  }

  // ---------- liste configurabili per evento admin (specializzazioni / tipi mezzo / turni) ----------
  function saveImpostazioniGlobali(next) {
    setImpostazioniGlobali(next);
    persist(KEY_IMPOSTAZIONI_GLOBALI, next);
  }
  function aggiungiSpecializzazione(nome, macroArea) {
    const n = nome.trim();
    if (!n) return;
    const lista = impostazioniGlobali.specializzazioni?.length ? impostazioniGlobali.specializzazioni : SPECIALIZZAZIONI;
    if (lista.some((x) => x.toLowerCase() === n.toLowerCase())) return;
    saveImpostazioniGlobali({
      ...impostazioniGlobali,
      specializzazioni: [...lista, n],
      specializzazioniMacroAree: { ...impostazioniGlobali.specializzazioniMacroAree, [n]: macroArea || "Altro" },
    });
  }
  function rimuoviSpecializzazione(nome) {
    const lista = impostazioniGlobali.specializzazioni?.length ? impostazioniGlobali.specializzazioni : SPECIALIZZAZIONI;
    saveImpostazioniGlobali({ ...impostazioniGlobali, specializzazioni: lista.filter((x) => x !== nome) });
  }
  function aggiungiTipoMezzo(nome, macroArea) {
    const n = nome.trim();
    if (!n) return;
    const lista = impostazioniGlobali.tipiMezzo?.length ? impostazioniGlobali.tipiMezzo : TIPI_MEZZO;
    if (lista.some((x) => x.toLowerCase() === n.toLowerCase())) return;
    saveImpostazioniGlobali({
      ...impostazioniGlobali,
      tipiMezzo: [...lista, n],
      tipiMezzoMacroAree: { ...impostazioniGlobali.tipiMezzoMacroAree, [n]: macroArea || "Altro" },
    });
  }
  function rimuoviTipoMezzo(nome) {
    const lista = impostazioniGlobali.tipiMezzo?.length ? impostazioniGlobali.tipiMezzo : TIPI_MEZZO;
    saveImpostazioniGlobali({ ...impostazioniGlobali, tipiMezzo: lista.filter((x) => x !== nome) });
  }
  function aggiungiTurnoGiorno(dataStr, turno) {
    const nome = (turno.nome || "").trim();
    const inizio = turno.inizio || "";
    const fine = turno.fine || "";
    if (!dataStr || !nome || !inizio || !fine) return;
    const attuali = configAd.turniPerGiorno || {};
    const listaGiorno = attuali[dataStr]?.length ? attuali[dataStr] : turniPerGiorno(configAd, dataStr);
    saveConfigAd({
      ...configAd,
      turniPerGiorno: { ...attuali, [dataStr]: [...listaGiorno, { id: genId(), nome, inizio, fine }] },
    });
  }
  function rimuoviTurnoGiorno(dataStr, id) {
    const attuali = configAd.turniPerGiorno || {};
    const listaGiorno = attuali[dataStr]?.length ? attuali[dataStr] : turniPerGiorno(configAd, dataStr);
    saveConfigAd({
      ...configAd,
      turniPerGiorno: { ...attuali, [dataStr]: listaGiorno.filter((t) => t.id !== id) },
    });
  }
  function svuotaTurniGiorno(dataStr) {
    const attuali = { ...(configAd.turniPerGiorno || {}) };
    delete attuali[dataStr];
    saveConfigAd({ ...configAd, turniPerGiorno: attuali });
  }
  function modificaTurnoGiorno(dataStr, id, patch) {
    const attuali = configAd.turniPerGiorno || {};
    const listaGiorno = attuali[dataStr] || [];
    saveConfigAd({
      ...configAd,
      turniPerGiorno: { ...attuali, [dataStr]: listaGiorno.map((t) => (t.id === id ? { ...t, ...patch } : t)) },
    });
  }
  function spostaTurnoGiorno(dataStr, id, direzione) {
    const attuali = configAd.turniPerGiorno || {};
    const listaGiorno = [...(attuali[dataStr] || [])];
    const idx = listaGiorno.findIndex((t) => t.id === id);
    const nuovoIdx = idx + direzione;
    if (idx === -1 || nuovoIdx < 0 || nuovoIdx >= listaGiorno.length) return;
    [listaGiorno[idx], listaGiorno[nuovoIdx]] = [listaGiorno[nuovoIdx], listaGiorno[idx]];
    saveConfigAd({ ...configAd, turniPerGiorno: { ...attuali, [dataStr]: listaGiorno } });
  }

  const volontariInCampo = volontariOp.filter((v) => v.stato === "in campo").length;
  const mezziInServizio = mezziOp.filter((m) => m.stato === "in servizio").length;
  const volontariInCampoAdmin = volontariAd.filter((v) => v.stato === "in campo").length;
  const mezziInServizioAdmin = mezziAd.filter((m) => m.stato === "in servizio").length;
  const associazioniInCampoSet = new Set([
    ...volontariOp.filter((v) => v.stato === "in campo").map((v) => v.associazione || ASSOCIAZIONE_DEFAULT),
    ...mezziOp.filter((m) => m.stato === "in servizio").map((m) => m.associazione || ASSOCIAZIONE_DEFAULT),
  ]);
  const tipiMezzoOp = impostazioniGlobali?.tipiMezzo?.length ? impostazioniGlobali.tipiMezzo : TIPI_MEZZO;
  const mezziPerTipo = tipiMezzoOp
    .map((t) => ({
      tipo: t,
      n: mezziOp.filter((m) => m.stato === "in servizio" && m.tipo === t).length,
    }))
    .filter((x) => x.n > 0);

  const associazioniInCampoSetAdmin = new Set([
    ...volontariAd.filter((v) => v.stato === "in campo").map((v) => v.associazione || ASSOCIAZIONE_DEFAULT),
    ...mezziAd.filter((m) => m.stato === "in servizio").map((m) => m.associazione || ASSOCIAZIONE_DEFAULT),
  ]);
  const tipiMezzoAdmin = impostazioniGlobali?.tipiMezzo?.length ? impostazioniGlobali.tipiMezzo : TIPI_MEZZO;
  const mezziPerTipoAdmin = tipiMezzoAdmin
    .map((t) => ({
      tipo: t,
      n: mezziAd.filter((m) => m.stato === "in servizio" && m.tipo === t).length,
    }))
    .filter((x) => x.n > 0);

  const squadrePerTipo = TIPI_SQUADRA.map((t) => ({ tipo: t.label, n: squadreOp.filter((s) => s.tipo === t.id).length }));
  const squadrePerTipoAdmin = TIPI_SQUADRA.map((t) => ({ tipo: t.label, n: squadreAd.filter((s) => s.tipo === t.id).length }));

  // ---------- Riepilogo: dati dell'evento selezionato manualmente (se presente) ----------
  const volontariInCampoRiepilogo = riepilogoVolontari.filter((v) => v.stato === "in campo").length;
  const mezziInServizioRiepilogo = riepilogoMezzi.filter((m) => m.stato === "in servizio").length;
  const associazioniInCampoSetRiepilogo = new Set([
    ...riepilogoVolontari.filter((v) => v.stato === "in campo").map((v) => v.associazione || ASSOCIAZIONE_DEFAULT),
    ...riepilogoMezzi.filter((m) => m.stato === "in servizio").map((m) => m.associazione || ASSOCIAZIONE_DEFAULT),
  ]);
  const mezziPerTipoRiepilogo = (impostazioniGlobali.tipiMezzo?.length ? impostazioniGlobali.tipiMezzo : TIPI_MEZZO)
    .map((t) => ({ tipo: t, n: riepilogoMezzi.filter((m) => m.stato === "in servizio" && m.tipo === t).length }))
    .filter((x) => x.n > 0);
  const squadrePerTipoRiepilogo = TIPI_SQUADRA.map((t) => ({ tipo: t.label, n: riepilogoSquadre.filter((s) => !s.terminata && s.tipo === t.id).length }));
  const eventiAttiviRiepilogo = eventi.filter((e) => !e.chiuso);
  const riepilogoEventoNomeSel = eventi.find((e) => e.id === riepilogoEventoId)?.nome || "";

  const eventoOperatoreNome = eventi.find((e) => e.id === eventoOperatoreId)?.nome || "";
  const eventoOperatoreLuogo = eventi.find((e) => e.id === eventoOperatoreId)?.luogoAttivita || "";
  const eventoAdminNome = eventi.find((e) => e.id === eventoAdminId)?.nome || "";

  if (loading) {
    return (
      <div style={styles.loadingWrap}>
        <div style={styles.spinner} />
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", color: "var(--paper)", marginTop: 12 }}>Caricamento dati…</div>
        <StyleBlock />
      </div>
    );
  }

  return (
    <div style={styles.app} id="pc-app-root">
      <StyleBlock />
      <StatusBar
        eventoNome={tab === "admin" ? eventoAdminNome : eventoOperatoreNome}
        volontariInCampo={tab === "admin" ? volontariInCampoAdmin : volontariInCampo}
        mezziInServizio={tab === "admin" ? mezziInServizioAdmin : mezziInServizio}
        etichettaContesto={tab === "admin" ? "EVENTO ADMIN" : "EVENTO"}
        tick={tick}
        onGoHome={() => setTab("operatore")}
      />

      <div style={styles.tabRow} className="no-print">
        <button
          onClick={() => setTab("operatore")}
          className="tab-btn"
          style={tab === "operatore" ? styles.tabActive : styles.tabInactive}
        >
          <Users size={16} style={{ marginRight: 6 }} /> Inserisci volontari/mezzi
        </button>
        <button
          onClick={() => setTab("admin")}
          className="tab-btn"
          style={tab === "admin" ? styles.tabActive : styles.tabInactive}
        >
          <ShieldPlus size={16} style={{ marginRight: 6 }} /> Login
        </button>
        {ruoloAccesso && (
          <button onClick={apriRiepilogoDiretto} className="tab-btn" style={styles.tabInactive}>
            <LayoutGrid size={16} style={{ marginRight: 6 }} /> Riepilogo
          </button>
        )}
      </div>

      <div style={styles.main}>
        {tab === "operatore" && (
          <OperatorView
            volontari={volontariOp}
            mezzi={mezziOp}
            config={configOp}
            tick={tick}
            associazioneCorrente={associazioneCorrente}
            associazioniDb={associazioniDb}
            eventi={eventi}
            eventoCorrenteId={eventoOperatoreId}
            eventoCorrenteNome={eventoOperatoreNome}
            eventoCorrenteLuogo={eventoOperatoreLuogo}
            specializzazioniGlobali={impostazioniGlobali.specializzazioni}
            tipiMezzoGlobali={impostazioniGlobali.tipiMezzo}
            specializzazioniMacroAree={impostazioniGlobali.specializzazioniMacroAree}
            tipiMezzoMacroAree={impostazioniGlobali.tipiMezzoMacroAree}
            onSetAssociazioneCorrente={impostaAssociazioneCorrente}
            onCambiaAssociazione={cambiaAssociazione}
            onSetEvento={impostaEventoOperatore}
            onCambiaEvento={cambiaEventoOperatore}
            onIncorpora={incorporaVolontario}
            onMezzoIn={metteMezzoInServizio}
          />
        )}
        {tab === "riepilogo" && (
          <RiepilogoView
            eventi={eventi}
            eventoNome={eventoOperatoreNome}
            eventoId={eventoOperatoreId}
            tipiMezzoList={tipiMezzoOp}
            volontariInCampo={volontariInCampo}
            associazioniInCampoSet={associazioniInCampoSet}
            mezziPerTipo={mezziPerTipo}
            mezziInServizio={mezziInServizio}
            squadrePerTipo={squadrePerTipo}
            eventoAdminId={eventoAdminId}
            eventoAdminNome={eventoAdminNome}
            volontariInCampoAdmin={volontariInCampoAdmin}
            associazioniInCampoSetAdmin={associazioniInCampoSetAdmin}
            mezziPerTipoAdmin={mezziPerTipoAdmin}
            mezziInServizioAdmin={mezziInServizioAdmin}
            squadrePerTipoAdmin={squadrePerTipoAdmin}
            eventiAttivi={eventiAttiviRiepilogo}
            riepilogoEventoId={riepilogoEventoId}
            riepilogoEventoNome={riepilogoEventoNomeSel}
            volontariInCampoRiepilogo={volontariInCampoRiepilogo}
            associazioniInCampoSetRiepilogo={associazioniInCampoSetRiepilogo}
            mezziPerTipoRiepilogo={mezziPerTipoRiepilogo}
            mezziInServizioRiepilogo={mezziInServizioRiepilogo}
            squadrePerTipoRiepilogo={squadrePerTipoRiepilogo}
            onSelezionaRiepilogoEvento={selezionaRiepilogoEvento}
            onCambiaRiepilogoEvento={cambiaRiepilogoEvento}
            onVaiHome={() => setTab("operatore")}
          />
        )}
        {tab === "admin" &&
          (!ruoloAccesso ? (
            <LoginBox
              loginUser={loginUser}
              loginPass={loginPass}
              setLoginUser={setLoginUser}
              setLoginPass={setLoginPass}
              loginError={loginError}
              onSubmit={handleLogin}
            />
          ) : ruoloAccesso === "admincoc" ? (
            !cocEventoId ? (
              <CocEventoGateView eventi={eventi} onSeleziona={impostaCocEvento} onLogout={handleLogout} />
            ) : (
              <AdminCocView
                eventoNome={eventi.find((e) => e.id === cocEventoId)?.nome || ""}
                funzioni={cocFunzioni.length ? cocFunzioni : COC_FUNZIONI_DEFAULT}
                utenti={cocUtenti}
                onToggleFunzione={toggleFunzioneCoc}
                onAggiungiFunzione={aggiungiFunzioneCoc}
                onCreaUtente={creaUtenteCoc}
                onModificaUtente={modificaUtenteCoc}
                onEliminaUtente={eliminaUtenteCoc}
                onCambiaEvento={cambiaCocEvento}
                onLogout={handleLogout}
              />
            )
          ) : ruoloAccesso === "coordinatorecoc" ? (
            !cocEventoId ? (
              <CocEventoGateView eventi={eventi} onSeleziona={impostaCocEvento} onLogout={handleLogout} />
            ) : (
              <CoordinatoreCocView
                eventoNome={eventi.find((e) => e.id === cocEventoId)?.nome || ""}
                funzioni={cocFunzioni.length ? cocFunzioni : COC_FUNZIONI_DEFAULT}
                utenti={cocUtenti}
                diario={cocDiario}
                note={cocNote}
                volontari={cocOpVolontari}
                mezzi={cocOpMezzi}
                squadre={cocOpSquadre}
                tipiMezzoList={impostazioniGlobali.tipiMezzo}
                onCambiaEvento={cambiaCocEvento}
                onLogout={handleLogout}
              />
            )
          ) : ruoloAccesso === "coc-funzione" ? (
            <FunzioneCocView
              eventoNome={eventi.find((e) => e.id === cocEventoId)?.nome || ""}
              utenteAttivo={cocUtenteAttivo}
              funzioni={cocFunzioni.length ? cocFunzioni : COC_FUNZIONI_DEFAULT}
              diario={cocDiario}
              note={cocNote}
              onAggiungiDiario={aggiungiDiarioCoc}
              onModificaDiario={modificaDiarioCoc}
              onEliminaDiario={eliminaDiarioCoc}
              onInviaNota={inviaNotaCoc}
              onAggiornaStatoNota={aggiornaStatoNotaCoc}
              onLogout={handleLogout}
            />
          ) : !eventoAdminId ? (
            <EventiTab
              eventi={eventi}
              mode="gate"
              onSeleziona={impostaEventoAdmin}
              onCrea={creaEvento}
              onRinomina={rinominaEvento}
              onChiudi={chiudiEvento}
              onRiapri={riapriEvento}
              onElimina={eliminaEvento}
              onEsporta={esportaEvento}
              onLogout={handleLogout}
              specializzazioniList={impostazioniGlobali.specializzazioni}
              tipiMezzoList={impostazioniGlobali.tipiMezzo}
              specializzazioniMacroAree={impostazioniGlobali.specializzazioniMacroAree}
              tipiMezzoMacroAree={impostazioniGlobali.tipiMezzoMacroAree}
              onAddSpecializzazione={aggiungiSpecializzazione}
              onRemoveSpecializzazione={rimuoviSpecializzazione}
              onAddTipoMezzo={aggiungiTipoMezzo}
              onRemoveTipoMezzo={rimuoviTipoMezzo}
              adminCredentials={adminCredentials}
              onSaveAdminCredentials={saveAdminCredentials}
              ruoloAccesso={ruoloAccesso}
              operatori={operatori}
              onCreaOperatore={creaOperatore}
              onModificaOperatore={modificaOperatore}
              onEliminaOperatore={eliminaOperatore}
            />
          ) : (
            <AdminView
              ruoloAccesso={ruoloAccesso}
              turnoGenerale={turnoGenerale}
              setTurnoGenerale={setTurnoGenerale}
              dataGenerale={dataGenerale}
              setDataGenerale={setDataGenerale}
              nomeUtenteLoggato={nomeUtenteLoggato}
              volontari={volontariAd}
              mezzi={mezziAd}
              config={configAd}
              specializzazioniGlobali={impostazioniGlobali.specializzazioni}
              tipiMezzoGlobali={impostazioniGlobali.tipiMezzo}
              associazioniDb={associazioniDb}
              eventi={eventi}
              eventoCorrenteId={eventoAdminId}
              eventoCorrenteNome={eventoAdminNome}
              onSaveConfig={saveConfigAd}
              onAddAssociazione={aggiungiAssociazione}
              onRemoveAssociazione={rimuoviAssociazione}
              onAddAssociazioneDb={aggiungiAssociazioneDb}
              onUpdateAssociazioneDb={modificaAssociazioneDb}
              onDeleteAssociazioneDb={eliminaAssociazioneDb}
              onAddSpecializzazione={aggiungiSpecializzazione}
              onRemoveSpecializzazione={rimuoviSpecializzazione}
              onAddTipoMezzo={aggiungiTipoMezzo}
              onRemoveTipoMezzo={rimuoviTipoMezzo}
              onAddTurnoGiorno={aggiungiTurnoGiorno}
              onRemoveTurnoGiorno={rimuoviTurnoGiorno}
              onSvuotaTurniGiorno={svuotaTurniGiorno}
              onModificaTurnoGiorno={modificaTurnoGiorno}
              onSpostaTurnoGiorno={spostaTurnoGiorno}
              onUpdateVolontario={updateVolontario}
              onDeleteVolontario={deleteVolontario}
              onScorporaVolontario={scorporaVolontario}
              onRimettiInCampoVolontario={rimettiInCampoVolontario}
              onUpdateMezzo={updateMezzo}
              onDeleteMezzo={deleteMezzo}
              onCheckoutMezzo={checkoutMezzo}
              onRimettiInCampoMezzo={rimettiInCampoMezzo}
              onCambiaEvento={cambiaEventoAdmin}
              onSetEvento={impostaEventoAdmin}
              onCreaEvento={creaEvento}
              onRinominaEvento={rinominaEvento}
              onChiudiEvento={chiudiEvento}
              onRiapriEvento={riapriEvento}
              onEliminaEvento={eliminaEvento}
              onEsportaEvento={esportaEvento}
              squadre={squadreAd}
              onAggiungiSquadra={aggiungiSquadra}
              onAggiornaSquadra={aggiornaSquadra}
              onEliminaSquadra={eliminaSquadra}
              onTerminaSquadra={terminaSquadra}
              onRiattivaSquadra={riattivaSquadra}
              registroRadio={registroRadioAd}
              onAggiungiMessaggioRadio={aggiungiMessaggioRadio}
              onAggiornaMessaggioRadio={aggiornaMessaggioRadio}
              onEliminaMessaggioRadio={eliminaMessaggioRadio}
              adminCredentials={adminCredentials}
              onSaveAdminCredentials={saveAdminCredentials}
              onLogout={handleLogout}
            />
          ))}
      </div>

      {toast && (
        <div style={styles.toast} className="no-print">
          {toast}
        </div>
      )}
    </div>
  );
}

// ================= STATUS BAR =================
function StatusBar({ eventoNome, volontariInCampo, mezziInServizio, etichettaContesto, tick, onGoHome }) {
  const now = new Date();
  return (
    <div style={styles.statusBar}>
      <button style={styles.brandRow} className="no-print" onClick={onGoHome} title="Torna alla home">
        <div style={styles.logoBadge}>
          <img src={LOGO_DATA_URI} alt="Stemma Misericordia S.M. di Licodia" style={styles.logoImg} />
        </div>
        <div>
          <div style={styles.orgName}>FRATERNITA DI MISERICORDIA DI S.M. DI LICODIA - ODV</div>
          <div style={styles.orgSub}>Gestione Volontari · Protezione Civile</div>
        </div>
      </button>
      <div style={styles.flapRow}>
        <FlapStat label={etichettaContesto || "EVENTO"} value={eventoNome || "—"} wide />
        <FlapStat label="VOLONTARI IN CAMPO" value={String(volontariInCampo).padStart(2, "0")} accent="orange" />
        <FlapStat label="MEZZI IN SERVIZIO" value={String(mezziInServizio).padStart(2, "0")} accent="green" />
        <FlapStat label="ORA" value={now.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })} />
        <FlapStat label="DATA" value={now.toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit", year: "numeric" })} />
      </div>
    </div>
  );
}
function FlapStat({ label, value, accent, wide }) {
  return (
    <div style={{ ...styles.flapStat, minWidth: wide ? 220 : 110 }}>
      <div style={styles.flapLabel}>{label}</div>
      <div style={{ ...styles.flapValue, color: accent === "orange" ? "var(--orange)" : accent === "green" ? "var(--green)" : "var(--paper)" }}>
        {value}
      </div>
    </div>
  );
}

// ================= RIEPILOGO =================
function RiepilogoView({
  eventi,
  eventoNome,
  eventoId,
  tipiMezzoList,
  volontariInCampo,
  associazioniInCampoSet,
  mezziPerTipo,
  mezziInServizio,
  squadrePerTipo,
  eventoAdminId,
  eventoAdminNome,
  volontariInCampoAdmin,
  associazioniInCampoSetAdmin,
  mezziPerTipoAdmin,
  mezziInServizioAdmin,
  squadrePerTipoAdmin,
  eventiAttivi,
  riepilogoEventoId,
  riepilogoEventoNome,
  volontariInCampoRiepilogo,
  associazioniInCampoSetRiepilogo,
  mezziPerTipoRiepilogo,
  mezziInServizioRiepilogo,
  squadrePerTipoRiepilogo,
  onSelezionaRiepilogoEvento,
  onCambiaRiepilogoEvento,
  onVaiHome,
}) {
  const [mostraSelettore, setMostraSelettore] = useState(false);
  // priorità: evento scelto manualmente > evento pubblico (operatore) > evento in gestione Admin
  const usaSelezioneManuale = !!riepilogoEventoId;
  const usaAdmin = !usaSelezioneManuale && !eventoId && !!eventoAdminId;
  const effEventoId = riepilogoEventoId || eventoId || eventoAdminId;
  const effEventoNome = usaSelezioneManuale ? riepilogoEventoNome : usaAdmin ? eventoAdminNome : eventoNome;
  const effVolontariInCampo = usaSelezioneManuale ? volontariInCampoRiepilogo : usaAdmin ? volontariInCampoAdmin : volontariInCampo;
  const effMezziInServizio = usaSelezioneManuale ? mezziInServizioRiepilogo : usaAdmin ? mezziInServizioAdmin : mezziInServizio;
  const effAssociazioniSet = usaSelezioneManuale ? associazioniInCampoSetRiepilogo : usaAdmin ? associazioniInCampoSetAdmin : associazioniInCampoSet;
  const effMezziPerTipo = usaSelezioneManuale ? mezziPerTipoRiepilogo : usaAdmin ? mezziPerTipoAdmin : mezziPerTipo;
  const effSquadrePerTipo = (usaSelezioneManuale ? squadrePerTipoRiepilogo : usaAdmin ? squadrePerTipoAdmin : squadrePerTipo) || [];
  const effEventoObj = (eventi || []).find((e) => e.id === effEventoId);
  const effEventoLoghi = effEventoObj && effEventoObj.loghi;
  const effEventoEnte = effEventoObj && effEventoObj.enteGestore;
  const associazioni = Array.from(effAssociazioniSet || []);

  function escapeHtml(s) {
    return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  function apriFinestraRiepilogo() {
    if (!effEventoId) {
      window.alert("Seleziona prima un evento dalla schermata iniziale (tocca il logo in alto per tornare alla home) per poter aprire il quadro operativo.");
      return;
    }
    const html = `<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="utf-8" />
<title>Quadro operativo - ${escapeHtml(effEventoNome || "")}</title>
<style>
  * { box-sizing: border-box; }
  body { margin: 0; background: #F5F3EE; color: #14181F; font-family: 'Inter', Arial, sans-serif; min-height: 100vh; }
  .toolbar { display: flex; justify-content: flex-end; padding: 14px 24px 0; }
  .fs-btn { background: #1F3B57; color: #fff; border: none; border-radius: 8px; padding: 9px 16px; font-size: 13px; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; }
  .fs-btn:hover { background: #16293e; }
  .header { display: flex; align-items: center; gap: 16px; padding: 12px 32px 20px; border-bottom: 2px solid #1F3B57; }
  .logo { width: 60px; height: 74px; background: transparent; border-radius: 8px; padding: 4px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .logo img { width: 100%; height: 100%; object-fit: contain; }
  .loghi-riga { display: flex; align-items: center; gap: 10px; height: 74px; flex-shrink: 0; }
  .loghi-riga img { height: 100%; width: auto; max-width: 80px; object-fit: contain; }
  .org-name { font-size: 17px; letter-spacing: 0.02em; text-transform: uppercase; font-weight: 700; color: #14181F; }
  .org-sub { font-size: 13px; color: #556; margin-top: 3px; font-weight: 500; }
  .evento-banner { text-align: center; padding: 30px 20px 6px; text-transform: uppercase; letter-spacing: 0.03em; font-size: clamp(20px, 3vw, 30px); font-weight: 700; color: #1F3B57; }
  .clock { text-align: center; font-variant-numeric: tabular-nums; font-size: 16px; font-weight: 600; color: #556; margin-bottom: 28px; }
  .stats { display: flex; gap: 4vw; flex-wrap: wrap; justify-content: center; padding: 0 20px 44px; }
  .stat { text-align: center; background: #fff; border: 1px solid #D8D3C8; border-radius: 14px; padding: 22px 30px; min-width: 200px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
  .stat-label { font-size: clamp(13px, 1.4vw, 16px); font-weight: 700; color: #445; letter-spacing: 0.03em; text-transform: uppercase; margin-bottom: 10px; }
  .stat-value { font-variant-numeric: tabular-nums; font-size: clamp(48px, 8vw, 96px); font-weight: 800; line-height: 1; color: #1F3B57; }
  .accent-orange { color: #E8622C; }
  .accent-green { color: #3F7D53; }
  .section { max-width: 900px; margin: 0 auto 34px; padding: 0 20px; }
  .section-title { text-align: center; text-transform: uppercase; letter-spacing: 0.04em; font-size: 16px; font-weight: 700; color: #223; margin-bottom: 14px; }
  .chip-row { display: flex; gap: 12px; flex-wrap: wrap; justify-content: center; }
  .chip { background: #fff; border: 1px solid #D8D3C8; border-radius: 10px; padding: 12px 20px; font-size: 16px; font-weight: 600; color: #14181F; box-shadow: 0 1px 4px rgba(0,0,0,0.04); }
  .chip b { color: #1F3B57; margin-left: 6px; }
  .empty-note { text-align: center; color: #999; font-size: 14px; padding: 10px; }
  .footer-pad { height: 30px; }
  .fullscreen-mode .toolbar { display: none; }
</style>
</head>
<body>
  <div class="toolbar">
    <button class="fs-btn" id="fs-toggle" onclick="toggleFullscreen()">⤢ Schermo intero</button>
  </div>
  <div class="header">
    ${
      loghiEventoValidi(effEventoLoghi).length
        ? buildLoghiRigaHtml(effEventoLoghi, 74)
        : `<div class="logo"><img src="${LOGO_DATA_URI}" alt="Stemma Misericordia" /></div>`
    }
    <div>
      <div class="org-name">${escapeHtml(effEventoEnte || "Fraternita di Misericordia di S.M. di Licodia - ODV")}</div>
      <div class="org-sub">Quadro operativo · Protezione Civile</div>
    </div>
  </div>
  <div class="evento-banner">${escapeHtml(effEventoNome || "")}</div>
  <div class="clock" id="clock"></div>
  <div class="stats">
    <div class="stat"><div class="stat-label">Volontari in campo</div><div class="stat-value accent-orange" id="v-count">–</div></div>
    <div class="stat"><div class="stat-label">Associazioni in campo</div><div class="stat-value" id="a-count">–</div></div>
    <div class="stat"><div class="stat-label">Mezzi in servizio</div><div class="stat-value accent-green" id="m-count">–</div></div>
  </div>
  <div class="section">
    <div class="section-title">Mezzi per tipo</div>
    <div class="chip-row" id="mezzi-tipo"></div>
  </div>
  <div class="section">
    <div class="section-title">Squadre operative per tipologia</div>
    <div class="chip-row" id="squadre-tipo"></div>
  </div>
  <div class="section">
    <div class="section-title">Associazioni presenti</div>
    <div class="chip-row" id="assoc-list"></div>
  </div>
  <div class="footer-pad"></div>
  <script>
    var ASSOC_DEFAULT = "${escapeHtml(ASSOCIAZIONE_DEFAULT)}";
    var TIPI_MEZZO = ${JSON.stringify(tipiMezzoList)};
    var KEY_VOL = "protcivile:volontari:${effEventoId}";
    var KEY_MEZZI = "protcivile:mezzi:${effEventoId}";
    var KEY_SQUADRE = "protcivile:squadre:${effEventoId}";
    var TIPI_SQUADRA = ${JSON.stringify(TIPI_SQUADRA)};

    function toggleFullscreen() {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(function(){});
      } else {
        document.exitFullscreen().catch(function(){});
      }
    }
    document.addEventListener('fullscreenchange', function(){
      document.body.classList.toggle('fullscreen-mode', !!document.fullscreenElement);
    });

    function updateClock() {
      var el = document.getElementById('clock');
      if (el) el.textContent = new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }
    updateClock();
    setInterval(updateClock, 1000);

    function render(volontari, mezzi, squadre) {
      var vAttivi = volontari.filter(function(v){ return v.stato === 'in campo'; });
      var mAttivi = mezzi.filter(function(m){ return m.stato === 'in servizio'; });
      var assocSet = {};
      vAttivi.forEach(function(v){ assocSet[(v.associazione || ASSOC_DEFAULT).trim()] = true; });
      mAttivi.forEach(function(m){ assocSet[(m.associazione || ASSOC_DEFAULT).trim()] = true; });
      var assocList = Object.keys(assocSet).sort();

      document.getElementById('v-count').textContent = vAttivi.length;
      document.getElementById('a-count').textContent = assocList.length;
      document.getElementById('m-count').textContent = mAttivi.length;

      var mezziTipoHtml = '';
      TIPI_MEZZO.forEach(function(t){
        var n = mAttivi.filter(function(m){ return m.tipo === t; }).length;
        if (n > 0) mezziTipoHtml += '<div class="chip">' + t + '<b>' + n + '</b></div>';
      });
      document.getElementById('mezzi-tipo').innerHTML = mezziTipoHtml || '<div class="empty-note">Nessun mezzo in servizio.</div>';

      var squadreTipoHtml = '';
      TIPI_SQUADRA.forEach(function(t){
        var n = (squadre || []).filter(function(s){ return s.tipo === t.id; }).length;
        if (n > 0) squadreTipoHtml += '<div class="chip">' + t.label + '<b>' + n + '</b></div>';
      });
      document.getElementById('squadre-tipo').innerHTML = squadreTipoHtml || '<div class="empty-note">Nessuna squadra operativa.</div>';

      var assocHtml = '';
      assocList.forEach(function(a){ assocHtml += '<div class="chip">' + a + '</div>'; });
      document.getElementById('assoc-list').innerHTML = assocHtml || '<div class="empty-note">Nessuna associazione presente.</div>';
    }

    function poll() {
      try {
        if (!window.opener || window.opener.closed || !window.opener.storage) return;
        Promise.all([
          window.opener.storage.get(KEY_VOL, true).catch(function(){ return null; }),
          window.opener.storage.get(KEY_MEZZI, true).catch(function(){ return null; }),
          window.opener.storage.get(KEY_SQUADRE, true).catch(function(){ return null; })
        ]).then(function(res){
          var volontari = res[0] && res[0].value ? JSON.parse(res[0].value) : [];
          var mezzi = res[1] && res[1].value ? JSON.parse(res[1].value) : [];
          var squadre = res[2] && res[2].value ? JSON.parse(res[2].value) : [];
          render(volontari, mezzi, squadre);
        });
      } catch (e) { /* silenzioso */ }
    }
    poll();
    setInterval(poll, 8000);
  </script>
</body>
</html>`;
    const win = window.open("", "_blank", "width=1100,height=800");
    if (!win) {
      window.alert("Il browser ha bloccato l'apertura della finestra. Consenti i popup per questo sito e riprova.");
      return;
    }
    win.document.open();
    win.document.write(html);
    win.document.close();
    win.focus();
  }

  return (
    <div style={{ display: "grid", gap: 20 }}>
      {eventiAttivi && eventiAttivi.length > 1 && (
        <div style={styles.assocBanner} className="no-print">
          <div>
            <div style={styles.assocBannerLabel}>Evento mostrato nel riepilogo</div>
            <div style={styles.assocBannerName}>{effEventoNome || "Automatico"}</div>
          </div>
          <button
            style={styles.btnSecondary}
            onClick={() => {
              if (usaSelezioneManuale) onCambiaRiepilogoEvento();
              setMostraSelettore((v) => !v);
            }}
          >
            {mostraSelettore ? "Chiudi" : "Cambia evento"}
          </button>
        </div>
      )}
      {mostraSelettore && eventiAttivi && (
        <div style={styles.card} className="no-print">
          <h2 style={styles.cardTitle}>Seleziona l'evento da visualizzare</h2>
          <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
            {eventiAttivi.map((e) => (
              <div key={e.id} style={styles.rowItem}>
                <div style={styles.rowTitle}>{e.nome}</div>
                <button
                  style={styles.btnPrimary}
                  onClick={() => {
                    onSelezionaRiepilogoEvento(e.id);
                    setMostraSelettore(false);
                  }}
                >
                  Seleziona
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      {!effEventoId && (
        <div style={{ ...styles.card, borderColor: "var(--orange)" }}>
          <h2 style={{ ...styles.cardTitle, color: "var(--orange)" }}>Nessun evento selezionato</h2>
          <p style={{ fontSize: 13, color: "#555", marginBottom: 12 }}>
            Il quadro operativo mostra i dati dell'evento selezionato nella home pubblica (o, se non presente, quello in
            gestione in Admin). Torna alla home e scegli un'associazione e un evento per vedere qui i numeri in tempo reale.
          </p>
          {onVaiHome && (
            <button style={styles.btnPrimary} onClick={onVaiHome}>
              Vai alla selezione evento
            </button>
          )}
        </div>
      )}
      {usaAdmin && (
        <div style={{ ...styles.card, borderColor: "var(--green)" }}>
          <div style={{ fontSize: 13, color: "#555" }}>
            Nessun evento selezionato nella home pubblica: sto mostrando automaticamente l'evento attualmente in gestione in
            Admin (<b>{eventoAdminNome}</b>).
          </div>
        </div>
      )}
      <div style={{ ...styles.card, cursor: "pointer" }} onClick={apriFinestraRiepilogo}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 style={{ ...styles.cardTitle, margin: 0 }}>Quadro operativo</h2>
          <span style={styles.btnSecondary}>
            <Maximize2 size={14} style={{ marginRight: 6 }} /> Apri in una nuova finestra
          </span>
        </div>
        <div style={styles.statGrid}>
          <StatCard label="Volontari in campo" value={effVolontariInCampo} accent="orange" />
          <StatCard label="Associazioni in campo" value={associazioni.length} />
          <StatCard label="Mezzi in servizio" value={effMezziInServizio} accent="green" />
        </div>
      </div>

      {effMezziPerTipo.length > 0 && (
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Mezzi in campo per tipo</h2>
          <div style={{ display: "grid", gap: 8 }}>
            {effMezziPerTipo.map(({ tipo, n }) => (
              <div key={tipo} style={styles.rowItem}>
                <div style={styles.rowTitle}>{tipo}</div>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 18 }}>{n}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {effSquadrePerTipo.some((x) => x.n > 0) && (
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Squadre operative per tipologia</h2>
          <div style={{ display: "grid", gap: 8 }}>
            {effSquadrePerTipo.map(({ tipo, n }) => (
              <div key={tipo} style={styles.rowItem}>
                <div style={styles.rowTitle}>{tipo}</div>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 18 }}>{n}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {associazioni.length > 0 && (
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Associazioni presenti</h2>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {associazioni.map((a) => (
              <span key={a} style={styles.pillGreen}>
                {a}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ================= LOGIN =================
// ================= COC: SELEZIONE EVENTO =================
function CocEventoGateView({ eventi, onSeleziona, onLogout }) {
  const attivi = eventi.filter((e) => !e.chiuso);
  return (
    <div style={{ display: "grid", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }} className="no-print">
        <div />
        <button style={styles.btnGhost} onClick={onLogout}>
          <LogOut size={16} style={{ marginRight: 6 }} /> Esci
        </button>
      </div>
      <div style={styles.card}>
        <h2 style={styles.cardTitle}>Seleziona l'evento da gestire come COC</h2>
        <div style={{ display: "grid", gap: 8, marginTop: 14 }}>
          {attivi.length === 0 && <div style={styles.emptyText}>Nessun evento attivo al momento.</div>}
          {attivi.map((e) => (
            <div key={e.id} style={styles.rowItem}>
              <div>
                <div style={styles.rowTitle}>{e.nome}</div>
                <div style={styles.rowMeta}>Avviato il {fmtDate(e.createdAt)}</div>
              </div>
              <button style={styles.btnPrimary} onClick={() => onSeleziona(e.id)}>
                Seleziona
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ================= COC: ADMINCOC =================
function AdminCocView({ eventoNome, funzioni, utenti, onToggleFunzione, onAggiungiFunzione, onCreaUtente, onModificaUtente, onEliminaUtente, onCambiaEvento, onLogout }) {
  const [nuovaFunzione, setNuovaFunzione] = useState("");
  const [form, setForm] = useState({ nome: "", cognome: "", username: "", password: "", funzioneId: funzioni[0]?.id || "" });
  const [errore, setErrore] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState(null);

  function nomeFunzione(id) {
    return funzioni.find((f) => f.id === id)?.nome || "—";
  }

  function submitUtente(e) {
    e.preventDefault();
    const ok = onCreaUtente(form);
    if (!ok) {
      setErrore("Compila tutti i campi: nome utente potrebbe già esistere.");
      return;
    }
    setErrore("");
    setForm({ nome: "", cognome: "", username: "", password: "", funzioneId: funzioni[0]?.id || "" });
  }

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }} className="no-print">
        <div />
        <button style={styles.btnGhost} onClick={onLogout}>
          <LogOut size={16} style={{ marginRight: 6 }} /> Esci
        </button>
      </div>

      <div style={styles.assocBanner}>
        <div>
          <div style={styles.assocBannerLabel}>Evento COC in gestione</div>
          <div style={styles.assocBannerName}>{eventoNome}</div>
        </div>
        <button style={styles.btnSecondary} onClick={onCambiaEvento}>
          Cambia evento
        </button>
      </div>

      <div style={styles.card}>
        <h2 style={styles.cardTitle}>Funzioni di supporto</h2>
        <p style={{ fontSize: 13, color: "#666", marginBottom: 14 }}>
          Attiva le funzioni previste per questo evento. Solo le funzioni attive potranno avere un responsabile operativo.
        </p>
        <div style={{ display: "grid", gap: 8, marginBottom: 16 }}>
          {funzioni.map((f) => (
            <div key={f.id} style={styles.rowItem}>
              <div>
                <div style={styles.rowTitle}>{f.nome}</div>
                {f.descrizione && <div style={styles.rowMeta}>{f.descrizione}</div>}
              </div>
              <button style={f.attiva ? styles.btnPrimary : styles.btnSecondary} onClick={() => onToggleFunzione(f.id)}>
                {f.attiva ? "Attiva" : "Non attiva"}
              </button>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            style={{ ...styles.input, maxWidth: 280 }}
            placeholder="Nuova funzione personalizzata"
            value={nuovaFunzione}
            onChange={(e) => setNuovaFunzione(e.target.value)}
          />
          <button
            style={styles.btnSecondary}
            onClick={() => {
              onAggiungiFunzione(nuovaFunzione);
              setNuovaFunzione("");
            }}
          >
            <Plus size={14} style={{ marginRight: 6 }} /> Aggiungi
          </button>
        </div>
      </div>

      <div style={styles.card}>
        <h2 style={styles.cardTitle}>Utenti COC — responsabili di funzione</h2>
        <div style={{ display: "grid", gap: 8, marginBottom: 16 }}>
          {utenti.length === 0 && <div style={styles.emptyText}>Nessun utente COC creato per questo evento.</div>}
          {utenti.map((u) =>
            editingId === u.id ? (
              <div key={u.id} style={{ ...styles.rowItem, flexDirection: "column", alignItems: "stretch", gap: 8 }}>
                <div style={styles.grid2} className="grid2-force">
                  <input style={styles.input} value={editDraft.nome} onChange={(e) => setEditDraft({ ...editDraft, nome: e.target.value })} placeholder="Nome" />
                  <input style={styles.input} value={editDraft.cognome} onChange={(e) => setEditDraft({ ...editDraft, cognome: e.target.value })} placeholder="Cognome" />
                </div>
                <input style={styles.input} value={editDraft.username} onChange={(e) => setEditDraft({ ...editDraft, username: e.target.value })} placeholder="Nome utente" />
                <input style={styles.input} value={editDraft.password} onChange={(e) => setEditDraft({ ...editDraft, password: e.target.value })} placeholder="Password" />
                <select style={styles.input} value={editDraft.funzioneId} onChange={(e) => setEditDraft({ ...editDraft, funzioneId: e.target.value })}>
                  {funzioni.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.nome}
                    </option>
                  ))}
                </select>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    style={styles.btnPrimary}
                    onClick={() => {
                      onModificaUtente(u.id, editDraft);
                      setEditingId(null);
                    }}
                  >
                    Salva
                  </button>
                  <button style={styles.btnSecondary} onClick={() => setEditingId(null)}>
                    Annulla
                  </button>
                </div>
              </div>
            ) : (
              <div key={u.id} style={styles.rowItem}>
                <div>
                  <div style={styles.rowTitle}>
                    {u.cognome} {u.nome} <span style={styles.rowMeta}>· {u.username}</span>
                  </div>
                  <div style={styles.rowMeta}>Responsabile: {nomeFunzione(u.funzioneId)}</div>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button
                    style={styles.btnSecondary}
                    onClick={() => {
                      setEditingId(u.id);
                      setEditDraft({ ...u });
                    }}
                  >
                    Modifica
                  </button>
                  <button style={styles.btnGhostRed} onClick={() => onEliminaUtente(u.id)}>
                    Elimina
                  </button>
                </div>
              </div>
            )
          )}
        </div>

        <form onSubmit={submitUtente} style={{ display: "grid", gap: 10, maxWidth: 380 }}>
          <div style={styles.grid2} className="grid2-force">
            <div>
              <label style={styles.label}>Nome</label>
              <input style={styles.input} value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
            </div>
            <div>
              <label style={styles.label}>Cognome</label>
              <input style={styles.input} value={form.cognome} onChange={(e) => setForm({ ...form, cognome: e.target.value })} />
            </div>
          </div>
          <div>
            <label style={styles.label}>Funzione di cui è responsabile</label>
            <select style={styles.input} value={form.funzioneId} onChange={(e) => setForm({ ...form, funzioneId: e.target.value })}>
              {funzioni.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.nome}
                </option>
              ))}
            </select>
          </div>
          <div style={styles.grid2} className="grid2-force">
            <div>
              <label style={styles.label}>Nome utente</label>
              <input style={styles.input} value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
            </div>
            <div>
              <label style={styles.label}>Password</label>
              <input style={styles.input} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </div>
          </div>
          {errore && <div style={styles.errorText}>{errore}</div>}
          <button type="submit" style={styles.btnPrimary}>
            <Plus size={16} style={{ marginRight: 6 }} /> Crea utente COC
          </button>
        </form>
      </div>
    </div>
  );
}

// ================= COC: COORDINATORE (visione generale) =================
function CoordinatoreCocView({ eventoNome, funzioni, utenti, diario, note, volontari, mezzi, squadre, tipiMezzoList, onCambiaEvento, onLogout }) {
  function nomeFunzione(id) {
    return funzioni.find((f) => f.id === id)?.nome || "—";
  }
  function responsabileFunzione(id) {
    const u = utenti.find((x) => x.funzioneId === id);
    return u ? `${u.cognome} ${u.nome}` : "—";
  }
  const diarioOrdinato = [...diario].sort((a, b) => b.timestamp - a.timestamp);
  const noteOrdinate = [...note].sort((a, b) => b.timestamp - a.timestamp);

  const volontariInCampo = (volontari || []).filter((v) => v.stato === "in campo");
  const mezziInServizio = (mezzi || []).filter((m) => m.stato === "in servizio");
  const squadreAttive = (squadre || []).filter((s) => !s.terminata);
  const associazioniPresenti = Array.from(
    new Set([
      ...volontariInCampo.map((v) => v.associazione || ASSOCIAZIONE_DEFAULT),
      ...mezziInServizio.map((m) => m.associazione || ASSOCIAZIONE_DEFAULT),
    ])
  );
  const mezziPerTipo = (tipiMezzoList || TIPI_MEZZO)
    .map((t) => ({ tipo: t, n: mezziInServizio.filter((m) => m.tipo === t).length }))
    .filter((x) => x.n > 0);
  const squadrePerTipo = TIPI_SQUADRA.map((t) => ({ tipo: t.label, n: squadreAttive.filter((s) => s.tipo === t.id).length })).filter((x) => x.n > 0);
  const funzioniAttiveN = funzioni.filter((f) => f.attiva).length;

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }} className="no-print">
        <div />
        <button style={styles.btnGhost} onClick={onLogout}>
          <LogOut size={16} style={{ marginRight: 6 }} /> Esci
        </button>
      </div>

      <div style={styles.assocBanner}>
        <div>
          <div style={styles.assocBannerLabel}>Visione generale — Coordinatore COC</div>
          <div style={styles.assocBannerName}>{eventoNome}</div>
        </div>
        <button style={styles.btnSecondary} onClick={onCambiaEvento}>
          Cambia evento
        </button>
      </div>

      <div style={styles.card}>
        <h2 style={styles.cardTitle}>Cruscotto di sintesi</h2>
        <div style={styles.statGrid}>
          <StatCard label="Volontari in campo" value={volontariInCampo.length} accent="orange" />
          <StatCard label="Mezzi in servizio" value={mezziInServizio.length} accent="green" />
          <StatCard label="Squadre operative" value={squadreAttive.length} />
          <StatCard label="Funzioni attive" value={`${funzioniAttiveN}/${funzioni.length}`} />
        </div>

        {(mezziPerTipo.length > 0 || squadrePerTipo.length > 0 || associazioniPresenti.length > 0) && (
          <div style={{ display: "grid", gap: 16, marginTop: 20 }}>
            {mezziPerTipo.length > 0 && (
              <div>
                <div style={styles.rowMeta}>Mezzi per tipo</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 6 }}>
                  {mezziPerTipo.map(({ tipo, n }) => (
                    <span key={tipo} style={styles.chip}>
                      {tipo} <b>{n}</b>
                    </span>
                  ))}
                </div>
              </div>
            )}
            {squadrePerTipo.length > 0 && (
              <div>
                <div style={styles.rowMeta}>Squadre per tipo</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 6 }}>
                  {squadrePerTipo.map(({ tipo, n }) => (
                    <span key={tipo} style={styles.chip}>
                      {tipo} <b>{n}</b>
                    </span>
                  ))}
                </div>
              </div>
            )}
            {associazioniPresenti.length > 0 && (
              <div>
                <div style={styles.rowMeta}>Associazioni presenti</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 6 }}>
                  {associazioniPresenti.map((a) => (
                    <span key={a} style={styles.pillGreen}>
                      {a}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {(diarioOrdinato.length > 0 || noteOrdinate.length > 0) && (
          <div style={{ marginTop: 20 }}>
            <div style={styles.rowMeta}>Ultime registrazioni</div>
            <div style={{ display: "grid", gap: 6, marginTop: 6 }}>
              {diarioOrdinato.slice(0, 5).map((d) => (
                <div key={d.id} style={{ fontSize: 13, color: "#555" }}>
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "#999" }}>
                    {fmtTime(d.timestamp)}
                  </span>{" "}
                  · <b>{nomeFunzione(d.funzioneId)}</b>: {d.testo.length > 90 ? d.testo.slice(0, 90) + "…" : d.testo}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div style={styles.card}>
        <h2 style={styles.cardTitle}>Funzioni di supporto</h2>
        <div style={{ display: "grid", gap: 8 }}>
          {funzioni.map((f) => (
            <div key={f.id} style={styles.rowItem}>
              <div>
                <div style={styles.rowTitle}>{f.nome}</div>
                {f.descrizione && <div style={{ ...styles.rowMeta, marginBottom: 2 }}>{f.descrizione}</div>}
                <div style={styles.rowMeta}>Responsabile: {responsabileFunzione(f.id)}</div>
              </div>
              <span style={f.attiva ? styles.pillGreen : styles.pillOrange}>{f.attiva ? "Attiva" : "Non attiva"}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={styles.card}>
        <h2 style={styles.cardTitle}>Diario di sala — tutte le funzioni ({diarioOrdinato.length})</h2>
        <div style={{ display: "grid", gap: 8 }}>
          {diarioOrdinato.length === 0 && <div style={styles.emptyText}>Nessuna voce registrata.</div>}
          {diarioOrdinato.map((d) => (
            <div key={d.id} style={styles.rowItem}>
              <div>
                <div style={styles.rowTitle}>
                  {nomeFunzione(d.funzioneId)} <span style={styles.rowMeta}>· {d.autore}</span>
                </div>
                <div style={{ fontSize: 13, marginTop: 4, whiteSpace: "pre-wrap" }}>{d.testo}</div>
              </div>
              <div style={{ fontSize: 12, color: "#888", whiteSpace: "nowrap" }}>
                {fmtDate(d.timestamp)} {fmtTime(d.timestamp)}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={styles.card}>
        <h2 style={styles.cardTitle}>Note operative ({noteOrdinate.length})</h2>
        <div style={{ display: "grid", gap: 8 }}>
          {noteOrdinate.length === 0 && <div style={styles.emptyText}>Nessuna nota inviata.</div>}
          {noteOrdinate.map((n) => (
            <div key={n.id} style={styles.rowItem}>
              <div>
                <div style={styles.rowTitle}>
                  Da {nomeFunzione(n.daFunzioneId)} a {n.aFunzioneIds.map(nomeFunzione).join(", ")}
                </div>
                <div style={styles.rowMeta}>{n.autore}</div>
                <div style={{ fontSize: 13, marginTop: 4, whiteSpace: "pre-wrap" }}>{n.testo}</div>
                <div style={{ marginTop: 6 }}>
                  <span
                    style={
                      n.stato === "revocata"
                        ? { ...styles.pillGreen, background: "#E5E5E5", color: "#666" }
                        : !n.stato || n.stato === "in attesa"
                        ? styles.pillOrange
                        : n.stato === "evasa"
                        ? styles.pillGreen
                        : { ...styles.pillGreen, background: "#FBDCD6", color: "var(--red)" }
                    }
                  >
                    {n.stato === "revocata" ? "Revocata" : !n.stato || n.stato === "in attesa" ? "In attesa" : n.stato === "evasa" ? "Evasa" : "Respinta"}
                  </span>
                  {n.stato === "respinta" && n.motivazione && (
                    <div style={{ fontSize: 12, color: "#a33", marginTop: 4 }}>Motivo: {n.motivazione}</div>
                  )}
                </div>
              </div>
              <div style={{ fontSize: 12, color: "#888", whiteSpace: "nowrap" }}>
                {fmtDate(n.timestamp)} {fmtTime(n.timestamp)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ================= COC: RESPONSABILE DI FUNZIONE =================
function FunzioneCocView({ eventoNome, utenteAttivo, funzioni, diario, note, onAggiungiDiario, onModificaDiario, onEliminaDiario, onInviaNota, onAggiornaStatoNota, onLogout }) {
  const [testoDiario, setTestoDiario] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editTesto, setEditTesto] = useState("");
  const [testoNota, setTestoNota] = useState("");
  const [destinatari, setDestinatari] = useState([]);
  const [notaInviata, setNotaInviata] = useState(false);
  const [respingendoId, setRespingendoId] = useState(null);
  const [motivazioneRifiuto, setMotivazioneRifiuto] = useState("");

  const mieFunzione = funzioni.find((f) => f.id === utenteAttivo?.funzioneId);
  const autore = utenteAttivo ? `${utenteAttivo.cognome} ${utenteAttivo.nome}` : "";

  function nomeFunzione(id) {
    return funzioni.find((f) => f.id === id)?.nome || "—";
  }

  const mieVoci = diario.filter((d) => d.funzioneId === utenteAttivo?.funzioneId).sort((a, b) => b.timestamp - a.timestamp);
  const altreVoci = diario.filter((d) => d.funzioneId !== utenteAttivo?.funzioneId).sort((a, b) => b.timestamp - a.timestamp);
  const noteRicevuteInviate = note
    .filter((n) => n.daFunzioneId === utenteAttivo?.funzioneId || n.aFunzioneIds.includes(utenteAttivo?.funzioneId))
    .sort((a, b) => b.timestamp - a.timestamp);
  const altreFunzioniAttive = funzioni.filter((f) => f.attiva && f.id !== utenteAttivo?.funzioneId);

  function submitDiario(e) {
    e.preventDefault();
    if (!testoDiario.trim()) return;
    onAggiungiDiario(utenteAttivo.funzioneId, autore, testoDiario);
    setTestoDiario("");
  }

  function toggleDestinatario(id) {
    setDestinatari((d) => (d.includes(id) ? d.filter((x) => x !== id) : [...d, id]));
  }

  function submitNota(e) {
    e.preventDefault();
    if (!testoNota.trim() || destinatari.length === 0) return;
    onInviaNota(utenteAttivo.funzioneId, autore, testoNota, destinatari);
    setTestoNota("");
    setDestinatari([]);
    setNotaInviata(true);
    setTimeout(() => setNotaInviata(false), 2500);
  }

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }} className="no-print">
        <div />
        <button style={styles.btnGhost} onClick={onLogout}>
          <LogOut size={16} style={{ marginRight: 6 }} /> Esci
        </button>
      </div>

      <div style={styles.assocBanner}>
        <div>
          <div style={styles.assocBannerLabel}>{eventoNome}</div>
          <div style={styles.assocBannerName}>{mieFunzione?.nome || "Funzione non trovata"}</div>
          <div style={styles.assocBannerMeta}>Responsabile: {autore}</div>
        </div>
      </div>

      <div style={styles.card}>
        <h2 style={styles.cardTitle}>Diario della mia funzione</h2>
        <form onSubmit={submitDiario} style={{ display: "grid", gap: 10, marginBottom: 16 }}>
          <textarea
            style={{ ...styles.input, minHeight: 80, resize: "vertical", fontFamily: "inherit" }}
            value={testoDiario}
            onChange={(e) => setTestoDiario(e.target.value)}
            placeholder="Registra un'azione svolta dalla tua funzione..."
          />
          <button type="submit" style={styles.btnPrimary}>
            <Plus size={16} style={{ marginRight: 6 }} /> Aggiungi voce
          </button>
        </form>
        <div style={{ display: "grid", gap: 8 }}>
          {mieVoci.length === 0 && <div style={styles.emptyText}>Nessuna voce registrata ancora.</div>}
          {mieVoci.map((d) =>
            editingId === d.id ? (
              <div key={d.id} style={{ ...styles.rowItem, flexDirection: "column", alignItems: "stretch", gap: 8 }}>
                <textarea style={{ ...styles.input, minHeight: 70, fontFamily: "inherit" }} value={editTesto} onChange={(e) => setEditTesto(e.target.value)} />
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    style={styles.btnPrimary}
                    onClick={() => {
                      onModificaDiario(d.id, editTesto);
                      setEditingId(null);
                    }}
                  >
                    Salva
                  </button>
                  <button style={styles.btnSecondary} onClick={() => setEditingId(null)}>
                    Annulla
                  </button>
                </div>
              </div>
            ) : (
              <div key={d.id} style={styles.rowItem}>
                <div>
                  <div style={{ fontSize: 13, whiteSpace: "pre-wrap" }}>{d.testo}</div>
                  <div style={styles.rowMeta}>
                    {d.autore} · {fmtDate(d.timestamp)} {fmtTime(d.timestamp)}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button
                    style={styles.btnSecondary}
                    onClick={() => {
                      setEditingId(d.id);
                      setEditTesto(d.testo);
                    }}
                  >
                    Modifica
                  </button>
                  <button style={styles.btnGhostRed} onClick={() => onEliminaDiario(d.id)}>
                    Elimina
                  </button>
                </div>
              </div>
            )
          )}
        </div>
      </div>

      <div style={styles.card}>
        <h2 style={styles.cardTitle}>Report delle altre funzioni (sola lettura)</h2>
        <div style={{ display: "grid", gap: 8 }}>
          {altreVoci.length === 0 && <div style={styles.emptyText}>Nessuna voce dalle altre funzioni.</div>}
          {altreVoci.map((d) => (
            <div key={d.id} style={styles.rowItem}>
              <div>
                <div style={styles.rowTitle}>{nomeFunzione(d.funzioneId)}</div>
                <div style={{ fontSize: 13, marginTop: 4, whiteSpace: "pre-wrap" }}>{d.testo}</div>
                <div style={styles.rowMeta}>
                  {d.autore} · {fmtDate(d.timestamp)} {fmtTime(d.timestamp)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={styles.card}>
        <h2 style={styles.cardTitle}>Invia nota operativa ad altre funzioni</h2>
        <form onSubmit={submitNota} style={{ display: "grid", gap: 10 }}>
          <textarea
            style={{ ...styles.input, minHeight: 70, resize: "vertical", fontFamily: "inherit" }}
            value={testoNota}
            onChange={(e) => setTestoNota(e.target.value)}
            placeholder="Es. richiesta che coinvolge anche altri settori..."
          />
          <div>
            <label style={styles.label}>Destinatari</label>
            <div style={{ display: "grid", gap: 6 }}>
              {altreFunzioniAttive.length === 0 && <div style={styles.emptyText}>Nessuna altra funzione attiva.</div>}
              {altreFunzioniAttive.map((f) => (
                <label key={f.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                  <input type="checkbox" checked={destinatari.includes(f.id)} onChange={() => toggleDestinatario(f.id)} />
                  {f.nome}
                </label>
              ))}
            </div>
          </div>
          {notaInviata && <div style={{ color: "var(--green)", fontSize: 13 }}>Nota inviata.</div>}
          <button type="submit" style={styles.btnPrimary}>
            Invia nota
          </button>
        </form>
      </div>

      <div style={styles.card}>
        <h2 style={styles.cardTitle}>Note operative (inviate e ricevute)</h2>
        <div style={{ display: "grid", gap: 8 }}>
          {noteRicevuteInviate.length === 0 && <div style={styles.emptyText}>Nessuna nota.</div>}
          {noteRicevuteInviate.map((n) => {
            const sonoDestinatario = n.aFunzioneIds.includes(utenteAttivo?.funzioneId);
            const sonoMittente = n.daFunzioneId === utenteAttivo?.funzioneId;
            const inAttesa = !n.stato || n.stato === "in attesa";
            return (
              <div key={n.id} style={styles.rowItem}>
                <div>
                  <div style={styles.rowTitle}>
                    Da {nomeFunzione(n.daFunzioneId)} a {n.aFunzioneIds.map(nomeFunzione).join(", ")}
                  </div>
                  <div style={{ fontSize: 13, marginTop: 4, whiteSpace: "pre-wrap" }}>{n.testo}</div>
                  <div style={styles.rowMeta}>
                    {fmtDate(n.timestamp)} {fmtTime(n.timestamp)}
                  </div>
                  <div style={{ marginTop: 6 }}>
                    <span
                      style={
                        n.stato === "revocata"
                          ? { ...styles.pillGreen, background: "#E5E5E5", color: "#666" }
                          : inAttesa
                          ? styles.pillOrange
                          : n.stato === "evasa"
                          ? styles.pillGreen
                          : { ...styles.pillGreen, background: "#FBDCD6", color: "var(--red)" }
                      }
                    >
                      {n.stato === "revocata" ? "Revocata" : inAttesa ? "In attesa" : n.stato === "evasa" ? "Evasa" : "Respinta"}
                    </span>
                    {n.stato === "respinta" && n.motivazione && (
                      <div style={{ fontSize: 12, color: "#a33", marginTop: 4 }}>Motivo: {n.motivazione}</div>
                    )}
                  </div>
                  {respingendoId === n.id && (
                    <div style={{ marginTop: 8, display: "grid", gap: 6 }}>
                      <input
                        style={styles.input}
                        placeholder="Motivazione del rifiuto"
                        value={motivazioneRifiuto}
                        onChange={(e) => setMotivazioneRifiuto(e.target.value)}
                        autoFocus
                      />
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          style={styles.btnGhostRed}
                          onClick={() => {
                            if (!motivazioneRifiuto.trim()) return;
                            onAggiornaStatoNota(n.id, "respinta", motivazioneRifiuto);
                            setRespingendoId(null);
                            setMotivazioneRifiuto("");
                          }}
                        >
                          Conferma rifiuto
                        </button>
                        <button style={styles.btnSecondary} onClick={() => setRespingendoId(null)}>
                          Annulla
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }} className="no-print">
                  {sonoDestinatario && inAttesa && respingendoId !== n.id && (
                    <>
                      <button style={styles.btnPrimary} onClick={() => onAggiornaStatoNota(n.id, "evasa", "")}>
                        Evasa
                      </button>
                      <button style={styles.btnGhostRed} onClick={() => setRespingendoId(n.id)}>
                        Respinta
                      </button>
                    </>
                  )}
                  {sonoMittente && n.stato !== "revocata" && (
                    <button style={styles.btnGhostRed} onClick={() => window.confirm("Revocare questa nota operativa?") && onAggiornaStatoNota(n.id, "revocata", "")}>
                      Revoca
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function LoginBox({ loginUser, loginPass, setLoginUser, setLoginPass, loginError, onSubmit }) {
  return (
    <div style={{ maxWidth: 380, margin: "40px auto" }}>
      <div style={styles.card}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <ShieldPlus size={20} color="var(--navy)" />
          <h2 style={styles.cardTitle}>Accesso</h2>
        </div>
        <form onSubmit={onSubmit}>
          <label style={styles.label}>Nome utente</label>
          <input style={styles.input} value={loginUser} onChange={(e) => setLoginUser(e.target.value)} autoFocus />
          <label style={styles.label}>Password</label>
          <input style={styles.input} type="password" value={loginPass} onChange={(e) => setLoginPass(e.target.value)} />
          {loginError && <div style={styles.errorText}>{loginError}</div>}
          <button type="submit" style={{ ...styles.btnPrimary, width: "100%", marginTop: 14 }}>
            <LogIn size={16} style={{ marginRight: 6 }} /> Entra
          </button>
        </form>
      </div>
    </div>
  );
}

// ================= OPERATORE =================
// ================= OPERATORE =================
function OperatorView({
  volontari,
  mezzi,
  config,
  tick,
  associazioneCorrente,
  associazioniDb,
  eventi,
  eventoCorrenteId,
  eventoCorrenteNome,
  eventoCorrenteLuogo,
  specializzazioniGlobali,
  tipiMezzoGlobali,
  specializzazioniMacroAree,
  tipiMezzoMacroAree,
  onSetAssociazioneCorrente,
  onCambiaAssociazione,
  onSetEvento,
  onCambiaEvento,
  onIncorpora,
  onMezzoIn,
}) {
  const [subTab, setSubTab] = useState("home");
  const [turnoCorrenteId, setTurnoCorrenteId] = useState(null);
  const [dataTurnoCorrente, setDataTurnoCorrente] = useState(() => trovaTurnoEGiornoAttuale(config).dataStr);
  const [justIncorporated, setJustIncorporated] = useState(null);
  const [dupError, setDupError] = useState("");
  const [dupErrorMezzo, setDupErrorMezzo] = useState("");
  const [justRegistratoMezzo, setJustRegistratoMezzo] = useState(null);
  const associazioni = config?.associazioni?.length ? config.associazioni : [ASSOCIAZIONE_DEFAULT];
  const specializzazioniList = specializzazioniGlobali?.length ? specializzazioniGlobali : SPECIALIZZAZIONI;
  const tipiMezzoList = tipiMezzoGlobali?.length ? tipiMezzoGlobali : TIPI_MEZZO;
  const turniList = turniPerGiorno(config, dataTurnoCorrente);
  const inizioTurnoOptions = Array.from(new Set(turniList.map((t) => t.inizio))).sort();
  const fineTurnoOptions = Array.from(new Set(turniList.map((t) => t.fine))).sort();
  const turnoScelto = turniList.find((t) => t.id === turnoCorrenteId);

  useEffect(() => {
    setTurnoCorrenteId(null);
    setDataTurnoCorrente(trovaTurnoEGiornoAttuale(config).dataStr);
    // eslint-disable-next-line
  }, [eventoCorrenteId]);

  const assocNome = associazioneCorrente?.denominazione || associazioni[0];
  const assocCodice = associazioneCorrente?.cod || "";

  const emptyVForm = {
    associazione: assocNome,
    codiceAssociazione: assocCodice,
    dataRegistrazione: dataTurnoCorrente,
    cognome: "",
    nome: "",
    luogoNascita: "",
    dataNascita: "",
    telefono: "",
    beneficiLegge: "No",
    specializzazione: specializzazioniList[0],
    caposquadra: false,
    altraSpecializzazione: "",
    luogoAttivita: eventoCorrenteLuogo || "",
    inizioTurno: turnoScelto?.inizio || inizioTurnoOptions[0] || "",
    fineTurno: turnoScelto?.fine || fineTurnoOptions[0] || "",
    pastoRichiesto: "No",
    allergie: "",
  };
  const emptyMForm = {
    associazione: assocNome,
    codiceAssociazione: assocCodice,
    dataRegistrazione: dataTurnoCorrente,
    tipo: tipiMezzoList[0],
    targa: "",
    alimentazione: TIPI_ALIMENTAZIONE[0],
    kmIniziali: "",
    buonoBenzina: "No",
    referenteVolontarioId: "",
    inizioTurno: turnoScelto?.inizio || inizioTurnoOptions[0] || "",
    fineTurno: turnoScelto?.fine || fineTurnoOptions[0] || "",
  };
  const [vForm, setVForm] = useState(emptyVForm);
  const [mForm, setMForm] = useState(emptyMForm);

  // tiene sincronizzati gli orari (e la data) nei moduli con il turno effettivamente selezionato,
  // sia alla prima scelta sia se viene cambiato in un secondo momento
  useEffect(() => {
    if (!turnoScelto) return;
    setVForm((f) =>
      f.inizioTurno === turnoScelto.inizio && f.fineTurno === turnoScelto.fine && f.dataRegistrazione === dataTurnoCorrente
        ? f
        : { ...f, inizioTurno: turnoScelto.inizio, fineTurno: turnoScelto.fine, dataRegistrazione: dataTurnoCorrente }
    );
    setMForm((f) =>
      f.inizioTurno === turnoScelto.inizio && f.fineTurno === turnoScelto.fine && f.dataRegistrazione === dataTurnoCorrente
        ? f
        : { ...f, inizioTurno: turnoScelto.inizio, fineTurno: turnoScelto.fine, dataRegistrazione: dataTurnoCorrente }
    );
    // eslint-disable-next-line
  }, [turnoScelto?.id, dataTurnoCorrente]);

  // corregge il caso in cui l'associazione venga selezionata dopo il primo montaggio del componente
  useEffect(() => {
    if (!associazioneCorrente) return;
    setVForm((f) => ({ ...f, associazione: associazioneCorrente.denominazione || f.associazione, codiceAssociazione: associazioneCorrente.cod || "" }));
    setMForm((f) => ({ ...f, associazione: associazioneCorrente.denominazione || f.associazione, codiceAssociazione: associazioneCorrente.cod || "" }));
  }, [associazioneCorrente]);

  // pre-compila il luogo attività con quello dell'evento selezionato
  useEffect(() => {
    if (!eventoCorrenteLuogo) return;
    setVForm((f) => (f.luogoAttivita ? f : { ...f, luogoAttivita: eventoCorrenteLuogo }));
  }, [eventoCorrenteLuogo]);

  const mezziAttiviList = mezzi.filter((m) => m.stato === "in servizio").sort((a, b) => b.oraIngresso - a.oraIngresso);
  const volontariAttivi = volontari.filter((v) => v.stato === "in campo").sort((a, b) => b.oraIngresso - a.oraIngresso);

  const referentiDisponibili = volontari.filter(
    (v) =>
      v.stato === "in campo" &&
      (v.associazione || ASSOCIAZIONE_DEFAULT).trim().toLowerCase() === (mForm.associazione || "").trim().toLowerCase()
  );

  const now = new Date();
  const dataOggi = now.toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit", year: "numeric" });

  function submitVolontario(e) {
    e.preventDefault();
    if (!vForm.nome.trim() || !vForm.cognome.trim()) return;
    const eventoAttuale = eventi.find((ev) => ev.id === eventoCorrenteId);
    if (!eventoAttuale || eventoAttuale.chiuso) {
      setDupError("EVENTO_CHIUSO_VOLONTARI");
      return;
    }
    const nomeNorm = vForm.nome.trim().toLowerCase();
    const cognomeNorm = vForm.cognome.trim().toLowerCase();
    const duplicato = volontari.some(
      (v) =>
        v.nome.trim().toLowerCase() === nomeNorm &&
        v.cognome.trim().toLowerCase() === cognomeNorm &&
        (v.dataNascita || "") === (vForm.dataNascita || "") &&
        v.inizioTurno === vForm.inizioTurno &&
        v.fineTurno === vForm.fineTurno
    );
    if (duplicato) {
      setDupError(`${vForm.nome} ${vForm.cognome} risulta già inserito/a per questo turno.`);
      return;
    }
    setDupError("");
    onIncorpora(vForm);
    setJustIncorporated({ nome: vForm.nome.trim(), cognome: vForm.cognome.trim() });
    setVForm({ ...emptyVForm });
  }
  function submitMezzo(e) {
    e.preventDefault();
    if (!mForm.targa.trim()) return;
    const eventoAttuale = eventi.find((ev) => ev.id === eventoCorrenteId);
    if (!eventoAttuale || eventoAttuale.chiuso) {
      setDupErrorMezzo("EVENTO_CHIUSO_MEZZI");
      return;
    }
    const targaNorm = mForm.targa.trim().toLowerCase().replace(/\s+/g, "");
    const duplicatoMezzo = mezzi.some((m) => m.targa.trim().toLowerCase().replace(/\s+/g, "") === targaNorm);
    if (duplicatoMezzo) {
      setDupErrorMezzo(`Il mezzo con targa ${mForm.targa} risulta già inserito.`);
      return;
    }
    setDupErrorMezzo("");
    onMezzoIn(mForm);
    setJustRegistratoMezzo({ targa: mForm.targa.trim() });
    setMForm({ ...emptyMForm });
  }

  if (!associazioneCorrente) {
    return <SelezionaAssociazioneView onConferma={onSetAssociazioneCorrente} associazioniDb={associazioniDb} />;
  }

  if (!eventoCorrenteId) {
    return <SelezionaEventoView eventi={eventi} onConferma={onSetEvento} onIndietro={onCambiaAssociazione} />;
  }

  if (!turnoCorrenteId && turniList.length > 0) {
    return (
      <SelezionaTurnoView
        turniList={turniList}
        eventoNome={eventoCorrenteNome}
        dataSelezionata={dataTurnoCorrente}
        onCambiaData={setDataTurnoCorrente}
        onConferma={setTurnoCorrenteId}
        onIndietro={onCambiaEvento}
      />
    );
  }

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <datalist id="associazioni-list">
        {associazioni.map((a) => (
          <option key={a} value={a} />
        ))}
      </datalist>

      {subTab === "home" && (
        <div style={{ display: "grid", gap: 16 }}>
          <div style={styles.assocBanner}>
            <div>
              <div style={styles.assocBannerLabel}>Associazione selezionata</div>
              <div style={styles.assocBannerName}>{associazioneCorrente.denominazione}</div>
              <div style={styles.assocBannerMeta}>
                Cod. {associazioneCorrente.cod || "—"} · {associazioneCorrente.comune} ({associazioneCorrente.provincia})
              </div>
            </div>
            <button style={styles.btnSecondary} onClick={onCambiaAssociazione}>
              Cambia associazione
            </button>
          </div>

          <div style={styles.assocBanner}>
            <div>
              <div style={styles.assocBannerLabel}>Evento in corso</div>
              <div style={styles.assocBannerName}>{eventoCorrenteNome}</div>
            </div>
            <button style={styles.btnSecondary} onClick={onCambiaEvento}>
              Cambia evento
            </button>
          </div>

          {turnoScelto && (
            <div style={styles.assocBanner}>
              <div>
                <div style={styles.assocBannerLabel}>Turno selezionato</div>
                <div style={styles.assocBannerName}>
                  {turnoScelto.nome} ({turnoScelto.inizio}–{turnoScelto.fine}) · {dataTurnoCorrente.split("-").reverse().join("/")}
                </div>
              </div>
              <button style={styles.btnSecondary} onClick={() => setTurnoCorrenteId(null)}>
                Cambia turno
              </button>
            </div>
          )}

          <div style={styles.homeGrid}>
            <button
              style={styles.homeTile}
              onClick={() => {
                setJustIncorporated(null);
                setSubTab("volontari");
              }}
            >
              <Users size={34} />
              <div style={styles.homeTileLabel}>Inserisci volontari</div>
            </button>
            <button
              style={styles.homeTile}
              onClick={() => {
                setJustRegistratoMezzo(null);
                setSubTab("mezzi");
              }}
            >
              <Truck size={34} />
              <div style={styles.homeTileLabel}>Inserisci mezzi</div>
            </button>
          </div>
        </div>
      )}

      {subTab === "volontari" && (
        <div style={{ display: "grid", gap: 20 }}>
          <button style={styles.backBtn} className="no-print" onClick={() => setSubTab("home")}>
            ← Torna alla home
          </button>

          {justIncorporated && (
            <div style={{ ...styles.card, borderColor: "var(--green)" }}>
              <div style={{ fontSize: 15, marginBottom: 14 }}>
                <b>
                  {justIncorporated.nome} {justIncorporated.cognome}
                </b>{" "}
                incorporato/a con successo.
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button style={styles.btnPrimary} onClick={() => setJustIncorporated(null)}>
                  <Plus size={16} style={{ marginRight: 6 }} /> Aggiungi il prossimo volontario
                </button>
                <button style={styles.btnSecondary} onClick={() => setSubTab("home")}>
                  Torna alla home
                </button>
              </div>
            </div>
          )}

          {!justIncorporated && (
            <div style={styles.card}>
              <h2 style={styles.cardTitle}>Inserisci volontari</h2>
              <form onSubmit={submitVolontario} style={{ display: "grid", gap: 10 }}>
                <div>
                  <label style={styles.label}>Associazione</label>
                  <input style={{ ...styles.input, background: "#EFEBE1", color: "#777" }} value={vForm.associazione} disabled />
                </div>
                <div>
                  <label style={styles.label}>Codice associazione</label>
                  <input style={{ ...styles.input, background: "#EFEBE1", color: "#777" }} value={vForm.codiceAssociazione} disabled />
                </div>
                <div>
                  <label style={styles.label}>Data</label>
                  <input
                    style={{ ...styles.input, background: "#EFEBE1", color: "#777" }}
                    value={vForm.dataRegistrazione ? vForm.dataRegistrazione.split("-").reverse().join("/") : ""}
                    disabled
                  />
                </div>
                <div style={styles.grid2} className="grid2-force">
                  <div>
                    <label style={styles.label}>Cognome</label>
                    <input style={styles.input} value={vForm.cognome} onChange={(e) => setVForm({ ...vForm, cognome: e.target.value })} autoFocus />
                  </div>
                  <div>
                    <label style={styles.label}>Nome</label>
                    <input style={styles.input} value={vForm.nome} onChange={(e) => setVForm({ ...vForm, nome: e.target.value })} />
                  </div>
                </div>
                <div style={styles.grid2} className="grid2-force">
                  <div>
                    <label style={styles.label}>Luogo di nascita</label>
                    <input
                      style={styles.input}
                      value={vForm.luogoNascita}
                      onChange={(e) => setVForm({ ...vForm, luogoNascita: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={styles.label}>Data di nascita</label>
                    <input
                      style={styles.input}
                      type="date"
                      value={vForm.dataNascita}
                      onChange={(e) => setVForm({ ...vForm, dataNascita: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label style={styles.label}>Telefono</label>
                  <input
                    style={styles.input}
                    type="tel"
                    value={vForm.telefono}
                    onChange={(e) => setVForm({ ...vForm, telefono: e.target.value })}
                  />
                </div>
                <div>
                  <label style={styles.label}>Richiesta benefici legge</label>
                  <select style={styles.input} value={vForm.beneficiLegge} onChange={(e) => setVForm({ ...vForm, beneficiLegge: e.target.value })}>
                    {SI_NO.map((v) => (
                      <option key={v}>{v}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={styles.label}>Specializzazione principale</label>
                  <select
                    style={styles.input}
                    value={vForm.specializzazione}
                    onChange={(e) => setVForm({ ...vForm, specializzazione: e.target.value })}
                  >
                    {MACRO_AREE_SPECIALIZZAZIONI.map((area) => {
                      const voci = specializzazioniList.filter((s) => (specializzazioniMacroAree?.[s] || "Altro") === area);
                      if (voci.length === 0) return null;
                      return (
                        <optgroup key={area} label={area}>
                          {voci.map((s) => (
                            <option key={s}>{s}</option>
                          ))}
                        </optgroup>
                      );
                    })}
                  </select>
                  <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, fontSize: 13 }}>
                    <input
                      type="checkbox"
                      checked={vForm.caposquadra}
                      onChange={(e) => setVForm({ ...vForm, caposquadra: e.target.checked })}
                    />
                    Caposquadra
                  </label>
                </div>
                <div>
                  <label style={styles.label}>Altra specializzazione (facoltativa)</label>
                  <select
                    style={styles.input}
                    value={vForm.altraSpecializzazione}
                    onChange={(e) => setVForm({ ...vForm, altraSpecializzazione: e.target.value })}
                  >
                    <option value="">Nessuna</option>
                    {MACRO_AREE_SPECIALIZZAZIONI.map((area) => {
                      const voci = specializzazioniList.filter((s) => (specializzazioniMacroAree?.[s] || "Altro") === area);
                      if (voci.length === 0) return null;
                      return (
                        <optgroup key={area} label={area}>
                          {voci.map((s) => (
                            <option key={s}>{s}</option>
                          ))}
                        </optgroup>
                      );
                    })}
                  </select>
                </div>
                <div>
                  <label style={styles.label}>Luogo attività</label>
                  <input
                    style={styles.input}
                    value={vForm.luogoAttivita}
                    onChange={(e) => setVForm({ ...vForm, luogoAttivita: e.target.value })}
                  />
                </div>
                <div>
                  <label style={styles.label}>Turno</label>
                  <input
                    style={{ ...styles.input, background: "#EFEBE1", color: "#777" }}
                    value={turnoScelto ? `${turnoScelto.nome} (${turnoScelto.inizio}–${turnoScelto.fine})` : "Nessun turno selezionato"}
                    disabled
                  />
                </div>
                <div>
                  <label style={styles.label}>Richiesta pasto</label>
                  <select style={styles.input} value={vForm.pastoRichiesto} onChange={(e) => setVForm({ ...vForm, pastoRichiesto: e.target.value })}>
                    {SI_NO.map((v) => (
                      <option key={v}>{v}</option>
                    ))}
                  </select>
                  {vForm.pastoRichiesto === "Sì" && (
                    <input
                      style={{ ...styles.input, marginTop: 8 }}
                      value={vForm.allergie}
                      onChange={(e) => setVForm({ ...vForm, allergie: e.target.value })}
                      placeholder="Eventuali allergie o intolleranze alimentari"
                    />
                  )}
                </div>
                {dupError === "EVENTO_CHIUSO_VOLONTARI" ? (
                  <div style={{ ...styles.card, borderColor: "var(--red)", padding: 14 }}>
                    <div style={{ color: "var(--red)", fontWeight: 600, marginBottom: 10 }}>
                      Evento chiuso, non è possibile inserire nuovi volontari.
                    </div>
                    <button type="button" style={styles.btnPrimary} onClick={onCambiaEvento}>
                      Seleziona nuovo evento
                    </button>
                  </div>
                ) : (
                  dupError && <div style={styles.errorText}>{dupError}</div>
                )}
                <button type="submit" style={styles.btnPrimary}>
                  <LogIn size={16} style={{ marginRight: 6 }} /> Incorpora
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {subTab === "mezzi" && (
        <div style={{ display: "grid", gap: 20 }}>
          <button style={styles.backBtn} className="no-print" onClick={() => setSubTab("home")}>
            ← Torna alla home
          </button>

          {justRegistratoMezzo && (
            <div style={{ ...styles.card, borderColor: "var(--green)" }}>
              <div style={{ fontSize: 15, marginBottom: 14 }}>
                Mezzo <b>{justRegistratoMezzo.targa}</b> messo in servizio con successo.
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button style={styles.btnPrimary} onClick={() => setJustRegistratoMezzo(null)}>
                  <Plus size={16} style={{ marginRight: 6 }} /> Aggiungi il prossimo mezzo
                </button>
                <button style={styles.btnSecondary} onClick={() => setSubTab("home")}>
                  Torna alla home
                </button>
              </div>
            </div>
          )}

          {!justRegistratoMezzo && (
            <div style={styles.card}>
              <h2 style={styles.cardTitle}>Inserisci mezzi</h2>
              <form onSubmit={submitMezzo} style={{ display: "grid", gap: 10 }}>
                <div>
                  <label style={styles.label}>Associazione</label>
                  <input style={{ ...styles.input, background: "#EFEBE1", color: "#777" }} value={mForm.associazione} disabled />
                </div>
                <div>
                  <label style={styles.label}>Codice associazione</label>
                  <input style={{ ...styles.input, background: "#EFEBE1", color: "#777" }} value={mForm.codiceAssociazione} disabled />
                </div>
                <div>
                  <label style={styles.label}>Data</label>
                  <input
                    style={{ ...styles.input, background: "#EFEBE1", color: "#777" }}
                    value={mForm.dataRegistrazione ? mForm.dataRegistrazione.split("-").reverse().join("/") : ""}
                    disabled
                  />
                </div>
                <div>
                  <label style={styles.label}>Tipo</label>
                  <select style={styles.input} value={mForm.tipo} onChange={(e) => setMForm({ ...mForm, tipo: e.target.value })}>
                    {MACRO_AREE_MEZZI.map((area) => {
                      const voci = tipiMezzoList.filter((t) => (tipiMezzoMacroAree?.[t] || "Altro") === area);
                      if (voci.length === 0) return null;
                      return (
                        <optgroup key={area} label={area}>
                          {voci.map((t) => (
                            <option key={t}>{t}</option>
                          ))}
                        </optgroup>
                      );
                    })}
                  </select>
                </div>
                <div>
                  <label style={styles.label}>Targa</label>
                  <input style={styles.input} value={mForm.targa} onChange={(e) => setMForm({ ...mForm, targa: e.target.value })} />
                </div>
                <div>
                  <label style={styles.label}>Alimentazione</label>
                  <select style={styles.input} value={mForm.alimentazione} onChange={(e) => setMForm({ ...mForm, alimentazione: e.target.value })}>
                    {TIPI_ALIMENTAZIONE.map((a) => (
                      <option key={a}>{a}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={styles.label}>Km iniziali</label>
                  <input
                    style={styles.input}
                    type="number"
                    inputMode="numeric"
                    value={mForm.kmIniziali}
                    onChange={(e) => setMForm({ ...mForm, kmIniziali: e.target.value })}
                  />
                </div>
                <div>
                  <label style={styles.label}>Richiesta buono benzina</label>
                  <select style={styles.input} value={mForm.buonoBenzina} onChange={(e) => setMForm({ ...mForm, buonoBenzina: e.target.value })}>
                    {SI_NO.map((v) => (
                      <option key={v}>{v}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={styles.label}>Turno</label>
                  <input
                    style={{ ...styles.input, background: "#EFEBE1", color: "#777" }}
                    value={turnoScelto ? `${turnoScelto.nome} (${turnoScelto.inizio}–${turnoScelto.fine})` : "Nessun turno selezionato"}
                    disabled
                  />
                </div>
                <div>
                  <label style={styles.label}>Referente mezzo</label>
                  <select
                    style={styles.input}
                    value={mForm.referenteVolontarioId}
                    onChange={(e) => setMForm({ ...mForm, referenteVolontarioId: e.target.value })}
                  >
                    <option value="">Nessuno</option>
                    {referentiDisponibili.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.cognome} {v.nome}
                      </option>
                    ))}
                  </select>
                  {referentiDisponibili.length === 0 && (
                    <div style={{ fontSize: 12, color: "#999", marginTop: 4 }}>
                      Nessun volontario di questa associazione ancora inserito nell'evento.
                    </div>
                  )}
                </div>
                {dupErrorMezzo === "EVENTO_CHIUSO_MEZZI" ? (
                  <div style={{ ...styles.card, borderColor: "var(--red)", padding: 14 }}>
                    <div style={{ color: "var(--red)", fontWeight: 600, marginBottom: 10 }}>
                      Evento chiuso, non è possibile inserire nuovi mezzi.
                    </div>
                    <button type="button" style={styles.btnPrimary} onClick={onCambiaEvento}>
                      Seleziona nuovo evento
                    </button>
                  </div>
                ) : (
                  dupErrorMezzo && <div style={styles.errorText}>{dupErrorMezzo}</div>
                )}
                <button type="submit" style={styles.btnPrimary}>
                  <Truck size={16} style={{ marginRight: 6 }} /> Metti in servizio
                </button>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ================= SELEZIONA ASSOCIAZIONE =================
function SelezionaAssociazioneView({ onConferma, associazioniDb }) {
  const [modo, setModo] = useState("codice");
  const [queryCodice, setQueryCodice] = useState("");
  const [queryDenominazione, setQueryDenominazione] = useState("");
  const [provincia, setProvincia] = useState("");
  const [queryComune, setQueryComune] = useState("");

  const db = associazioniDb && associazioniDb.length ? associazioniDb : ASSOCIAZIONI_DB.map((r) => ({ cod: r[0], denominazione: r[1], sede: r[2], comune: r[3], provincia: r[4] }));
  const provinceList = useMemo(() => Array.from(new Set(db.map((a) => a.provincia))).filter(Boolean).sort(), [db]);

  const risultati = useMemo(() => {
    if (modo === "codice") {
      const q = queryCodice.trim();
      if (!q) return [];
      return db.filter((a) => a.cod.includes(q)).slice(0, 30);
    } else if (modo === "denominazione") {
      const q = queryDenominazione.trim().toLowerCase();
      if (!q) return [];
      return db.filter((a) => a.denominazione.toLowerCase().includes(q)).slice(0, 30);
    } else {
      if (!provincia) return [];
      const qc = queryComune.trim().toLowerCase();
      return db.filter((a) => a.provincia === provincia && (!qc || a.comune.toLowerCase().includes(qc))).slice(0, 40);
    }
  }, [modo, queryCodice, queryDenominazione, provincia, queryComune, db]);

  function scegli(a) {
    onConferma({ cod: a.cod, denominazione: a.denominazione, sede: a.sede, comune: a.comune, provincia: a.provincia });
  }

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <div style={styles.card}>
        <h2 style={styles.cardTitle}>Seleziona associazione</h2>
        <p style={{ fontSize: 13, color: "#666", marginBottom: 16 }}>
          Cerca l'associazione di riferimento per questo dispositivo: verrà usata per compilare automaticamente i moduli di
          inserimento volontari e mezzi.
        </p>

        <div style={styles.subTabRow}>
          <button
            className="tab-btn"
            style={modo === "codice" ? styles.subTabActive : styles.subTabInactive}
            onClick={() => setModo("codice")}
          >
            Cerca per codice
          </button>
          <button
            className="tab-btn"
            style={modo === "denominazione" ? styles.subTabActive : styles.subTabInactive}
            onClick={() => setModo("denominazione")}
          >
            Cerca per denominazione
          </button>
          <button
            className="tab-btn"
            style={modo === "zona" ? styles.subTabActive : styles.subTabInactive}
            onClick={() => setModo("zona")}
          >
            Cerca per provincia/città
          </button>
        </div>

        {modo === "codice" && (
          <div style={{ marginTop: 14 }}>
            <label style={styles.label}>Codice associazione (Cod.)</label>
            <input
              style={{ ...styles.input, maxWidth: 220 }}
              value={queryCodice}
              onChange={(e) => setQueryCodice(e.target.value)}
              placeholder="Es. 900"
              inputMode="numeric"
            />
          </div>
        )}

        {modo === "denominazione" && (
          <div style={{ marginTop: 14 }}>
            <label style={styles.label}>Denominazione associazione</label>
            <input
              style={{ ...styles.input, maxWidth: 360 }}
              value={queryDenominazione}
              onChange={(e) => setQueryDenominazione(e.target.value)}
              placeholder="Es. Misericordia di Santa Maria di Licodia"
            />
          </div>
        )}

        {modo === "zona" && (
          <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
            <div>
              <label style={styles.label}>Provincia</label>
              <select style={{ ...styles.input, width: 140 }} value={provincia} onChange={(e) => setProvincia(e.target.value)}>
                <option value="">Seleziona</option>
                {provinceList.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={styles.label}>Comune (opzionale)</label>
              <input
                style={{ ...styles.input, width: 220 }}
                value={queryComune}
                onChange={(e) => setQueryComune(e.target.value)}
                placeholder="Es. Santa Maria di Licodia"
              />
            </div>
          </div>
        )}

        <div style={{ marginTop: 16, display: "grid", gap: 8, maxHeight: 340, overflowY: "auto" }}>
          {risultati.length === 0 && (
            <div style={styles.emptyText}>
              {modo === "codice"
                ? "Digita un codice per cercare."
                : modo === "denominazione"
                ? "Digita una denominazione per cercare."
                : provincia
                ? "Nessun risultato."
                : "Seleziona una provincia per cercare."}
            </div>
          )}
          {risultati.map((a) => (
            <div key={a.cod} style={styles.rowItem}>
              <div>
                <div style={styles.rowTitle}>
                  {a.denominazione} <span style={styles.rowMeta}>· Cod. {a.cod}</span>
                </div>
                <div style={styles.rowMeta}>
                  {a.sede} — {a.comune} ({a.provincia})
                </div>
              </div>
              <button style={styles.btnSecondary} onClick={() => scegli(a)}>
                Conferma
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ================= SELEZIONA EVENTO =================
function SelezionaEventoView({ eventi, onConferma, onIndietro }) {
  const attivi = eventi.filter((e) => !e.chiuso);

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <button style={styles.backBtn} className="no-print" onClick={onIndietro}>
        ← Torna alla scelta dell'associazione
      </button>
      <div style={styles.card}>
        <h2 style={styles.cardTitle}>Seleziona evento</h2>
        <p style={{ fontSize: 13, color: "#666", marginBottom: 16 }}>
          Scegli l'evento/emergenza a cui vuoi registrarti. L'elenco è definito dall'amministratore.
        </p>

        <div style={{ display: "grid", gap: 8 }}>
          {attivi.length === 0 && (
            <div style={styles.emptyText}>
              Nessun evento disponibile al momento. Contatta l'amministratore per aprirne uno.
            </div>
          )}
          {attivi.map((e) => (
            <div key={e.id} style={styles.rowItem}>
              <div>
                <div style={styles.rowTitle}>{e.nome}</div>
                <div style={styles.rowMeta}>Avviato il {fmtDate(e.createdAt)}</div>
              </div>
              <button style={styles.btnPrimary} onClick={() => onConferma(e.id)}>
                Seleziona
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ================= SELEZIONA TURNO (parte pubblica) =================
function SelezionaTurnoView({ turniList, eventoNome, dataSelezionata, onCambiaData, onConferma, onIndietro }) {
  return (
    <div style={{ display: "grid", gap: 20 }}>
      <button style={styles.backBtn} className="no-print" onClick={onIndietro}>
        ← Torna alla scelta dell'evento
      </button>
      <div style={styles.card}>
        <h2 style={styles.cardTitle}>Seleziona turno</h2>
        <p style={{ fontSize: 13, color: "#666", marginBottom: 16 }}>
          Scegli la giornata e il turno di riferimento per {eventoNome ? `"${eventoNome}"` : "questo evento"}. Verranno
          usati per precompilare data e orario nei moduli "Inserisci volontari" e "Inserisci mezzi" — i turni disponibili
          possono cambiare a seconda della giornata scelta.
        </p>

        <div style={{ marginBottom: 16 }}>
          <label style={styles.label}>Giornata</label>
          <input
            type="date"
            style={{ ...styles.input, maxWidth: 200 }}
            value={dataSelezionata}
            onChange={(e) => onCambiaData(e.target.value)}
          />
        </div>

        <div style={{ display: "grid", gap: 8 }}>
          {turniList.length === 0 && <div style={styles.emptyText}>Nessun turno configurato per questa giornata.</div>}
          {turniList.map((t) => (
            <div key={t.id} style={styles.rowItem}>
              <div>
                <div style={styles.rowTitle}>{t.nome}</div>
                <div style={styles.rowMeta}>
                  {t.inizio}–{t.fine}
                </div>
              </div>
              <button style={styles.btnPrimary} onClick={() => onConferma(t.id)}>
                Seleziona
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
// ================= ADMIN / REPORT =================
function AdminView({
  ruoloAccesso,
  turnoGenerale,
  setTurnoGenerale,
  dataGenerale,
  setDataGenerale,
  volontari,
  mezzi,
  config,
  specializzazioniGlobali,
  tipiMezzoGlobali,
  nomeUtenteLoggato,
  associazioniDb,
  eventi,
  eventoCorrenteId,
  eventoCorrenteNome,
  onSaveConfig,
  onAddAssociazione,
  onRemoveAssociazione,
  onAddAssociazioneDb,
  onUpdateAssociazioneDb,
  onDeleteAssociazioneDb,
  onAddSpecializzazione,
  onRemoveSpecializzazione,
  onAddTipoMezzo,
  onRemoveTipoMezzo,
  onAddTurnoGiorno,
  onRemoveTurnoGiorno,
  onSvuotaTurniGiorno,
  onModificaTurnoGiorno,
  onSpostaTurnoGiorno,
  onUpdateVolontario,
  onDeleteVolontario,
  onScorporaVolontario,
  onRimettiInCampoVolontario,
  onUpdateMezzo,
  onDeleteMezzo,
  onCheckoutMezzo,
  onRimettiInCampoMezzo,
  onCambiaEvento,
  onSetEvento,
  onCreaEvento,
  onRinominaEvento,
  onChiudiEvento,
  onRiapriEvento,
  onEliminaEvento,
  onEsportaEvento,
  squadre,
  onAggiungiSquadra,
  onAggiornaSquadra,
  onEliminaSquadra,
  onTerminaSquadra,
  onRiattivaSquadra,
  registroRadio,
  onAggiungiMessaggioRadio,
  onAggiornaMessaggioRadio,
  onEliminaMessaggioRadio,
  adminCredentials,
  onSaveAdminCredentials,
  onLogout,
}) {
  const [subTab, setSubTab] = useState("home");
  const eventoCorrente = eventi.find((e) => e.id === eventoCorrenteId);
  const soloLettura = !!eventoCorrente?.chiuso && ruoloAccesso !== "admin";
  const associazioni = config.associazioni || [];
  const specializzazioniList = specializzazioniGlobali?.length ? specializzazioniGlobali : SPECIALIZZAZIONI;
  const tipiMezzoList = tipiMezzoGlobali?.length ? tipiMezzoGlobali : TIPI_MEZZO;
  const turniListGenerale = turniPerGiorno(config, dataGenerale);
  const turnoGeneraleObj = turnoGenerale !== "tutti" ? turniListGenerale.find((t) => t.id === turnoGenerale) : null;

  // se cambia la giornata e il turno generale non esiste più per quella data (es. turni personalizzati con id diversi),
  // ricalcola il turno più adatto invece di lasciare un riferimento non valido
  useEffect(() => {
    if (turnoGenerale !== "tutti" && !turniListGenerale.find((t) => t.id === turnoGenerale)) {
      setTurnoGenerale(trovaTurnoAttuale(turniListGenerale));
    }
    // eslint-disable-next-line
  }, [dataGenerale, config?.turniPerGiorno, config?.turni]);

  const volontariInCampoN = volontari.filter((v) => v.stato === "in campo").length;
  const mezziInServizioN = mezzi.filter((m) => m.stato === "in servizio").length;
  const associazioniPartecipanti = Array.from(
    new Set([
      ...volontari.filter((v) => v.stato === "in campo").map((v) => v.associazione || ASSOCIAZIONE_DEFAULT),
      ...mezzi.filter((m) => m.stato === "in servizio").map((m) => m.associazione || ASSOCIAZIONE_DEFAULT),
    ])
  );
  // Per i Registri presenza: tutte le associazioni che hanno avuto volontari/mezzi in questo evento,
  // a prescindere dal fatto che siano ancora "in campo" — uno storico non deve sparire perché tutti
  // sono rientrati/scorporati.
  const associazioniTutte = Array.from(
    new Set([
      ...volontari.map((v) => v.associazione || ASSOCIAZIONE_DEFAULT),
      ...mezzi.map((m) => m.associazione || ASSOCIAZIONE_DEFAULT),
    ])
  );

  function escapeHtmlAdmin(s) {
    return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  const beneficiariRaggruppati = (() => {
    const gruppi = {};
    volontari
      .filter((v) => v.beneficiLegge === "Sì")
      .forEach((v) => {
        const chiave = `${v.cognome.trim().toLowerCase()}|${v.nome.trim().toLowerCase()}|${v.dataNascita || ""}`;
        if (!gruppi[chiave]) {
          gruppi[chiave] = {
            cognome: v.cognome,
            nome: v.nome,
            luogoNascita: v.luogoNascita,
            dataNascita: v.dataNascita,
            associazione: v.associazione || ASSOCIAZIONE_DEFAULT,
            codiceAssociazione: v.codiceAssociazione,
            date: [],
          };
        }
        gruppi[chiave].date.push({ data: fmtDate(v.oraIngresso), inizioTurno: v.inizioTurno, fineTurno: v.fineTurno });
      });
    return Object.values(gruppi);
  })();

  function buildAttestatoHtml(persona) {
    const luogoEvento = Array.from(new Set(volontari.map((v) => v.luogoAttivita).filter(Boolean)))[0] || "…………………………………………………..";
    const oggiFmt = new Date().toLocaleDateString("it-IT");
    const righeGiorni = persona.date
      .map((d) => `<div class="riga-giorno">- ${escapeHtmlAdmin(d.data)}${d.inizioTurno && d.fineTurno ? ` dalle ore ${escapeHtmlAdmin(d.inizioTurno)} alle ore ${escapeHtmlAdmin(d.fineTurno)}` : ""}</div>`)
      .join("");
    return `<div class="pagina">
      <div class="intestazione">
        ${
          loghiEventoValidi(eventoCorrente && eventoCorrente.loghi).length
            ? buildLoghiRigaHtml(eventoCorrente.loghi, 66)
            : `<div class="logo-box"><img src="${LOGO_DATA_URI}" alt="" /></div>`
        }
        <div>
          <div class="ente">${escapeHtmlAdmin((eventoCorrente && eventoCorrente.enteGestore) || "Fraternita di Misericordia di S.M. di Licodia - ODV")}</div>
          <div class="sotto">Protezione Civile</div>
        </div>
      </div>
      <div class="titolo">Attestazione presenza</div>
      <div class="corpo">
        <p>Si attesta che <b>${escapeHtmlAdmin(persona.cognome)} ${escapeHtmlAdmin(persona.nome)}</b>, nato/a a
        ${escapeHtmlAdmin(persona.luogoNascita) || "…………………………………."}
        il ${escapeHtmlAdmin(fmtDataItaliana(persona.dataNascita)) || "…………./…………/…………"}, appartenente all'organizzazione di volontariato
        <b>${escapeHtmlAdmin(persona.associazione)}</b> iscritta al n. ${escapeHtmlAdmin(persona.codiceAssociazione) || "…………"}
        dell'elenco territoriale del DRPC Sicilia, ha prestato servizio per attività di Protezione Civile in occasione di:</p>
        <p>Evento denominato <b>«${escapeHtmlAdmin(eventoCorrenteNome)}»</b> nei seguenti giorni ed orari:</p>
        <div class="giorni">${righeGiorni}</div>
        <p class="rilascio">Si rilascia la presente per gli usi consentiti dalla legge, ivi compreso quanto indicato
        all'art. 39-40 del D.Lgs 1 del 02/01/2018 e s.m.i.</p>
        <p class="luogo-data">${escapeHtmlAdmin(luogoEvento)}, ${escapeHtmlAdmin(oggiFmt)}</p>
      </div>
      <div class="firma-riga">
        <div class="firma">Il Responsabile Odv</div>
        <div class="firma">Il Responsabile Evento</div>
      </div>
    </div>`;
  }

  function stampaAttestatoStyle() {
    return `<style>
  * { box-sizing: border-box; }
  @page { size: portrait; margin: 18mm; }
  body { font-family: Arial, Helvetica, sans-serif; color: #111; margin: 0; }
  .pagina { page-break-after: always; padding: 10px; }
  .pagina:last-child { page-break-after: auto; }
  .intestazione { display: flex; align-items: center; gap: 16px; border-bottom: 2px solid #1F3B57; padding-bottom: 14px; margin-bottom: 26px; }
  .logo-box { width: 54px; height: 66px; flex-shrink: 0; }
  .logo-box img { width: 100%; height: 100%; object-fit: contain; }
  .loghi-riga { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
  .loghi-riga img { height: 100%; width: auto; max-width: 90px; object-fit: contain; }
  .ente { font-size: 14px; font-weight: bold; letter-spacing: 0.02em; color: #1F3B57; }
  .sotto { font-size: 11px; color: #556; margin-top: 2px; }
  .titolo { text-align: center; font-size: 20px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.04em; margin: 10px 0 34px; }
  .corpo { font-size: 14px; line-height: 1.9; }
  .corpo p { margin: 0 0 14px; text-align: justify; }
  .giorni { margin: 10px 0 20px 10px; }
  .riga-giorno { font-size: 14px; margin-bottom: 4px; }
  .rilascio { margin-top: 24px; }
  .luogo-data { font-weight: bold; margin-top: 20px; }
  .firma-riga { display: flex; justify-content: space-between; margin-top: 70px; font-size: 13px; }
  .firma { border-top: 1px solid #111; padding-top: 6px; width: 260px; text-align: center; }
</style>`;
  }

  function apriFinestraAttestato(html, titolo) {
    const doc = `<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="utf-8" />
<title>${escapeHtmlAdmin(titolo)}</title>
${stampaAttestatoStyle()}
</head>
<body>
  ${html}
  <script>window.onload = function(){ setTimeout(function(){ window.print(); }, 300); };</script>
</body>
</html>`;
    const win = window.open("", "_blank", "width=900,height=1000");
    if (!win) {
      window.alert("Il browser ha bloccato l'apertura della finestra. Consenti i popup per questo sito e riprova.");
      return;
    }
    win.document.open();
    win.document.write(doc);
    win.document.close();
    win.focus();
  }

  function generaAttestatoSingolo(persona) {
    apriFinestraAttestato(buildAttestatoHtml(persona), `Attestazione - ${persona.cognome} ${persona.nome}`);
  }
  function generaTuttiAttestati() {
    if (beneficiariRaggruppati.length === 0) {
      window.alert('Nessun volontario con "Richiesta benefici legge" impostata su Sì per questo evento.');
      return;
    }
    apriFinestraAttestato(beneficiariRaggruppati.map(buildAttestatoHtml).join(""), `Attestazioni - ${eventoCorrenteNome}`);
  }

  // ---------- Pasti ----------
  const luogoEventoCorrente = () => Array.from(new Set(volontari.map((v) => v.luogoAttivita).filter(Boolean)))[0] || "";

  function stilePaginaTicket() {
    return `<style>
  * { box-sizing: border-box; }
  @page { size: portrait; margin: 10mm; }
  body { font-family: Arial, Helvetica, sans-serif; color: #111; margin: 0; }
  .ticket { border: 1px solid #ccc; border-radius: 12px; overflow: hidden; margin-bottom: 14px; page-break-inside: avoid; box-shadow: 0 1px 4px rgba(0,0,0,0.08); }
  .ticket-header { display: flex; align-items: center; gap: 12px; background: #1F3B57; color: #fff; padding: 8px 14px; }
  .ticket-header img { width: 36px; height: 44px; object-fit: contain; background: #fff; border-radius: 4px; padding: 2px; flex-shrink: 0; }
  .loghi-riga { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
  .loghi-riga img { height: 100%; width: auto; max-width: 50px; object-fit: contain; background: #fff; border-radius: 4px; padding: 2px; }
  .ticket-ente { font-size: 12px; font-weight: bold; letter-spacing: 0.02em; line-height: 1.25; }
  .ticket-sub { font-size: 9px; opacity: 0.85; margin-top: 1px; }
  .ticket-title { text-align: center; font-size: 13px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em; padding: 10px 14px 2px; color: #1F3B57; }
  .ticket-body { padding: 6px 16px 12px; }
  .riga { display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 5px; border-bottom: 1px dotted #ddd; padding-bottom: 3px; }
  .riga b { color: #1F3B57; }
  .elenco { margin: 8px 0 0; padding-left: 18px; font-size: 12px; }
  .ticket-footer { display: flex; justify-content: center; padding: 10px 16px 16px; }
  .firma-box { width: 260px; text-align: center; font-size: 9px; color: #555; border-top: 1px solid #999; padding-top: 22px; }
</style>`;
  }
  function apriFinestraTicket(html, titolo) {
    const doc = `<!DOCTYPE html>
<html lang="it">
<head><meta charset="utf-8" /><title>${escapeHtmlAdmin(titolo)}</title>${stilePaginaTicket()}</head>
<body>${html}<script>window.onload = function(){ setTimeout(function(){ window.print(); }, 300); };</script></body>
</html>`;
    const win = window.open("", "_blank", "width=800,height=900");
    if (!win) {
      window.alert("Il browser ha bloccato l'apertura della finestra. Consenti i popup per questo sito e riprova.");
      return;
    }
    win.document.open();
    win.document.write(doc);
    win.document.close();
    win.focus();
  }
  function intestazioneTicket() {
    const loghi = loghiEventoValidi(eventoCorrente && eventoCorrente.loghi);
    const nomeEnteTicket = (eventoCorrente && eventoCorrente.enteGestore) || "Fraternita di Misericordia di S.M. di Licodia - ODV";
    return `<div class="ticket-header">
      ${loghi.length ? buildLoghiRigaHtml(loghi, 44) : `<img src="${LOGO_DATA_URI}" alt="" />`}
      <div>
        <div class="ticket-ente">${escapeHtmlAdmin(nomeEnteTicket)}</div>
        <div class="ticket-sub">Protezione Civile</div>
      </div>
    </div>`;
  }
  function piedeTicket() {
    return `<div class="ticket-footer">
      <div class="firma-box">Firma e timbro</div>
    </div>`;
  }

  const pastiVolontariTutti = volontari.filter((v) => v.pastoRichiesto === "Sì");

  function buildTicketPastoHtml(v) {
    return `<div class="ticket">
      ${intestazioneTicket()}
      <div class="ticket-title">Ticket pasto</div>
      <div class="ticket-body">
        <div class="riga"><span>Evento</span><b>${escapeHtmlAdmin(eventoCorrenteNome)}</b></div>
        <div class="riga"><span>Nominativo</span><b>${escapeHtmlAdmin(v.cognome)} ${escapeHtmlAdmin(v.nome)}</b></div>
        <div class="riga"><span>Associazione</span><b>${escapeHtmlAdmin(v.associazione || ASSOCIAZIONE_DEFAULT)}</b></div>
        <div class="riga"><span>Data</span><b>${escapeHtmlAdmin(fmtDate(v.oraIngresso))}</b></div>
        <div class="riga"><span>Turno</span><b>${escapeHtmlAdmin(v.inizioTurno || "")}–${escapeHtmlAdmin(v.fineTurno || "")}</b></div>
        ${v.allergie ? `<div class="riga"><span>Allergie/intolleranze</span><b>${escapeHtmlAdmin(v.allergie)}</b></div>` : ""}
      </div>
      ${piedeTicket()}
    </div>`;
  }
  function generaTicketPastoSingolo(v) {
    apriFinestraTicket(buildTicketPastoHtml(v), `Ticket pasto - ${v.cognome} ${v.nome}`);
  }
  function generaTicketPastoCumulativo(associazione, listaVisibile) {
    const lista = (listaVisibile || pastiVolontariTutti).filter((v) => (v.associazione || ASSOCIAZIONE_DEFAULT) === associazione);
    if (lista.length === 0) return;
    apriFinestraTicket(lista.map(buildTicketPastoHtml).join(""), `Ticket pasto - ${associazione}`);
  }
  function generaReportPastiPdf(listaVisibile) {
    const lista = listaVisibile || pastiVolontariTutti;
    if (lista.length === 0) {
      window.alert("Nessun volontario con richiesta pasto per i filtri selezionati.");
      return;
    }
    const righe = lista
      .map(
        (v) => `<tr><td>${escapeHtmlAdmin(v.cognome)}</td><td>${escapeHtmlAdmin(v.nome)}</td><td>${escapeHtmlAdmin(v.associazione || ASSOCIAZIONE_DEFAULT)}</td>
        <td>${escapeHtmlAdmin(fmtDate(v.oraIngresso))}</td><td>${escapeHtmlAdmin(v.inizioTurno || "")}–${escapeHtmlAdmin(v.fineTurno || "")}</td>
        <td>${escapeHtmlAdmin(v.allergie || "")}</td></tr>`
      )
      .join("");
    const html = `<!DOCTYPE html>
<html lang="it"><head><meta charset="utf-8" /><title>Report pasti - ${escapeHtmlAdmin(eventoCorrenteNome)}</title>
<style>
  body { font-family: Arial, sans-serif; padding: 20px 24px; }
  h1 { font-size: 15px; margin: 0 0 4px; }
  .sub { font-size: 11px; color: #444; margin-bottom: 16px; }
  table { width: 100%; border-collapse: collapse; font-size: 9pt; }
  th, td { border: 1px solid #000; padding: 4px 6px; text-align: left; }
  th { background: #EFEBE1; text-transform: uppercase; font-size: 8pt; }
</style></head>
<body>
  <h1>Report richieste pasto</h1>
  <div class="sub">${escapeHtmlAdmin(eventoCorrenteNome)} — ${lista.length} volontari — stampato il ${escapeHtmlAdmin(new Date().toLocaleString("it-IT"))}</div>
  <table><thead><tr><th>Cognome</th><th>Nome</th><th>Associazione</th><th>Data</th><th>Turno</th><th>Allergie</th></tr></thead>
  <tbody>${righe}</tbody></table>
  <script>window.onload = function(){ setTimeout(function(){ window.print(); }, 300); };</script>
</body></html>`;
    const win = window.open("", "_blank", "width=1000,height=900");
    if (!win) {
      window.alert("Il browser ha bloccato l'apertura della finestra. Consenti i popup per questo sito e riprova.");
      return;
    }
    win.document.open();
    win.document.write(html);
    win.document.close();
    win.focus();
  }

  // ---------- Buoni benzina ----------
  const mezziBenzinaTutti = mezzi.filter((m) => m.buonoBenzina === "Sì");

  function aggiornaImportoBenzina(id, importo) {
    onUpdateMezzo(id, { buonoImporto: importo });
  }
  function buildTicketBenzinaHtml(m, importoOverride) {
    const importo = importoOverride !== undefined ? importoOverride : m.buonoImporto;
    return `<div class="ticket">
      ${intestazioneTicket()}
      <div class="ticket-title">Buono benzina</div>
      <div class="ticket-body">
        <div class="riga"><span>Evento</span><b>${escapeHtmlAdmin(eventoCorrenteNome)}</b></div>
        <div class="riga"><span>Associazione</span><b>${escapeHtmlAdmin(m.associazione || ASSOCIAZIONE_DEFAULT)}</b></div>
        <div class="riga"><span>Targa</span><b>${escapeHtmlAdmin(m.targa)}</b></div>
        <div class="riga"><span>Tipo mezzo</span><b>${escapeHtmlAdmin(m.tipo)}</b></div>
        <div class="riga"><span>Data</span><b>${escapeHtmlAdmin(fmtDate(m.oraIngresso))}</b></div>
        <div class="riga"><span>Turno</span><b>${escapeHtmlAdmin(m.inizioTurno || "")}–${escapeHtmlAdmin(m.fineTurno || "")}</b></div>
        <div class="riga"><span>Importo</span><b>${importo ? `€ ${escapeHtmlAdmin(importo)}` : "…………"}</b></div>
      </div>
      ${piedeTicket()}
    </div>`;
  }
  function generaTicketBenzinaSingolo(m, importoCorrente) {
    const importo = (importoCorrente ?? m.buonoImporto ?? "").toString().trim();
    if (importo && importo !== (m.buonoImporto || "")) aggiornaImportoBenzina(m.id, importo);
    apriFinestraTicket(buildTicketBenzinaHtml(m, importo), `Buono benzina - ${m.targa}`);
  }
  function generaTicketBenzinaCumulativo(associazione, importiCorrenti, listaVisibile) {
    const lista = (listaVisibile || mezziBenzinaTutti).filter((m) => (m.associazione || ASSOCIAZIONE_DEFAULT) === associazione);
    if (lista.length === 0) return;
    apriFinestraTicket(
      lista.map((m) => buildTicketBenzinaHtml(m, importiCorrenti && importiCorrenti[m.id] !== undefined ? importiCorrenti[m.id] : m.buonoImporto)).join(""),
      `Buoni benzina - ${associazione}`
    );
  }
  function generaReportBenzinaPdf(listaVisibile, importiCorrenti, turnoLabel, dataLabel) {
    const lista = listaVisibile || mezziBenzinaTutti;
    if (lista.length === 0) {
      window.alert("Nessun mezzo con richiesta buono benzina per i filtri selezionati.");
      return;
    }
    function importoDi(m) {
      const raw = importiCorrenti && importiCorrenti[m.id] !== undefined ? importiCorrenti[m.id] : m.buonoImporto;
      const n = parseFloat((raw ?? "").toString().replace(",", "."));
      return isNaN(n) ? 0 : n;
    }
    function fmtEuro(n) {
      return `€ ${n.toFixed(2).replace(".", ",")}`;
    }
    const totale = lista.reduce((acc, m) => acc + importoDi(m), 0);
    const righe = lista
      .map(
        (m) => `<tr><td>${escapeHtmlAdmin(m.associazione || ASSOCIAZIONE_DEFAULT)}</td><td>${escapeHtmlAdmin(m.tipo)}</td>
        <td>${escapeHtmlAdmin(m.targa)}</td><td class="imp">${escapeHtmlAdmin(fmtEuro(importoDi(m)))}</td></tr>`
      )
      .join("");
    const html = `<!DOCTYPE html>
<html lang="it"><head><meta charset="utf-8" /><title>Report buoni benzina - ${escapeHtmlAdmin(eventoCorrenteNome)}</title>
<style>
  body { font-family: Arial, sans-serif; padding: 20px 24px; }
  h1 { font-size: 15px; margin: 0 0 4px; }
  .sub { font-size: 11px; color: #444; margin-bottom: 4px; }
  .meta { font-size: 12px; color: #222; margin-bottom: 16px; }
  .meta b { color: #000; }
  table { width: 100%; border-collapse: collapse; font-size: 9pt; }
  th, td { border: 1px solid #000; padding: 4px 6px; text-align: left; }
  th { background: #EFEBE1; text-transform: uppercase; font-size: 8pt; }
  td.imp, th.imp { text-align: right; }
  tfoot td { font-weight: bold; border-top: 2px solid #000; }
</style></head>
<body>
  <h1>Report buoni benzina</h1>
  <div class="meta"><b>Data:</b> ${escapeHtmlAdmin(dataLabel || "Tutte le date")} &nbsp;·&nbsp; <b>Turno:</b> ${escapeHtmlAdmin(turnoLabel || "Tutti i turni")}</div>
  <div class="sub">${escapeHtmlAdmin(eventoCorrenteNome)} — ${lista.length} buoni — stampato il ${escapeHtmlAdmin(new Date().toLocaleString("it-IT"))}</div>
  <table>
    <thead><tr><th>Associazione</th><th>Tipo mezzo</th><th>Targa</th><th class="imp">Importo</th></tr></thead>
    <tbody>${righe}</tbody>
    <tfoot><tr><td colspan="3">Totale</td><td class="imp">${escapeHtmlAdmin(fmtEuro(totale))}</td></tr></tfoot>
  </table>
  <script>window.onload = function(){ setTimeout(function(){ window.print(); }, 300); };</script>
</body></html>`;
    const win = window.open("", "_blank", "width=1000,height=900");
    if (!win) {
      window.alert("Il browser ha bloccato l'apertura della finestra. Consenti i popup per questo sito e riprova.");
      return;
    }
    win.document.open();
    win.document.write(html);
    win.document.close();
    win.focus();
  }

  const GRUPPO_EVENTO_TABS = ["panoramica", "associazioni", "partecipanti", "volontari", "mezzi", "impostazioni"];
  const GRUPPO_SQUADRE_TABS = ["squadre-appiedate", "squadre-ambulanze", "squadre-logistiche-tecniche"];
  const GRUPPO_STAMPE_TABS = ["attestati", "pasti", "benzina", "registri"];
  function backTarget() {
    if (GRUPPO_EVENTO_TABS.includes(subTab)) return "gestione-evento";
    if (GRUPPO_SQUADRE_TABS.includes(subTab)) return "gestione-squadre";
    if (GRUPPO_STAMPE_TABS.includes(subTab)) return "stampe";
    return "home";
  }

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }} className="no-print">
        {subTab !== "home" ? (
          <button style={styles.backBtn} onClick={() => setSubTab(backTarget())}>
            ← Indietro
          </button>
        ) : (
          <div />
        )}
        <button style={styles.btnGhost} onClick={onLogout}>
          <LogOut size={16} style={{ marginRight: 6 }} /> Esci
        </button>
      </div>

      {subTab === "home" && (
        <div style={{ display: "grid", gap: 16 }}>
          <div style={styles.assocBanner} className="no-print">
            <div>
              <div style={styles.assocBannerLabel}>Evento in gestione</div>
              <div style={styles.assocBannerName}>{eventoCorrenteNome}</div>
            </div>
            <button style={styles.btnSecondary} onClick={onCambiaEvento}>
              Cambia evento
            </button>
          </div>

          <div style={styles.assocBanner} className="no-print">
            <div>
              <div style={styles.assocBannerLabel}>Filtro turno generale</div>
              <div style={styles.assocBannerMeta}>
                Si applica come impostazione iniziale a Volontari, Mezzi, Associazioni partecipanti e Gestione squadre — ogni
                schermata permette comunque di scegliere una data o un turno diverso al suo interno.
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <input type="date" style={styles.input} value={dataGenerale} onChange={(e) => setDataGenerale(e.target.value)} />
              <select style={styles.input} value={turnoGenerale} onChange={(e) => setTurnoGenerale(e.target.value)}>
                <option value="tutti">Tutti i turni</option>
                {turniListGenerale.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nome} ({t.inizio}–{t.fine})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {soloLettura && (
            <div style={{ ...styles.card, borderColor: "var(--orange)" }} className="no-print">
              <div style={{ fontSize: 13, color: "#555" }}>
                <b style={{ color: "var(--orange)" }}>Evento chiuso — sola consultazione.</b> I dati sono visibili ma non
                modificabili. Solo un accesso Admin può riaprire questo evento o apportare modifiche.
              </div>
            </div>
          )}

          <div style={styles.sezioniGrid}>
            <button style={styles.sezioneTile} onClick={() => setSubTab("gestione-evento")}>
              <LayoutGrid size={38} />
              <div style={styles.sezioneTileLabel}>Dati evento</div>
              <div style={styles.sezioneTileSub}>Panoramica, associazioni, volontari, mezzi, impostazioni</div>
            </button>
            <button style={styles.sezioneTile} onClick={() => setSubTab("gestione-squadre")}>
              <Users size={38} />
              <div style={styles.sezioneTileLabel}>Gestione squadre</div>
              <div style={styles.sezioneTileSub}>Appiedate, ambulanze, logistiche-tecniche</div>
            </button>
            <button style={styles.sezioneTile} onClick={() => setSubTab("registro-radio")}>
              <Radio size={38} />
              <div style={styles.sezioneTileLabel}>Registro comunicazioni radio</div>
              <div style={styles.sezioneTileSub}>Registrazione cronologica dei messaggi radio</div>
            </button>
            <button style={styles.sezioneTile} onClick={() => setSubTab("stampe")}>
              <Printer size={38} />
              <div style={styles.sezioneTileLabel}>Stampa attestati/ticket/registri</div>
              <div style={styles.sezioneTileSub}>Attestati, buoni pasto, buoni benzina, registri presenza</div>
            </button>
          </div>
        </div>
      )}

      {subTab === "stampe" && (
        <div style={{ display: "grid", gap: 16 }}>
          <div style={styles.squadreSectionTitle}>Stampa attestati/ticket/registri</div>
          <div style={styles.homeGrid}>
            <button style={styles.homeTile} onClick={() => setSubTab("attestati")}>
              <Printer size={30} />
              <div style={styles.homeTileLabel}>Attestati art.39-40 D.Lgs 1 del 2/1/18</div>
            </button>
            <button style={styles.homeTile} onClick={() => setSubTab("pasti")}>
              <Users size={30} />
              <div style={styles.homeTileLabel}>Buoni Pasto</div>
            </button>
            <button style={styles.homeTile} onClick={() => setSubTab("benzina")}>
              <Truck size={30} />
              <div style={styles.homeTileLabel}>Buoni benzina</div>
            </button>
            <button style={styles.homeTile} onClick={() => setSubTab("registri")}>
              <Printer size={30} />
              <div style={styles.homeTileLabel}>Stampa registri presenza</div>
            </button>
          </div>
        </div>
      )}

      {subTab === "gestione-evento" && (
        <div style={{ display: "grid", gap: 16 }}>
          <div style={styles.squadreSectionTitle}>Dati evento</div>
          <div style={styles.homeGrid}>
            <button style={styles.homeTile} onClick={() => setSubTab("panoramica")}>
              <LayoutGrid size={30} />
              <div style={styles.homeTileLabel}>Panoramica evento</div>
            </button>
            <button style={styles.homeTile} onClick={() => setSubTab("partecipanti")}>
              <Users size={30} />
              <div style={styles.homeTileLabel}>Associazioni partecipanti</div>
            </button>
            <button style={styles.homeTile} onClick={() => setSubTab("volontari")}>
              <Users size={30} />
              <div style={styles.homeTileLabel}>Volontari partecipanti</div>
            </button>
            <button style={styles.homeTile} onClick={() => setSubTab("mezzi")}>
              <Truck size={30} />
              <div style={styles.homeTileLabel}>Mezzi partecipanti</div>
            </button>
            <button style={styles.homeTile} onClick={() => setSubTab("impostazioni")}>
              <Clock size={30} />
              <div style={styles.homeTileLabel}>Impostazione turni evento</div>
            </button>
            <button style={styles.homeTile} onClick={() => setSubTab("associazioni")}>
              <ShieldPlus size={30} />
              <div style={styles.homeTileLabel}>Associazioni Elenco DRPC</div>
            </button>
          </div>
        </div>
      )}

      {subTab === "attestati" && (
        <AttestatiTab beneficiari={beneficiariRaggruppati} onGeneraSingolo={generaAttestatoSingolo} onGeneraTutti={generaTuttiAttestati} />
      )}

      {subTab === "pasti" && (
        <PastiTab
          volontari={pastiVolontariTutti}
          onGeneraSingolo={generaTicketPastoSingolo}
          onGeneraCumulativo={generaTicketPastoCumulativo}
          onGeneraReport={generaReportPastiPdf}
          config={config}
          turniList={turniListGenerale}
          turnoDefaultId={turnoGenerale}
          dataDefault={dataGenerale}
        />
      )}

      {subTab === "benzina" && (
        <BenzinaTab
          mezzi={mezziBenzinaTutti}
          onGeneraSingolo={generaTicketBenzinaSingolo}
          onGeneraCumulativo={generaTicketBenzinaCumulativo}
          onAggiornaImporto={aggiornaImportoBenzina}
          onGeneraReport={generaReportBenzinaPdf}
          config={config}
          turniList={turniListGenerale}
          turnoDefaultId={turnoGenerale}
          dataDefault={dataGenerale}
        />
      )}

      {subTab === "gestione-squadre" && (
        <div style={{ display: "grid", gap: 16 }}>
          <div style={styles.squadreSectionTitle}>Gestione squadre</div>
          <div style={styles.homeGrid}>
            <button style={styles.homeTile} onClick={() => setSubTab("squadre-appiedate")}>
              <Users size={30} />
              <div style={styles.homeTileLabel}>Appiedate</div>
            </button>
            <button style={styles.homeTile} onClick={() => setSubTab("squadre-ambulanze")}>
              <Truck size={30} />
              <div style={styles.homeTileLabel}>Ambulanze</div>
            </button>
            <button style={styles.homeTile} onClick={() => setSubTab("squadre-logistiche-tecniche")}>
              <Truck size={30} />
              <div style={styles.homeTileLabel}>Logistiche-Tecniche</div>
            </button>
          </div>

          <SquadreRiepilogoLive
            squadre={squadre}
            volontari={volontari}
            mezzi={mezzi}
            turniList={turniListGenerale}
            onTermina={onTerminaSquadra}
            onAggiorna={onAggiornaSquadra}
          />
        </div>
      )}

      {subTab === "registro-radio" && (
        <RegistroRadioTab
          registro={registroRadio}
          squadre={squadre}
          onAggiungi={onAggiungiMessaggioRadio}
          onAggiorna={onAggiornaMessaggioRadio}
          onElimina={onEliminaMessaggioRadio}
          eventoNome={eventoCorrenteNome}
          nomeUtenteLoggato={nomeUtenteLoggato}
          soloLettura={soloLettura}
          ruoloAccesso={ruoloAccesso}
        />
      )}

      {(subTab === "squadre-appiedate" || subTab === "squadre-ambulanze" || subTab === "squadre-logistiche-tecniche") && (
        <SquadreTab
          tipo={subTab.replace("squadre-", "")}
          volontari={volontari}
          mezzi={mezzi}
          squadre={squadre.filter((s) => s.tipo === subTab.replace("squadre-", ""))}
          tutteLeSquadre={squadre}
          turniList={turniListGenerale}
          onAggiungi={onAggiungiSquadra}
          onAggiorna={onAggiornaSquadra}
          onElimina={onEliminaSquadra}
          onTermina={onTerminaSquadra}
          onRiattiva={onRiattivaSquadra}
          soloLettura={soloLettura}
          turnoIniziale={turnoGenerale}
          dataIniziale={dataGenerale}
        />
      )}

      {subTab === "panoramica" && (
        <PanoramicaTab
          volontari={volontari}
          mezzi={mezzi}
          volontariInCampoN={volontariInCampoN}
          mezziInServizioN={mezziInServizioN}
        />
      )}

      {subTab === "associazioni" && (
        <AssociazioniDbTab
          associazioniDb={associazioniDb}
          onAdd={onAddAssociazioneDb}
          onUpdate={onUpdateAssociazioneDb}
          onDelete={onDeleteAssociazioneDb}
          soloLettura={soloLettura}
        />
      )}

      {subTab === "partecipanti" && (
        <PartecipantiTab
          associazioniPartecipanti={associazioniPartecipanti}
          volontari={volontari}
          mezzi={mezzi}
          config={config}
          turniList={turniListGenerale}
          turnoIniziale={turnoGenerale}
          dataIniziale={dataGenerale}
        />
      )}

      {subTab === "registri" && (
        <RegistriPresenzaTab
          associazioniPartecipanti={associazioniTutte}
          volontari={volontari}
          mezzi={mezzi}
          associazioniDb={associazioniDb}
          config={config}
          turniList={turniListGenerale}
          turnoIniziale={turnoGenerale}
          dataIniziale={dataGenerale}
          eventoCorrente={eventoCorrente}
        />
      )}

      {subTab === "volontari" && (
        <VolontariTab
          volontari={volontari}
          associazioni={associazioni}
          specializzazioniList={specializzazioniList}
          config={config}
          turniList={turniListGenerale}
          onUpdate={onUpdateVolontario}
          onDelete={onDeleteVolontario}
          onScorpora={onScorporaVolontario}
          onRimettiInCampo={onRimettiInCampoVolontario}
          soloLettura={soloLettura}
          turnoIniziale={turnoGenerale}
          dataIniziale={dataGenerale}
        />
      )}

      {subTab === "mezzi" && (
        <MezziTab
          mezzi={mezzi}
          volontari={volontari}
          associazioni={associazioni}
          tipiMezzoList={tipiMezzoList}
          config={config}
          turniList={turniListGenerale}
          onUpdate={onUpdateMezzo}
          onDelete={onDeleteMezzo}
          onCheckout={onCheckoutMezzo}
          onRimettiInCampo={onRimettiInCampoMezzo}
          soloLettura={soloLettura}
          turnoIniziale={turnoGenerale}
          dataIniziale={dataGenerale}
        />
      )}

      {subTab === "impostazioni" && (
        <ImpostazioniTab
          soloLettura={soloLettura}
          config={config}
          onAddTurnoGiorno={onAddTurnoGiorno}
          onRemoveTurnoGiorno={onRemoveTurnoGiorno}
          onSvuotaTurniGiorno={onSvuotaTurniGiorno}
          onModificaTurnoGiorno={onModificaTurnoGiorno}
          onSpostaTurnoGiorno={onSpostaTurnoGiorno}
        />
      )}
    </div>
  );
}

// ================= ADMIN: PANORAMICA =================
// ================= ADMIN: ATTESTATI ART. 39-40 D.LGS 1/2018 =================
function AttestatiTab({ beneficiari, onGeneraSingolo, onGeneraTutti }) {
  const [ricerca, setRicerca] = useState("");
  const filtrati = beneficiari.filter((p) => {
    const q = ricerca.trim().toLowerCase();
    if (!q) return true;
    return `${p.cognome} ${p.nome}`.toLowerCase().includes(q) || `${p.nome} ${p.cognome}`.toLowerCase().includes(q);
  });

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <div style={styles.card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
          <h2 style={styles.cardTitle}>Attestati — volontari con richiesta benefici legge ({filtrati.length})</h2>
          {filtrati.length > 0 && (
            <button style={styles.btnPrimary} onClick={onGeneraTutti}>
              <Printer size={14} style={{ marginRight: 6 }} /> Genera tutti
            </button>
          )}
        </div>
        <input
          style={{ ...styles.input, maxWidth: 320, marginTop: 4, marginBottom: 14 }}
          value={ricerca}
          onChange={(e) => setRicerca(e.target.value)}
          placeholder="Cerca per nome o cognome…"
        />
        <div style={{ display: "grid", gap: 8 }}>
          {filtrati.length === 0 && (
            <div style={styles.emptyText}>
              {beneficiari.length === 0
                ? 'Nessun volontario con "Richiesta benefici legge" impostata su Sì per questo evento.'
                : "Nessun risultato per la ricerca."}
            </div>
          )}
          {filtrati.map((p) => (
            <div key={`${p.cognome}-${p.nome}-${p.dataNascita}`} style={styles.rowItem}>
              <div>
                <div style={styles.rowTitle}>
                  {p.cognome} {p.nome}
                </div>
                <div style={styles.rowMeta}>
                  {p.associazione} · {p.date.length} {p.date.length === 1 ? "giornata" : "giornate"} di servizio
                </div>
              </div>
              <button style={styles.btnSecondary} onClick={() => onGeneraSingolo(p)}>
                <Printer size={14} style={{ marginRight: 6 }} /> Genera attestato
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ================= ADMIN: PASTI =================
function PastiTab({ volontari, onGeneraSingolo, onGeneraCumulativo, onGeneraReport, config, turniList, turnoDefaultId, dataDefault }) {
  const [dataFiltro, setDataFiltro] = useState(dataDefault || "");
  const [turnoFiltro, setTurnoFiltro] = useState(turnoDefaultId || "tutti");

  const turniListEffettiva = dataFiltro && config ? turniPerGiorno(config, dataFiltro) : turniList;
  const turnoFiltroObj = turnoFiltro !== "tutti" ? turniListEffettiva.find((t) => t.id === turnoFiltro) : null;
  const filtrati = volontari.filter((v) => {
    if (turnoFiltroObj && (v.inizioTurno !== turnoFiltroObj.inizio || v.fineTurno !== turnoFiltroObj.fine)) return false;
    if (dataFiltro) {
      const dataFiltroFmt = new Date(dataFiltro + "T00:00:00").toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit", year: "numeric" });
      if (fmtDate(v.oraIngresso) !== dataFiltroFmt) return false;
    }
    return true;
  });
  const associazioni = Array.from(new Set(filtrati.map((v) => v.associazione || ASSOCIAZIONE_DEFAULT)));

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <div style={styles.card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
          <h2 style={styles.cardTitle}>Volontari con richiesta pasto ({filtrati.length})</h2>
          {filtrati.length > 0 && (
            <button style={styles.btnSecondary} onClick={() => onGeneraReport(filtrati)}>
              <Printer size={14} style={{ marginRight: 6 }} /> Report PDF
            </button>
          )}
        </div>
        <p style={{ fontSize: 13, color: "#666", marginBottom: 10 }}>
          Per impostazione predefinita è mostrato il turno generale selezionato per l'evento. Puoi comunque cercare buoni di
          date o turni diversi con i filtri qui sotto.
        </p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
          <input style={styles.input} type="date" value={dataFiltro} onChange={(e) => setDataFiltro(e.target.value)} />
          <select style={styles.input} value={turnoFiltro} onChange={(e) => setTurnoFiltro(e.target.value)}>
            <option value="tutti">Tutti i turni</option>
            {turniListEffettiva.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nome} ({t.inizio}–{t.fine})
              </option>
            ))}
          </select>
        </div>
        <div style={{ display: "grid", gap: 8 }}>
          {filtrati.length === 0 && <div style={styles.emptyText}>Nessun volontario con richiesta pasto per i filtri selezionati.</div>}
          {filtrati.map((v) => (
            <div key={v.id} style={styles.rowItem}>
              <div>
                <div style={styles.rowTitle}>
                  {v.cognome} {v.nome}
                </div>
                <div style={styles.rowMeta}>
                  {v.associazione || ASSOCIAZIONE_DEFAULT} · {fmtDate(v.oraIngresso)} · {v.inizioTurno || ""}–{v.fineTurno || ""}
                  {v.allergie ? ` · Allergie: ${v.allergie}` : ""}
                </div>
              </div>
              <button style={styles.btnSecondary} onClick={() => onGeneraSingolo(v)}>
                <Printer size={14} style={{ marginRight: 6 }} /> Ticket pasto
              </button>
            </div>
          ))}
        </div>
      </div>

      {associazioni.length > 0 && (
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Ticket per associazione</h2>
          <p style={{ fontSize: 13, color: "#666", marginBottom: 10 }}>
            Genera in un unico foglio un ticket separato per ciascun volontario dell'associazione scelta (rispetta i filtri
            impostati sopra).
          </p>
          <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
            {associazioni.map((a) => (
              <div key={a} style={styles.rowItem}>
                <div style={styles.rowTitle}>{a}</div>
                <button style={styles.btnSecondary} onClick={() => onGeneraCumulativo(a, filtrati)}>
                  <Printer size={14} style={{ marginRight: 6 }} /> Genera ticket
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ================= ADMIN: BUONI BENZINA =================
function BenzinaTab({ mezzi, onGeneraSingolo, onGeneraCumulativo, onAggiornaImporto, onGeneraReport, config, turniList, turnoDefaultId, dataDefault }) {
  const [importi, setImporti] = useState(() => {
    const iniziale = {};
    mezzi.forEach((m) => {
      iniziale[m.id] = m.buonoImporto || "";
    });
    return iniziale;
  });
  const [dataFiltro, setDataFiltro] = useState(dataDefault || "");
  const [turnoFiltro, setTurnoFiltro] = useState(turnoDefaultId || "tutti");

  function setImporto(id, valore) {
    setImporti((prev) => ({ ...prev, [id]: valore }));
  }

  const turniListEffettiva = dataFiltro && config ? turniPerGiorno(config, dataFiltro) : turniList;
  const turnoFiltroObj = turnoFiltro !== "tutti" ? turniListEffettiva.find((t) => t.id === turnoFiltro) : null;
  const filtrati = mezzi.filter((m) => {
    if (turnoFiltroObj) {
      const turniGiornoRecord = m.oraIngresso && config ? turniPerGiorno(config, timestampADataInput(m.oraIngresso)) : turniListEffettiva;
      if (!turnoCopertoDaRecord(m.inizioTurno, m.fineTurno, turnoFiltroObj, turniGiornoRecord)) return false;
    }
    if (dataFiltro) {
      const dataFiltroFmt = new Date(dataFiltro + "T00:00:00").toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit", year: "numeric" });
      if (fmtDate(m.oraIngresso) !== dataFiltroFmt) return false;
    }
    return true;
  });
  const associazioni = Array.from(new Set(filtrati.map((m) => m.associazione || ASSOCIAZIONE_DEFAULT)));
  const dataLabel = dataFiltro ? new Date(dataFiltro + "T00:00:00").toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit", year: "numeric" }) : "Tutte le date";
  const turnoLabel = turnoFiltroObj ? `${turnoFiltroObj.nome} (${turnoFiltroObj.inizio}–${turnoFiltroObj.fine})` : "Tutti i turni";

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <div style={styles.card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
          <h2 style={styles.cardTitle}>Mezzi con richiesta buono benzina ({filtrati.length})</h2>
          {filtrati.length > 0 && onGeneraReport && (
            <button style={styles.btnSecondary} onClick={() => onGeneraReport(filtrati, importi, turnoLabel, dataLabel)}>
              <Printer size={14} style={{ marginRight: 6 }} /> Report PDF
            </button>
          )}
        </div>
        <p style={{ fontSize: 13, color: "#666", marginBottom: 10 }}>
          Per impostazione predefinita è mostrato il turno generale selezionato per l'evento. Puoi comunque cercare buoni di
          date o turni diversi con i filtri qui sotto. L'importo va indicato per ciascun mezzo: verrà riportato anche nel
          buono per associazione.
        </p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
          <input style={styles.input} type="date" value={dataFiltro} onChange={(e) => setDataFiltro(e.target.value)} />
          <select style={styles.input} value={turnoFiltro} onChange={(e) => setTurnoFiltro(e.target.value)}>
            <option value="tutti">Tutti i turni</option>
            {turniListEffettiva.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nome} ({t.inizio}–{t.fine})
              </option>
            ))}
          </select>
        </div>
        <div style={{ display: "grid", gap: 8 }}>
          {filtrati.length === 0 && <div style={styles.emptyText}>Nessun mezzo con richiesta buono benzina per i filtri selezionati.</div>}
          {filtrati.map((m) => (
            <div key={m.id} style={styles.rowItem}>
              <div>
                <div style={styles.rowTitle}>{m.targa}</div>
                <div style={styles.rowMeta}>
                  {m.tipo} · {m.associazione || ASSOCIAZIONE_DEFAULT} · {fmtDate(m.oraIngresso)} · {m.inizioTurno || ""}–{m.fineTurno || ""}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ fontSize: 13, color: "#666" }}>€</span>
                  <input
                    style={{ ...styles.input, width: 90 }}
                    type="number"
                    value={importi[m.id] ?? m.buonoImporto ?? ""}
                    onChange={(e) => setImporto(m.id, e.target.value)}
                    onBlur={(e) => {
                      if (e.target.value !== (m.buonoImporto || "")) onAggiornaImporto(m.id, e.target.value);
                    }}
                    placeholder="Importo"
                  />
                </div>
                <button style={styles.btnSecondary} onClick={() => onGeneraSingolo(m, importi[m.id] ?? m.buonoImporto ?? "")}>
                  <Printer size={14} style={{ marginRight: 6 }} /> Genera buono
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {associazioni.length > 0 && (
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Buoni per associazione</h2>
          <p style={{ fontSize: 13, color: "#666", marginBottom: 10 }}>
            Genera in un unico foglio un buono separato per ciascun mezzo dell'associazione scelta (rispetta i filtri
            impostati sopra).
          </p>
          <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
            {associazioni.map((a) => (
              <div key={a} style={styles.rowItem}>
                <div style={styles.rowTitle}>{a}</div>
                <button style={styles.btnSecondary} onClick={() => onGeneraCumulativo(a, importi, filtrati)}>
                  <Printer size={14} style={{ marginRight: 6 }} /> Genera buoni
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

}

function PanoramicaTab({ volontari, mezzi, volontariInCampoN, mezziInServizioN }) {
  const specializzazioneSet = Array.from(new Set(volontari.map((v) => v.specializzazione)));
  const perSpecializzazione = specializzazioneSet.map((s) => ({ s, n: volontari.filter((v) => v.specializzazione === s).length }));
  const oreTotaliMs = volontari.reduce((sum, v) => sum + (v.oraUscita || Date.now()) - v.oraIngresso, 0);
  const oreMezziTotaliMs = mezzi.reduce((sum, m) => sum + (m.oraUscita || Date.now()) - m.oraIngresso, 0);
  function fmtOreHHmm(ms) {
    const totMin = Math.round(ms / 60000);
    const h = Math.floor(totMin / 60);
    const m = totMin % 60;
    return `${h}h ${String(m).padStart(2, "0")}m`;
  }

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <div style={styles.statGrid}>
        <StatCard label="Volontari in campo" value={volontariInCampoN} accent="orange" />
        <StatCard label="Volontari totali registrati" value={volontari.length} />
        <StatCard label="Mezzi in servizio" value={mezziInServizioN} accent="green" />
        <StatCard label="Ore uomo totali" value={fmtOreHHmm(oreTotaliMs)} />
        <StatCard label="Ore mezzi totale" value={fmtOreHHmm(oreMezziTotaliMs)} accent="green" />
      </div>

      {perSpecializzazione.length > 0 && (
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Impiego per specializzazione</h2>
          <div style={{ display: "grid", gap: 8 }}>
            {perSpecializzazione.map(({ s, n }) => (
              <div key={s} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 180, fontFamily: "'IBM Plex Mono', monospace", fontSize: 13 }}>{s}</div>
                <div style={{ flex: 1, background: "var(--line)", borderRadius: 3, height: 10 }}>
                  <div style={{ width: `${(n / volontari.length) * 100}%`, background: "var(--navy)", height: 10, borderRadius: 3 }} />
                </div>
                <div style={{ width: 24, textAlign: "right", fontFamily: "'IBM Plex Mono', monospace" }}>{n}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


// ================= ADMIN: ASSOCIAZIONI (DATABASE) =================
function AssociazioniDbTab({ associazioniDb, onAdd, onUpdate, onDelete }) {
  const [query, setQuery] = useState("");
  const [editingCod, setEditingCod] = useState(null);
  const [editDraft, setEditDraft] = useState({});
  const [nuovo, setNuovo] = useState({ cod: "", denominazione: "", sede: "", comune: "", provincia: "" });
  const [errore, setErrore] = useState("");

  const risultati = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = associazioniDb || [];
    if (!q) return list.slice(0, 60);
    return list.filter((a) => a.cod.includes(q) || a.denominazione.toLowerCase().includes(q) || a.comune.toLowerCase().includes(q)).slice(0, 60);
  }, [associazioniDb, query]);

  function startEdit(a) {
    setEditingCod(a.cod);
    setEditDraft({ ...a });
  }
  function saveEdit() {
    onUpdate(editingCod, editDraft);
    setEditingCod(null);
  }
  function submitNuovo(e) {
    e.preventDefault();
    if (!nuovo.cod.trim() || !nuovo.denominazione.trim()) {
      setErrore("Codice e denominazione sono obbligatori.");
      return;
    }
    const ok = onAdd(nuovo);
    if (!ok) {
      setErrore("Esiste già un'associazione con questo codice.");
      return;
    }
    setErrore("");
    setNuovo({ cod: "", denominazione: "", sede: "", comune: "", provincia: "" });
  }

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <div style={styles.card}>
        <h2 style={styles.cardTitle}>Associazioni nel database ({(associazioniDb || []).length})</h2>
        <div style={{ position: "relative", marginBottom: 14, maxWidth: 320 }}>
          <Search size={14} style={{ position: "absolute", left: 8, top: 10, opacity: 0.5 }} />
          <input
            style={{ ...styles.input, paddingLeft: 28 }}
            placeholder="Cerca per codice, nome o comune"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div style={{ display: "grid", gap: 8, maxHeight: 420, overflowY: "auto" }}>
          {risultati.length === 0 && <div style={styles.emptyText}>Nessuna associazione trovata.</div>}
          {risultati.map((a) =>
            editingCod === a.cod ? (
              <div key={a.cod} style={{ ...styles.rowItem, flexDirection: "column", alignItems: "stretch", gap: 8 }}>
                <div style={styles.grid2} className="grid2-force">
                  <input style={styles.input} value={editDraft.cod} onChange={(e) => setEditDraft({ ...editDraft, cod: e.target.value })} placeholder="Codice" />
                  <input style={styles.input} value={editDraft.provincia} onChange={(e) => setEditDraft({ ...editDraft, provincia: e.target.value.toUpperCase() })} placeholder="Provincia" />
                </div>
                <input style={styles.input} value={editDraft.denominazione} onChange={(e) => setEditDraft({ ...editDraft, denominazione: e.target.value })} placeholder="Denominazione" />
                <input style={styles.input} value={editDraft.sede} onChange={(e) => setEditDraft({ ...editDraft, sede: e.target.value })} placeholder="Sede" />
                <input style={styles.input} value={editDraft.comune} onChange={(e) => setEditDraft({ ...editDraft, comune: e.target.value })} placeholder="Comune" />
                <div style={{ display: "flex", gap: 8 }}>
                  <button style={styles.btnPrimary} onClick={saveEdit}>
                    Salva
                  </button>
                  <button style={styles.btnSecondary} onClick={() => setEditingCod(null)}>
                    Annulla
                  </button>
                </div>
              </div>
            ) : (
              <div key={a.cod} style={styles.rowItem}>
                <div>
                  <div style={styles.rowTitle}>
                    {a.denominazione} <span style={styles.rowMeta}>· Cod. {a.cod}</span>
                  </div>
                  <div style={styles.rowMeta}>
                    {a.sede} — {a.comune} ({a.provincia})
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button style={styles.btnSecondary} onClick={() => startEdit(a)}>
                    Modifica
                  </button>
                  <button style={styles.btnGhostRed} onClick={() => window.confirm(`Eliminare "${a.denominazione}"?`) && onDelete(a.cod)}>
                    Elimina
                  </button>
                </div>
              </div>
            )
          )}
        </div>
      </div>

      <div style={styles.card}>
        <h2 style={styles.cardTitle}>Aggiungi associazione mancante</h2>
        <form onSubmit={submitNuovo} style={{ display: "grid", gap: 10 }}>
          <div style={styles.grid2} className="grid2-force">
            <div>
              <label style={styles.label}>Codice</label>
              <input style={styles.input} value={nuovo.cod} onChange={(e) => setNuovo({ ...nuovo, cod: e.target.value })} />
            </div>
            <div>
              <label style={styles.label}>Provincia</label>
              <input style={styles.input} value={nuovo.provincia} onChange={(e) => setNuovo({ ...nuovo, provincia: e.target.value.toUpperCase() })} maxLength={2} />
            </div>
          </div>
          <div>
            <label style={styles.label}>Denominazione</label>
            <input style={styles.input} value={nuovo.denominazione} onChange={(e) => setNuovo({ ...nuovo, denominazione: e.target.value })} />
          </div>
          <div>
            <label style={styles.label}>Sede</label>
            <input style={styles.input} value={nuovo.sede} onChange={(e) => setNuovo({ ...nuovo, sede: e.target.value })} />
          </div>
          <div>
            <label style={styles.label}>Comune</label>
            <input style={styles.input} value={nuovo.comune} onChange={(e) => setNuovo({ ...nuovo, comune: e.target.value })} />
          </div>
          {errore && <div style={styles.errorText}>{errore}</div>}
          <button type="submit" style={styles.btnPrimary}>
            <Plus size={16} style={{ marginRight: 6 }} /> Aggiungi associazione
          </button>
        </form>
      </div>
    </div>
  );
}

// ================= ADMIN: ASSOCIAZIONI PARTECIPANTI =================
function PartecipantiTab({ associazioniPartecipanti, volontari, mezzi, config, turniList, turnoIniziale, dataIniziale }) {
  const [turnoFiltroPart, setTurnoFiltroPart] = useState(turnoIniziale || "tutti");
  const [dataFiltroPart, setDataFiltroPart] = useState(dataIniziale || "");

  const turniListEffettiva = dataFiltroPart && config ? turniPerGiorno(config, dataFiltroPart) : turniList;
  const associazioniFiltrate = (() => {
    let volontariF = volontari.filter((v) => v.stato === "in campo");
    let mezziF = mezzi.filter((m) => m.stato === "in servizio");
    if (turnoFiltroPart !== "tutti") {
      const t = turniListEffettiva.find((x) => x.id === turnoFiltroPart);
      if (t) {
        volontariF = volontariF.filter((v) => v.inizioTurno === t.inizio && v.fineTurno === t.fine);
        mezziF = mezziF.filter((m) => {
          const turniGiornoRecord = m.oraIngresso && config ? turniPerGiorno(config, timestampADataInput(m.oraIngresso)) : turniListEffettiva;
          return turnoCopertoDaRecord(m.inizioTurno, m.fineTurno, t, turniGiornoRecord);
        });
      }
    }
    if (dataFiltroPart) {
      const dataFiltroFmt = new Date(dataFiltroPart + "T00:00:00").toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit", year: "numeric" });
      volontariF = volontariF.filter((v) => fmtDate(v.oraIngresso) === dataFiltroFmt);
      mezziF = mezziF.filter((m) => fmtDate(m.oraIngresso) === dataFiltroFmt);
    }
    const set = new Set([
      ...volontariF.map((v) => v.associazione || ASSOCIAZIONE_DEFAULT),
      ...mezziF.map((m) => m.associazione || ASSOCIAZIONE_DEFAULT),
    ]);
    return associazioniPartecipanti.filter((a) => set.has(a));
  })();

  return (
    <div style={styles.card}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
        <h2 style={styles.cardTitle}>Associazioni in campo ({associazioniFiltrate.length})</h2>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input type="date" style={styles.input} value={dataFiltroPart} onChange={(e) => setDataFiltroPart(e.target.value)} />
          <select style={styles.input} value={turnoFiltroPart} onChange={(e) => setTurnoFiltroPart(e.target.value)}>
            <option value="tutti">Tutti i turni</option>
            {turniListEffettiva.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nome} ({t.inizio}–{t.fine})
              </option>
            ))}
          </select>
        </div>
      </div>
      <div style={{ display: "grid", gap: 8 }}>
        {associazioniFiltrate.length === 0 && <div style={styles.emptyText}>Nessuna associazione per il turno selezionato.</div>}
        {associazioniFiltrate.map((a) => (
          <div key={a} style={styles.rowItem}>
            <span style={styles.pillGreen}>{a}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function RegistriPresenzaTab({ associazioniPartecipanti, volontari, mezzi, associazioniDb, config, turniList, turnoIniziale, dataIniziale, eventoCorrente }) {
  const [avviso, setAvviso] = useState("");
  const [turnoFiltroPart, setTurnoFiltroPart] = useState(turnoIniziale && turnoIniziale !== "tutti" ? turnoIniziale : turniList[0]?.id || "tutti");
  const [dataFiltroPart, setDataFiltroPart] = useState(dataIniziale || new Date().toISOString().slice(0, 10));

  const turniListEffettiva = dataFiltroPart && config ? turniPerGiorno(config, dataFiltroPart) : turniList;
  const associazioniFiltrate = (() => {
    let volontariF = volontari;
    let mezziF = mezzi;
    if (turnoFiltroPart !== "tutti") {
      const t = turniListEffettiva.find((x) => x.id === turnoFiltroPart);
      if (t) {
        volontariF = volontariF.filter((v) => v.inizioTurno === t.inizio && v.fineTurno === t.fine);
        mezziF = mezziF.filter((m) => {
          const turniGiornoRecord = m.oraIngresso && config ? turniPerGiorno(config, timestampADataInput(m.oraIngresso)) : turniListEffettiva;
          return turnoCopertoDaRecord(m.inizioTurno, m.fineTurno, t, turniGiornoRecord);
        });
      }
    }
    if (dataFiltroPart) {
      const dataFiltroFmt = new Date(dataFiltroPart + "T00:00:00").toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit", year: "numeric" });
      volontariF = volontariF.filter((v) => fmtDate(v.oraIngresso) === dataFiltroFmt);
      mezziF = mezziF.filter((m) => fmtDate(m.oraIngresso) === dataFiltroFmt);
    }
    const set = new Set([
      ...volontariF.map((v) => v.associazione || ASSOCIAZIONE_DEFAULT),
      ...mezziF.map((m) => m.associazione || ASSOCIAZIONE_DEFAULT),
    ]);
    return associazioniPartecipanti.filter((a) => set.has(a));
  })();

  function infoAssociazione(nome) {
    const rec = (associazioniDb || []).find((a) => a.denominazione === nome);
    const daVolontario = volontari.find((v) => (v.associazione || ASSOCIAZIONE_DEFAULT) === nome);
    const daMezzo = mezzi.find((m) => (m.associazione || ASSOCIAZIONE_DEFAULT) === nome);
    return {
      denominazione: nome,
      cod: rec?.cod || daVolontario?.codiceAssociazione || daMezzo?.codiceAssociazione || "",
      sede: rec?.sede || "",
      comune: rec?.comune || "",
      provincia: rec?.provincia || "",
    };
  }

  function escapeHtml(s) {
    return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }
  function referenteNomeMezzo(id) {
    const v = volontari.find((x) => x.id === id);
    return v ? `${v.cognome} ${v.nome}` : "";
  }

  function buildRegistroHtml(associazione, giornoFmt, turno, volontariFiltrati, mezziFiltrati) {
    // Capacità righe per pagina: quando le due sezioni condividono il foglio restano le stesse
    // dimensioni del modello originale; quando una sezione prosegue da sola su un foglio nuovo
    // può occupare più spazio.
    const CAP_VOL_SHARED = 9;
    const CAP_MEZZI_SHARED = 6;
    const CAP_VOL_SOLO = 16;
    const CAP_MEZZI_SOLO = 12;

    const sedeTxt = associazione.sede || [associazione.comune, associazione.provincia ? `(${associazione.provincia})` : ""].filter(Boolean).join(" ");

    function rigaVolHtml(v) {
      return `<tr>
        <td>${escapeHtml(v.cognome)}</td><td>${escapeHtml(v.nome)}</td><td>${escapeHtml(v.luogoNascita)}</td>
        <td class="ctr">${escapeHtml(fmtDataItaliana(v.dataNascita))}</td><td class="ctr">${escapeHtml(v.telefono)}</td><td class="ctr">${escapeHtml(v.beneficiLegge)}</td>
        <td>${escapeHtml(v.specializzazione)}</td><td>${escapeHtml(v.luogoAttivita)}</td>
        <td class="ctr">${escapeHtml(turno.inizio)}</td><td class="ctr">${escapeHtml(turno.fine)}</td><td class="ctr">${escapeHtml(v.pastoRichiesto)}</td>
      </tr>`;
    }
    const rigaVolVuota = `<tr>${"<td>&nbsp;</td>".repeat(11)}</tr>`;

    function rigaMezzoHtml(m) {
      return `<tr>
        <td>${escapeHtml(m.tipo)}</td><td>${escapeHtml(m.targa)}</td><td class="ctr">${escapeHtml(m.kmIniziali)}</td>
        <td class="ctr">${escapeHtml(m.kmFinali)}</td><td class="ctr">${escapeHtml(m.buonoBenzina)}</td><td>${escapeHtml(referenteNomeMezzo(m.referenteVolontarioId))}</td><td></td><td class="ctr">${escapeHtml(abbreviaAlimentazione(m.alimentazione))}</td>
      </tr>`;
    }
    const rigaMezzoVuota = `<tr>${"<td>&nbsp;</td>".repeat(8)}</tr>`;

    function buildHeaderHtml() {
      return `<table class="header-table">
      <tr>
        <td class="logo-box" rowspan="2">${
          eventoCorrente && eventoCorrente.enteGestore
            ? `<div class="ente-in-cella">${escapeHtml(eventoCorrente.enteGestore)}</div>`
            : ""
        }${buildLoghiCellaHtml(eventoCorrente && eventoCorrente.loghi)}${
          eventoCorrente && eventoCorrente.nome
            ? `<div class="evento-in-cella">Evento: ${escapeHtml(eventoCorrente.nome)}${eventoCorrente.luogoAttivita ? ` - ${escapeHtml(eventoCorrente.luogoAttivita)}` : ""}</div>`
            : ""
        }</td>
        <td class="cod-cell" rowspan="2"><div class="cod-label">COD. ASS.</div><div class="cod-value">${escapeHtml(associazione.cod) || ""}</div></td>
        <td class="assoc-line" colspan="2">&nbsp;Associazione: ${escapeHtml(associazione.denominazione)}</td>
      </tr>
      <tr>
        <td class="sede-line">&nbsp;Sede di: ${escapeHtml(sedeTxt)}</td>
        <td class="data-line">&nbsp;Data: ${escapeHtml(giornoFmt)}</td>
      </tr>
    </table>`;
    }

    function buildVolSectionHtml(lista, capacita, ultimaPagina) {
      const vuoteN = ultimaPagina ? Math.max(capacita - lista.length, 0) : 0;
      const righe = lista.map(rigaVolHtml).join("") + rigaVolVuota.repeat(vuoteN);
      return `<div class="section-title">Volontari presenti</div>
    <table class="reg-table">
      <colgroup>
        <col style="width:14.7%"><col style="width:11.8%"><col style="width:10.7%"><col style="width:8.7%">
        <col style="width:10.4%"><col style="width:3.2%"><col style="width:13.3%"><col style="width:16.5%">
        <col style="width:4.1%"><col style="width:3.8%"><col style="width:2.7%">
      </colgroup>
      <thead><tr>
        <th>Cognome</th><th>Nome</th><th>Luogo Nascita</th><th>Data Nascita</th><th>Telefono</th>
        <th class="vert">Rich.<br>benefici<br>legge</th><th>Specializzazione</th><th>Luogo attività</th>
        <th>Inizio<br>turno<br>ore</th><th>Fine<br>turno<br>ore</th><th class="vert">Richiesta<br>pasto</th>
      </tr></thead>
      <tbody>${righe}</tbody>
    </table>`;
    }

    function buildMezziSectionHtml(lista, capacita, ultimaPagina, primaSezionePagina) {
      const vuoteN = ultimaPagina ? Math.max(capacita - lista.length, 0) : 0;
      const righe = lista.map(rigaMezzoHtml).join("") + rigaMezzoVuota.repeat(vuoteN);
      return `${primaSezionePagina ? "" : '<div class="spacer"></div>'}
    <div class="section-title${primaSezionePagina ? "" : " section-title-top"}">Mezzi utilizzati</div>
    <table class="reg-table">
      <colgroup>
        <col style="width:14.7%"><col style="width:11.8%"><col style="width:10.7%"><col style="width:8.7%">
        <col style="width:5.3%"><col style="width:21.6%"><col style="width:24.4%"><col style="width:2.7%">
      </colgroup>
      <thead><tr>
        <th>Tipo</th><th>Targa</th><th>Km iniziali</th><th>Km finali</th>
        <th>Richiesta<br>buono<br>benz.</th><th>Referente del mezzo</th><th>Servizio espletato</th><th class="vert">alim</th>
      </tr></thead>
      <tbody>${righe}</tbody>
    </table>`;
    }

    // ---------- Impaginazione: pagina 1 mostra sempre entrambe le sezioni (formato originale).
    // Le pagine successive mostrano solo le sezioni che hanno ancora righe da stampare. ----------
    const pagine = [];
    let remV = volontariFiltrati.slice();
    let remM = mezziFiltrati.slice();
    {
      const chunkV = remV.splice(0, CAP_VOL_SHARED);
      const chunkM = remM.splice(0, CAP_MEZZI_SHARED);
      pagine.push({ vol: chunkV, mezzi: chunkM, mostraVol: true, mostraMezzi: true, volUltima: remV.length === 0, mezziUltima: remM.length === 0 });
    }
    while (remV.length > 0 || remM.length > 0) {
      if (remV.length > 0 && remM.length > 0) {
        const chunkV = remV.splice(0, CAP_VOL_SHARED);
        const chunkM = remM.splice(0, CAP_MEZZI_SHARED);
        pagine.push({ vol: chunkV, mezzi: chunkM, mostraVol: true, mostraMezzi: true, volUltima: remV.length === 0, mezziUltima: remM.length === 0 });
      } else if (remV.length > 0) {
        const chunkV = remV.splice(0, CAP_VOL_SOLO);
        pagine.push({ vol: chunkV, mezzi: [], mostraVol: true, mostraMezzi: false, volUltima: remV.length === 0, mezziUltima: true });
      } else {
        const chunkM = remM.splice(0, CAP_MEZZI_SOLO);
        pagine.push({ vol: [], mezzi: chunkM, mostraVol: false, mostraMezzi: true, volUltima: true, mezziUltima: remM.length === 0 });
      }
    }

    const paginaHtml = pagine
      .map((p, idx) => {
        const ultimaPagina = idx === pagine.length - 1;
        let corpo = "";
        if (p.mostraVol) corpo += buildVolSectionHtml(p.vol, p.mostraMezzi ? CAP_VOL_SHARED : CAP_VOL_SOLO, p.volUltima);
        if (p.mostraMezzi) corpo += buildMezziSectionHtml(p.mezzi, p.mostraVol ? CAP_MEZZI_SHARED : CAP_MEZZI_SOLO, p.mezziUltima, !p.mostraVol);
        return `<div class="foglio"${ultimaPagina ? "" : ' style="page-break-after: always;"'}>
      ${buildHeaderHtml()}
      ${corpo}
      ${
        ultimaPagina
          ? `<div class="footer">
        <div class="footer-line">Il Responsabile/Il Referente dell'Associazione</div>
      </div>`
          : ""
      }
    </div>`;
      })
      .join("");

    return `<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="utf-8" />
<meta name="format-detection" content="telephone=no, address=no, email=no, date=no" />
<title>Registro ${escapeHtml(associazione.denominazione)} - ${escapeHtml(giornoFmt)}</title>
<style>
  * { box-sizing: border-box; }
  @page { size: landscape; margin: 10mm; }
  body { font-family: Arial, Helvetica, sans-serif; color: #000; margin: 0; padding: 16px 20px; font-size: 10pt; }
  .sheet { max-width: 1300px; margin: 0 auto; }
  .foglio + .foglio { margin-top: 0; }
  .header-table { width: 100%; border-collapse: collapse; border: 2px solid #000; margin-bottom: 0; table-layout: fixed; }
  .header-table td { border: 1px solid #000; padding: 3px 8px; vertical-align: middle; word-break: break-word; overflow-wrap: break-word; }
  .logo-box { width: 200px; border-right: 1px solid #000; padding: 4px !important; vertical-align: middle; }
  .ente-in-cella { font-weight: bold; font-size: 8pt; text-align: center; margin-bottom: 2px; line-height: 1.15; }
  .evento-in-cella { font-weight: bold; font-size: 7.5pt; text-align: center; margin-top: 2px; line-height: 1.15; }
  .loghi-cella { display: flex; align-items: center; justify-content: center; gap: 4px; height: 100%; min-height: 50px; }
  .loghi-cella img { flex: 1 1 0; max-width: 100%; max-height: 50px; object-fit: contain; }
  .cod-cell { width: 110px; text-align: center; }
  .cod-cell .cod-label { font-weight: bold; font-style: italic; font-size: 9pt; }
  .cod-cell .cod-value { font-weight: bold; font-size: 16pt; }
  .assoc-line { font-weight: bold; font-size: 14pt; border-top: 2px solid #000; border-right: 2px solid #000; }
  .sede-line { font-weight: bold; font-size: 12pt; width: 46%; border-right: 2px solid #000; }
  .data-line { font-weight: bold; font-size: 12pt; border-right: 2px solid #000; }
  .section-title { font-weight: bold; letter-spacing: 0.5em; font-size: 10pt; margin: 0; padding: 4px; text-align: center; text-transform: uppercase; border: 2px solid #000; border-top: none; }
  .section-title-top { border-top: 2px solid #000; }
  table.reg-table { width: 100%; max-width: 100%; border-collapse: collapse; font-size: 9pt; margin: 0 0 0; border: 2px solid #000; border-top: none; table-layout: auto; }
  table.reg-table thead { display: table-header-group; }
  table.reg-table tr { page-break-inside: avoid; }
  table.reg-table td { border: 1px solid #000; padding: 3px 4px; height: 19px; font-size: 8.5pt; vertical-align: middle; word-break: break-word; overflow-wrap: break-word; white-space: normal; }
  table.reg-table td.ctr { text-align: center; white-space: nowrap; }
  table.reg-table th { border: 1px solid #000; padding: 4px 2px; height: 52px; font-size: 8pt; font-weight: bold; text-align: center; vertical-align: middle; word-break: break-word; overflow-wrap: break-word; white-space: normal; }
  table.reg-table th.vert { writing-mode: vertical-rl; transform: rotate(180deg); font-size: 7pt; line-height: 1.15; white-space: nowrap; }
  .spacer { height: 10px; }
  .footer { margin-top: 46px; text-align: right; font-size: 10pt; font-weight: bold; }
  .footer-line { border-top: 1px solid #000; width: 320px; margin: 0 0 0 auto; padding-top: 4px; }
  @media print { body { padding: 0; } .sheet { max-width: none; width: 100%; } }
</style>
</head>
<body>
  <div class="sheet">${paginaHtml}</div>
  <script>window.onload = function(){ setTimeout(function(){ window.print(); }, 250); };</script>
</body>
</html>`;
  }

  function generaRegistro(nome) {
    const turno = turniListEffettiva.find((t) => t.id === turnoFiltroPart);
    if (!turno) {
      setAvviso("Seleziona un turno specifico nei filtri in alto (non \"Tutti i turni\") prima di stampare il registro.");
      return;
    }
    const dataUso = dataFiltroPart || new Date().toISOString().slice(0, 10);
    const giornoFmt = new Date(dataUso + "T00:00:00").toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit", year: "numeric" });
    const volontariFiltrati = volontari.filter(
      (v) =>
        (v.associazione || ASSOCIAZIONE_DEFAULT) === nome &&
        fmtDate(v.oraIngresso) === giornoFmt &&
        v.inizioTurno === turno.inizio &&
        v.fineTurno === turno.fine
    );
    const mezziFiltrati = mezzi.filter(
      (m) =>
        (m.associazione || ASSOCIAZIONE_DEFAULT) === nome &&
        fmtDate(m.oraIngresso) === giornoFmt &&
        turnoCopertoDaRecord(m.inizioTurno, m.fineTurno, turno, dataUso && config ? turniPerGiorno(config, dataUso) : turniListEffettiva)
    );

    const html = buildRegistroHtml(infoAssociazione(nome), giornoFmt, turno, volontariFiltrati, mezziFiltrati);
    const win = window.open("", "_blank", "width=1050,height=850");
    if (!win) {
      setAvviso("Il browser ha bloccato l'apertura della finestra di stampa. Consenti i popup per questo sito e riprova.");
      return;
    }
    win.document.open();
    win.document.write(html);
    win.document.close();
    win.focus();
    setAvviso("");
  }

  return (
    <div style={styles.card}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
        <h2 style={styles.cardTitle}>Registri presenza ({associazioniFiltrate.length})</h2>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input type="date" style={styles.input} value={dataFiltroPart} onChange={(e) => setDataFiltroPart(e.target.value)} />
          <select style={styles.input} value={turnoFiltroPart} onChange={(e) => setTurnoFiltroPart(e.target.value)}>
            <option value="tutti">Tutti i turni</option>
            {turniListEffettiva.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nome} ({t.inizio}–{t.fine})
              </option>
            ))}
          </select>
        </div>
      </div>
      {avviso && <div style={{ ...styles.errorText, marginBottom: 10 }}>{avviso}</div>}
      <div style={{ display: "grid", gap: 8 }}>
        {associazioniFiltrate.length === 0 && <div style={styles.emptyText}>Nessuna associazione per i filtri selezionati.</div>}
        {associazioniFiltrate.map((a) => (
          <div key={a} style={styles.rowItem}>
            <span style={styles.pillGreen}>{a}</span>
            <button style={styles.btnSecondary} onClick={() => generaRegistro(a)}>
              <Printer size={14} style={{ marginRight: 6 }} /> Stampa registro
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ================= ADMIN: VOLONTARI =================
function VolontariTab({ volontari, associazioni, specializzazioniList, config, turniList, onUpdate, onDelete, onScorpora, onRimettiInCampo, soloLettura, turnoIniziale, dataIniziale }) {
  const [search, setSearch] = useState("");
  const [statoFiltro, setStatoFiltro] = useState("tutti");
  const [specializzazioneFiltro, setSpecializzazioneFiltro] = useState("tutte");
  const [associazioneFiltro, setAssociazioneFiltro] = useState("tutte");
  const [dataFiltro, setDataFiltro] = useState(dataIniziale || "");
  const [turnoFiltro, setTurnoFiltro] = useState(turnoIniziale || "tutti");
  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState({});
  const turniListEffettiva = dataFiltro && config ? turniPerGiorno(config, dataFiltro) : turniList;
  const inizioTurnoOptionsAdmin = Array.from(new Set(turniListEffettiva.map((t) => t.inizio))).sort();
  const fineTurnoOptionsAdmin = Array.from(new Set(turniListEffettiva.map((t) => t.fine))).sort();

  const associazioniPresenti = useMemo(
    () => Array.from(new Set(volontari.map((v) => (v.associazione || ASSOCIAZIONE_DEFAULT).trim()))).sort(),
    [volontari]
  );

  const filtrati = useMemo(() => {
    return volontari.filter((v) => {
      if (statoFiltro !== "tutti" && v.stato !== statoFiltro) return false;
      if (
        specializzazioneFiltro !== "tutte" &&
        v.specializzazione !== specializzazioneFiltro &&
        v.altraSpecializzazione !== specializzazioneFiltro
      )
        return false;
      if (associazioneFiltro !== "tutte" && (v.associazione || ASSOCIAZIONE_DEFAULT).trim() !== associazioneFiltro) return false;
      if (dataFiltro) {
        const dataFiltroFmt = new Date(dataFiltro + "T00:00:00").toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit", year: "numeric" });
        if (fmtDate(v.oraIngresso) !== dataFiltroFmt) return false;
      }
      if (turnoFiltro !== "tutti") {
        const t = turniListEffettiva.find((x) => x.id === turnoFiltro);
        if (!t || v.inizioTurno !== t.inizio || v.fineTurno !== t.fine) return false;
      }
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        if (!`${v.nome} ${v.cognome}`.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [volontari, statoFiltro, specializzazioneFiltro, associazioneFiltro, dataFiltro, turnoFiltro, search, turniList]);

  function startEdit(v) {
    setEditingId(v.id);
    setEditDraft({ ...v });
  }
  function saveEdit() {
    onUpdate(editingId, editDraft);
    setEditingId(null);
  }

  function exportCsv() {
    const rows = [[
      "Cognome", "Nome", "Luogo nascita", "Data nascita", "Telefono", "Associazione", "Codice associazione",
      "Specializzazione", "Altra specializzazione", "Caposquadra", "Luogo attività", "Benefici L.266", "Pasto richiesto", "Inizio turno", "Fine turno", "Uscita effettiva", "Stato",
    ]];
    filtrati.forEach((v) =>
      rows.push([
        v.cognome, v.nome, v.luogoNascita || "", fmtDataItaliana(v.dataNascita), v.telefono || "",
        v.beneficiLegge || "No", v.pastoRichiesto || "No", v.inizioTurno || fmtTime(v.oraIngresso),
        v.fineTurno || "", v.oraUscita ? fmtDate(v.oraUscita) + " " + fmtTime(v.oraUscita) : "", v.stato,
      ])
    );
    downloadCsv(`volontari_${new Date().toISOString().slice(0, 10)}.csv`, rows);
  }

  return (
    <div style={styles.card}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
        <h2 style={styles.cardTitle}>Volontari in campo</h2>
        <div style={{ display: "flex", gap: 8 }} className="no-print">
          <button style={styles.btnSecondary} onClick={exportCsv}>
            <Download size={14} style={{ marginRight: 6 }} /> CSV
          </button>
          <button style={styles.btnSecondary} onClick={() => window.print()}>
            <Printer size={14} style={{ marginRight: 6 }} /> Stampa
          </button>
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", margin: "14px 0" }} className="no-print">
        <div style={{ position: "relative" }}>
          <Search size={14} style={{ position: "absolute", left: 8, top: 10, opacity: 0.5 }} />
          <input style={{ ...styles.input, paddingLeft: 28, width: 200 }} placeholder="Cerca nominativo" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select style={styles.input} value={statoFiltro} onChange={(e) => setStatoFiltro(e.target.value)}>
          <option value="tutti">Tutti gli stati</option>
          <option value="in campo">In campo</option>
          <option value="rientrato">Rientrati</option>
        </select>
        <select style={styles.input} value={specializzazioneFiltro} onChange={(e) => setSpecializzazioneFiltro(e.target.value)}>
          <option value="tutte">Tutte le specializzazioni</option>
          {specializzazioniList.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <select style={styles.input} value={associazioneFiltro} onChange={(e) => setAssociazioneFiltro(e.target.value)}>
          <option value="tutte">Tutte le associazioni</option>
          {associazioniPresenti.map((a) => (
            <option key={a}>{a}</option>
          ))}
        </select>
        <input style={styles.input} type="date" value={dataFiltro} onChange={(e) => setDataFiltro(e.target.value)} />
        <select style={styles.input} value={turnoFiltro} onChange={(e) => setTurnoFiltro(e.target.value)}>
          <option value="tutti">Tutti i turni</option>
          {turniListEffettiva.map((t) => (
            <option key={t.id} value={t.id}>
              {t.nome} ({t.inizio}–{t.fine})
            </option>
          ))}
        </select>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Nominativo</th>
              <th style={styles.th}>Associazione</th>
              <th style={styles.th}>Specializzazione</th>
              <th style={styles.th}>Altra specializzazione</th>
              <th style={styles.th}>Caposquadra</th>
              <th style={styles.th}>Luogo attività</th>
              <th style={styles.th}>Telefono</th>
              <th style={styles.th}>Inizio turno</th>
              <th style={styles.th}>Fine turno</th>
              <th style={styles.th}>Durata</th>
              <th style={styles.th}>Stato</th>
              <th style={styles.th} className="no-print"></th>
            </tr>
          </thead>
          <tbody>
            {filtrati.length === 0 && (
              <tr>
                <td style={styles.td} colSpan={12}>
                  <span style={styles.emptyText}>Nessun risultato per i filtri selezionati.</span>
                </td>
              </tr>
            )}
            {filtrati.map((v) =>
              editingId === v.id ? (
                <tr key={v.id}>
                  <td style={styles.td} colSpan={12}>
                    <div style={{ display: "grid", gap: 8, padding: "8px 0" }}>
                      <div style={styles.grid2} className="grid2-force">
                        <input style={styles.input} value={editDraft.cognome} onChange={(e) => setEditDraft({ ...editDraft, cognome: e.target.value })} placeholder="Cognome" />
                        <input style={styles.input} value={editDraft.nome} onChange={(e) => setEditDraft({ ...editDraft, nome: e.target.value })} placeholder="Nome" />
                      </div>
                      <div style={styles.grid2} className="grid2-force">
                        <input style={styles.input} value={editDraft.luogoNascita || ""} onChange={(e) => setEditDraft({ ...editDraft, luogoNascita: e.target.value })} placeholder="Luogo di nascita" />
                        <input style={styles.input} type="date" value={editDraft.dataNascita || ""} onChange={(e) => setEditDraft({ ...editDraft, dataNascita: e.target.value })} placeholder="Data di nascita" />
                      </div>
                      <div style={styles.grid2} className="grid2-force">
                        <input style={styles.input} list="associazioni-list-admin" value={editDraft.associazione} onChange={(e) => setEditDraft({ ...editDraft, associazione: e.target.value })} placeholder="Associazione" />
                        <input style={styles.input} value={editDraft.codiceAssociazione || ""} onChange={(e) => setEditDraft({ ...editDraft, codiceAssociazione: e.target.value })} placeholder="Codice associazione" />
                      </div>
                      <div style={styles.grid2} className="grid2-force">
                        <select style={styles.input} value={editDraft.specializzazione} onChange={(e) => setEditDraft({ ...editDraft, specializzazione: e.target.value })}>
                          {specializzazioniList.map((s) => (
                            <option key={s}>{s}</option>
                          ))}
                        </select>
                        <select style={styles.input} value={editDraft.altraSpecializzazione || ""} onChange={(e) => setEditDraft({ ...editDraft, altraSpecializzazione: e.target.value })}>
                          <option value="">Altra specializzazione: nessuna</option>
                          {specializzazioniList.map((s) => (
                            <option key={s}>{s}</option>
                          ))}
                        </select>
                      </div>
                      <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                        <input
                          type="checkbox"
                          checked={!!editDraft.caposquadra}
                          onChange={(e) => setEditDraft({ ...editDraft, caposquadra: e.target.checked })}
                        />
                        Caposquadra
                      </label>
                      <div style={styles.grid2} className="grid2-force">
                        <input style={styles.input} value={editDraft.luogoAttivita} onChange={(e) => setEditDraft({ ...editDraft, luogoAttivita: e.target.value })} placeholder="Luogo attività" />
                        <input style={styles.input} value={editDraft.telefono} onChange={(e) => setEditDraft({ ...editDraft, telefono: e.target.value })} placeholder="Telefono" />
                      </div>
                      <div style={styles.grid2} className="grid2-force">
                        <div>
                          <label style={styles.label}>Data registrazione</label>
                          <input
                            style={styles.input}
                            type="date"
                            value={timestampADataInput(editDraft.oraIngresso)}
                            onChange={(e) => setEditDraft({ ...editDraft, oraIngresso: applicaDataATimestamp(editDraft.oraIngresso, e.target.value) })}
                          />
                        </div>
                        <div />
                      </div>
                      <div style={styles.grid2} className="grid2-force">
                        <select style={styles.input} value={editDraft.inizioTurno || ""} onChange={(e) => setEditDraft({ ...editDraft, inizioTurno: e.target.value })}>
                          <option value="">Inizio turno</option>
                          {inizioTurnoOptionsAdmin.map((o) => (
                            <option key={o}>{o}</option>
                          ))}
                        </select>
                        <select style={styles.input} value={editDraft.fineTurno || ""} onChange={(e) => setEditDraft({ ...editDraft, fineTurno: e.target.value })}>
                          <option value="">Fine turno</option>
                          {fineTurnoOptionsAdmin.map((o) => (
                            <option key={o}>{o}</option>
                          ))}
                        </select>
                      </div>
                      <div style={styles.grid2} className="grid2-force">
                        <div>
                          <label style={styles.label}>Richiesta benefici legge</label>
                          <select style={styles.input} value={editDraft.beneficiLegge || "No"} onChange={(e) => setEditDraft({ ...editDraft, beneficiLegge: e.target.value })}>
                            {SI_NO.map((s) => (
                              <option key={s}>{s}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label style={styles.label}>Richiesta pasto</label>
                          <select style={styles.input} value={editDraft.pastoRichiesto || "No"} onChange={(e) => setEditDraft({ ...editDraft, pastoRichiesto: e.target.value })}>
                            {SI_NO.map((s) => (
                              <option key={s}>{s}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      {editDraft.pastoRichiesto === "Sì" && (
                        <input
                          style={styles.input}
                          value={editDraft.allergie || ""}
                          onChange={(e) => setEditDraft({ ...editDraft, allergie: e.target.value })}
                          placeholder="Eventuali allergie o intolleranze alimentari"
                        />
                      )}
                      <div style={{ display: "flex", gap: 8 }}>
                        <button style={styles.btnPrimary} onClick={saveEdit}>
                          Salva
                        </button>
                        <button style={styles.btnSecondary} onClick={() => setEditingId(null)}>
                          Annulla
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                <tr key={v.id}>
                  <td style={styles.td}>
                    {v.cognome} {v.nome}
                  </td>
                  <td style={styles.td}>{v.associazione || ASSOCIAZIONE_DEFAULT}</td>
                  <td style={styles.td}>{v.specializzazione}</td>
                  <td style={styles.td}>{v.altraSpecializzazione || "—"}</td>
                  <td style={styles.td}>{v.caposquadra ? <span style={styles.pillOrange}>Caposquadra</span> : "—"}</td>
                  <td style={styles.td}>{v.luogoAttivita || "—"}</td>
                  <td style={styles.td}>{v.telefono || "—"}</td>
                  <td style={styles.td}>
                    {fmtDate(v.oraIngresso)} {v.inizioTurno || fmtTime(v.oraIngresso)}
                  </td>
                  <td style={styles.td}>
                    {v.oraUscita
                      ? `${fmtDate(v.oraUscita)} ${fmtTime(v.oraUscita)}`
                      : v.fineTurno
                      ? `previsto ${v.fineTurno}`
                      : "—"}
                  </td>
                  <td style={styles.td}>{fmtDuration(v.oraIngresso, v.oraUscita)}</td>
                  <td style={styles.td}>
                    <span style={v.stato === "in campo" ? styles.pillGreen : styles.pillRed}>{v.stato}</span>
                  </td>
                  <td style={styles.td} className="no-print">
                    {soloLettura ? (
                      <span style={{ fontSize: 12, color: "#999" }}>Sola lettura</span>
                    ) : (
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {v.stato === "in campo" ? (
                          <button style={styles.btnGhostRed} onClick={() => onScorpora(v.id)}>
                            Scorpora
                          </button>
                        ) : (
                          onRimettiInCampo && (
                            <button style={styles.btnPrimary} onClick={() => onRimettiInCampo(v.id)}>
                              Rimetti in campo
                            </button>
                          )
                        )}
                        <button style={styles.btnSecondary} onClick={() => startEdit(v)}>
                          Modifica
                        </button>
                        <button style={styles.btnGhostRed} onClick={() => window.confirm(`Eliminare ${v.nome} ${v.cognome}?`) && onDelete(v.id)}>
                          Elimina
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>
      <datalist id="associazioni-list-admin">
        {associazioni.map((a) => (
          <option key={a} value={a} />
        ))}
      </datalist>
    </div>
  );
}

// ================= ADMIN: MEZZI =================
function MezziTab({ mezzi, volontari, associazioni, tipiMezzoList, config, turniList, onUpdate, onDelete, onCheckout, onRimettiInCampo, soloLettura, turnoIniziale, dataIniziale }) {
  const [search, setSearch] = useState("");
  const [statoFiltro, setStatoFiltro] = useState("tutti");
  const [tipoFiltro, setTipoFiltro] = useState("tutti");
  const [associazioneFiltroMezzi, setAssociazioneFiltroMezzi] = useState("tutte");
  const [dataFiltro, setDataFiltro] = useState(dataIniziale || "");
  const [turnoFiltro, setTurnoFiltro] = useState(turnoIniziale || "tutti");
  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState({});
  const [checkingOutId, setCheckingOutId] = useState(null);
  const [kmFinaliDraft, setKmFinaliDraft] = useState("");
  const turniListEffettiva = dataFiltro && config ? turniPerGiorno(config, dataFiltro) : turniList;
  const inizioTurnoOptionsMezzi = Array.from(new Set(turniListEffettiva.map((t) => t.inizio))).sort();
  const fineTurnoOptionsMezzi = Array.from(new Set(turniListEffettiva.map((t) => t.fine))).sort();

  const associazioniPresentiMezzi = useMemo(
    () => Array.from(new Set(mezzi.map((m) => (m.associazione || ASSOCIAZIONE_DEFAULT).trim()))).sort(),
    [mezzi]
  );

  const filtrati = useMemo(() => {
    return mezzi.filter((m) => {
      if (statoFiltro !== "tutti" && m.stato !== statoFiltro) return false;
      if (tipoFiltro !== "tutti" && m.tipo !== tipoFiltro) return false;
      if (associazioneFiltroMezzi !== "tutte" && (m.associazione || ASSOCIAZIONE_DEFAULT).trim() !== associazioneFiltroMezzi) return false;
      if (search.trim() && !m.targa.toLowerCase().includes(search.trim().toLowerCase())) return false;
      if (dataFiltro) {
        const dataFiltroFmt = new Date(dataFiltro + "T00:00:00").toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit", year: "numeric" });
        if (fmtDate(m.oraIngresso) !== dataFiltroFmt) return false;
      }
      if (turnoFiltro !== "tutti") {
        const t = turniListEffettiva.find((x) => x.id === turnoFiltro);
        const turniGiornoRecord = m.oraIngresso && config ? turniPerGiorno(config, timestampADataInput(m.oraIngresso)) : turniListEffettiva;
        if (!t || !turnoCopertoDaRecord(m.inizioTurno, m.fineTurno, t, turniGiornoRecord)) return false;
      }
      return true;
    });
  }, [mezzi, statoFiltro, tipoFiltro, associazioneFiltroMezzi, search, dataFiltro, turnoFiltro, turniListEffettiva, volontari, config]);

  function referenteNome(id) {
    const v = volontari.find((x) => x.id === id);
    return v ? `${v.cognome} ${v.nome}` : "—";
  }
  function startEdit(m) {
    setEditingId(m.id);
    setEditDraft({ ...m });
  }
  function saveEdit() {
    onUpdate(editingId, editDraft);
    setEditingId(null);
  }
  function confermaRientro(id) {
    onCheckout(id, kmFinaliDraft);
    setCheckingOutId(null);
    setKmFinaliDraft("");
  }
  function prolungaMezzo(m) {
    const dataRec = m.oraIngresso ? timestampADataInput(m.oraIngresso) : "";
    const turniGiornoRecord = dataRec && config ? turniPerGiorno(config, dataRec) : turniListEffettiva;
    const prossimo = turnoSuccessivoPer(m.fineTurno, turniGiornoRecord);
    if (!prossimo) {
      window.alert("Non risulta un turno successivo configurato per questa data, oppure il mezzo è già nell'ultimo turno della giornata.");
      return;
    }
    if (
      !window.confirm(
        `Prolungare il mezzo ${m.targa} fino alla fine del turno "${prossimo.nome}" (${prossimo.inizio}–${prossimo.fine})? Il mezzo resterà un unico record (niente duplicazione) e comparirà come presente anche nei registri/filtri di questo nuovo turno.`
      )
    )
      return;
    onUpdate(m.id, { fineTurno: prossimo.fine });
  }

  function exportCsv() {
    const rows = [["Targa", "Tipo", "Alimentazione", "Associazione", "Codice associazione", "Km iniziali", "Km finali", "Buono benzina", "Referente", "Inizio turno", "Fine turno", "Ingresso", "Uscita", "Stato"]];
    filtrati.forEach((m) =>
      rows.push([
        m.targa, m.tipo, m.alimentazione || "", m.associazione || ASSOCIAZIONE_DEFAULT, m.codiceAssociazione || "", m.kmIniziali || "", m.kmFinali || "",
        m.buonoBenzina || "No", referenteNome(m.referenteVolontarioId), m.inizioTurno || "", m.fineTurno || "", fmtDate(m.oraIngresso) + " " + fmtTime(m.oraIngresso),
        m.oraUscita ? fmtDate(m.oraUscita) + " " + fmtTime(m.oraUscita) : "", m.stato,
      ])
    );
    downloadCsv(`mezzi_${new Date().toISOString().slice(0, 10)}.csv`, rows);
  }

  return (
    <div style={styles.card}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
        <h2 style={styles.cardTitle}>Mezzi in campo</h2>
        <div style={{ display: "flex", gap: 8 }} className="no-print">
          <button style={styles.btnSecondary} onClick={exportCsv}>
            <Download size={14} style={{ marginRight: 6 }} /> CSV
          </button>
          <button style={styles.btnSecondary} onClick={() => window.print()}>
            <Printer size={14} style={{ marginRight: 6 }} /> Stampa
          </button>
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", margin: "14px 0" }} className="no-print">
        <div style={{ position: "relative" }}>
          <Search size={14} style={{ position: "absolute", left: 8, top: 10, opacity: 0.5 }} />
          <input style={{ ...styles.input, paddingLeft: 28, width: 200 }} placeholder="Cerca targa" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select style={styles.input} value={statoFiltro} onChange={(e) => setStatoFiltro(e.target.value)}>
          <option value="tutti">Tutti gli stati</option>
          <option value="in servizio">In servizio</option>
          <option value="rientrato">Rientrati</option>
        </select>
        <select style={styles.input} value={tipoFiltro} onChange={(e) => setTipoFiltro(e.target.value)}>
          <option value="tutti">Tutti i tipi</option>
          {tipiMezzoList.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        {associazioniPresentiMezzi.length > 1 && (
          <select style={styles.input} value={associazioneFiltroMezzi} onChange={(e) => setAssociazioneFiltroMezzi(e.target.value)}>
            <option value="tutte">Tutte le associazioni</option>
            {associazioniPresentiMezzi.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        )}
        <input style={styles.input} type="date" value={dataFiltro} onChange={(e) => setDataFiltro(e.target.value)} />
        <select style={styles.input} value={turnoFiltro} onChange={(e) => setTurnoFiltro(e.target.value)}>
          <option value="tutti">Tutti i turni</option>
          {turniListEffettiva.map((t) => (
            <option key={t.id} value={t.id}>
              {t.nome} ({t.inizio}–{t.fine})
            </option>
          ))}
        </select>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Targa</th>
              <th style={styles.th}>Tipo</th>
              <th style={styles.th}>Alimentazione</th>
              <th style={styles.th}>Associazione</th>
              <th style={styles.th}>Km iniziali</th>
              <th style={styles.th}>Km finali</th>
              <th style={styles.th}>Referente</th>
              <th style={styles.th}>Turno</th>
              <th style={styles.th}>Ingresso</th>
              <th style={styles.th}>Uscita</th>
              <th style={styles.th}>Stato</th>
              <th style={styles.th} className="no-print"></th>
            </tr>
          </thead>
          <tbody>
            {filtrati.length === 0 && (
              <tr>
                <td style={styles.td} colSpan={12}>
                  <span style={styles.emptyText}>Nessun risultato per i filtri selezionati.</span>
                </td>
              </tr>
            )}
            {filtrati.map((m) =>
              editingId === m.id ? (
                <tr key={m.id}>
                  <td style={styles.td} colSpan={12}>
                    <div style={{ display: "grid", gap: 8, padding: "8px 0" }}>
                      <div style={styles.grid2} className="grid2-force">
                        <input style={styles.input} value={editDraft.targa} onChange={(e) => setEditDraft({ ...editDraft, targa: e.target.value })} placeholder="Targa" />
                        <select style={styles.input} value={editDraft.tipo} onChange={(e) => setEditDraft({ ...editDraft, tipo: e.target.value })}>
                          {tipiMezzoList.map((t) => (
                            <option key={t}>{t}</option>
                          ))}
                        </select>
                      </div>
                      <select style={styles.input} value={editDraft.alimentazione || ""} onChange={(e) => setEditDraft({ ...editDraft, alimentazione: e.target.value })}>
                        {TIPI_ALIMENTAZIONE.map((a) => (
                          <option key={a}>{a}</option>
                        ))}
                      </select>
                      <div style={styles.grid2} className="grid2-force">
                        <input style={styles.input} list="associazioni-list-admin2" value={editDraft.associazione} onChange={(e) => setEditDraft({ ...editDraft, associazione: e.target.value })} placeholder="Associazione" />
                        <input style={styles.input} value={editDraft.codiceAssociazione || ""} onChange={(e) => setEditDraft({ ...editDraft, codiceAssociazione: e.target.value })} placeholder="Codice associazione" />
                      </div>
                      <div style={styles.grid2} className="grid2-force">
                        <input style={styles.input} type="number" value={editDraft.kmIniziali} onChange={(e) => setEditDraft({ ...editDraft, kmIniziali: e.target.value })} placeholder="Km iniziali" />
                        <input style={styles.input} type="number" value={editDraft.kmFinali || ""} onChange={(e) => setEditDraft({ ...editDraft, kmFinali: e.target.value })} placeholder="Km finali" />
                      </div>
                      <div>
                        <label style={styles.label}>Richiesta buono benzina</label>
                        <select style={styles.input} value={editDraft.buonoBenzina || "No"} onChange={(e) => setEditDraft({ ...editDraft, buonoBenzina: e.target.value })}>
                          {SI_NO.map((s) => (
                            <option key={s}>{s}</option>
                          ))}
                        </select>
                      </div>
                      <div style={styles.grid2} className="grid2-force">
                        <div>
                          <label style={styles.label}>Data registrazione</label>
                          <input
                            style={styles.input}
                            type="date"
                            value={timestampADataInput(editDraft.oraIngresso)}
                            onChange={(e) => setEditDraft({ ...editDraft, oraIngresso: applicaDataATimestamp(editDraft.oraIngresso, e.target.value) })}
                          />
                        </div>
                        <div />
                      </div>
                      <div style={styles.grid2} className="grid2-force">
                        <select style={styles.input} value={editDraft.inizioTurno || ""} onChange={(e) => setEditDraft({ ...editDraft, inizioTurno: e.target.value })}>
                          <option value="">Inizio turno</option>
                          {inizioTurnoOptionsMezzi.map((o) => (
                            <option key={o}>{o}</option>
                          ))}
                        </select>
                        <select style={styles.input} value={editDraft.fineTurno || ""} onChange={(e) => setEditDraft({ ...editDraft, fineTurno: e.target.value })}>
                          <option value="">Fine turno</option>
                          {fineTurnoOptionsMezzi.map((o) => (
                            <option key={o}>{o}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label style={styles.label}>Referente mezzo</label>
                        <select
                          style={styles.input}
                          value={editDraft.referenteVolontarioId || ""}
                          onChange={(e) => setEditDraft({ ...editDraft, referenteVolontarioId: e.target.value })}
                        >
                          <option value="">Nessuno</option>
                          {volontari.map((v) => (
                            <option key={v.id} value={v.id}>
                              {v.cognome} {v.nome}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button style={styles.btnPrimary} onClick={saveEdit}>
                          Salva
                        </button>
                        <button style={styles.btnSecondary} onClick={() => setEditingId(null)}>
                          Annulla
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                <tr key={m.id}>
                  <td style={styles.td}>{m.targa}</td>
                  <td style={styles.td}>{m.tipo}</td>
                  <td style={styles.td}>{m.alimentazione || "—"}</td>
                  <td style={styles.td}>{m.associazione || ASSOCIAZIONE_DEFAULT}</td>
                  <td style={styles.td}>{m.kmIniziali || "—"}</td>
                  <td style={styles.td}>{m.kmFinali || "—"}</td>
                  <td style={styles.td}>{referenteNome(m.referenteVolontarioId)}</td>
                  <td style={styles.td}>{m.inizioTurno && m.fineTurno ? `${m.inizioTurno}–${m.fineTurno}` : "—"}</td>
                  <td style={styles.td}>
                    {fmtDate(m.oraIngresso)} {fmtTime(m.oraIngresso)}
                  </td>
                  <td style={styles.td}>{m.oraUscita ? `${fmtDate(m.oraUscita)} ${fmtTime(m.oraUscita)}` : "—"}</td>
                  <td style={styles.td}>
                    <span style={m.stato === "in servizio" ? styles.pillGreen : styles.pillRed}>{m.stato}</span>
                  </td>
                  <td style={styles.td} className="no-print">
                    {soloLettura ? (
                      <span style={{ fontSize: 12, color: "#999" }}>Sola lettura</span>
                    ) : checkingOutId === m.id ? (
                      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        <input
                          style={{ ...styles.input, width: 100 }}
                          type="number"
                          placeholder="Km finali"
                          value={kmFinaliDraft}
                          onChange={(e) => setKmFinaliDraft(e.target.value)}
                          autoFocus
                        />
                        <button style={styles.btnPrimary} onClick={() => confermaRientro(m.id)}>
                          Conferma
                        </button>
                        <button style={styles.btnSecondary} onClick={() => setCheckingOutId(null)}>
                          Annulla
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {m.stato === "in servizio" ? (
                          <>
                            <button
                              style={styles.btnGhostRed}
                              onClick={() => {
                                setCheckingOutId(m.id);
                                setKmFinaliDraft("");
                              }}
                            >
                              Rientra
                            </button>
                            <button style={styles.btnSecondary} onClick={() => prolungaMezzo(m)}>
                              Prolunga al turno successivo
                            </button>
                          </>
                        ) : (
                          onRimettiInCampo && (
                            <button style={styles.btnPrimary} onClick={() => onRimettiInCampo(m.id)}>
                              Rimetti in campo
                            </button>
                          )
                        )}
                        <button style={styles.btnSecondary} onClick={() => startEdit(m)}>
                          Modifica
                        </button>
                        <button style={styles.btnGhostRed} onClick={() => window.confirm(`Eliminare il mezzo ${m.targa}?`) && onDelete(m.id)}>
                          Elimina
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>
      <datalist id="associazioni-list-admin2">
        {associazioni.map((a) => (
          <option key={a} value={a} />
        ))}
      </datalist>
    </div>
  );
}

// ================= ADMIN: IMPOSTAZIONI =================
function ImpostazioniTab({ soloLettura, config, onAddTurnoGiorno, onRemoveTurnoGiorno, onSvuotaTurniGiorno, onModificaTurnoGiorno, onSpostaTurnoGiorno }) {
  const [dataSelezionata, setDataSelezionata] = useState(() => new Date().toISOString().slice(0, 10));
  const [nuovoTurnoGiorno, setNuovoTurnoGiorno] = useState({ nome: "", inizio: "", fine: "" });
  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState({ nome: "", inizio: "", fine: "" });

  const turniGiornoSelezionato = turniPerGiorno(config, dataSelezionata);

  function iniziaModifica(t) {
    setEditingId(t.id);
    setEditDraft({ nome: t.nome, inizio: t.inizio, fine: t.fine });
  }
  function salvaModifica(id) {
    onModificaTurnoGiorno(dataSelezionata, id, editDraft);
    setEditingId(null);
  }

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <div style={styles.card}>
        <h2 style={styles.cardTitle}>Turni di servizio per giornata</h2>
        <p style={{ fontSize: 13, color: "#666", marginBottom: 12 }}>
          Ogni giornata dell'evento ha i propri turni, indipendenti dalle altre: seleziona una data e definisci gli
          orari validi solo per quel giorno. Puoi modificarli e riordinarli in qualsiasi momento.
        </p>
        <div style={{ marginBottom: 14 }}>
          <label style={styles.label}>Giornata</label>
          <input
            type="date"
            style={{ ...styles.input, width: 180 }}
            value={dataSelezionata}
            onChange={(e) => setDataSelezionata(e.target.value)}
          />
        </div>
        <div style={{ display: "grid", gap: 8, marginBottom: 12 }}>
          {turniGiornoSelezionato.length === 0 && (
            <div style={styles.emptyText}>Nessun turno impostato per questa giornata.</div>
          )}
          {turniGiornoSelezionato.map((t, idx) =>
            editingId === t.id ? (
              <div key={t.id} style={{ ...styles.rowItem, flexDirection: "column", alignItems: "stretch", gap: 8 }}>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <input
                    style={{ ...styles.input, width: 180 }}
                    value={editDraft.nome}
                    onChange={(e) => setEditDraft({ ...editDraft, nome: e.target.value })}
                    placeholder="Nome turno"
                  />
                  <input
                    style={{ ...styles.input, width: 110 }}
                    type="time"
                    value={editDraft.inizio}
                    onChange={(e) => setEditDraft({ ...editDraft, inizio: e.target.value })}
                  />
                  <input
                    style={{ ...styles.input, width: 110 }}
                    type="time"
                    value={editDraft.fine}
                    onChange={(e) => setEditDraft({ ...editDraft, fine: e.target.value })}
                  />
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button style={styles.btnPrimary} onClick={() => salvaModifica(t.id)}>
                    Salva
                  </button>
                  <button style={styles.btnSecondary} onClick={() => setEditingId(null)}>
                    Annulla
                  </button>
                </div>
              </div>
            ) : (
              <div key={t.id} style={styles.rowItem}>
                <div>
                  <div style={styles.rowTitle}>{t.nome}</div>
                  <div style={styles.rowMeta}>
                    {t.inizio} – {t.fine}
                  </div>
                </div>
                {!soloLettura && (
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <button
                      style={styles.btnSecondary}
                      onClick={() => onSpostaTurnoGiorno(dataSelezionata, t.id, -1)}
                      disabled={idx === 0}
                      title="Sposta su"
                    >
                      ↑
                    </button>
                    <button
                      style={styles.btnSecondary}
                      onClick={() => onSpostaTurnoGiorno(dataSelezionata, t.id, 1)}
                      disabled={idx === turniGiornoSelezionato.length - 1}
                      title="Sposta giù"
                    >
                      ↓
                    </button>
                    <button style={styles.btnSecondary} onClick={() => iniziaModifica(t)}>
                      Modifica
                    </button>
                    <button style={styles.btnGhostRed} onClick={() => onRemoveTurnoGiorno(dataSelezionata, t.id)}>
                      Rimuovi
                    </button>
                  </div>
                )}
              </div>
            )
          )}
        </div>
        {!soloLettura && (
          <>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-end", marginBottom: 10 }}>
              <div>
                <label style={styles.label}>Nome turno</label>
                <input
                  style={{ ...styles.input, width: 180 }}
                  placeholder="Es. Turno Mattina"
                  value={nuovoTurnoGiorno.nome}
                  onChange={(e) => setNuovoTurnoGiorno({ ...nuovoTurnoGiorno, nome: e.target.value })}
                />
              </div>
              <div>
                <label style={styles.label}>Inizio</label>
                <input
                  style={{ ...styles.input, width: 110 }}
                  type="time"
                  value={nuovoTurnoGiorno.inizio}
                  onChange={(e) => setNuovoTurnoGiorno({ ...nuovoTurnoGiorno, inizio: e.target.value })}
                />
              </div>
              <div>
                <label style={styles.label}>Fine</label>
                <input
                  style={{ ...styles.input, width: 110 }}
                  type="time"
                  value={nuovoTurnoGiorno.fine}
                  onChange={(e) => setNuovoTurnoGiorno({ ...nuovoTurnoGiorno, fine: e.target.value })}
                />
              </div>
              <button
                style={styles.btnSecondary}
                onClick={() => {
                  onAddTurnoGiorno(dataSelezionata, nuovoTurnoGiorno);
                  setNuovoTurnoGiorno({ nome: "", inizio: "", fine: "" });
                }}
              >
                <Plus size={14} style={{ marginRight: 6 }} /> Aggiungi turno per questa giornata
              </button>
            </div>
            {turniGiornoSelezionato.length > 0 && (
              <button style={styles.btnGhostRed} onClick={() => onSvuotaTurniGiorno(dataSelezionata)}>
                Svuota tutti i turni di questa giornata
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ================= ADMIN: GESTIONE SQUADRE =================
// ================= ADMIN: RIEPILOGO SQUADRE (LIVE) =================
// ================= ADMIN: REGISTRO COMUNICAZIONI RADIO =================
const PRIORITA_RADIO = ["Soccorso", "Urgente", "Normale"];
function pillPriorita(p) {
  if (p === "Soccorso") return { background: "#FBDCD6", color: "var(--red)" };
  if (p === "Urgente") return { background: "#FDE9DF", color: "var(--orange)" };
  return { background: "#E1EFE3", color: "var(--green)" };
}

function RegistroRadioTab({ registro, squadre, onAggiungi, onAggiorna, onElimina, eventoNome, nomeUtenteLoggato, soloLettura, ruoloAccesso }) {
  const identificativi = useMemo(() => {
    const set = new Set(["C.O."]);
    squadre.forEach((s) => {
      if (s.codiceRadio && s.codiceRadio.trim()) set.add(s.codiceRadio.trim());
    });
    return Array.from(set);
  }, [squadre]);

  const emptyForm = { da: "C.O.", a: identificativi[1] || "C.O.", messaggio: "", priorita: "Normale", note: "" };
  const [form, setForm] = useState(emptyForm);

  function escapeHtml(s) {
    return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  function submit(e) {
    e.preventDefault();
    if (!form.messaggio.trim()) return;
    onAggiungi({ ...form, registratoDa: nomeUtenteLoggato || "" });
    setForm({ ...form, messaggio: "", note: "" });
  }

  const registroOrdinato = [...registro].sort((a, b) => a.numero - b.numero);

  function stampaRegistro() {
    const righe = registroOrdinato
      .map(
        (m) => `<tr>
        <td>${m.numero}</td><td>${escapeHtml(fmtTime(m.timestamp))}</td><td>${escapeHtml(fmtDate(m.timestamp))}</td>
        <td>${escapeHtml(m.da)}</td><td>${escapeHtml(m.a)}</td><td>${escapeHtml(m.messaggio)}</td>
        <td>${escapeHtml(m.priorita)}</td><td>${escapeHtml(m.note)}</td>
      </tr>`
      )
      .join("");
    const html = `<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="utf-8" />
<title>Registro comunicazioni - ${escapeHtml(eventoNome || "")}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; color: #000; margin: 0; padding: 20px 24px; }
  h1 { font-size: 15px; margin: 0 0 4px; }
  .sub { font-size: 11px; color: #444; margin-bottom: 16px; }
  table { width: 100%; border-collapse: collapse; font-size: 9pt; }
  th, td { border: 1px solid #000; padding: 4px 6px; text-align: left; vertical-align: top; }
  th { background: #EFEBE1; font-size: 8pt; text-transform: uppercase; }
  td:first-child, th:first-child { width: 30px; text-align: center; }
</style>
</head>
<body>
  <h1>Registro comunicazioni radio</h1>
  <div class="sub">${escapeHtml(eventoNome || "")} — stampato il ${escapeHtml(new Date().toLocaleString("it-IT"))}</div>
  <table>
    <thead><tr><th>N°</th><th>Ora</th><th>Data</th><th>Da</th><th>A</th><th>Messaggio</th><th>Priorità</th><th>Note/Azioni</th></tr></thead>
    <tbody>${righe || '<tr><td colspan="8">&nbsp;</td></tr>'}</tbody>
  </table>
  <script>window.onload = function(){ setTimeout(function(){ window.print(); }, 250); };</script>
</body>
</html>`;
    const win = window.open("", "_blank", "width=1100,height=800");
    if (!win) {
      window.alert("Il browser ha bloccato l'apertura della finestra. Consenti i popup per questo sito e riprova.");
      return;
    }
    win.document.open();
    win.document.write(html);
    win.document.close();
    win.focus();
  }

  return (
    <div style={{ display: "grid", gap: 20 }}>
      {!soloLettura && (
        <div style={styles.card}>
        <h2 style={styles.cardTitle}>Nuovo messaggio</h2>
        <form onSubmit={submit} style={{ display: "grid", gap: 10 }}>
          <div style={styles.grid2} className="grid2-force">
            <div>
              <label style={styles.label}>Da</label>
              <select style={styles.input} value={form.da} onChange={(e) => setForm({ ...form, da: e.target.value })}>
                {identificativi.map((id) => (
                  <option key={id}>{id}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={styles.label}>A</label>
              <select style={styles.input} value={form.a} onChange={(e) => setForm({ ...form, a: e.target.value })}>
                {identificativi.map((id) => (
                  <option key={id}>{id}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label style={styles.label}>Messaggio</label>
            <textarea
              style={{ ...styles.input, minHeight: 90, resize: "vertical", fontFamily: "inherit" }}
              value={form.messaggio}
              onChange={(e) => setForm({ ...form, messaggio: e.target.value })}
              placeholder="Richiesta, coordinate, dati operativi..."
            />
          </div>
          <div style={styles.grid2} className="grid2-force">
            <div>
              <label style={styles.label}>Priorità</label>
              <select style={styles.input} value={form.priorita} onChange={(e) => setForm({ ...form, priorita: e.target.value })}>
                {PRIORITA_RADIO.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={styles.label}>Note / Azioni (opzionale)</label>
              <input
                style={styles.input}
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                placeholder='Es. "Inoltrato a VF", "Mezzo partito"'
              />
            </div>
          </div>
          <button type="submit" style={styles.btnPrimary}>
            <Plus size={16} style={{ marginRight: 6 }} /> Registra messaggio
          </button>
        </form>
        </div>
      )}

      <div style={styles.card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
          <h2 style={styles.cardTitle}>Registro comunicazioni ({registroOrdinato.length})</h2>
          <button style={styles.btnSecondary} onClick={stampaRegistro}>
            <Printer size={14} style={{ marginRight: 6 }} /> Stampa PDF
          </button>
        </div>
        <div style={{ overflowX: "auto", marginTop: 14 }}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>N°</th>
                <th style={styles.th}>Ora</th>
                <th style={styles.th}>Data</th>
                <th style={styles.th}>Da</th>
                <th style={styles.th}>A</th>
                <th style={styles.th}>Messaggio</th>
                <th style={styles.th}>Priorità</th>
                <th style={styles.th}>Note / Azioni</th>
                <th style={styles.th}>Registrato da</th>
                <th style={styles.th} className="no-print"></th>
              </tr>
            </thead>
            <tbody>
              {registroOrdinato.length === 0 && (
                <tr>
                  <td style={styles.td} colSpan={10}>
                    <span style={styles.emptyText}>Nessun messaggio registrato.</span>
                  </td>
                </tr>
              )}
              {registroOrdinato.map((m) => (
                <tr key={m.id}>
                  <td style={styles.td}>{m.numero}</td>
                  <td style={styles.td}>{fmtTime(m.timestamp)} (locale)</td>
                  <td style={styles.td}>{fmtDate(m.timestamp)}</td>
                  <td style={styles.td}>{m.da}</td>
                  <td style={styles.td}>{m.a}</td>
                  <td style={{ ...styles.td, maxWidth: 260, whiteSpace: "pre-wrap" }}>{m.messaggio}</td>
                  <td style={styles.td}>
                    <span style={{ ...styles.pillGreen, ...pillPriorita(m.priorita) }}>{m.priorita}</span>
                  </td>
                  <td style={styles.td}>
                    {soloLettura ? (
                      m.note || "—"
                    ) : (
                      <input
                        style={{ ...styles.input, minWidth: 160 }}
                        defaultValue={m.note}
                        onBlur={(e) => {
                          if (e.target.value !== m.note) onAggiorna(m.id, { note: e.target.value });
                        }}
                        placeholder="Nessuna"
                      />
                    )}
                  </td>
                  <td style={styles.td}>{m.registratoDa || "—"}</td>
                  <td style={styles.td} className="no-print">
                    {!soloLettura && ruoloAccesso === "admin" && (
                      <button style={styles.btnGhostRed} onClick={() => window.confirm("Eliminare questo messaggio dal registro?") && onElimina(m.id)}>
                        Elimina
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SquadreRiepilogoLive({ squadre, volontari, mezzi, turniList, onTermina, onAggiorna }) {
  const [terminandoId, setTerminandoId] = useState(null);
  const [kmFinaliTermina, setKmFinaliTermina] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState(null);
  const [filtroAssocEditLive, setFiltroAssocEditLive] = useState("");
  const [dettagliId, setDettagliId] = useState(null);

  function nomeVolontario(id) {
    const v = volontari.find((x) => x.id === id);
    return v ? `${v.cognome} ${v.nome}` : "—";
  }
  function associazioneVolontario(id) {
    const v = volontari.find((x) => x.id === id);
    return v ? v.associazione || ASSOCIAZIONE_DEFAULT : "—";
  }
  function labelMezzo(id) {
    const m = mezzi.find((x) => x.id === id);
    return m ? `${m.targa} (${m.tipo})` : "";
  }
  function mezzoById(id) {
    return mezzi.find((x) => x.id === id);
  }
  function mezziDellaSquadra(s) {
    return [s.mezzoId, ...(s.mezziExtraIds || [])].filter(Boolean);
  }
  function labelTurno(id) {
    const t = turniList.find((x) => x.id === id);
    return t ? `${t.nome} (${t.inizio}–${t.fine})` : "Turno non specificato";
  }
  function avviaTermina(s, conMezzo) {
    if (conMezzo && mezziDellaSquadra(s).length) {
      setTerminandoId(s.id);
      setKmFinaliTermina({});
    } else {
      onTermina(s.id);
    }
  }
  function confermaTermina(id) {
    onTermina(id, kmFinaliTermina);
    setTerminandoId(null);
    setKmFinaliTermina({});
  }

  // volontari/mezzi già assegnati a un'altra squadra ATTIVA, esclusa quella in modifica
  const volontariAssegnatiAltrove = useMemo(() => {
    const set = new Set();
    (squadre || []).forEach((s) => {
      if (editingId && s.id === editingId) return;
      if (s.terminata) return;
      (s.volontariIds || []).forEach((id) => set.add(id));
    });
    return set;
  }, [squadre, editingId]);
  const mezziAssegnatiAltrove = useMemo(() => {
    const set = new Set();
    (squadre || []).forEach((s) => {
      if (editingId && s.id === editingId) return;
      if (s.terminata) return;
      if (s.mezzoId) set.add(s.mezzoId);
      (s.mezziExtraIds || []).forEach((id) => set.add(id));
    });
    return set;
  }, [squadre, editingId]);
  const volontariDisponibiliEdit = volontari.filter((v) => !volontariAssegnatiAltrove.has(v.id));
  const mezziDisponibiliEdit = mezzi.filter((m) => !mezziAssegnatiAltrove.has(m.id));
  const associazioniVolontariEdit = Array.from(new Set(volontariDisponibiliEdit.map((v) => v.associazione || ASSOCIAZIONE_DEFAULT))).sort();
  const volontariDisponibiliEditFiltrati = filtroAssocEditLive
    ? volontariDisponibiliEdit.filter((v) => (v.associazione || ASSOCIAZIONE_DEFAULT) === filtroAssocEditLive)
    : volontariDisponibiliEdit;

  function startEdit(s) {
    setEditingId(s.id);
    setEditDraft({ mezziExtraIds: [], ...s });
    setFiltroAssocEditLive("");
    setDettagliId(null);
  }
  function toggleVolontarioEdit(id) {
    const ids = editDraft.volontariIds.includes(id) ? editDraft.volontariIds.filter((x) => x !== id) : [...editDraft.volontariIds, id];
    setEditDraft({ ...editDraft, volontariIds: ids });
  }
  function salvaEditLive() {
    onAggiorna(editingId, editDraft);
    setEditingId(null);
    setEditDraft(null);
  }

  const squadreAttive = squadre.filter((s) => !s.terminata);
  const squadreTerminate = squadre.filter((s) => s.terminata).sort((a, b) => (b.terminataAt || 0) - (a.terminataAt || 0));

  return (
    <div style={styles.card}>
      <h2 style={styles.cardTitle}>Squadre attive — quadro in tempo reale</h2>
      {squadreAttive.length === 0 && <div style={styles.emptyText}>Nessuna squadra attiva per questo evento.</div>}
      <div style={{ display: "grid", gap: 22 }}>
        {TIPI_SQUADRA.map((meta) => {
          const gruppo = squadreAttive.filter((s) => s.tipo === meta.id).sort((a, b) => b.createdAt - a.createdAt);
          if (squadreAttive.length > 0 && gruppo.length === 0) return null;
          return (
            <div key={meta.id}>
              <div style={styles.squadreBlockTitle}>
                {meta.label} <span style={{ fontWeight: 400, color: "#999" }}>({gruppo.length})</span>
              </div>
              {gruppo.length === 0 ? (
                <div style={styles.emptyText}>Nessuna squadra di questo tipo.</div>
              ) : (
                <div style={{ display: "grid", gap: 10 }}>
                  {gruppo.map((s) => (
                    <div key={s.id} style={styles.squadraRiepilogoCard}>
                      {editingId === s.id ? (
                        <div style={{ display: "grid", gap: 8 }}>
                          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                            <input
                              style={{ ...styles.input, maxWidth: 220 }}
                              value={editDraft.nome}
                              onChange={(e) => setEditDraft({ ...editDraft, nome: e.target.value })}
                              placeholder="Nome squadra"
                            />
                            <input
                              style={{ ...styles.input, maxWidth: 160 }}
                              value={editDraft.codiceRadio || ""}
                              onChange={(e) => setEditDraft({ ...editDraft, codiceRadio: e.target.value })}
                              placeholder="Codice radio"
                            />
                            <select style={{ ...styles.input, maxWidth: 220 }} value={editDraft.turnoId} onChange={(e) => setEditDraft({ ...editDraft, turnoId: e.target.value })}>
                              {turniList.map((t) => (
                                <option key={t.id} value={t.id}>
                                  {t.nome} ({t.inizio}–{t.fine})
                                </option>
                              ))}
                            </select>
                          </div>
                          {meta.conMezzo && (
                            <div>
                              <label style={styles.label}>{meta.id === "logistiche-tecniche" ? "Mezzo 1" : "Mezzo di riferimento"}</label>
                              <select style={styles.input} value={editDraft.mezzoId || ""} onChange={(e) => setEditDraft({ ...editDraft, mezzoId: e.target.value })}>
                                <option value="">Nessuno</option>
                                {mezziDisponibiliEdit
                                  .filter((m) => !(editDraft.mezziExtraIds || []).includes(m.id))
                                  .map((m) => (
                                    <option key={m.id} value={m.id}>
                                      {m.targa} ({m.tipo})
                                    </option>
                                  ))}
                              </select>
                            </div>
                          )}
                          {meta.conMezzo &&
                            meta.id === "logistiche-tecniche" &&
                            [0, 1, 2].map((i) => (
                              <div key={i}>
                                <label style={styles.label}>Mezzo {i + 2} (facoltativo)</label>
                                <select
                                  style={styles.input}
                                  value={(editDraft.mezziExtraIds || [])[i] || ""}
                                  onChange={(e) => {
                                    const next = [...(editDraft.mezziExtraIds || [])];
                                    next[i] = e.target.value;
                                    setEditDraft({ ...editDraft, mezziExtraIds: next });
                                  }}
                                >
                                  <option value="">Nessuno</option>
                                  {mezziDisponibiliEdit
                                    .filter((m) => m.id !== editDraft.mezzoId)
                                    .filter((m) => m.id === (editDraft.mezziExtraIds || [])[i] || !(editDraft.mezziExtraIds || []).includes(m.id))
                                    .map((m) => (
                                      <option key={m.id} value={m.id}>
                                        {m.targa} ({m.tipo})
                                      </option>
                                    ))}
                                </select>
                              </div>
                            ))}
                          <div>
                            <label style={styles.label}>Volontari</label>
                            {associazioniVolontariEdit.length > 1 && (
                              <select
                                style={{ ...styles.input, marginBottom: 8 }}
                                value={filtroAssocEditLive}
                                onChange={(e) => setFiltroAssocEditLive(e.target.value)}
                              >
                                <option value="">Tutte le associazioni</option>
                                {associazioniVolontariEdit.map((a) => (
                                  <option key={a} value={a}>
                                    {a}
                                  </option>
                                ))}
                              </select>
                            )}
                            <div style={{ display: "grid", gap: 6, maxHeight: 200, overflowY: "auto", border: "1px solid var(--line)", borderRadius: 8, padding: 8 }}>
                              {volontariDisponibiliEditFiltrati.map((v) => (
                                <label key={v.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                                  <input type="checkbox" checked={editDraft.volontariIds.includes(v.id)} onChange={() => toggleVolontarioEdit(v.id)} />
                                  {v.cognome} {v.nome} <span style={{ color: "#999" }}>{v.associazione ? `· ${v.associazione}` : ""}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                          <div style={{ display: "flex", gap: 8 }}>
                            <button style={styles.btnPrimary} onClick={salvaEditLive}>
                              Salva
                            </button>
                            <button style={styles.btnSecondary} onClick={() => { setEditingId(null); setEditDraft(null); }}>
                              Annulla
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 }}>
                            <div>
                              <div style={styles.rowTitle}>{s.nome}</div>
                              <div style={styles.rowMeta}>
                                {labelTurno(s.turnoId)}
                                {s.codiceRadio ? ` · Radio: ${s.codiceRadio}` : ""}
                                {meta.conMezzo && mezziDellaSquadra(s).length ? ` · Mezz${mezziDellaSquadra(s).length > 1 ? "i" : "o"}: ${mezziDellaSquadra(s).map(labelMezzo).join(", ")}` : ""}
                              </div>
                            </div>
                            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, color: "#888" }}>
                              {s.volontariIds.length} {s.volontariIds.length === 1 ? "componente" : "componenti"}
                            </div>
                          </div>
                          <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
                            {s.volontariIds.length === 0 ? (
                              <span style={styles.emptyText}>Nessun volontario assegnato</span>
                            ) : (
                              s.volontariIds.map((vid) => (
                                <span key={vid} style={styles.chip}>
                                  {nomeVolontario(vid)}
                                </span>
                              ))
                            )}
                          </div>
                          {dettagliId === s.id && (
                            <div style={{ marginTop: 10, padding: 10, background: "var(--bg-soft, #F7F5F0)", borderRadius: 8, fontSize: 13 }}>
                              <div style={{ fontWeight: 600, marginBottom: 6 }}>Dettagli associazioni</div>
                              {meta.conMezzo && (
                                <div style={{ marginBottom: 6 }}>
                                  <div style={{ color: "#888", fontSize: 12 }}>Mezzi</div>
                                  {mezziDellaSquadra(s).length === 0 ? (
                                    <div style={styles.emptyText}>Nessun mezzo assegnato</div>
                                  ) : (
                                    mezziDellaSquadra(s).map((mid) => {
                                      const m = mezzoById(mid);
                                      return (
                                        <div key={mid}>
                                          {m ? `${m.targa} (${m.tipo})` : "—"} — <i>{m ? m.associazione || ASSOCIAZIONE_DEFAULT : "—"}</i>
                                        </div>
                                      );
                                    })
                                  )}
                                </div>
                              )}
                              <div>
                                <div style={{ color: "#888", fontSize: 12 }}>Volontari</div>
                                {s.volontariIds.length === 0 ? (
                                  <div style={styles.emptyText}>Nessun volontario assegnato</div>
                                ) : (
                                  s.volontariIds.map((vid) => (
                                    <div key={vid}>
                                      {nomeVolontario(vid)} — <i>{associazioneVolontario(vid)}</i>
                                    </div>
                                  ))
                                )}
                              </div>
                            </div>
                          )}
                          <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }} className="no-print">
                            <button style={styles.btnSecondary} onClick={() => setDettagliId(dettagliId === s.id ? null : s.id)}>
                              {dettagliId === s.id ? "Nascondi dettagli" : "Dettagli"}
                            </button>
                            {onAggiorna && (
                              <button style={styles.btnSecondary} onClick={() => startEdit(s)}>
                                Modifica
                              </button>
                            )}
                            {onTermina &&
                              (terminandoId === s.id ? (
                                <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                                  {mezziDellaSquadra(s).map((mid) => (
                                    <input
                                      key={mid}
                                      style={{ ...styles.input, width: 150 }}
                                      type="number"
                                      placeholder={`Km finali ${labelMezzo(mid)}`}
                                      value={kmFinaliTermina[mid] || ""}
                                      onChange={(e) => setKmFinaliTermina((prev) => ({ ...prev, [mid]: e.target.value }))}
                                      autoFocus={mid === mezziDellaSquadra(s)[0]}
                                    />
                                  ))}
                                  <button style={styles.btnPrimary} onClick={() => confermaTermina(s.id)}>
                                    Conferma
                                  </button>
                                  <button style={styles.btnSecondary} onClick={() => setTerminandoId(null)}>
                                    Annulla
                                  </button>
                                </div>
                              ) : (
                                <button style={styles.btnGhostRed} onClick={() => avviaTermina(s, meta.conMezzo)}>
                                  Termina operatività
                                </button>
                              ))}
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {squadreTerminate.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <div style={styles.squadreBlockTitle}>
            <Archive size={16} style={{ marginRight: 6, verticalAlign: -3 }} /> Squadre terminate ({squadreTerminate.length})
          </div>
          <div style={{ display: "grid", gap: 10 }}>
            {squadreTerminate.map((s) => {
              const meta = TIPI_SQUADRA.find((t) => t.id === s.tipo) || TIPI_SQUADRA[0];
              return (
                <div key={s.id} style={{ ...styles.squadraRiepilogoCard, opacity: 0.7 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 }}>
                    <div>
                      <div style={styles.rowTitle}>
                        {s.nome} <span style={{ fontWeight: 400, color: "#999", fontSize: 12 }}>({meta.label})</span>
                      </div>
                      <div style={styles.rowMeta}>
                        {labelTurno(s.turnoId)}
                        {s.codiceRadio ? ` · Radio: ${s.codiceRadio}` : ""}
                        {" · terminata il "}
                        {fmtDate(s.terminataAt)}
                      </div>
                    </div>
                    <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, color: "#888" }}>
                      {s.volontariIds.length} {s.volontariIds.length === 1 ? "componente" : "componenti"}
                    </div>
                  </div>
                  {dettagliId === s.id && (
                    <div style={{ marginTop: 10, padding: 10, background: "var(--bg-soft, #F7F5F0)", borderRadius: 8, fontSize: 13 }}>
                      <div style={{ fontWeight: 600, marginBottom: 6 }}>Dettagli associazioni</div>
                      {meta.conMezzo && (
                        <div style={{ marginBottom: 6 }}>
                          <div style={{ color: "#888", fontSize: 12 }}>Mezzi</div>
                          {mezziDellaSquadra(s).length === 0 ? (
                            <div style={styles.emptyText}>Nessun mezzo assegnato</div>
                          ) : (
                            mezziDellaSquadra(s).map((mid) => {
                              const m = mezzoById(mid);
                              return (
                                <div key={mid}>
                                  {m ? `${m.targa} (${m.tipo})` : "—"} — <i>{m ? m.associazione || ASSOCIAZIONE_DEFAULT : "—"}</i>
                                </div>
                              );
                            })
                          )}
                        </div>
                      )}
                      <div>
                        <div style={{ color: "#888", fontSize: 12 }}>Volontari</div>
                        {s.volontariIds.length === 0 ? (
                          <div style={styles.emptyText}>Nessun volontario assegnato</div>
                        ) : (
                          s.volontariIds.map((vid) => (
                            <div key={vid}>
                              {nomeVolontario(vid)} — <i>{associazioneVolontario(vid)}</i>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                  <div style={{ marginTop: 10 }} className="no-print">
                    <button style={styles.btnSecondary} onClick={() => setDettagliId(dettagliId === s.id ? null : s.id)}>
                      {dettagliId === s.id ? "Nascondi dettagli" : "Dettagli"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function SquadreTab({ tipo, volontari, mezzi, squadre, tutteLeSquadre, turniList, onAggiungi, onAggiorna, onElimina, onTermina, onRiattiva, soloLettura, turnoIniziale, dataIniziale }) {
  const meta = TIPI_SQUADRA.find((t) => t.id === tipo) || TIPI_SQUADRA[0];
  const conMezzo = meta.conMezzo;

  const turnoDefault = turnoIniziale && turnoIniziale !== "tutti" ? turnoIniziale : turniList[0]?.id || "";
  const emptyForm = { nome: "", codiceRadio: "", turnoId: turnoDefault, volontariIds: [], mezzoId: "", mezziExtraIds: [] };
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState(null);
  const [terminandoId, setTerminandoId] = useState(null);
  const [kmFinaliTermina, setKmFinaliTermina] = useState({});
  const [filtroAssocNuova, setFiltroAssocNuova] = useState("");
  const [filtroAssocEdit, setFiltroAssocEdit] = useState("");
  const multiMezzo = tipo === "logistiche-tecniche";

  function mezziDellaSquadra(s) {
    return [s.mezzoId, ...(s.mezziExtraIds || [])].filter(Boolean);
  }
  function avviaTermina(s) {
    if (conMezzo && mezziDellaSquadra(s).length) {
      setTerminandoId(s.id);
      setKmFinaliTermina({});
    } else {
      onTermina(s.id);
    }
  }
  function confermaTermina(id) {
    onTermina(id, kmFinaliTermina);
    setTerminandoId(null);
    setKmFinaliTermina({});
  }

  // volontari/mezzi già assegnati a un'altra squadra ATTIVA (di qualsiasi tipo), esclusa quella in modifica
  const volontariAssegnatiAltrove = useMemo(() => {
    const set = new Set();
    (tutteLeSquadre || []).forEach((s) => {
      if (editingId && s.id === editingId) return;
      if (s.terminata) return;
      (s.volontariIds || []).forEach((id) => set.add(id));
    });
    return set;
  }, [tutteLeSquadre, editingId]);
  const mezziAssegnatiAltrove = useMemo(() => {
    const set = new Set();
    (tutteLeSquadre || []).forEach((s) => {
      if (editingId && s.id === editingId) return;
      if (s.terminata) return;
      if (s.mezzoId) set.add(s.mezzoId);
      (s.mezziExtraIds || []).forEach((id) => set.add(id));
    });
    return set;
  }, [tutteLeSquadre, editingId]);

  const turnoForm = turniList.find((t) => t.id === (editingId ? editDraft?.turnoId : form.turnoId));
  function stessaGiornata(ts, dataStr) {
    if (!dataStr || !ts) return true;
    const d = new Date(ts);
    const [y, m, g] = dataStr.split("-").map(Number);
    return d.getFullYear() === y && d.getMonth() + 1 === m && d.getDate() === g;
  }
  const volontariDisponibili = (turnoForm
    ? volontari.filter(
        (v) => v.inizioTurno === turnoForm.inizio && v.fineTurno === turnoForm.fine && stessaGiornata(v.oraIngresso, dataIniziale)
      )
    : volontari
  ).filter((v) => !volontariAssegnatiAltrove.has(v.id));
  const mezziDisponibili = mezzi.filter((m) => !mezziAssegnatiAltrove.has(m.id));
  const associazioniVolontariDisponibili = Array.from(new Set(volontariDisponibili.map((v) => v.associazione || ASSOCIAZIONE_DEFAULT))).sort();
  const volontariDisponibiliFiltratiNuova = filtroAssocNuova
    ? volontariDisponibili.filter((v) => (v.associazione || ASSOCIAZIONE_DEFAULT) === filtroAssocNuova)
    : volontariDisponibili;
  const volontariDisponibiliFiltratiEdit = filtroAssocEdit
    ? volontariDisponibili.filter((v) => (v.associazione || ASSOCIAZIONE_DEFAULT) === filtroAssocEdit)
    : volontariDisponibili;
  const mezziDisponibiliFiltratiNuova = filtroAssocNuova
    ? mezziDisponibili.filter((m) => (m.associazione || ASSOCIAZIONE_DEFAULT) === filtroAssocNuova)
    : mezziDisponibili;
  const mezziDisponibiliFiltratiEdit = filtroAssocEdit
    ? mezziDisponibili.filter((m) => (m.associazione || ASSOCIAZIONE_DEFAULT) === filtroAssocEdit)
    : mezziDisponibili;

  const squadreAttive = squadre.filter((s) => !s.terminata);
  const squadreTerminate = squadre.filter((s) => s.terminata);
  const squadreVisibili = squadreAttive.filter(
    (s) => (!turnoDefault || s.turnoId === turnoDefault) && (!dataIniziale || !s.dataRiferimento || s.dataRiferimento === dataIniziale)
  );

  function nomeVolontario(id) {
    const v = volontari.find((x) => x.id === id);
    return v ? `${v.cognome} ${v.nome}` : "—";
  }
  function labelMezzo(id) {
    const m = mezzi.find((x) => x.id === id);
    return m ? `${m.targa} (${m.tipo})` : "—";
  }
  function labelMezzi(s) {
    return mezziDellaSquadra(s).map(labelMezzo).join(", ");
  }
  function labelTurno(id) {
    const t = turniList.find((x) => x.id === id);
    return t ? `${t.nome} (${t.inizio}–${t.fine})` : "—";
  }

  function toggleVolontario(id, draft, setDraft) {
    const ids = draft.volontariIds.includes(id) ? draft.volontariIds.filter((x) => x !== id) : [...draft.volontariIds, id];
    setDraft({ ...draft, volontariIds: ids });
  }

  function submitNuova(e) {
    e.preventDefault();
    if (!form.nome.trim() || !form.turnoId) return;
    onAggiungi(tipo, form);
    setForm({ ...emptyForm, turnoId: form.turnoId });
    setFiltroAssocNuova("");
  }

  function startEdit(s) {
    setEditingId(s.id);
    setEditDraft({ mezziExtraIds: [], ...s });
    setFiltroAssocEdit("");
  }
  function salvaEdit() {
    onAggiorna(editingId, editDraft);
    setEditingId(null);
    setEditDraft(null);
  }

  return (
    <div style={{ display: "grid", gap: 20 }}>
      {!soloLettura && (
        <div style={styles.card}>
        <h2 style={styles.cardTitle}>Nuova squadra — {meta.label}</h2>
        <form onSubmit={submitNuova} style={{ display: "grid", gap: 10 }}>
          <div style={styles.grid2} className="grid2-force">
            <div>
              <label style={styles.label}>Nome squadra</label>
              <input style={styles.input} value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Es. Squadra Alfa" />
            </div>
            <div>
              <label style={styles.label}>Codice radio</label>
              <input style={styles.input} value={form.codiceRadio} onChange={(e) => setForm({ ...form, codiceRadio: e.target.value })} placeholder="Es. Alfa 1" />
            </div>
          </div>
          <div>
            <label style={styles.label}>Turno di riferimento</label>
            <div style={{ ...styles.input, background: "#EFEBE1", color: "#555", display: "flex", alignItems: "center" }}>
              {turniList.find((t) => t.id === form.turnoId)
                ? `${turniList.find((t) => t.id === form.turnoId).nome} (${turniList.find((t) => t.id === form.turnoId).inizio}–${turniList.find((t) => t.id === form.turnoId).fine})`
                : "Nessun turno configurato"}
              {dataIniziale ? ` · ${dataIniziale.split("-").reverse().join("/")}` : ""}
            </div>
            <div style={{ fontSize: 12, color: "#888", marginTop: 4 }}>
              Determinato dal Filtro turno generale impostato in Dati evento.
            </div>
          </div>
          {conMezzo && (
            <div>
              <label style={styles.label}>{multiMezzo ? "Mezzo 1" : "Mezzo di riferimento"}</label>
              <select style={styles.input} value={form.mezzoId} onChange={(e) => setForm({ ...form, mezzoId: e.target.value })}>
                <option value="">Nessuno</option>
                {mezziDisponibiliFiltratiNuova
                  .filter((m) => !form.mezziExtraIds.includes(m.id))
                  .map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.targa} ({m.tipo}) · {m.stato}
                    </option>
                  ))}
              </select>
            </div>
          )}
          {conMezzo &&
            multiMezzo &&
            [0, 1, 2].map((i) => (
              <div key={i}>
                <label style={styles.label}>Mezzo {i + 2} (facoltativo)</label>
                <select
                  style={styles.input}
                  value={form.mezziExtraIds[i] || ""}
                  onChange={(e) => {
                    const next = [...form.mezziExtraIds];
                    next[i] = e.target.value;
                    setForm({ ...form, mezziExtraIds: next });
                  }}
                >
                  <option value="">Nessuno</option>
                  {mezziDisponibiliFiltratiNuova
                    .filter((m) => m.id !== form.mezzoId)
                    .filter((m) => m.id === form.mezziExtraIds[i] || !form.mezziExtraIds.includes(m.id))
                    .map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.targa} ({m.tipo}) · {m.stato}
                      </option>
                    ))}
                </select>
              </div>
            ))}
          <div>
            <label style={styles.label}>
              Volontari (registrati per il turno selezionato{dataIniziale ? ` del ${dataIniziale.split("-").reverse().join("/")}` : ""})
            </label>
            {associazioniVolontariDisponibili.length > 1 && (
              <select
                style={{ ...styles.input, marginBottom: 8 }}
                value={filtroAssocNuova}
                onChange={(e) => setFiltroAssocNuova(e.target.value)}
              >
                <option value="">Tutte le associazioni</option>
                {associazioniVolontariDisponibili.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            )}
            <div style={{ display: "grid", gap: 6, maxHeight: 220, overflowY: "auto", border: "1px solid var(--line)", borderRadius: 8, padding: 8 }}>
              {volontariDisponibiliFiltratiNuova.length === 0 && (
                <div style={styles.emptyText}>Nessun volontario disponibile per questo turno e questa data (o già assegnato a un'altra squadra).</div>
              )}
              {volontariDisponibiliFiltratiNuova.map((v) => (
                <label key={v.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                  <input
                    type="checkbox"
                    checked={form.volontariIds.includes(v.id)}
                    onChange={() => toggleVolontario(v.id, form, setForm)}
                  />
                  {v.cognome} {v.nome} <span style={{ color: "#999" }}>· {v.specializzazione}{v.associazione ? ` · ${v.associazione}` : ""}</span>
                </label>
              ))}
            </div>
          </div>
          <button type="submit" style={styles.btnPrimary}>
            <Plus size={16} style={{ marginRight: 6 }} /> Crea squadra
          </button>
        </form>
        </div>
      )}

      <div style={styles.card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
          <h2 style={styles.cardTitle}>Squadre — {meta.label}</h2>
          <span style={styles.rowMeta}>
            {turniList.find((t) => t.id === turnoDefault) ? `${turniList.find((t) => t.id === turnoDefault).nome} (${turniList.find((t) => t.id === turnoDefault).inizio}–${turniList.find((t) => t.id === turnoDefault).fine})` : "nessun turno impostato"}
            {dataIniziale ? ` · ${dataIniziale.split("-").reverse().join("/")}` : ""}
          </span>
        </div>

        <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
          {squadreVisibili.length === 0 && <div style={styles.emptyText}>Nessuna squadra per il turno selezionato.</div>}
          {squadreVisibili.map((s) =>
            editingId === s.id ? (
              <div key={s.id} style={{ ...styles.card, background: "#FAF8F3" }}>
                <div style={styles.grid2} className="grid2-force">
                  <input style={styles.input} value={editDraft.nome} onChange={(e) => setEditDraft({ ...editDraft, nome: e.target.value })} placeholder="Nome squadra" />
                  <input style={styles.input} value={editDraft.codiceRadio} onChange={(e) => setEditDraft({ ...editDraft, codiceRadio: e.target.value })} placeholder="Codice radio" />
                </div>
                <div style={{ marginTop: 10 }}>
                  <label style={styles.label}>Turno di riferimento</label>
                  <select style={styles.input} value={editDraft.turnoId} onChange={(e) => setEditDraft({ ...editDraft, turnoId: e.target.value })}>
                    {turniList.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.nome} ({t.inizio}–{t.fine})
                      </option>
                    ))}
                  </select>
                </div>
                {conMezzo && (
                  <div style={{ marginTop: 10 }}>
                    <label style={styles.label}>{multiMezzo ? "Mezzo 1" : "Mezzo di riferimento"}</label>
                    <select style={styles.input} value={editDraft.mezzoId} onChange={(e) => setEditDraft({ ...editDraft, mezzoId: e.target.value })}>
                      <option value="">Nessuno</option>
                      {mezziDisponibiliFiltratiEdit
                        .filter((m) => !(editDraft.mezziExtraIds || []).includes(m.id))
                        .map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.targa} ({m.tipo})
                          </option>
                        ))}
                    </select>
                  </div>
                )}
                {conMezzo &&
                  multiMezzo &&
                  [0, 1, 2].map((i) => (
                    <div key={i} style={{ marginTop: 10 }}>
                      <label style={styles.label}>Mezzo {i + 2} (facoltativo)</label>
                      <select
                        style={styles.input}
                        value={(editDraft.mezziExtraIds || [])[i] || ""}
                        onChange={(e) => {
                          const next = [...(editDraft.mezziExtraIds || [])];
                          next[i] = e.target.value;
                          setEditDraft({ ...editDraft, mezziExtraIds: next });
                        }}
                      >
                        <option value="">Nessuno</option>
                        {mezziDisponibiliFiltratiEdit
                          .filter((m) => m.id !== editDraft.mezzoId)
                          .filter((m) => m.id === (editDraft.mezziExtraIds || [])[i] || !(editDraft.mezziExtraIds || []).includes(m.id))
                          .map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.targa} ({m.tipo})
                            </option>
                          ))}
                      </select>
                    </div>
                  ))}
                <div style={{ marginTop: 10 }}>
                  <label style={styles.label}>Volontari</label>
                  {associazioniVolontariDisponibili.length > 1 && (
                    <select
                      style={{ ...styles.input, marginBottom: 8 }}
                      value={filtroAssocEdit}
                      onChange={(e) => setFiltroAssocEdit(e.target.value)}
                    >
                      <option value="">Tutte le associazioni</option>
                      {associazioniVolontariDisponibili.map((a) => (
                        <option key={a} value={a}>
                          {a}
                        </option>
                      ))}
                    </select>
                  )}
                  <div style={{ display: "grid", gap: 6, maxHeight: 200, overflowY: "auto", border: "1px solid var(--line)", borderRadius: 8, padding: 8 }}>
                    {volontariDisponibiliFiltratiEdit.map((v) => (
                      <label key={v.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                        <input
                          type="checkbox"
                          checked={editDraft.volontariIds.includes(v.id)}
                          onChange={() => toggleVolontario(v.id, editDraft, setEditDraft)}
                        />
                        {v.cognome} {v.nome} <span style={{ color: "#999" }}>{v.associazione ? `· ${v.associazione}` : ""}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                  <button style={styles.btnPrimary} onClick={salvaEdit}>
                    Salva
                  </button>
                  <button
                    style={styles.btnSecondary}
                    onClick={() => {
                      setEditingId(null);
                      setEditDraft(null);
                    }}
                  >
                    Annulla
                  </button>
                </div>
              </div>
            ) : (
              <div key={s.id} style={styles.rowItem}>
                <div>
                  <div style={styles.rowTitle}>
                    {s.nome} {s.codiceRadio && <span style={styles.rowMeta}>· Radio: {s.codiceRadio}</span>}
                  </div>
                  <div style={styles.rowMeta}>
                    {labelTurno(s.turnoId)}
                    {conMezzo && mezziDellaSquadra(s).length ? ` · ${labelMezzi(s)}` : ""}
                  </div>
                  <div style={styles.rowMeta}>
                    {s.volontariIds.length === 0 ? "Nessun volontario assegnato" : s.volontariIds.map(nomeVolontario).join(", ")}
                  </div>
                </div>
                {soloLettura ? (
                  <span style={{ fontSize: 12, color: "#999" }}>Sola lettura</span>
                ) : terminandoId === s.id ? (
                  <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                    {mezziDellaSquadra(s).map((mid) => (
                      <input
                        key={mid}
                        style={{ ...styles.input, width: 150 }}
                        type="number"
                        placeholder={`Km finali ${labelMezzo(mid)}`}
                        value={kmFinaliTermina[mid] || ""}
                        onChange={(e) => setKmFinaliTermina((prev) => ({ ...prev, [mid]: e.target.value }))}
                        autoFocus={mid === mezziDellaSquadra(s)[0]}
                      />
                    ))}
                    <button style={styles.btnPrimary} onClick={() => confermaTermina(s.id)}>
                      Conferma
                    </button>
                    <button style={styles.btnSecondary} onClick={() => setTerminandoId(null)}>
                      Annulla
                    </button>
                  </div>
                ) : (
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <button style={styles.btnSecondary} onClick={() => startEdit(s)}>
                      Modifica
                    </button>
                    <button style={styles.btnGhostRed} onClick={() => avviaTermina(s)}>
                      Termina operatività
                    </button>
                    <button style={styles.btnGhostRed} onClick={() => window.confirm(`Eliminare la squadra "${s.nome}"?`) && onElimina(s.id)}>
                      Elimina
                    </button>
                  </div>
                )}
              </div>
            )
          )}
        </div>
      </div>

      {squadreTerminate.length > 0 && (
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>
            <Archive size={16} style={{ marginRight: 6, verticalAlign: -3 }} /> Squadre terminate ({squadreTerminate.length})
          </h2>
          <div style={{ display: "grid", gap: 8 }}>
            {squadreTerminate.map((s) => (
              <div key={s.id} style={{ ...styles.rowItem, opacity: 0.65 }}>
                <div>
                  <div style={styles.rowTitle}>
                    {s.nome} {s.codiceRadio && <span style={styles.rowMeta}>· Radio: {s.codiceRadio}</span>}
                  </div>
                  <div style={styles.rowMeta}>
                    {labelTurno(s.turnoId)} · terminata il {fmtDate(s.terminataAt)}
                  </div>
                </div>
                {!soloLettura && (
                  <div style={{ display: "flex", gap: 6 }}>
                    {onRiattiva && (
                      <button style={styles.btnPrimary} onClick={() => onRiattiva(s.id)}>
                        Riattiva
                      </button>
                    )}
                    <button style={styles.btnGhostRed} onClick={() => window.confirm(`Eliminare definitivamente la squadra "${s.nome}"?`) && onElimina(s.id)}>
                      Elimina
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ================= ADMIN: EVENTI =================
function LoghiEventoPicker({ loghi, onChange, disabled }) {
  const valori = [0, 1, 2].map((i) => (loghi && loghi[i]) || "");
  function handleFile(i, file) {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      window.alert("Il logo è troppo pesante (max 2MB). Scegli un'immagine più leggera.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const next = [...valori];
      next[i] = reader.result;
      onChange(next.filter(Boolean));
    };
    reader.readAsDataURL(file);
  }
  function rimuovi(i) {
    const next = [...valori];
    next[i] = "";
    onChange(next.filter(Boolean));
  }
  return (
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
      {[0, 1, 2].map((i) => (
        <div key={i} style={{ width: 84, textAlign: "center" }}>
          {valori[i] ? (
            <div style={{ position: "relative" }}>
              <img
                src={valori[i]}
                alt=""
                style={{ width: 84, height: 84, objectFit: "contain", border: "1px solid #D8D3C8", borderRadius: 8, background: "#fff" }}
              />
              {!disabled && (
                <button
                  type="button"
                  onClick={() => rimuovi(i)}
                  style={{
                    position: "absolute",
                    top: -6,
                    right: -6,
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    border: "none",
                    background: "#c0392b",
                    color: "#fff",
                    fontSize: 12,
                    cursor: "pointer",
                    lineHeight: "20px",
                    padding: 0,
                  }}
                  title="Rimuovi logo"
                >
                  ×
                </button>
              )}
            </div>
          ) : (
            !disabled && (
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 84,
                  height: 84,
                  border: "1px dashed #999",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontSize: 12,
                  color: "#666",
                }}
              >
                + Logo
                <input type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => handleFile(i, e.target.files && e.target.files[0])} />
              </label>
            )
          )}
        </div>
      ))}
    </div>
  );
}

function EventiTab({
  eventi,
  mode,
  onSeleziona,
  onCrea,
  onRinomina,
  onChiudi,
  onRiapri,
  onElimina,
  onEsporta,
  onLogout,
  specializzazioniList,
  tipiMezzoList,
  specializzazioniMacroAree,
  tipiMezzoMacroAree,
  onAddSpecializzazione,
  onRemoveSpecializzazione,
  onAddTipoMezzo,
  onRemoveTipoMezzo,
  adminCredentials,
  onSaveAdminCredentials,
  ruoloAccesso,
  operatori,
  onCreaOperatore,
  onModificaOperatore,
  onEliminaOperatore,
}) {
  const [nuovoNome, setNuovoNome] = useState("");
  const [nuovoLuogo, setNuovoLuogo] = useState("");
  const [nuovoEnte, setNuovoEnte] = useState("");
  const [nuoviLoghi, setNuoviLoghi] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editNome, setEditNome] = useState("");
  const [editLuogo, setEditLuogo] = useState("");
  const [editEnte, setEditEnte] = useState("");
  const [editLoghi, setEditLoghi] = useState([]);
  const [mostraGenerali, setMostraGenerali] = useState(false);

  const attivi = eventi.filter((e) => !e.chiuso);
  const chiusi = eventi.filter((e) => e.chiuso);

  function submitNuovo(e) {
    e.preventDefault();
    if (!nuovoNome.trim()) return;
    const id = onCrea(nuovoNome, nuovoLuogo, nuovoEnte, nuoviLoghi);
    setNuovoNome("");
    setNuovoLuogo("");
    if (id) onSeleziona(id);
    setNuovoEnte("");
    setNuoviLoghi([]);
  }

  function salvaRinomina(id) {
    onRinomina(id, editNome, editLuogo, editEnte, editLoghi);
    setEditingId(null);
  }

  if (mode === "gate" && mostraGenerali) {
    return (
      <ImpostazioniGeneraliView
        specializzazioniList={specializzazioniList}
        tipiMezzoList={tipiMezzoList}
        specializzazioniMacroAree={specializzazioniMacroAree}
        tipiMezzoMacroAree={tipiMezzoMacroAree}
        onAddSpecializzazione={onAddSpecializzazione}
        onRemoveSpecializzazione={onRemoveSpecializzazione}
        onAddTipoMezzo={onAddTipoMezzo}
        onRemoveTipoMezzo={onRemoveTipoMezzo}
        adminCredentials={adminCredentials}
        onSaveAdminCredentials={onSaveAdminCredentials}
        ruoloAccesso={ruoloAccesso}
        operatori={operatori}
        onCreaOperatore={onCreaOperatore}
        onModificaOperatore={onModificaOperatore}
        onEliminaOperatore={onEliminaOperatore}
        onIndietro={() => setMostraGenerali(false)}
      />
    );
  }

  return (
    <div style={{ display: "grid", gap: 20 }}>
      {mode === "gate" && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }} className="no-print">
          <div />
          <div style={{ display: "flex", gap: 8 }}>
            {ruoloAccesso === "admin" && (
              <button style={styles.btnSecondary} onClick={() => setMostraGenerali(true)}>
                <RotateCcw size={16} style={{ marginRight: 6 }} /> Impostazioni generali
              </button>
            )}
            <button style={styles.btnGhost} onClick={onLogout}>
              <LogOut size={16} style={{ marginRight: 6 }} /> Esci
            </button>
          </div>
        </div>
      )}

      <div style={styles.card}>
        <h2 style={styles.cardTitle}>{mode === "gate" ? "Seleziona un evento" : "Eventi"}</h2>
        <p style={{ fontSize: 13, color: "#666", marginBottom: 16 }}>
          Ogni evento ha volontari, mezzi e impostazioni propri e indipendenti. Puoi gestire più eventi in contemporanea: ogni
          postazione (dispositivo) può lavorare su un evento diverso.
        </p>

        <div style={{ display: "grid", gap: 8, marginBottom: 20 }}>
          {attivi.length === 0 && <div style={styles.emptyText}>Nessun evento attivo. Creane uno qui sotto.</div>}
          {attivi.map((e) =>
            editingId === e.id ? (
              <div key={e.id} style={{ ...styles.rowItem, flexDirection: "column", alignItems: "stretch", gap: 8 }}>
                <input style={styles.input} value={editNome} onChange={(ev) => setEditNome(ev.target.value)} placeholder="Nome evento" />
                <input style={styles.input} value={editLuogo} onChange={(ev) => setEditLuogo(ev.target.value)} placeholder="Luogo attività" />
                <input
                  style={styles.input}
                  value={editEnte}
                  onChange={(ev) => setEditEnte(ev.target.value)}
                  placeholder="Ente gestore (es. Comune di..., DRPC Sicilia)"
                />
                <div>
                  <div style={{ fontSize: 12, color: "#666", marginBottom: 6 }}>Loghi da mostrare nei documenti (max 3, facoltativi)</div>
                  <LoghiEventoPicker loghi={editLoghi} onChange={setEditLoghi} />
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button style={styles.btnPrimary} onClick={() => salvaRinomina(e.id)}>
                    Salva
                  </button>
                  <button style={styles.btnSecondary} onClick={() => setEditingId(null)}>
                    Annulla
                  </button>
                </div>
              </div>
            ) : (
              <div key={e.id} style={styles.rowItem}>
                <div>
                  <div style={styles.rowTitle}>{e.nome}</div>
                  <div style={styles.rowMeta}>
                    Creato il {fmtDate(e.createdAt)}
                    {e.luogoAttivita ? ` · ${e.luogoAttivita}` : ""}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <button style={styles.btnPrimary} onClick={() => onSeleziona(e.id)}>
                    Seleziona
                  </button>
                  {ruoloAccesso === "admin" && (
                    <button
                      style={styles.btnSecondary}
                      onClick={() => {
                        setEditingId(e.id);
                        setEditNome(e.nome);
                        setEditLuogo(e.luogoAttivita || "");
                        setEditEnte(e.enteGestore || "");
                        setEditLoghi(e.loghi || []);
                      }}
                    >
                      Modifica
                    </button>
                  )}
                  {ruoloAccesso === "admin" && (
                    <button style={styles.btnGhostRed} onClick={() => onChiudi(e.id)}>
                      Chiudi
                    </button>
                  )}
                  {onEsporta && (
                    <button style={styles.btnSecondary} onClick={() => onEsporta(e.id)}>
                      <Download size={14} style={{ marginRight: 6 }} /> Esporta tutto
                    </button>
                  )}
                  {ruoloAccesso === "admin" && onElimina && (
                    <button style={styles.btnGhostRed} onClick={() => onElimina(e.id)}>
                      Elimina
                    </button>
                  )}
                </div>
              </div>
            )
          )}
        </div>

        {ruoloAccesso === "admin" && (
          <form onSubmit={submitNuovo} style={{ display: "grid", gap: 8 }}>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <input
                style={{ ...styles.input, maxWidth: 300 }}
                placeholder="Nome nuovo evento (es. Alluvione ottobre 2026)"
                value={nuovoNome}
                onChange={(e) => setNuovoNome(e.target.value)}
              />
              <input
                style={{ ...styles.input, maxWidth: 260 }}
                placeholder="Luogo attività"
                value={nuovoLuogo}
                onChange={(e) => setNuovoLuogo(e.target.value)}
              />
            </div>
            <input
              style={{ ...styles.input, maxWidth: 400 }}
              placeholder="Ente gestore (facoltativo, es. Comune di..., DRPC Sicilia)"
              value={nuovoEnte}
              onChange={(e) => setNuovoEnte(e.target.value)}
            />
            <div>
              <div style={{ fontSize: 12, color: "#666", marginBottom: 6 }}>
                Loghi da mostrare in registro, attestati e ticket di questo evento (max 3, facoltativi)
              </div>
              <LoghiEventoPicker loghi={nuoviLoghi} onChange={setNuoviLoghi} />
            </div>
            <div>
              <button type="submit" style={styles.btnPrimary}>
                <Plus size={16} style={{ marginRight: 6 }} /> Crea evento
              </button>
            </div>
          </form>
        )}
      </div>

      {chiusi.length > 0 && (
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>
            <Archive size={16} style={{ marginRight: 6, verticalAlign: -3 }} /> Eventi chiusi ({chiusi.length})
          </h2>
          <div style={{ display: "grid", gap: 8 }}>
            {chiusi.map((e) => (
              <div key={e.id} style={styles.rowItem}>
                <div>
                  <div style={styles.rowTitle}>{e.nome}</div>
                  <div style={styles.rowMeta}>
                    Creato il {fmtDate(e.createdAt)} · chiuso
                    {e.luogoAttivita ? ` · ${e.luogoAttivita}` : ""}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <button style={styles.btnSecondary} onClick={() => onSeleziona(e.id)}>
                    Consulta
                  </button>
                  {ruoloAccesso === "admin" && (
                    <button style={styles.btnSecondary} onClick={() => onRiapri(e.id)}>
                      Riapri
                    </button>
                  )}
                  {onEsporta && (
                    <button style={styles.btnSecondary} onClick={() => onEsporta(e.id)}>
                      <Download size={14} style={{ marginRight: 6 }} /> Esporta tutto
                    </button>
                  )}
                  {onElimina && ruoloAccesso === "admin" && (
                    <button style={styles.btnGhostRed} onClick={() => onElimina(e.id)}>
                      Elimina
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ================= ADMIN: IMPOSTAZIONI GENERALI =================
function ImpostazioniGeneraliView({
  specializzazioniList,
  tipiMezzoList,
  specializzazioniMacroAree,
  tipiMezzoMacroAree,
  onAddSpecializzazione,
  onRemoveSpecializzazione,
  onAddTipoMezzo,
  onRemoveTipoMezzo,
  adminCredentials,
  onSaveAdminCredentials,
  ruoloAccesso,
  operatori,
  onCreaOperatore,
  onModificaOperatore,
  onEliminaOperatore,
  onIndietro,
}) {
  const isAdmin = ruoloAccesso === "admin";
  const [nuovaSpec, setNuovaSpec] = useState("");
  const [nuovaSpecArea, setNuovaSpecArea] = useState(MACRO_AREE_SPECIALIZZAZIONI[0]);
  const [nuovoTipo, setNuovoTipo] = useState("");
  const [nuovoTipoArea, setNuovoTipoArea] = useState(MACRO_AREE_MEZZI[0]);
  const [credUsername, setCredUsername] = useState(adminCredentials?.username || "");
  const [credPassword, setCredPassword] = useState(adminCredentials?.password || "");
  const [credSalvato, setCredSalvato] = useState(false);
  const [nuovoOpNome, setNuovoOpNome] = useState("");
  const [nuovoOpCognome, setNuovoOpCognome] = useState("");
  const [nuovoOpUser, setNuovoOpUser] = useState("");
  const [nuovoOpPass, setNuovoOpPass] = useState("");
  const [erroreOp, setErroreOp] = useState("");
  const [editingOpId, setEditingOpId] = useState(null);
  const [editOpUser, setEditOpUser] = useState("");
  const [editOpPass, setEditOpPass] = useState("");
  const [editOpNome, setEditOpNome] = useState("");
  const [editOpCognome, setEditOpCognome] = useState("");

  function salvaCredenziali(e) {
    e.preventDefault();
    onSaveAdminCredentials({
      username: credUsername.trim() || adminCredentials.username,
      password: credPassword.trim() || adminCredentials.password,
    });
    setCredSalvato(true);
    setTimeout(() => setCredSalvato(false), 2500);
  }

  function submitNuovoOperatore(e) {
    e.preventDefault();
    const ok = onCreaOperatore({ nome: nuovoOpNome, cognome: nuovoOpCognome, username: nuovoOpUser, password: nuovoOpPass });
    if (!ok) {
      setErroreOp("Compila nome, cognome, utente e password. Il nome utente potrebbe già esistere.");
      return;
    }
    setErroreOp("");
    setNuovoOpNome("");
    setNuovoOpCognome("");
    setNuovoOpUser("");
    setNuovoOpPass("");
  }

  function salvaModificaOperatore(id) {
    onModificaOperatore(id, {
      nome: editOpNome.trim() || undefined,
      cognome: editOpCognome.trim() || undefined,
      username: editOpUser.trim() || undefined,
      password: editOpPass.trim() || undefined,
    });
    setEditingOpId(null);
  }

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <button style={styles.backBtn} className="no-print" onClick={onIndietro}>
        ← Torna alla selezione evento
      </button>

      <div style={styles.card}>
        <h2 style={styles.cardTitle}>Impostazioni generali</h2>
        <p style={{ fontSize: 13, color: "#666" }}>
          Valgono per default per ogni nuovo evento che verrà creato. Non modificano gli eventi già esistenti.
        </p>
      </div>

      <div style={styles.card}>
        <h2 style={styles.cardTitle}>Specializzazioni volontari</h2>
        <p style={{ fontSize: 13, color: "#666", marginBottom: 12 }}>
          Raggruppate per macro-area, per una visualizzazione più organica nei menu a tendina di inserimento dati.
        </p>
        {MACRO_AREE_SPECIALIZZAZIONI.map((area) => {
          const voci = specializzazioniList.filter((s) => (specializzazioniMacroAree[s] || "Altro") === area);
          if (voci.length === 0) return null;
          return (
            <div key={area} style={{ marginBottom: 12 }}>
              <div style={styles.rowMeta}>{area}</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 6 }}>
                {voci.map((s) => (
                  <span key={s} style={styles.chip}>
                    {s}
                    <button style={styles.chipRemove} onClick={() => onRemoveSpecializzazione(s)} title="Rimuovi">
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          );
        })}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
          <input
            style={{ ...styles.input, maxWidth: 220 }}
            placeholder="Nuova specializzazione"
            value={nuovaSpec}
            onChange={(e) => setNuovaSpec(e.target.value)}
          />
          <select style={{ ...styles.input, maxWidth: 200 }} value={nuovaSpecArea} onChange={(e) => setNuovaSpecArea(e.target.value)}>
            {MACRO_AREE_SPECIALIZZAZIONI.map((a) => (
              <option key={a}>{a}</option>
            ))}
          </select>
          <button
            style={styles.btnSecondary}
            onClick={() => {
              onAddSpecializzazione(nuovaSpec, nuovaSpecArea);
              setNuovaSpec("");
            }}
          >
            <Plus size={14} style={{ marginRight: 6 }} /> Aggiungi
          </button>
        </div>
      </div>

      <div style={styles.card}>
        <h2 style={styles.cardTitle}>Tipi mezzo</h2>
        <p style={{ fontSize: 13, color: "#666", marginBottom: 12 }}>
          Raggruppati per macro-area, per una visualizzazione più organica nei menu a tendina di inserimento dati.
        </p>
        {MACRO_AREE_MEZZI.map((area) => {
          const voci = tipiMezzoList.filter((t) => (tipiMezzoMacroAree[t] || "Altro") === area);
          if (voci.length === 0) return null;
          return (
            <div key={area} style={{ marginBottom: 12 }}>
              <div style={styles.rowMeta}>{area}</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 6 }}>
                {voci.map((t) => (
                  <span key={t} style={styles.chip}>
                    {t}
                    <button style={styles.chipRemove} onClick={() => onRemoveTipoMezzo(t)} title="Rimuovi">
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          );
        })}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
          <input
            style={{ ...styles.input, maxWidth: 220 }}
            placeholder="Nuovo tipo mezzo"
            value={nuovoTipo}
            onChange={(e) => setNuovoTipo(e.target.value)}
          />
          <select style={{ ...styles.input, maxWidth: 200 }} value={nuovoTipoArea} onChange={(e) => setNuovoTipoArea(e.target.value)}>
            {MACRO_AREE_MEZZI.map((a) => (
              <option key={a}>{a}</option>
            ))}
          </select>
          <button
            style={styles.btnSecondary}
            onClick={() => {
              onAddTipoMezzo(nuovoTipo, nuovoTipoArea);
              setNuovoTipo("");
            }}
          >
            <Plus size={14} style={{ marginRight: 6 }} /> Aggiungi
          </button>
        </div>
      </div>

      {isAdmin && (
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Accesso amministratore</h2>
          <p style={{ fontSize: 13, color: "#666", marginBottom: 16 }}>
            Modifica il nome utente e la password per l'accesso all'area Admin.
          </p>
          <form onSubmit={salvaCredenziali} style={{ display: "grid", gap: 10, maxWidth: 340 }}>
            <div>
              <label style={styles.label}>Nome utente</label>
              <input style={styles.input} value={credUsername} onChange={(e) => setCredUsername(e.target.value)} />
            </div>
            <div>
              <label style={styles.label}>Password</label>
              <input style={styles.input} type="text" value={credPassword} onChange={(e) => setCredPassword(e.target.value)} />
            </div>
            {credSalvato && <div style={{ color: "var(--green)", fontSize: 13 }}>Credenziali aggiornate.</div>}
            <button type="submit" style={styles.btnPrimary}>
              Salva credenziali
            </button>
          </form>
        </div>
      )}

      {isAdmin && (
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Gestione operatori</h2>
          <p style={{ fontSize: 13, color: "#666", marginBottom: 16 }}>
            Gli account operatore hanno accesso a tutta la gestione (eventi, volontari, mezzi, squadre, registro radio), ma
            non possono creare altri account né modificare le credenziali amministratore.
          </p>
          <div style={{ display: "grid", gap: 8, marginBottom: 16 }}>
            {(operatori || []).map((o) =>
              editingOpId === o.id ? (
                <div key={o.id} style={{ ...styles.rowItem, flexDirection: "column", alignItems: "stretch", gap: 8 }}>
                  <div style={styles.grid2} className="grid2-force">
                    <input style={styles.input} value={editOpNome} onChange={(e) => setEditOpNome(e.target.value)} placeholder="Nome" />
                    <input style={styles.input} value={editOpCognome} onChange={(e) => setEditOpCognome(e.target.value)} placeholder="Cognome" />
                  </div>
                  <input style={styles.input} value={editOpUser} onChange={(e) => setEditOpUser(e.target.value)} placeholder="Nome utente" />
                  <input style={styles.input} value={editOpPass} onChange={(e) => setEditOpPass(e.target.value)} placeholder="Nuova password (lascia vuoto per non cambiarla)" />
                  <div style={{ display: "flex", gap: 8 }}>
                    <button style={styles.btnPrimary} onClick={() => salvaModificaOperatore(o.id)}>
                      Salva
                    </button>
                    <button style={styles.btnSecondary} onClick={() => setEditingOpId(null)}>
                      Annulla
                    </button>
                  </div>
                </div>
              ) : (
                <div key={o.id} style={styles.rowItem}>
                  <div>
                    <div style={styles.rowTitle}>
                      {o.cognome} {o.nome}
                    </div>
                    <div style={styles.rowMeta}>{o.username}</div>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button
                      style={styles.btnSecondary}
                      onClick={() => {
                        setEditingOpId(o.id);
                        setEditOpNome(o.nome || "");
                        setEditOpCognome(o.cognome || "");
                        setEditOpUser(o.username);
                        setEditOpPass("");
                      }}
                    >
                      Modifica
                    </button>
                    <button style={styles.btnGhostRed} onClick={() => onEliminaOperatore(o.id)}>
                      Elimina
                    </button>
                  </div>
                </div>
              )
            )}
          </div>
          <form onSubmit={submitNuovoOperatore} style={{ display: "grid", gap: 10, maxWidth: 340 }}>
            <div style={styles.grid2} className="grid2-force">
              <div>
                <label style={styles.label}>Nome</label>
                <input style={styles.input} value={nuovoOpNome} onChange={(e) => setNuovoOpNome(e.target.value)} />
              </div>
              <div>
                <label style={styles.label}>Cognome</label>
                <input style={styles.input} value={nuovoOpCognome} onChange={(e) => setNuovoOpCognome(e.target.value)} />
              </div>
            </div>
            <div>
              <label style={styles.label}>Nome utente</label>
              <input style={styles.input} value={nuovoOpUser} onChange={(e) => setNuovoOpUser(e.target.value)} />
            </div>
            <div>
              <label style={styles.label}>Password</label>
              <input style={styles.input} type="text" value={nuovoOpPass} onChange={(e) => setNuovoOpPass(e.target.value)} />
            </div>
            {erroreOp && <div style={styles.errorText}>{erroreOp}</div>}
            <button type="submit" style={styles.btnPrimary}>
              <Plus size={16} style={{ marginRight: 6 }} /> Crea operatore
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, accent }) {
  return (
    <div style={styles.statCard}>
      <div style={styles.statLabel}>{label}</div>
      <div style={{ ...styles.statValue, color: accent === "orange" ? "var(--orange)" : accent === "green" ? "var(--green)" : "var(--navy)" }}>
        {value}
      </div>
    </div>
  );
}

// ================= STYLE ELEMENTS =================
function StyleBlock() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');
      :root {
        --ink: #14181F;
        --navy: #1F3B57;
        --paper: #F5F3EE;
        --orange: #E8622C;
        --green: #3F7D53;
        --red: #B3261E;
        --line: #D8D3C8;
      }
      * { box-sizing: border-box; }
      .tab-btn { font-family: 'Oswald', sans-serif; letter-spacing: 0.04em; text-transform: uppercase; font-size: 13px; }
      button { cursor: pointer; font-family: 'Inter', sans-serif; border: none; }
      input, select { font-family: 'Inter', sans-serif; }
      input:focus, select:focus, button:focus-visible { outline: 2px solid var(--navy); outline-offset: 1px; }
      table { border-collapse: collapse; width: 100%; }
      @media (max-width: 720px) {
        .grid2-force { grid-template-columns: 1fr !important; }
      }
      @media print {
        .no-print { display: none !important; }
        body { background: white !important; }
      }
    `}</style>
  );
}

// ================= INLINE STYLES =================
const styles = {
  app: { fontFamily: "'Inter', sans-serif", background: "var(--paper)", minHeight: "100vh", color: "var(--ink)" },
  loadingWrap: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "60vh", background: "var(--ink)" },
  spinner: { width: 28, height: 28, border: "3px solid rgba(245,243,238,0.25)", borderTopColor: "var(--orange)", borderRadius: "50%", animation: "spin 0.8s linear infinite" },
  statusBar: { background: "var(--ink)", padding: "16px 20px", color: "var(--paper)" },
  brandRow: { display: "flex", alignItems: "center", gap: 12, marginBottom: 14, background: "transparent", border: "none", padding: 0, textAlign: "left", cursor: "pointer" },
  logoBadge: { width: 46, height: 58, borderRadius: 6, background: "transparent", padding: 3, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  logoImg: { width: "100%", height: "100%", objectFit: "contain" },
  orgName: { fontFamily: "'Oswald', sans-serif", fontSize: 15, letterSpacing: "0.03em", lineHeight: 1.2, color: "var(--paper)" },
  orgSub: { fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, opacity: 0.65, marginTop: 2, color: "var(--paper)" },
  flapRow: { display: "flex", gap: 10, flexWrap: "wrap" },
  flapStat: { background: "#1F252F", border: "1px solid #2B323F", borderRadius: 6, padding: "8px 12px" },
  flapLabel: { fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, opacity: 0.55, letterSpacing: "0.06em" },
  flapValue: { fontFamily: "'IBM Plex Mono', monospace", fontSize: 18, fontWeight: 500, fontVariantNumeric: "tabular-nums", marginTop: 2 },
  tabRow: { display: "flex", gap: 2, padding: "12px 20px 0", background: "var(--paper)" },
  tabActive: { padding: "10px 18px", background: "var(--navy)", color: "var(--paper)", borderRadius: "6px 6px 0 0", display: "flex", alignItems: "center" },
  tabInactive: { padding: "10px 18px", background: "transparent", color: "var(--ink)", opacity: 0.55, borderRadius: "6px 6px 0 0", display: "flex", alignItems: "center" },
  subTabRow: { display: "flex", gap: 8, marginBottom: 4 },
  subTabActive: { padding: "7px 14px", background: "var(--orange)", color: "white", borderRadius: 20, display: "flex", alignItems: "center", fontSize: 12 },
  subTabInactive: { padding: "7px 14px", background: "#EFEBE1", color: "var(--ink)", opacity: 0.7, borderRadius: 20, display: "flex", alignItems: "center", fontSize: 12 },
  homeGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 190px))", gap: 18, justifyContent: "center", padding: "20px 0" },
  sezioniGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 320px))", gap: 20, justifyContent: "center", padding: "24px 0" },
  sezioneTile: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, padding: "36px 24px", background: "white", border: "1px solid var(--line)", borderRadius: 16, color: "var(--navy)", boxShadow: "0 2px 10px rgba(0,0,0,0.06)" },
  sezioneTileLabel: { fontFamily: "'Oswald', sans-serif", fontSize: 20, textTransform: "uppercase", letterSpacing: "0.02em", color: "var(--ink)" },
  sezioneTileSub: { fontSize: 12, color: "#888", textAlign: "center", lineHeight: 1.4 },
  assocBanner: { display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, background: "white", border: "1px solid var(--line)", borderRadius: 10, padding: "12px 16px" },
  squadreSection: { marginTop: 8, paddingTop: 20, borderTop: "1px dashed var(--line)" },
  squadreSectionTitle: { fontFamily: "'Oswald', sans-serif", fontSize: 13, textTransform: "uppercase", letterSpacing: "0.06em", color: "#888", textAlign: "center", marginBottom: 8 },
  assocBannerLabel: { fontSize: 11, textTransform: "uppercase", letterSpacing: "0.04em", color: "#999", fontFamily: "'IBM Plex Mono', monospace" },
  assocBannerName: { fontSize: 15, fontWeight: 600, marginTop: 2 },
  assocBannerMeta: { fontSize: 12, color: "#777", marginTop: 2 },
  homeTile: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, aspectRatio: "1 / 1", background: "white", border: "1px solid var(--line)", borderRadius: 14, color: "var(--navy)", boxShadow: "0 2px 8px rgba(0,0,0,0.05)", transition: "transform 0.1s" },
  homeTileLabel: { fontFamily: "'Oswald', sans-serif", fontSize: 17, textTransform: "uppercase", letterSpacing: "0.02em", color: "var(--ink)" },
  homeTileCount: { fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: "#888" },
  backBtn: { alignSelf: "flex-start", background: "transparent", color: "var(--navy)", padding: "6px 4px", fontSize: 13, fontWeight: 500 },
  main: { padding: 20, maxWidth: 1100, margin: "0 auto" },
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 },
  card: { background: "white", border: "1px solid var(--line)", borderRadius: 10, padding: 20 },
  cardTitle: { fontFamily: "'Oswald', sans-serif", fontSize: 16, letterSpacing: "0.02em", margin: "0 0 14px", textTransform: "uppercase" },
  label: { display: "block", fontSize: 12, color: "#666", marginBottom: 4, fontWeight: 500 },
  input: { width: "100%", padding: "8px 10px", border: "1px solid var(--line)", borderRadius: 6, fontSize: 14, background: "#FCFBF8" },
  btnPrimary: { background: "var(--navy)", color: "var(--paper)", padding: "10px 16px", borderRadius: 6, fontSize: 14, fontWeight: 500, display: "flex", alignItems: "center", justifyContent: "center" },
  btnSecondary: { background: "#EFEBE1", color: "var(--ink)", padding: "8px 12px", borderRadius: 6, fontSize: 13, display: "flex", alignItems: "center" },
  btnGhost: { background: "transparent", color: "var(--ink)", padding: "8px 12px", borderRadius: 6, fontSize: 13, border: "1px solid var(--line)", display: "flex", alignItems: "center" },
  btnGhostRed: { background: "transparent", color: "var(--red)", padding: "6px 10px", borderRadius: 6, fontSize: 12, border: "1px solid var(--red)" },
  btnDanger: { background: "var(--red)", color: "white", padding: "10px 16px", borderRadius: 6, fontSize: 14, fontWeight: 500, display: "flex", alignItems: "center" },
  table: { width: "100%", fontSize: 13 },
  th: { textAlign: "left", padding: "8px 10px", borderBottom: "2px solid var(--ink)", fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.04em" },
  td: { padding: "8px 10px", borderBottom: "1px solid var(--line)" },
  rowItem: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", background: "#FAF8F3", borderRadius: 6, border: "1px solid var(--line)" },
  rowTitle: { fontSize: 14, fontWeight: 500 },
  rowMeta: { fontSize: 12, color: "#777", marginTop: 2 },
  emptyText: { fontSize: 13, color: "#999", fontStyle: "italic" },
  errorText: { color: "var(--red)", fontSize: 13, marginTop: 6 },
  statGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14 },
  statCard: { background: "white", border: "1px solid var(--line)", borderRadius: 10, padding: "16px 18px" },
  statLabel: { fontSize: 12, color: "#777", fontFamily: "'IBM Plex Mono', monospace" },
  statValue: { fontSize: 28, fontFamily: "'Oswald', sans-serif", marginTop: 4 },
  pillOrange: { background: "#FDE9DF", color: "var(--orange)", padding: "3px 8px", borderRadius: 20, fontSize: 11, fontWeight: 600 },
  pillGreen: { background: "#E1EFE3", color: "var(--green)", padding: "3px 8px", borderRadius: 20, fontSize: 11, fontWeight: 600 },
  pillRed: { background: "#FBE1DF", color: "#B23B32", padding: "3px 8px", borderRadius: 20, fontSize: 11, fontWeight: 600 },
  toast: { position: "fixed", bottom: 20, left: "50%", transform: "translateX(-50%)", background: "var(--ink)", color: "var(--paper)", padding: "10px 18px", borderRadius: 8, fontSize: 13, boxShadow: "0 4px 20px rgba(0,0,0,0.2)" },
  chip: { display: "inline-flex", alignItems: "center", gap: 6, background: "#EFEBE1", padding: "5px 10px", borderRadius: 20, fontSize: 12 },
  squadraRiepilogoCard: { background: "#FAF8F3", border: "1px solid var(--line)", borderRadius: 10, padding: "12px 14px" },
  squadreBlockTitle: { fontFamily: "'Oswald', sans-serif", fontSize: 15, textTransform: "uppercase", letterSpacing: "0.03em", marginBottom: 10, paddingBottom: 6, borderBottom: "1px solid var(--line)" },
  chipRemove: { background: "transparent", color: "#999", fontSize: 14, lineHeight: 1, padding: 0 },
};
