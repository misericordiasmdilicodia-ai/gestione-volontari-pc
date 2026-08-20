import { useState, useEffect, useMemo, useRef } from "react";
import { ShieldPlus, Truck, Users, LogIn, LogOut, Search, Download, Printer, RotateCcw, X, Clock, Archive, LayoutGrid, Maximize2, Minimize2, Plus } from "lucide-react";

// ---------- costanti ----------
const SPECIALIZZAZIONI = ["Capo Squadra", "Autista", "Soccorritore", "Volontario", "Altro"];
const SI_NO = ["No", "Sì"];
const TIPI_MEZZO = ["Ambulanza", "Fuoristrada", "Furgone", "Auto", "Moto", "Altro"];
const ASSOCIAZIONE_DEFAULT = "Misericordia di Santa Maria di Licodia";
const TURNI_DEFAULT = [
  { id: "t1", nome: "Turno Mattina", inizio: "08:00", fine: "14:00" },
  { id: "t2", nome: "Turno Pomeriggio", inizio: "14:00", fine: "20:00" },
  { id: "t3", nome: "Turno Notte", inizio: "20:00", fine: "08:00" },
];
const ADMIN_USER = "Admin";
const ADMIN_PASS = "Admin@";
const POLL_MS = 8000;

const KEY_VOL = "protcivile:volontari";
const KEY_MEZZI = "protcivile:mezzi";
const KEY_CONFIG = "protcivile:config";
const KEY_ARCHIVIO = "protcivile:archivio";
const KEY_ASSOC_CORRENTE = "protcivile:associazione-corrente";
const KEY_ASSOC_DB = "protcivile:associazioni-db";

const ASSOCIAZIONI_DB = [["5", "ASSOCIAZIONE NAZIONALE S.S.T. - SEARCH AND RESCUE – ODV DELEGAZIONE DI SCIACCA", "C / o S t a dio Comunale L. Gurrera, s.n.c.", "Sciacca", "AG"], ["6", "ASSOCIAZIONE NAZIONALE CARABINIERI SEZIONE DI VIZZINI", "Via Roma, 35", "Vizzini", "CT"], ["7", "ARCI CACCIA FEDERAZIONE PROVINCIALE DI CATANIA", "Via Felice Paradiso, 3 c/o Com Acireale", "Acireale", "CT"], ["10", "ASSOCIAZIONE PALERMO 4X4 ODV", "Via del Melograno, 18/A", "Palermo", "PA"], ["14", "ORGANIZZAZIONE NAZIONALE DI VOLONTARIATO GIUBBE D'ITALIA", "Via Orto S. Antonino, 7", "Chiusa Sclafani", "PA"], ["16", "FRATERNITA DI MISERICORDIA DI VALLEDOLMO", "Via G Garibaldi, 165", "Valledolmo", "PA"], ["24", "ASSOCIAZIONE NAZIONALE VIGILI DEL FUOCO IN CONGEDO DELEGAZIONE TORREGROTTA – ODV", "V i a M e z z a s a l ma, 27 c/o Municipio di Torregrotta", "Torregrotta", "ME"], ["28", "ASSOCIAZIONE CULTURALE NUOVA ACROPOLI SIRACUSA", "Viale Zecchino, 72", "Siracusa", "SR"], ["38", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI MASCALUCIA", "Piazza Leonardo Da Vinci", "Mascalucia", "CT"], ["39", "ASSOCIAZIONE NAZIONALE VIGILI DEL FUOCO IN CONGEDO DELEGAZIONE DI NARO", "Piazza Cesare Battisti, 1", "Naro", "AG"], ["47", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI ACICATENA", "Via Sottotenente Barbagallo, 2", "Acicatena", "CT"], ["52", "ASSOCIAZIONE NAZIONALE VIGILI DEL FUOCO IN CONGEDO", "Piazza Macello, 3", "Lercara Friddi", "PA"], ["54", "NUCLEO PRONTO INTERVENTO SCIARESE", "Via Lo Varco, 25", "Sciara", "PA"], ["56", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI MODICA", "Piazza Principe di Napoli, 17", "Modica", "RG"], ["64", "PROTEZIONE CIVILE ADRANO", "Piazza S. Francesco, 13", "Adrano", "CT"], ["65", "ASSOCIAZIONE DI VOLONTARIATO “RADIO VALLE ALCANTARA”", "Piazza Raggia, 13", "Taormina", "ME"], ["70", "ASSOCIAZIONE VOLONTARIATO MILAZZO", "Via Francesco Crispi, 81", "Milazzo", "ME"], ["73", "ORGANIZZAZIONE NAZIONALE VOLONTARIATO GIUBBE D'ITALIA SEZIONE DI ALTAVILLA MILICIA", "Via Crocifisso, 24", "Altavilla Milicia", "PA"], ["90", "PROTEZIONE CIVILE CENTRO OPERATIVO ISIDE", "Viale Madre Teresa di Calcutta, s.n.", "Mineo", "CT"], ["92", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI VITTORIA", "Via S. Incardona c/o Mercato Ortofrutticolo", "Vittoria", "RG"], ["96", "ASSOCIAZIONE VOLONTARI CITTA'DI NOTO", "Via Silvio Spaventa, 2", "Noto", "SR"], ["101", "STRUTTURA REGIONALE SICILIA - FEDERAZIONE ITALIANA RICETRASMISSIONI – CITIZEN'S BAND – F.I.R. C.B. ODV", "V ia XXIV Maggio, 56", "Messina", "ME"], ["106", "ASSOCIAZIONE VOLONTARI DEL SOCCORSO", "Circonvallazione Costa degli Archi, s.n.c.", "Santa Croce Camerina", "RG"], ["107", "CORPO AUSILIARIO PROTEZIONE CIVILE “G. CARUANO”", "C.da Mendolilli Capitina", "Vittoria", "RG"], ["108", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI SANTA CROCE DI CAMERINA", "Via Carmine, 95", "Santa Croce Camerina", "RG"], ["109", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI RAGUSA", "Corso Italia, 72", "Ragusa", "RG"], ["120", "CORPO VOLONTARI PROTEZIONE CIVILE ENNA PUBBLICA ASSISTENZA", "Via Scifitello, snc", "Enna", "EN"], ["124", "FRATERNITA DI MISERICORDIA DI SAN PIERO PATTI", "Via Primo Maggio, 2", "San Piero Patti", "ME"], ["130", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI PRIOLO GARGALLO", "C.e.r.i.c.a c/da Cava Sorciaro, s.n.", "Priolo Gargallo", "SR"], ["132", "ORGANIZZAZIONE WHISKEY MIKE", "Via Grotta del Toro, 48", "Marsala", "TP"], ["136", "EKOS SICILIA AMBIENTE E CULTURA", "Via Fiorita , 7/A", "Catania", "CT"], ["138", "PUBBICA ASSISTENZA SICILIA SOCCORSO O.N.L.U.S.", "C.da Bellia, 2", "Piazza Armerina", "EN"], ["143", "FRATERNITA DI MISERICORDIA DI PEDARA", "Via Pizzo Ferro, 5", "Pedara", "CT"], ["154", "VOLONTARIATO SICILIANO PER LA PROTEZIONE CIVILE SEZIONE DI FRANCOFONTE", "Via Onorevole Sebastiano Franco", "Francofonte", "SR"], ["155", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI COMISO", "Via G. Bufalino", "Comiso", "RG"], ["159", "RANGERS INTERNATIONAL- DELEGAZIONE 552.005 UCRIA", "Via Padre Bernardino", "Ucria", "ME"], ["172", "PUBBLICA ASSISTENZA AMICO SOCCORSO ALDO INGALA", "Via Signore Ritrovato, 4", "Barrafranca", "EN"], ["181", "E.R.A.P. EMERGENZA RADIOAMATORI ASSOCIATI PALERMO ODV", "Via Monte Mario, 5", "Palermo", "PA"], ["196", "ORGANIZZAZIONE NAZIONALE DI VOLONTARIATO GIUBBE D'ITALIA – SEZIONE COMUNALE DI ARAGONA", "Via B. Naselli, 173", "Aragona", "AG"], ["200", "ENTE SALVAGUARDIA AMBIENTE E FORESTE ESAF-GRUPPO VOLONTARI EMERGENZE", "Via Felice Fontana, 23", "Catania", "CT"], ["207", "NUCLEO DIOCESANO DI PROTEZIONE CIVILE", "Via Emilia, 21", "Messina", "ME"], ["208", "ORGANIZZAZIONE VOLONTARI DI P.C. RAGUSA O.N.L.U.S", "Via Achille Grandi, s.n.c", "Ragusa", "RG"], ["214", "ORGANIZZAZIONE EUROPEA COORDINAMENTO NAZIONALE VOLONTARIATO E IMPRESA SOCIALE E.T.S.-DISTACCAMENTO DI PARTINICO", "Via Papa Paolo VI, 3", "Partinico", "PA"], ["220", "ORGANIZZAZIONE NAZIONALE VOLONTARIATO GIUBBE D'ITALIA – SEZIONE DI CEFALU'", "Via Vitaliano Brancati, 19", "Cefalù", "PA"], ["222", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI SCORDIA", "Via Aldo Moro", "Scordia", "CT"], ["225", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI GIARDINI NAXOS", "Via Jannuzzo palazzo VV.UU.", "Giardini Naxos", "ME"], ["228", "GOS MODICA AVCM DELL'ASSOCIAZIONE NAZIONALE VIGILI DEL FUOCO VOLONTARI ODV", "Via Furio Camillo, 3", "Modica", "RG"], ["231", "GRUPPO VOLONTARIO CINOFILO ACESE ODV", "Via Manzoni, 13", "Acireale", "CT"], ["239", "REPARTO OPERATIVO SOCCORSO E SOLIDARIETA'", "Via Modica, 72", "Siracusa", "SR"], ["245", "PUBBLICA ASSISTENZA VOLONTARI RIUNITI RACALMUTO", "Via Vincenzo Scimè, 5", "Racalmuto", "AG"], ["250", "CLUB 27 CATANIA", "Viale F. Fontana", "Catania", "CT"], ["267", "ORGANIZZAZIONE NAZIONALE DI VOLONTARIATO GIUBBE D'ITALIA – SEZIONE COMUNALE DI CALASCIBETTA", "Via Nazionale, 139", "Calascibetta", "EN"], ["268", "NUCLEO DI PROTEZIONE CIVILE ANC DI NICOLOSI", "Via Garibaldi, 40", "Nicolosi", "CT"], ["269", "PUBBLICA ASSISTENZA “IL SOCCORSO”", "V i a A n t o n i n o I n corvaia, 2", "Misiliscemi", "TP"], ["275", "LEGAMBIENTE PROTEZIONE CIVILE FILIPPO SALIMENI", "Via Cortile S. Agostino, 17", "Agira", "EN"], ["289", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI ISPICA", "Via dell'Arte, s.n.c.", "Ispica", "RG"], ["295", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI PALAZZOLO ACREIDE", "Via G. Campailla, s.n.", "Palazzolo Acreide", "SR"], ["306", "GRIFONE, GRUPPO DI CORLEONE ADERENTE PROCIV – ARCI NAZIONALE", "Via S. Lucia c/o ufficio tecnico", "Corleone", "PA"], ["326", "CONFRATERNITA DI MISERICORDIA DI NICOLOSI", "Piazza Vittorio Emanuele, 26", "Nicolosi", "CT"], ["342", "ORGANIZZAZIONE MAGNA VIS PER LA LOGISTICA ED I MEZZI SPECIALI", "Piazza Mulini, 13", "Trabia", "PA"], ["356", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DEL COMUNE DI SINAGRA", "Piazza S. Teodoro", "Sinagra", "ME"], ["389", "ASSOCIAZIONE DI VOLONTARIATO PROTEZIONE CIVILE DI BIANCAVILLA", "Via dei Peloritani, 1", "Biancavilla", "CT"], ["401", "VOLO CLUB ALBATROS ASSOCIAZIONE ONLUS DI VOLONTARIATO PER LA P.ROTEZIONE CIVILE", "C.da Canne Masche", "Termini Imerese", "PA"], ["410", "“S.E.R. L.A.N.C.E. C.B.” SERVIZIO EMERGENZA RADIO VOLONTARI DI PROTEZIONE CIVILE", "Via La Porta, 19", "Porto Empedocle", "AG"], ["441", "NUCLEO DI PROTEZIONE CIVILE ANC", "Via Marcello Paternò, s.n.", "Biancavilla", "CT"], ["445", "ASSOCIAZIONE NAZ. CARABINIERI GRUPPO DI PROTEZIONE CIVILE GUARDIA MANGANO", "Via Tolmezzo, 10", "Acireale Guardia Mangano", "CT"], ["459", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI SORTINO", "Viale Mario Giardino", "Sortino", "SR"], ["460", "CONFRATERNITA DI MISERICORDIA DI PORTOPALO DI CAPOPASSERO", "Via Garibaldi, 53", "Portopalo di Capo Passero", "SR"], ["463", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI ACI SANT'ANTONIO", "Via Regina Margherita, 8", "Aci Sant'Antonio", "CT"], ["464", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI LICODIA EUBEA", "Via Piersanti Mattarella, 4", "Licodia Eubea", "CT"], ["472", "CROCE D'ORO PORTO EMPEDOCLE ORGANIZZAZIONE VOLONTARIA", "Via Roma, 42", "Porto Empedocle", "AG"], ["473", "GRUPPO” ETNA” - CLUB – C.B.- S. VENERINA", "Via Mazzini, 75", "Santa Venerina", "CT"], ["478", "FORUM REGIONALE DELLE ASSOCIAZIONI DI VOLONTARIATO DELLA PROTEZIONE CIVILE", "Via Trieste, 25", "Palermo", "PA"], ["481", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI RANDAZZO", "Piazza Municipio, 1", "Randazzo", "CT"], ["483", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI CANICATTINI BAGNI", "Piazza Caduti di Nassiriya", "Canicattini Bagni", "SR"], ["494", "DELEGAZIONE L.A.N.C.E. C.B. TUSA", "Via Roma", "Tusa", "ME"], ["495", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI NICOLOSI", "Via Calvario, 27", "Nicolosi", "CT"], ["498", "GRUPPO ALFA REGIONE SICILIA", "Via Santa Teresa, 3", "Chiaramonte Gulfi", "RG"], ["502", "ASSOCIAZIONE VOLONTARI CITTA' DI SIRACUSA", "Via Beneventano, 1", "Siracusa", "SR"], ["505", "PUBBLICA ASSISTENZA PROCIVIS", "Via Vico la Mantia, 5", "Gela", "CL"], ["508", "A.P.A.S. PATERNO'", "Via Giovanni Verga, 91", "Paternò", "CT"], ["509", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI TRECASTAGNI", "Via Benedetto Croce, 5", "Trecastagni", "CT"], ["510", "C.B. G. MARCONI", "Via Spiaggia, 319", "Mascali", "CT"], ["601", "SMAV - SAN MAURO ASSOCIAZIONE VOLONTARIATO ONLUS", "Via Acqua Nuova, 7", "San Mauro Castelverde", "PA"], ["602", "CONFRATERNITA DI MISERICORDIA SAN GREGORIO DI CATANIA – ONLUS", "Via Umberto, 67", "San Gregorio di Catania", "CT"], ["603", "RANGERS EUROPA DIVISIONE DI NICOLOSI", "Via Montearso, 1", "Nicolosi", "CT"], ["604", "“RANGERS EUROPA” DIVISIONE DI MONTEROSSO ALMO", "C.da Margi, snc (sede COM)", "Monterosso Almo", "RG"], ["605", "SOCIETA' NAZIONALE DI SALVAMENTO SEZIONE DI LENTINI/CARLENTINI – CAPITANERIA DI PORTO DI AUGUSTA", "Via San Francesco D'Assisi, 151", "Lentini", "SR"], ["606", "CONFRATERNITA DI MISERICORDIA", "Via Lombardia, 1", "Bronte", "CT"], ["608", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI RESUTTANO", "Piazza Vittorio Emanuele III, 1", "Resuttano", "CL"], ["610", "CENTRO ASCOLTO SOLIDARIETA' S. PAOLO APOSTOLO – O.N.L.U.S.", "Via Piave, 4", "Solarino", "SR"], ["611", "ASSOCIAZIONE VOLONTARIATO E PROTEZIONE CIVILE VILLA GRAZIA DI CARINI", "Via Garita, 13", "Carini", "PA"], ["612", "CLUB RADIO C.B. - ODV", "Via Sant'Andrea, 96", "Barcellona Pozzo di Gotto", "ME"], ["614", "OPERE DI ASSISTENZA, SOCCORSO E SOLIDARIETA' DELLA CROCE GIOVANNEA", "Via Libertà, 24", "Partinico", "PA"], ["615", "PLUTIA EMERGENZA", "Via Alessandro Manzoni, 94", "Piazza Armerina", "EN"], ["616", "O.N.L.U.S. VOLONTARI OPERATORI DI SOCCORSO CERAMI", "Via Tomasi di Lampedusa, 2", "Cerami", "EN"], ["617", "ASSOCIAZIONE CATTOLICA CULTURALE ITALIANA RADIOPERATORI", "Via Garibaldi, 379", "Messina", "ME"], ["618", "RANGERS INTERNATIONAL DELEGAZIONE 555.001 NICOSIA", "Via Sant'Anna , 61", "Nicosia", "EN"], ["619", "FRATERNITA DI MISERICORDIA DI GRAVINA DI CATANIA", "Via Zangrì, 10", "Gravina di Catania", "CT"], ["622", "ASSOCIAZIONE PROVINCIALE VIGILI DEL FUOCO DISCONTINUI VOLONTARI", "Via Seneca, 8", "Trapani", "TP"], ["624", "ORGANIZZAZIONE NAZIONALE DI VOLONTARIATO GIUBBE D'ITALIA – SEZIONE COMUNALE DI AGIRA", "C.da Tre Fontane, snc", "Agira", "EN"], ["629", "ASSOCIAZIONE VOLONTARIATO FUTURA", "Via Campania, 20", "Ispica", "RG"], ["630", "ANTRAS ASSOCIAZIONE NAZIONALE DI NUCLEI OPERATIVI NEL SETTORE DEI TRASPORTI E DELLA PROTEZIONE", "Viale Regione Siciliana. 64", "Palermo", "PA"], ["634", "FRATERNITA DI MISERICORDIA FLORIDIA", "Via Labriola", "Floridia", "SR"], ["635", "ASSOCIAZIONE DI VOLONTARIATO PER LA PROTEZIONE CIVILE ED AMBIENTALE", "Via Libertà, 3", "Zafferana Etnea", "CT"], ["636", "PROTEZIONE CIVILE GERACI SICULO", "Via Don Orione, 1", "Geraci Siculo", "PA"], ["639", "CAVALIERI DI SICILIA ODV", "Via Francesco Crispi, 1", "Borgetto", "PA"], ["640", "A.R.I. ASSOCIAZIONE RADIOAMATORI ITALIANI", "Via F. Fontana, 23", "Catania", "CT"], ["641", "TRAVEL SOCCORSO ORGANIZZAZIONE NON LUCRATIVA DI UTILITA' SOCIALE", "Via Volontari Italiani del Sangue, 7/9", "Termini Imerese", "PA"], ["645", "PROCIV ARCI GRUPPO ANTHARES BOLOGNETTA", "Via Pietro Novelli, 108", "Bolognetta", "PA"], ["648", "GUARDIE AMBIENTALI COMANDO ITALIA", "V i a S e r r a d i f a l c o , 55", "Palermo", "PA"], ["654", "ASSOCIAZIONE VOLONTARIATO PER LA PROTEZIONE CIVILE TRIPI", "Via F. Todaro, 127", "Tripi", "ME"], ["655", "MISTRAL", "Via Francesco Crispi, 28", "Belpasso", "CT"], ["657", "PEGASO", "Via Pezzingoli, 4", "Monreale", "PA"], ["658", "GRUPPO INTERCOMUNALE DI VOLONTARIATO DI PROTEZIONE CIVILE DEI COMUNI DI BOMPENSIERE, MILENA E MONTEDORO-BO.MI.MO.", "Via Principe di Scalea, 126", "Bompensiere", "CL"], ["661", "PROTEZIONE CIVILE MONTE LA STELLA", "Via P. Nenni, s.n.c.", "Assoro", "EN"], ["664", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI TROINA", "Via Conte Ruggero, 2", "Troina", "EN"], ["665", "“LA PANTERA” GRUPPO DI VOLONTARIATO PROTEZIONE CIVILE ASSISTENZIALE E CULTURALE", "Via Mezzasalma, 10", "Rometta Marea", "ME"], ["668", "GUARDIA COSTIERA AUSILIARIA- ONLUS - CENTRO REGIONALE DELLA SICILIA - GRUPPO OPERATIVO ISOLA DELLA FEMMINE", "Via Palermo, 63", "Isola delle Femmine", "PA"], ["669", "CONFRATERNITA DI MISERICORDIA DI SPADAFORA", "Via Provinciale San Martino", "Spadafora", "ME"], ["670", "PUBBLICA ASSISTENZA PACECO SOCCORSO ODV", "V i a L eonardo Pizzardi, 15", "Misiliscemi", "TP"], ["672", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI POGGIOREALE", "Via Ximenes, 1", "Poggioreale", "TP"], ["673", "VOLONTARI PROTEZIONE CIVILE SAMBUCA", "Viale Giovanni XXIII c/o UTC", "Sambuca di Sicilia", "AG"], ["675", "ASSOCIAZIONE NAZIONALE CARABINIERI NUCLEO VOLONTARI VIGILANZA E PROTEZIONE CIVILE", "Via Vittorio Emanuele, 71", "Aci Sant'Antonio", "CT"], ["677", "CONFRATERNITA DI MISERICORDIA DI BOMPIETRO", "Via Roma, 27", "Bompietro", "PA"], ["680", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI MANIACE", "Via Beato Placido, 13", "Maniace", "CT"], ["682", "CLUB ELETTRA", "Viale Epicarmo Corbino, 50", "Augusta", "SR"], ["683", "C.B. OMEGA CANICATTINI BAGNI", "Via Pipernice, s.n.c.", "Canicattini Bagni", "SR"], ["684", "RANGERS INTERNATIONAL DELEGAZIONE 553-005 DI CALATABIANO", "Via Garibaldi, 4", "Calatabiano", "CT"], ["686", "FEDERAZIONE - PROCIV - SICILIA - ADERENTE ALL'ASSOCIAZIONE NAZIONALE VOLONTARI PER LA P.C. PROCIV - ARCI NAZIONALE", "V i a Pietro Novelli, 108", "Bolognetta", "PA"], ["687", "NUCLEO DI PROTEZIONE CIVILE A.D.M.I. ASSOCIAZIONE DIPENDENTI MINISTERO DELL'INTERNO – DI SAN PIETRO CLARENZA", "V ia Felice Fontana, 23", "Catania", "CT"], ["688", "AQUILE DELL'ETNA", "Via Pierre De Coubertin, 15", "Catania", "CT"], ["689", "A.M.A. ONLUS (ASSOCIAZIONE MEDITERRANEA ASSISTENZA)", "Via Calasanzio, 3", "Ragusa", "RG"], ["691", "I CAVALIERI DELLA SIKANIA – ONLUS", "C/da Canale, 3", "Sant'Angelo Muxaro", "AG"], ["693", "ORGANIZZAZIONE NAZIONALE. VOLONTARI GIUBBE D'ITALIA SEZIONE SANTA ELISABETTA", "Via Kennedy, 21", "Santa Elisabetta", "AG"], ["696", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI LENTINI", "Piazza Umberto I, 31", "Lentini", "SR"], ["701", "ORGANIZZAZIONE EUROPEA VOLONTARI DI PREVENZIONE E PROTEZIONE CIVILE", "Piazza Garibaldi, 1", "Camastra", "AG"], ["702", "ORGANIZZAZIONE NAZIONALE VOLONTARIATO GIUBBE D'ITALIA SEZIONE COMUNALE DI VILLAROSA", "Via Cossa, s.n.c.", "Villarosa", "EN"], ["703", "ASSOCIAZIONE VOLONTARIATO PROTEZIONE CIVILE GRIFONI", "Via Umberto, 170", "Favara", "AG"], ["706", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI BELPASSO", "Piazza Municipio, 9", "Belpasso", "CT"], ["709", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI SAN PIETRO CLARENZA", "Via Padre Somma, 9", "San Pietro Clarenza", "CT"], ["711", "FRATERNITA DI MISERICORDIA DI BARRAFRANCA", "Via Montello, 42", "Barrafranca", "EN"], ["712", "ORGANIZZAZIONE NAZIONALE VOLONTARIATO GIUBBE D'ITALIA – COORDINAMENTO NAZIONALE", "Via Indipendenza, 35", "Aragona", "AG"], ["718", "PUBBLICA ASSISTENZA AMICO SOCCORSO O.N.L.U.S.", "Via Segesta, 3", "Trapani", "TP"], ["721", "FRATERNITA DI MISERICORDIA SAN LEONE", "Via S. Leone, 1", "Catania", "CT"], ["723", "ASSOCIAZIONE NAZIONALE S.S.T. - SEARCH AND RESCUE – ODV DELEGAZIONE DI CASTELVETRANO", "Via Nicolò Copernico, 36", "Castelvetrano", "TP"], ["725", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI SOLARINO", "Piazza del Plebiscito, 1", "Solarino", "SR"], ["726", "“AGESCI SICILIA - ASSOCIAZIONE GUIDE E SCOUT CATTOLICI ITALIANI”", "Via F.lli Bandiera, 82", "Gravina di Catania", "CT"], ["727", "E.R.A. T. EMERGENZA RADIOAMATORI ASSOCIATI TRAPANI ODV", "V i a T r e S a n t i , 7", "Alcamo", "TP"], ["729", "V.A.B. VIGILANZA ANTINCENDI BOSCHIVI MILITELLO ODV", "C.da Rena Rossa presso Elipista", "Militello Val Di Catania", "CT"], ["730", "FRATERNITA DI MISERICORDIA MARIA IMMACOLATA", "Via A. de Gasperi, 2", "Catenanuova", "EN"], ["731", "FONTANA DELLE ROSE ODV", "Piazza San Francesco, 7", "Campofranco", "CL"], ["733", "ASSOCIAZIONE P.A. S.O.S. VALDERICE ONLUS", "Via S. Barnaba, 43", "Valderice", "TP"], ["734", "FRATERNITA DI MISERICORDIA DI MESSINA", "Via Taormina Palazzina IACP", "Messina", "ME"], ["737", "ARETUSA SOCCORSO O.D.V.", "Via Elorina, 148", "Siracusa", "SR"], ["738", "RANGERS INTERNATIONAL DELEGAZIONE 552.002 GALATI MAMERTINO", "Via Cavour località Contura, s.n.c.", "Galati Mamertino", "ME"], ["740", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI ITALA", "Via Principe Umberto", "Itala", "ME"], ["742", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI VILLAFRANCA SICULA", "Via Vittorio Emanuele, 126", "Villafranca Sicula", "AG"], ["743", "ASSOCIAZIONE INTERNAZIONALE “PANTERE VERDI O.N.L.U.S.” RAGGRUPPAMENTO PROVINCIALE DI TRAPANI", "C/da Cozzaro, 52", "Marsala", "TP"], ["744", "ASSOCIAZIONE INTERNAZIONALE \"PANTERE VERDI O.N.L.U.S.\" RAGGRUPPAMENTO PROVINCIALE DI CALTANISSETTA", "Via Napoleone Colajanni, 208", "Caltanissetta", "CL"], ["746", "FRATERNITA DI MISERICORDIA", "Via Concerie, 35", "Melilli", "SR"], ["750", "CONFRATERNITA DI MISERICORDIA DI REALMONTE", "Via dei Gerani, 11/13", "Realmonte", "AG"], ["759", "VOLONTARI PROTEZIONE CIVILE DELIA", "Via Pola, 13", "Delia", "CL"], ["760", "ASSOCIAZIONE INTERNAZIONALE PANTERE VERDI ONLUS RAGGRUPPAMENTO PROVINCIALE DI CATANIA", "Via Felice Fontana, 23", "Catania", "CT"], ["761", "FRATERNITA DELLE MISERICORDIE DI ACIREALE", "Via Paolo Vasta, 180", "Acireale", "CT"], ["765", "ASSOCIAZIONE INTERNAZIONALE “PANTERE VERDI ONLUS” - RAGGRUPPAMENTO PROVINCIALE DI ENNA", "Via Bandiera, 72", "Valguarnera Caropepe", "EN"], ["771", "ASSOCIAZIONE AVULSS DI AGIRA", "Via Roma, 22", "Agira", "EN"], ["773", "ASSOCIAZIONE EUROPEA OPERATORI POLIZIA - GRUPPO VOLONTARIATO E PROTEZIONE CIVILE SEZIONE SICUREZZA", "Via S. Gregorio, 10", "Aci Castello", "CT"], ["774", "P.A. AURORA O.N.L.U.S", "Via Vita, 26", "Marsala", "TP"], ["775", "ODV GRUPPO DI VOLONTARIATO E PROTEZIONE CIVILE DELL'ASSOCIAZIONE NAZIONALE DELLA POLIZIA DI STATO – SEZIONE DI CALTANISSETTA", "Via Trieste, 82", "Caltanissetta", "CL"], ["778", "ASSOCIAZIONE VOLONTARI EUROPEI TUTELA AMBIENTE ODV-ETS", "V i a d e g l i A r c hi, 28", "Mazara del Vallo", "TP"], ["782", "FRATERNITA DI MISERICORDIA SANTA MARIA DI OGNINA", "Piazza Ognina, 11", "Catania", "CT"], ["786", "RANGERS INTERNATIONAL DELEGAZIONE SAN FILIPPO MONGIUFFI MELIA N° 552-018", "Piazza San Nicolò, 6", "Mongiuffi Melia", "ME"], ["788", "PUBBLICA ASSISTENZA TRINACRIA EMERGENCY", "Via Falcone, s.n.c. C/da Brucazzi", "Gela", "CL"], ["789", "GUARDIE AMBIENTALI D'ITALIA - DELEGAZIONE PROVINCIALE DI TRAPANI", "Via Ponte Salemi, 23/A", "Trapani", "TP"], ["792", "PUBBLICA ASSISTENZA INTERLAND MADONITA", "C.da Sant'Elia, s.n.c.", "Petralia Sottana", "PA"], ["794", "CONFRATERNITA DI MISERICORDIA DI MODICA", "Via Mercè, 53", "Modica", "RG"], ["796", "NUCLEO OPERATIVO DI PROTEZIONE CIVILE EMERGENZA AMBIENTALE", "Via Papa Giovanni XXIII, 54", "Terrasini", "PA"], ["798", "FRATERNITA DI MISERICORDIA DI TRECASTAGNI", "Via Arciprete Torrisi, 5", "Trecastagni", "CT"], ["800", "FRATERNITA DI MISERICORDIA DI ZAFFERANA ETNEA", "Via Libertà, 3", "Zafferana Etnea", "CT"], ["805", "ORGANIZZAZIONE DI VOLONTARIATO “MARI E MONTI 2004”", "Via E. Cianciolo, 26", "Messina", "ME"], ["806", "ASSOCIAZIONE DI PROTEZIONE CIVILE AMBIENTALE RICERCA E SOCCORSO O.N.L.U.S. A.P.C.A.R.S.", "Corso Garibaldi, 186", "San Filippo del Mela", "ME"], ["807", "ASSOCIAZIONE PUBBLICA ASSISTENZA LA PROVVIDENZA ONLUS", "C.da Damusello, 568", "Marsala", "TP"], ["808", "ORGANIZZAZIONE DI PROTEZIONE CIVILE \"OVERLAND\"", "Fondo Pasqualino, 5", "Monreale", "PA"], ["809", "ASSOCIAZIONE NAZIONALE VIGILI DEL FUOCO IN CONGEDO – DELEGAZIONE CAPACI ODV”", "Via del Fante, 17", "Capaci", "PA"], ["814", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI FICARAZZI", "Corso Umberto I, 412", "Ficarazzi", "PA"], ["817", "CONFRATERNITA DI MISERICORDIA DI ROCCAPALUMBA", "Via Garibaldi, 40", "Roccapalumba", "PA"], ["822", "ORGANIZZAZIONE PER LA PROTEZIONE CIVILE LE ALI", "Via Rosa Balistreri, 5", "Palermo", "PA"], ["823", "ARCAVERDE", "Via Luigi Manfredi, 2/G-H", "Palermo", "PA"], ["824", "ASSOCIAZIONE VOLONTARI DEL MEDITERRANEO -ODV-ETS", "Via Itria, 88/B", "Marsala", "TP"], ["828", "C.E.S.U.L. CORPO EUROPEO SOCCORSO UMANITARIO LOGISTICO – ODV", "Viale S. Panagia, 162", "Siracusa", "SR"], ["835", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI RIESI", "Piazza Don Pietro D'Altariva", "Riesi", "CL"], ["836", "COMITATO REGIONALE A.N.P.A.S. SICILIA", "Via Sardegna, 36", "Enna", "EN"], ["837", "GRUPPO OPERATIVO EMERGENZA 837 ODV", "C.da Fallari Mugno S.P. 25", "Ragusa", "RG"], ["838", "ASSOCIAZIONE GUARDIE ITTICHE VENATORIE ENDAS “G.I.S.E. ODV ETS”", "Via degli Asteroidi, 2", "Agrigento", "AG"], ["839", "ORGANIZZAZIONE NAZIONALE DI VOLONTARIATO GIUBBE D'ITALIA", "Via Tivoli, 125", "Raffadali", "AG"], ["843", "SOS BUSETO ODV", "Via Murfi, 4", "Buseto Palizzolo", "TP"], ["844", "GUARDIE AMBIENTALI TRINACRIA", "Via Pantelleria, 24", "Mazara del Vallo", "TP"], ["847", "ASSOCIAZIONE VOLONTARI S. MARCO ONLUS", "Via Cappuccini, 92", "San Marco D'Alunzio", "ME"], ["848", "E.R.A. CITTA' DI ANTILLO E VALLE D'AGRO'", "Via Cesare Battisti, 1", "Antillo", "ME"], ["850", "GRUPPO COMUNALE DI VOLONTARIATO DI PROTEZIONE CIVILE DI TERMINI IMERESE", "Piazza Duomo", "Termini Imerese", "PA"], ["854", "GARIBALDINI A CAVALLO -ODV", "Via Giuseppe Di Matteo, 371", "Castellana Sicula", "PA"], ["856", "CORPO PROTEZIONE AMBIENTALE SICILIA- ODV SEZIONE DI MAZARA DEL VALLO", "Via S.Maria delle Giumarre, 19", "Mazara del Vallo", "TP"], ["858", "NUOVA ACROPOLI FLORIDIA -ODV (ETS)", "Via F. Turati, 60/A", "Floridia", "SR"], ["861", "NUCLEO OPERATIVO EMERGENZA SICILIA O.N.L.U.S.", "S.P. Nunziata Piedimonte, 255", "Mascali", "CT"], ["862", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI MELILLI", "Via Concerie, 1", "Melilli", "SR"], ["866", "RINASCITA VENTIMIGLIESE - ONLUS", "Via Umberto I, 60", "Ventimiglia di Sicilia", "PA"], ["868", "RANGERS INTERNATIONAL DELEGAZIONE 552.021 MOJO ALCANTARA", "Via Vanella Mojo, 19", "Mojo Alcantara", "ME"], ["869", "ELIOS COMITATO PROVINCIALE MESSINA", "V i a N i c o l ò P a t t i , 1 3", "Rometta Marea", "ME"], ["873", "RANGERS INTERNATIONAL - DELEGAZIONE N. 553-010", "Via San Francesco, s.n.c.", "Castiglione di Sicilia", "CT"], ["874", "FRATERNITA MISERICORDIA MISTERBIANCO", "Via V. Veneto, 245", "Misterbianco", "CT"], ["877", "CONFRATERNITA DI MISERICORDIA DI FERLA", "Via Pessina, s.n.c.", "Ferla", "SR"], ["881", "AQUILE DEGLI EREI REGALBUTO", "Via Vittorio Emanuele, 88", "Regalbuto", "EN"], ["883", "ORGANIZZAZIONE EUROPEA VIGILI DEL FUOCO VOLONTARI DI PROTEZIONE CIVILE – DISTACCAMENTO COMUNALE DI", "Via Piazza, 27", "Corleone", "PA"], ["893", "CORLEONE NUCLEO OPERATIVO INTERFORZE SICILIA – VOLONTARI DI PREVENZIONE E PROTEZIONE CIVILE", "C.da Piana", "Sant'Agata di Militello", "ME"], ["895", "CROCE DEL SUD", "Vicolo Pantelleria, 19", "Palermo", "PA"], ["896", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI BAUCINA", "Via Umberto ,78", "Baucina", "PA"], ["898", "ASSOCIAZIONE NAZIONALE VIGILI DEL FUOCO VOLONTARI DELEGAZIONE DI BISACQUINO", "Via Collegio, 9", "Bisacquino", "PA"], ["900", "FRATERNITA DI MISERICORDIA DI SANTA MARIA DI LICODIA", "Via Isonzo, 4", "Santa Maria di Licodia", "CT"], ["907", "ORGANIZZAZIONE NAZIONALE DI VOLONTARIATO GIUBBE D'ITALIA - SEZIONE COMUNALE DI CORLEONE", "Via Federico de Maria, 2", "Corleone", "PA"], ["908", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI CAPO D'ORLANDO", "Via Vittorio Emanuele, 7", "Capo D'orlando", "ME"], ["912", "CONFRATERNITA DI MISERICORDIA DI PATTI", "Via XX Settembre, 34", "Patti", "ME"], ["913", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI LIBRIZZI", "Piazza Catena, 4", "Librizzi", "ME"], ["914", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI SANTA LUCIA DEL MELA", "Via Pietro Nenni", "Santa Lucia del Mela", "ME"], ["917", "RANGERS INTERNATIONAL DELEGAZIONE 552.024 LETOJANNI", "Via IV Novembre, 84", "Letojanni", "ME"], ["918", "ASSOCIAZIONE VOLONTARI DI PROTEZIONE CIVILE - BEATO V. SALANITRO - O.N.L.U.S.", "Cortile Traina, 5", "Ciminna", "PA"], ["919", "ASSOCIAZIONE PREVENZIONE FORESTE SICILIA", "Via Provinciale per Riposto, 34", "Acireale", "CT"], ["923", "PUBBLICA ASSISTENZA SOCCORSO ALCAMO", "Via Ruggero Settimo, 125", "Alcamo", "TP"], ["926", "ASSOCIAZIONE NAZIONALE ANGELI PER LA VITA DELEGAZIONE DI CASTELVETRANO", "Via Gaspare Parrino, 13", "Castelvetrano", "TP"], ["927", "FRATERNITA MISERICORDIA DI ADRANO", "Via Pietro Nenni, 20/E", "Adrano", "CT"], ["931", "PROTEZIONE CIVILE P.A. CALTANISSETTA", "Via Melfa, 19", "Caltanissetta", "CL"], ["933", "ASSOCIAZIONE GUARDIA NAZIONALE O.N.L.U.S.", "Via Umberto", "Francavilla di Sicilia", "ME"], ["934", "ASSOCIAZIONE VOLONTARI DONATORI SANGUE -AVIS", "Piazzetta del Volontariato, 1", "Piazza Armerina", "EN"], ["935", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI SANT'ALFIO", "Via V. Emanuele, 4", "Sant'Alfio", "CT"], ["938", "GRUPPO COMUNALE VOLONTARIATO DELLA PROTEZIONE CIVILE DI CASTELDACCIA", "Piazza Matrice", "Casteldaccia", "PA"], ["939", "ASSOCIAZIONE GIOVANILE RIGENERHA", "Via Rosolino Siragusa, 48", "Montemaggiore Belsito", "PA"], ["940", "ARMERINA EMERGENZA", "Via Don Lorenzo Milani, snc presso Parco Urbano San Pietro", "Piazza Armerina", "EN"], ["941", "A.N.T.R.A.S. - ASSOCIAZIONE NAZIONALE DI NUCLEI OPERATIVI DEL SETTORE DEI TRASPORTI E DELLA PROTEZIONE CIVILE - NUCLEO DI COORDINAMENTO CITTA' DI TRAPANI", "Viale Marche, 15", "Trapani", "TP"], ["943", "ASSOCIAZIONE NAZIONALE S.S.T.- SEARCH AND RESCUE - DELEGAZIONE DI RIBERA - ODV", "C / o V illa Comunale ex Ufficio Agricoltura", "Ribera", "AG"], ["946", "FRATERNITA DI MISERICORDIA DI AUGUSTA", "Via Gramsci, 21/23", "Augusta", "SR"], ["950", "ASSOCIAZIONE DI SOCCORSO E VOLONTARIATO ORIZZONTI", "C.da San Filippo, s.n.c.", "Furnari", "ME"], ["951", "RANGERS INTERNATIONAL DELEGAZIONE 552.027 “KALFA“ ROCCAFIORITA", "Via Fontana Nuova", "Roccafiorita", "ME"], ["952", "FALCHI D'ITALIA", "Piazza M. Guidara", "Sant'Angelo di Brolo", "ME"], ["954", "FRATERNITA MISERICORDIA DI VALVERDE", "Via Calì, 43", "Valverde", "CT"], ["956", "IL SOCCORSO - CAVE DI CUSA - ONLUS", "Via Fiume, 5", "Campobello di Mazara", "TP"], ["959", "CONFRATERNITA DI MISERICORDIA DI MARINEO", "Via Agrigento, 42", "Marineo", "PA"], ["961", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI LASCARI", "Piazza Aldo Moro, 6", "Lascari", "PA"], ["962", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI SALAPARUTA", "Via Regione Siciliana", "", "TP"], ["964", "GRUPPO INTERNAZIONALE VOLONTARIATO ARCOBALENO DELEGAZIONE DI MAZARA DEL VALLO 2010 ODV", "Via Inghilterra, 7", "Mazara del Vallo", "TP"], ["966", "ASSOCIAZIONE ITALIANA BELVEDERE", "Via G.Verga, 24", "Piedimonte Etneo", "CT"], ["968", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE E ANTINCENDIO DI ALTOFONTE", "Piazza Falcone e Borsellino, 18", "Altofonte", "PA"], ["969", "GRUPPO SPELEOLOGICO SANTA ELISABETTA", "Via Rosario Livatino, 2", "Santa Elisabetta", "AG"], ["970", "ASSOCIAZIONE NAZIONALE G.O.E. GRUPPO OPERATIVO DI EMERGENZA", "Via G.Amendola, 22", "Salemi", "TP"], ["976", "ASSOCIAZIONE NAZIONALE VIGILI DEL FUOCO IN CONGEDO - VOLONTARIATO E PROTEZIONE CIVILE – DELEGAZIONE DI MAZARA DEL VALLO", "Via Guglielmo Marconi, 37", "Mazara del Vallo", "TP"], ["977", "ASSOCIAZIONE NAZIONALE S.S.T.- SEARCH AND RESCUE-ODV DELEGAZIONE DI PETROSINO", "Via Lazio, 9", "Petrosino", "TP"], ["978", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI AUGUSTA", "Via Principe Umberto, 89", "Augusta", "SR"], ["981", "P.A. SICILIA EMERGENZA ONE", "Via Piedimonte, 13", "Catania", "CT"], ["982", "PEGASO ONLUS", "Via Pietro Castelli, 284", "Messina", "ME"], ["983", "ASSOCIAZIONE AMBIENTE E SALUTE ONLUS", "Via Siracusa, 15", "Siracusa", "SR"], ["987", "E.R.A. SEZIONE DI CALTANISSETTA", "Villaggio Faina, 8/4", "Campofranco", "CL"], ["988", "PROCIV - ARCI N.P.N. ASSOCIAZIONE VOLONTARI PROTEZIONE CIVILE", "Via E.Toti, 6", "Sommatino", "CL"], ["990", "CASTEL GONZAGA ASSOCIAZIONE VOLONTARIATO PROTEZIONE CIVILE", "Via Montepiselli c/o Parrocchia S.Teresa di Gesù Bambino", "Messina", "ME"], ["995", "CONFRATERNITA DI MISERICORDIA DI CATANIA - PORTO", "Piazza San Francesco di Paola, s.n.", "Catania", "CT"], ["998", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI CARLENTINI", "Via F.Morelli", "Carlentini", "SR"], ["999", "ASSOCIAZIONE EUROPEA OPERATORI POLIZIA - SEZIONE DI PORTO EMPEDOCLE", "Via Marconi, 10", "Porto Empedocle", "AG"], ["1000", "P.A. HUMANITAS TRAPANI ODV", "Via Benedetto Valenza,, 27/A", "Trapani", "TP"], ["1004", "P.A. GRUPPO VOLONTARI PROTEZIONE CIVILE NICOSIA", "Via Bernardo di Falco, 20", "Nicosia", "EN"], ["1007", "CONFRATERNITA DI MISERICORDIA DI PALERMO", "Via Salvatore Corleone, 9", "Palermo", "PA"], ["1008", "O.N.V.G.I. ORGANIZZAZIONE NAZIONALE VOLONTARI GIUBBE D'ITALIA - SEZIONE COMUNALE DI PALAZZO ADRIANO", "Via Vittorio Veneto, 11", "Palazzo Adriano", "PA"], ["1010", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI GRATTERI", "Via delle Scuole", "Gratteri", "PA"], ["1014", "ELIGIO' SOCCORSO", "Vico Fusatina, 11", "Gela", "CL"], ["1015", "ASSOCIAZIONE NAZIONALE SAN MARCO", "Vicolo del Castellaccio, 21", "Palermo", "PA"], ["1024", "GUARDIA MARINA NAZIONALE ONLUS", "Via Filippo Patti, 19", "Palermo", "PA"], ["1025", "ATTIVITA' OPERATIVA DI PROTEZIONE CIVILE E SOCIALE", "Via Normanni, 5", "Palermo", "PA"], ["1029", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI SAN TEODORO", "Via Vittorio Emanuele, 13", "San Teodoro", "ME"], ["1032", "CISAR IQ9PX – SEZIONE DI PANTELLERIA", "Corso Umberto, I", "Pantelleria", "TP"], ["1034", "GRUPPO DI VOLONTARI DELLA PROTEZIONE CIVILE ELIMO ERICINI ODV", "Via Alessandro Volta, 47", "Erice", "TP"], ["1036", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI ACIREALE", "Via Felice Paradiso, 55/B", "Acireale", "CT"], ["1038", "ASSOCIAZIONE NAZIONALE VOLONTARIATO E COMUNICAZIONE SOLIDALE RETE 100 PASSI ODV", "Via Giosuè Carducci, 8", "Palermo", "PA"], ["1043", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI FURCI SICULO", "Via Roma, 56", "Furci Siculo", "ME"], ["1044", "ASSOCIAZIONE NAZIONALE VOLONTARIATO ASSISTENZA SOCCORSO SICILIA", "Via Signore Ritrovato, 4", "Barrafranca", "EN"], ["1047", "ASSOCIAZIONE SICILY PROTEZIONE CIVILE AIDONE", "Via Lorenzo D'Arena, 18", "Aidone", "EN"], ["1051", "O. D.V. ASSOCIAZIONE VOLONTARI PROTEZIONE COSTIERA AMBIENTALE", "Via Don Primo Mazzolari, 101", "Mazara del Vallo", "TP"], ["1052", "FIRE RESCUE ALCAMO", "Via Autonomia Siciliana, 12", "Alcamo", "TP"], ["1053", "CONFRATERNITA DI MISERICORDIA DI PIANA DEGLI ALBANESI", "V i a l e R egione Siciliana Sud-Est, 900", "Palermo", "PA"], ["1054", "ASSOCIAZIONE VOLONTARI DI PROTEZIONE CIVILE AQUILE MONTESERRA", "Via della Regione, 26", "Viagrande", "CT"], ["1056", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI SAN GIOVANNI LA PUNTA", "Piazza Europa, 1", "San Giovanni La Punta", "CT"], ["1063", "VOLONTARI DEL TERZO SETTORE", "Via Polveriera, 63", "Messina", "ME"], ["1067", "ASSOCIAZIONE MISERICORDIA DI ENNA", "Via della Resistenza, 111", "Enna", "EN"], ["1071", "ASSOCIAZIONE ORGANIZZAZIONE VOLONTARI DI PROTEZIONE CIVILE DI MONTELEPRE", "Via Circonvallazione, 98", "Montelepre", "PA"], ["1072", "ASSOCIAZIONE NAZIONALE VIGILI DEL FUOCO IN CONGEDO VOLONTARIATO E PROTEZIONE CIVILE DELEGAZIONE DI PALERMO CITTA'", "Piazzetta Pietro Speciale, 9", "Palermo", "PA"], ["1073", "A.V.I.S.P. - ASSOCIAZIONE VOLONTARI ITALIANI SOCCORSO PRIZZI - A.V.I.S.P. - ONLUS", "Parco Urbano Madonna", "Prizzi", "PA"], ["1078", "CORPO VOLONTARI PER IL SOCCORSO", "Via della Passiflora C.da Manfria", "Gela", "CL"], ["1080", "RANGERS INTERNATIONAL DI S. SALVATORE DI FITALIA", "C.da Scrisera", "San Salvatore di Fitalia", "ME"], ["1081", "PSICOLOGI PER I POPOLI - REGIONE SICILIA", "Via G. D'Annunzio, 52", "Piazza Armerina", "EN"], ["1082", "FRATERNITA DI MISERICORDIA “S. MASSIMILIANO KOLBE “ DI REGALBUTO", "Via Palermo, 4", "Regalbuto", "EN"], ["1083", "CORPO VOLONTARI PROTEZIONE CIVILE LEONFORTE", "Via Zona Torretta (ex scuola elementare)", "Leonforte", "EN"], ["1084", "PENSIAMO IN POSITIVO – ODV PALERMO", "Via C. Airoldi 45/47", "Palermo", "PA"], ["1086", "COMUNIONE FRATERNA", "Via Maddalena, 36", "Messina", "ME"], ["1088", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE CITTA' DI PACHINO", "Via dello Stadio, s.n.c.", "Pachino", "SR"], ["1089", "FRATERNITA DI MISERICORDIA DI SAN GIUSEPPE", "Via Monte Bianco", "Letojanni", "ME"], ["1092", "IL GABBIANO ONLUS", "Via C. Barbagallo, 128", "Acireale", "CT"], ["1093", "SEZIONE DI CATANIA ONLUS DEL C.N.G.E.I", "Piazza Santa Maria della Guardia, 25", "Catania", "CT"], ["1096", "FRATERNITA DI MISERICORDIA DI BELPASSO", "Via A. De Gasperi, 5", "Belpasso", "CT"], ["1098", "ASSOCIAZIONE NAZIONALE S.S.T.( SQUADRE DI SOCCORSO TECNICO) ODV SEARCH AND RESCUE", "Via Oberdan, 42", "Canicattì", "AG"], ["1101", "RANGERS SEZIONE PROVINCIALE DI ENNA", "Via Legnano, 22", "Enna", "EN"], ["1103", "CENTRO CINOAGONISTICO SIRACUSANO", "Strada Carancino, 73", "Siracusa", "SR"], ["1104", "ASSOCIAZIONE DI PROTEZIONE ED EMERGENZE CIVILI INGEGNERI", "Via Francesco Crispi, 120", "Palermo", "PA"], ["1107", "EUROPEAN RADIOAMATEURS ASSOCIATION SEZIONE CITTA' DI MISTRETTA", "Via Libertà, 249", "Mistretta", "ME"], ["1112", "ASSOCIAZIONE NUOVA ACROPOLI ODV", "Via Verona, 19", "Catania", "CT"], ["1115", "N.O.E. - NUCLEO OPERATIVO EMERGENZE", "Via XXIV Maggio, 56", "Messina", "ME"], ["1116", "GRUPPO VOLONTARI ITALIA", "Via Forcile, 5", "Catania", "CT"], ["1118", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI POLLINA POEFI", "Piazza Maddalena", "Pollina", "PA"], ["1120", "RANGERS INTERNATIONAL DELEGAZIONE 556-001 NISCEMI", "Viale Mario Gori, 83", "Niscemi", "CL"], ["1121", "ODV/ETS ASSOCIAZIONE EUROPEA OPERATORI POLIZIA (A.E.O.P.) - SEZIONE COMUNALE DI TRAPANI", "Via Luigi Ferrari, 6/A", "Trapani", "TP"], ["1124", "LE AQUILE DI CATANIA SEZIONE LUIGI RULLO", "Viale Mario Rapisardi, 558", "Catania", "CT"], ["1127", "ORGANIZZAZIONE EUROPEA COORDINAMENTO NAZIONALE VOLONTARIATO E IMPRESA SOCIALE E.T.S. DISTACCAMENTO DI MISILMERI", "Via Madonna del Carmelo, 25", "Misilmeri", "PA"], ["1128", "NUCLEO OPERATIVO INTERFORZE SICILIA VOLONTARI DI PREVENZIONE E PROTEZIONE CIVILE", "Via San Giuseppe, 4", "Gangi", "PA"], ["1132", "MARI E MONTI 2004", "C.da Bagni", "Rometta", "ME"], ["1133", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI LONGI", "Via Roma, 2", "Longi", "ME"], ["1135", "CORPO VOLONTARIO DI SOCCORSO IN MARE", "Viale Mario Rapisardi, 14", "Ispica", "RG"], ["1136", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI SICULIANA", "Via Roma, plesso ex scuola elementare", "Siculiana", "AG"], ["1137", "ASSOCIAZIONE NAZIONALE FINANZIERI D'ITALIA SEZIONE DI AGRIGENTO - PROTEZIONE CIVILE", "Via G. Amendola, 2", "Agrigento", "AG"], ["1140", "CROCE COSTANTINIANA DI SAN GIORGIO - SICILIA - ONLUS", "Piazza Unità d'Italia, 11", "Palermo", "PA"], ["1145", "ORGANIZZAZIONE NAZIONALE DI VOLONTARIATO GIUBBE D'ITALIA – SEZIONE COMUNALE DI SANTA FLAVIA", "Via Antonio Carcione, 3", "Santa Flavia", "PA"], ["1148", "V.A.B. VIGILANZA ANTINCENDI BOSCHIVI", "Via Siracusa, 28", "Scordia", "CT"], ["1150", "AIDONE SOCCORSO", "Via Papa Giovanni XXIII, s.n.c.", "Aidone", "EN"], ["1152", "LABORATORIO VERDE DI FAREAMBIENTE TRAPANI", "Piazza Umberto I, 52", "Trapani", "TP"], ["1154", "AVIS COMUNALE DI VILLAFRATI", "Piazza Fratelli Rosselli, 4/A", "Villafrati", "PA"], ["1157", "ASSOCIAZIONE NAZIONALE DI AZIONE SOCIALE", "Via Veronica Gambara, 6", "Palermo", "PA"], ["1161", "CATANIA SUB", "Via G.D'Annunzio, 77", "Catania", "CT"], ["1162", "CORPO VOLONTARI SICILIA TRINACRIA PROTEZIONE CIVILE AIDONE", "Via Giordano, 36", "Aidone", "EN"], ["1163", "A.C.S.A. ASSOCIAZIONE CROCE SICILIANA ASSISTENZA", "Corso dei Mille, 313", "Palermo", "PA"], ["1164", "CONFRATERNITA DI MISERICORDIA DI RAGALNA", "Piazza Cisterna, 1", "Ragalna", "CT"], ["1165", "A.I.Z.A. GUARDIA NAZIONALE (ASSOCIAZIONE ITTICA- ZOOFILA - AMBIENTALE)", "Via Simone Catalano, 113", "Valderice", "TP"], ["1167", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI PETRALIA SOPRANA", "Piazza del Popolo", "Petralia Soprana", "PA"], ["1168", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI MEZZOJUSO", "Piazza Umberto I, 6", "Mezzojuso", "PA"], ["1169", "CONFRATERNITA DI MISERICORDIA DI SANT'ANGELO DI BROLO", "Piazzale Michele Guidara, s.n.c.", "Sant'Angelo di Brolo", "ME"], ["1171", "CONFRATERNITA DI MISERICORDIA DI CATANIA SANTA CROCE", "Villaggio S.Agata zona B, 26/B", "Catania", "CT"], ["1174", "GUARDIE AMBIENTALI SICILIA", "Villaggio Zia Lisa II, 55", "Catania", "CT"], ["1175", "ASSOCIAZIONE DI VOLONTARIATO AMICI DEL SOCCORSO MONSIGNOR VITO PERNICONE", "Piazza Marconi, 8", "Regalbuto", "EN"], ["1177", "GLI ANGELI", "Via S.Vincenzo De Paoli, 15", "Termini Imerese", "PA"], ["1178", "ASSOCIAZIONE NAZIONALE VIGILI DEL FUOCO IN CONGEDO – DELEGAZIONE DI PARTINICO ODV", "Via Scupara, 13", "Partinico", "PA"], ["1180", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI ALCARA LI FUSI", "Via della Rinascita, 16", "Alcara Li Fusi", "ME"], ["1181", "VIGILANTES", "Largo Pescheria ex Mercato Ittico, s.n.c.", "Termini Imerese", "PA"], ["1182", "ASSOCIAZIONE NAZIONALE NUCLEO OPERATIVO EMERGENZE", "Via A. Bertani, 31", "Castelvetrano", "TP"], ["1183", "ORGANIZZAZIONE DI VOLONTARIATO NOVA MILITIA CHRISTI ORDINE DEI CAVALIERI TEMPLARI GUARDIANI DI PACE", "Via Felice Bisazza, 91", "Messina", "ME"], ["1187", "G.I.V.A. - DELEGAZIONE DI CASTELLANA SICULA ODV", "C.da Passo L'Abate, s.n.c.", "Castellana Sicula", "PA"], ["1189", "ULTREYA PEDARA ODV", "Via dei Garofani, 4", "Pedara", "CT"], ["1190", "ASSOCIAZIONE NAZIONALE MARINAI D'ITALIA", "Via Papa Giovanni Paolo II, 3", "Fiumefreddo di Sicilia", "CT"], ["1191", "ASSOCIAZIONE SOCIALE CULTURALE RICREATIVA RISTOWORLD ITALY", "Via Zia Lisa, 153", "Catania", "CT"], ["1192", "ASSOCIAZIONE EUROPEA OPERATORI POLIZIA GRUPPO VALVERDE ONLUS", "Via Seminara, 32", "Valverde", "CT"], ["1193", "A.V.Y. ASSOCIAZIONE VOLONTARIATO YPSIGRO", "Via Li Volsi, 59", "Castelbuono", "PA"], ["1194", "CONFRATERNITA DI MISERICORDIA DI LIBRINO", "Viale Castagnola, 2", "Catania", "CT"], ["1195", "P.A. ANGELI DEL SOCCORSO", "Strada Palermo, 144", "Trapani", "TP"], ["1197", "COORDINAMENTO ASSOCIAZIONI DI VOLONTARIATO FORZA INTERVENTO RAPIDO", "V iale Castagnola, 2", "Catania", "CT"], ["1198", "ASSOCIAZIONE EUROPEA OPERATORI POLIZIA GRUPPO ITTICO VENATORIO ZOOFILO AMBIENTALE SEZIONE NICOLOSI” (CT)", "Via Giacomo Leopardi, 5", "Nicolosi", "CT"], ["1201", "CONFRATERNITA DI MISERICORDIA DI PRIOLO GARGALLO", "Via del Fico 2/4", "Priolo Gargallo", "SR"], ["1202", "A.E.O.P. ASSOCIAZIONE EUROPEA OPERATORI POLIZIA - SEZIONE AMBIENTALE PALERMO", "Via Ugo la Malfa, 62", "Palermo", "PA"], ["1204", "G.I.V.A. GRUPPO INTERNAZIONALE VOLONTARIATO ARCOBALENO DELEGAZIONE DI TRAPANI – ODV", "Via Tito Livio, 7", "Trapani", "TP"], ["1205", "GUARDIA NAZIONALE A.E.Z.A – ASSOCIAZIONE ECOLOGICA ZOOFILA AMBIENTALE", "C.da Bosco, 499", "Marsala", "TP"], ["1207", "NUOVA ACROPOLI AUGUSTA ODV (ETS)", "Viale Italia, 262", "Augusta", "SR"], ["1208", "LEGAMBIENTE DEI PELORITANI", "C/o CAI Via Natoli, 20", "Messina", "ME"], ["1209", "GRUPPO VOLONTARI SICILIA", "Via Felice Fontana, 23", "Catania", "CT"], ["1212", "A.VO.TE.AM. GRUPPO VOLONTARI PROTEZIONE CIVILE AMBIENTALE E TERRITORIALE", "Via Messina, 142", "Bronte", "CT"], ["1214", "G.I.V.A - GRUPPO INTERNAZIONALE VOLONTARIATO ARCOBALENO DELEGAZIONE DI MARSALA – ODV", "C.da Darà, 422", "Marsala", "TP"], ["1216", "U.G.E.S. S.O.S. PALERMO - URGENTE GESTIONE EMERGENZE SOCIALI E SERVIZI OPERATIVI DI SOCCORSO PALERMO", "Via Alcide de Gasperi, 70", "Palermo", "PA"], ["1217", "ASSOCIAZIONE NAZIONALE VIGILI DEL FUOCO IN CONGEDO VOLONTARIATO E PROTEZIONE CIVILE DELEGAZIONE ZISA", "Via Sebastiano Camarrone, 47/A", "Palermo", "PA"], ["1222", "RIVIVERE A COLORI SAPONARA", "Via Dafne, s.n.c.", "Saponara", "ME"], ["1224", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI LICATA", "P i a zza Progresso, 10", "Licata", "AG"], ["1225", "ASSOCIAZIONE MAGNA VIS", "V i a Marco Polo, 54", "Catania", "CT"], ["1227", "ELPIS NAVE OSPEDALE ONLUS", "Via Generale Domenico Giglio, 3", "Trapani", "TP"], ["1228", "RANGERS INTERNATIONAL DELEGAZIONE 552.029 BROLO", "Via Statale, 38", "Brolo", "ME"], ["1229", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI TORRENOVA", "Via Benedetto Caputo", "Torrenova", "ME"], ["1232", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI PIRAINO", "Via Dante Alighieri, 7", "Piraino", "ME"], ["1233", "GUARDIA NAZIONALE A.E.Z.A", "Via Cavour, 119", "Noto", "SR"], ["1234", "I CARE ONLUS", "Via Malta, 8", "Cefalù", "PA"], ["1235", "ORGANIZZAZIONE PER LA LOGISTICA E MEZZI SPECIALI MAGNA VIS BAGHERIA OdV", "Vicolo Palma, 2", "Bagheria", "PA"], ["1237", "A.I.C.E.S. ASSOCIAZIONE PER L'IMPEGNO CIVILE E SOCIALE", "Via San Lorenzo, 154", "Palermo", "PA"], ["1239", "RANGERS INTERNATIONAL DELEGAZIONE 552.020 GIOIOSA MAREA", "Corso Uliveto", "Gioiosa Marea", "ME"], ["1240", "SAFETY-E.T.S.", "Piazza Stazione, s.n.c.", "Brolo", "ME"], ["1241", "CONFEDERAZIONE G.I.V.A.", "Piazza Graziella Campagna, 13", "Rometta Marea", "ME"], ["1242", "ORGANIZZAZIONE EUROPEA COORDINAMENTO NAZIONALE VOLONTARIATO E IMPRESA SOCIALE ETS", "P i a z z a S t a z i o n e , s . n . c .", "Brolo", "ME"], ["1246", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI POZZALLO", "Viale Australia, s.n.c. c/o centro C.O.M.", "Pozzallo", "RG"], ["1247", "MILO DOG SPORTING", "Via Salemi, 135 c/da Crociferi", "Trapani", "TP"], ["1248", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI FORZA D'AGRO'", "Piazza Giovanni XXIII", "Forza D'Agrò", "ME"], ["1249", "RANGERS INTERNATIONAL DELEGAZIONE 552.001 CASTELL'UMBERTO", "Via Generale Cascino, s.n.c.", "Castell'Umberto", "ME"], ["1250", "GUARDIA COSTIERA AUSILIARIA O.N.L.U.S. - REGIONE SICILIA", "Via Giuseppe La Villa, 11", "Palermo", "PA"], ["1251", "COORDINAMENTO MAGNA VIS - SICILIA", "Piazza Mulini, 13", "Trabia", "PA"], ["1253", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI SCALETTA ZANCLEA", "Piazza Municipio, s.n.c.", "Scaletta Zanclea", "ME"], ["1254", "VOLONTARI ISOLA DI STROMBOLI", "Via Fabio Filzi, 35", "Lipari", "ME"], ["1257", "ASSISTENZA E VOLONTARIATO SOLIDALE", "Via Vittorio Emanuele, 58", "Montelepre", "PA"], ["1259", "I FALCHI - ONLUS DI PROTEZIONE CIVILE E VIGILANZA AMBIENTALE (ENTE UMANITARIO )", "Via Capitini, 46", "Palma di Montechiaro", "AG"], ["1261", "GUARDIA COSTIERA AUSILIARIA CENTRO OPERATIVO DI SCIACCA", "Via Marche, 3", "Sciacca", "AG"], ["1262", "NEW CITTA' DI CATANIA – ONLUS", "Via Cardi, 98/100", "Catania", "CT"], ["1264", "P.A. EUROSOCCORSO – ODV", "Piazzale Papa Giovanni II", "Trapani", "TP"], ["1265", "ODV FLY TEAM", "Strada Brisciano, 21 C/da Marausa", "Misiliscemi", "TP"], ["1266", "ORGANIZZAZIONE EUROPEA COORDINAMENTO NAZIONALE VOLONTARIATO IMPRESA SOCIALE ETS – DISTACCAMENTO DI MESSINA", "Via La Farina, 280", "Messina", "ME"], ["1267", "GRUPPO VOLONTARIO DI PROTEZIONE CIVILE DELL'ASSOCIAZIONE NAZIONALE DELLA POLIZIA DI STATO- SEZIONE DI CATANIA", "Via Monsignor Ventimiglia,18", "Catania", "CT"], ["1268", "COMUNITA' MASCI MESSINA 3 – STELLA POLARE", "Via Comunale Santo, s.n. c/o parrocchia S. Maria della Consolazione", "Messina", "ME"], ["1269", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI LIPARI", "Piazza Mazzini, 1", "Lipari", "ME"], ["1270", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI RACCUJA", "Piazza 2 Giugno, 1", "Raccuja", "ME"], ["1273", "ASSOCIAZIONE RADIOAMATORI PELORITANI – ODV", "Via Scite, 13 – 9b scala C", "Messina", "ME"], ["1274", "FRATERNITA DI MISERICORDIA DI CATANIA", "Via Etnea, 595", "Catania", "CT"], ["1276", "G.E.P.A.- SICILIA-ODV", "Via Centamore, 159", "Biancavilla", "CT"], ["1277", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI PALMA DI MONTECHIARO", "Via Fiorentino, 89", "Palma di Montechiaro", "AG"], ["1278", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI GRAMMICHELE", "Piazza Carlo Maria Carafa, 1", "Grammichele", "CT"], ["1279", "GRUPPO INTERNAZIONALE VOLONTARIATO ARCOBALENO – G.I.V.A DELEGAZIONE DI PARTANNA – ODV", "Via Palermo, 126", "Partanna", "TP"], ["1280", "MISERICORDIA DI MAZARA DEL VALLO – SAN VITO", "Via Giotto, 23", "Mazara del Vallo", "TP"], ["1282", "ASSOCIAZIONE NAZIONALE VIGILI DEL FUOCO IN CONGEDO -DELEGAZIONE TORRETTA ODV", "Via S.Quasimodo, 20", "Torretta", "PA"], ["1284", "GRUPPO COMUNALE VOLONTARITO DI PROTEZIONE CIVILE DI VILLAFRANCA TIRRENA", "Via Don Luigi Sturzo, 3", "Villafranca Tirrena", "ME"], ["1285", "M.A.S.C.I. PALERMO 3 AQUILE RANDAGIE", "Via Mura di San Vito, 12", "Palermo", "PA"], ["1287", "CROCE BIANCA", "Via Pelligra, s.n.c.", "Misilmeri", "PA"], ["1288", "GUARDIA COSTIERA VOLONTARIA C. O. MESSINA", "Via Consolare Pompea – Località Fortino, s.n.", "Messina", "ME"], ["1289", "FRATERNITA' DI MISERICORDIA DI GIARRE", "Piazza Ungheria, 11", "Giarre", "CT"], ["1290", "FARMACISTI VOLONTARI PER LA PROTEZIONE CIVILE SEZ IONE CATANIA", "Via G. D'Annunzio, 43/A", "Catania", "CT"], ["1292", "CROCE ROSSA ITALIANA COMITATO DI CATANIA", "Via Etnea, 353", "Catania", "CT"], ["1293", "ASSOCIAZIONE NAZIONALE VIGILI DEL FUOCO IN CONGEDO VOLONTARIATO E PROTEZIONE CIVILE - COORDINAMENTO REGIONALE SICILIA", "P i a z z e tta Pietro Speciale, 9", "Palermo", "PA"], ["1294", "CROCE ROSSA ITALIANA - COMITATO DI PALERMO", "Via Pietro Nenni, 75", "Palermo", "PA"], ["1295", "TRISCELE NUCLEO PROTEZIONE CIVILE AUTONOMA SICILIANA", "Via Fratelli Campo, 46", "Palermo", "PA"], ["1296", "P.A EMERGENCY LIFE", "Via Firenze, 6", "Porto Empedocle", "AG"], ["1300", "S.S.T. SQUADRE DI SOCCORSO TECNICO – DELEGAZIONE CINOFILI ARCHIMEDE SIRACUSA ODV", "Via Romagna, 41", "Siracusa", "SR"], ["1301", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI MOTTA SANT'ANASTASIA", "Piazza Umberto, 22", "Motta Sant'Anastasia", "CT"], ["1303", "ASSOCIAZIONE PUBBLICA ASSISTENZA TUTELA AMBIENTE VOLONTARIATO E PROTEZIONE CIVILE PALERMO 4", "Passaggio Gino Marinuzzi, 4", "Palermo", "PA"], ["1305", "ASSOCIAZIONE VOLONTARI NUCLEO OPERATIVO VALLE JATO", "Via Acquanuova, 44", "San Giuseppe Jato", "PA"], ["1306", "ASSOCIAZIONE NAZIONALE VIGILI DEL FUOCO IN CONGEDO DELEGAZIONE DI BAGHERIA 1 ODV", "Via Giuseppe Mulè, 43", "Bagheria", "PA"], ["1308", "ASSOCIAZIONE NAZIONALE PUBBLICA ASSISTENZA E PROTEZIONE CIVILE LUCE", "Via Domenico La Bruna, 1", "Trapani", "TP"], ["1310", "G.I.V.A. - GRUPPO INTERNAZIONALE VOLONTARIATO ARCOBALENO - DELEGAZIONE COMUNALE DI PACECO", "Via L.Ariosto, 26", "Paceco", "TP"], ["1312", "GUARDIA COSTIERA AUSILIARIA DI TRAPANI- ODV", "Via Giuseppe La Russa, 28", "Erice", "TP"], ["1315", "A.C.S. ASSOCIAZIONE CANI DA SALVATAGGIO", "Via Apollo, 34", "Palermo", "PA"], ["1316", "A.E.Z.A. GUARDIA NAZIONALE COMANDO PROVINCIALE MONREALE", "Via Casale Settimo, 6/Q", "Palermo", "PA"], ["1319", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI LENI", "Via Libertà, 33", "Leni (Isola Salina)", "ME"], ["1323", "CROCE ROSSA ITALIANA - COMITATO DEL TIRRENO NEBRODI", "Piazza Stazione, s.n.c.", "Brolo", "ME"], ["1324", "CROCE ROSSA ITALIANA – COMITATO DI MILAZZO - ISOLE EOLIE – ODV", "Via San Paolino, 1", "Milazzo", "ME"], ["1325", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI PIETRAPERZIA", "Via San Domenico, 9", "Pietraperzia", "EN"], ["1326", "P.A. PROCIVIS", "Via Barrile, 9", "Licata", "AG"], ["1327", "TYNDARIS ONLUS", "Via Case Nuove Russo, 5", "Patti", "ME"], ["1328", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI SAVOCA", "Piazza D'Annunzio, 1", "Savoca", "ME"], ["1330", "NUCLEO OPERATIVO INTERFORZE SICILIA", "Via Suffia, 11", "Aidone", "EN"], ["1331", "CROCE ROSSA ITALIANA- COMITATO DI CALTANISSETTA", "Via Xiboli, 345 ex stabilimento Averna", "Caltanissetta", "CL"], ["1332", "PUBBLICA ASSISTENZA PROCIVIS DI RIPOSTO", "Via Archimede, s.n.", "Riposto", "CT"], ["1333", "ASSOCIAZIONE PROTEZIONE CIVILE SECURITY", "Via dei Peloritani, 118", "Biancavilla", "CT"], ["1335", "RANGER SEZIONE PROVINCIALE DI CATANIA", "C.da Pernicotto", "Adrano", "CT"], ["1336", "ORGANIZZAZIONE EUROPEA VOLONTARI DI PREVENZIONE E PROTEZIONE CIVILE- DISTACCAMENTO DI SANT'AGATA DI MILITELLO", "Via Duca D'Aosta, 66", "Sant'Agata di Militello", "ME"], ["1337", "C.O.E.S. COORDINAMENTO OPERATIVO EMERGENZE", "Via Oliveto I, 30", "Sant'Agata di Militello", "ME"], ["1338", "V.A.B. VIGILANZA ANTINCENDI BOSCHIVI SICILIA", "Viale Madre Teresa di Calcutta, s.n.c.", "Mineo", "CT"], ["1339", "UNITI PER LA VITA", "Corso Umberto, 94", "Sciara", "PA"], ["1340", "ASSOCIAZIONE NAZIONALE VIGILI DEL FUOCO IN CONGEDO CARINI ODV", "Via Pastificio, 5/A", "Carini", "PA"], ["1341", "ASSOCIAZIONE NAZIONALE VOLONTARIATO E COMUNICAZIONE SOLIDALE SFERRACAVALLO ODV", "Via Tabò, 39", "Palermo", "PA"], ["1342", "GRUPPO COMUNALE DI VOLONTARIATO DI PROTEZIONE CIVILE DI PANTELLERIA", "Piazza Cavour, 15", "Pantelleria", "TP"], ["1343", "A.R.I. CASTELVETRANO", "Via Piersanti Mattarella, 110", "Castelvetrano", "TP"], ["1344", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI SALEMI", "Via San Matteo", "Salemi", "TP"], ["1345", "ASSOCIAZIONE NAZIONALE CARABINIERI SEZIONE DI MESSINA GRUPPO DI FATTO ODV", "Via San Giovanni di Malta, 1/B", "Messina", "ME"], ["1347", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI SAN CATALDO", "Piazza Papa Giovanni XXIII", "San Cataldo", "CL"], ["1348", "GUARDIA COSTIERA AUSILIARIA ONLUS CENTRO REGIONALE DELLA SICILIA -GRUPPO OPERATIVO DI LICATA", "Via Martiri della Libertà, 21", "Licata", "AG"], ["1350", "ROYAL WOLF RANGERS", "Via Fratelli Belleo, 58/B", "Ragusa", "RG"], ["1351", "ITALIAN HELP SYSTEM FOR LIFE - IHS ODV", "V i a A . Sangiuliano, 319/321", "Catania", "CT"], ["1354", "PSICOLOGI PER I POPOLI SICILIA - ODV", "Via Maletto, 3", "Palermo", "PA"], ["1356", "ERA ACQUEDOLCI", "Via Dante, 28", "Acquedolci", "ME"], ["1357", "EUROPEAN RADIOAMATEURS ASSOCIATION – E.R.A. SEZIONE PROVINCIALE DI AGRIGENTO", "Via Michelangelo, 3", "Santa Margherita del Belice", "AG"], ["1360", "IL CAMMINO", "Via Leonardo da Vinci, 20", "Ragalna", "CT"], ["1361", "ASSOCIAZIONE NUCLEO OPERATIVO ASSISTENZA E SOCCORSO", "Via S. D'Acquisto, s.n.", "Castellammare del Golfo", "TP"], ["1362", "GUARDIA RURALE AUSILIARA CATANIA ODV", "Via Fontanelle, 94", "Caltagirone", "CT"], ["1364", "CROCE ROSSA ITALIANA - COMITATO MASCALUCIA ODV", "Via Francesco Petrarca, 26", "Mascalucia", "CT"], ["1365", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI MARIANOPOLI", "Viale della Regione Siciliana, 5", "Marianopoli", "CL"], ["1366", "FLY TEAM DELEGAZIONE CASTELLAMMARE DEL GOLFO", "Via Segesta, 11", "Castellammare del Golfo", "TP"], ["1367", "ASSOCIAZIONE DI VOLONTARIATO E PROTEZIONE CIVILE GODRANO", "Via Raffaele Jozzino, s.n.c.", "Godrano", "PA"], ["1368", "EVERGREEN", "Via San Giuseppe, 38", "Monreale", "PA"], ["1369", "ANVCS GUARDIE AMBIENTALI ODV", "Via Costanza, 26", "Borgetto", "PA"], ["1370", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI ISNELLO", "Corso Vittorio Emanuele, 14", "Isnello", "PA"], ["1371", "OVERLAND", "Via Domenico Faucello, 16/B", "Messina", "ME"], ["1372", "A.R.E. ASSOCIAZIONE RADIOAMATORI EOLIANI", "Via Culia, s.n.c.", "Lipari", "ME"], ["1373", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI GIBELLINA", "Via Luigi Sturzo, 1", "Gibellina", "TP"], ["1374", "RANGERS D’ITALIA SEZIONE SICILIA ODV", "Via Padre Giordano Cascini, s.n.", "Palermo", "PA"], ["1375", "GIUBBE VERDI COMPAGNIA DI CASTROFILIPPO -ODV", "Via Michelangelo, 9", "Castrofilippo", "AG"], ["1376", "CONFRATERNITA DI MISERICORDIA DI ROSOLINI ODV", "Via Maltese, 65", "Rosolini", "SR"], ["1377", "COORDINAMENTO ZONALE DELLE MISERICORDIE CATANIA -ODV", "Via Pizzo Ferro, 5", "Pedara", "CT"], ["1378", "ASSOCIAZIONE NAZIONALE SST NPCA CASTELDACCIA ODV", "Via Strada Quattro Finaite, 4", "Casteldaccia", "PA"], ["1379", "NUCLEO OPERATIVO INTERFORZE SICILIA – VOLONTARI DI PREVENZIONE E PROTEZIONE CIVILE", "Via Vittorio Emanuele, 7", "Castel di Lucio", "ME"], ["1380", "COMPAGNIA GIUBBE VERDI S. CROCE DI CASTELTERMINI -ODV", "Via G.Matteotti, s.n .", "Casteltermini", "AG"], ["1381", "G.I.V.A. DELEGAZIONE MAZARA DEL VALLO 2019 – ODV", "Via del Fenicottero, 15", "Mazara del Vallo", "TP"], ["1382", "A.N.GI.V. SICILIA ODV", "Via Scibilia, 1", "Bronte", "CT"], ["1383", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI MONTALBANO ELICONA", "Piazza Maria SS.della Provvidenza, s.n.c.", "Montalbano Elicona", "ME"], ["1384", "ASSOCIAZIONE NAZIONALE VIGILI DEL FUOCO IN CONGEDO DELEGAZIONE DI CONTESSA ENTELLINA", "Via Cucci, 23", "Contessa Entellina", "PA"], ["1385", "SDAV – SECURITY DEPARTMENT ASSOCIAZIONE DI VOLONTARIATO - ODV", "Via Antonio Mongitore, 1", "Agrigento", "AG"], ["1387", "ODV- ASSOCIAZIONE VOLONTARI PROTEZIONE CIVILE BUTERA", "Via Boscaglia, 1", "Butera", "CL"], ["1388", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI CASTRONOVO DI SICILIA", "Vioa Luigi Tirrito, 1", "Castronovo di Sicilia", "PA"], ["1389", "GRUPPO INTERNAZIONALE DEL VOLONTARIATO ARCOBALENO DELEGAZIONE DI VALDINA – ODV", "Via San Nicola, 40/B", "Valdina", "ME"], ["1390", "PUBBLICA ASSISTENZA PROTEZIONE CIVILE NISSORIA", "Via Torre, s.n.c.", "Nissoria", "EN"], ["1391", "AFCT ASSOCIAZIONE FALCO CATANIA – ODV", "Via Spoto, 28", "Catania", "CT"], ["1392", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI RAGALNA", "Via Claudio Monteverdi, 2", "Ragalna", "CT"], ["1393", "ASSOCIAZIONE ITALIANA DELLA CROCE ROSSA COMITATO DI ENNA", "Via Legnano, 22 bis", "Enna", "EN"], ["1394", "G.I.V.A. GRUPPO INTERNAZIONALE VOLONTARIATO ARCOBALENO – DELEGAZIONE DI SALEMI", "Via Monaci, 45", "Salemi", "TP"], ["1395", "CORPO DI PUBBLICA ASSISTENZA PROTEZIONE CIVILE TEMPLARE FEDERICIANA ODV", "Via Alessandro Italia, s.n.c.", "Palazzolo Acreide", "SR"], ["1396", "GUARDIE TERRITORIALI E.T.S.", "V ia G. Crispi, 131", "Palermo", "PA"], ["1397", "VERA ODV", "Via Alfredo Maria Mazzei, 14", "Nicolosi", "CT"], ["1398", "OASI DEL CAVALLO ENGEA GARIBALDINI VOLONTARI", "Via Ceraulo, 23", "Monreale", "PA"], ["1399", "ODV GANZARIA EMERGENZA", "Via Salvatore Lo Tauro, 10", "San Michele di Ganzaria", "CT"], ["1400", "COORDINAMENTO TERRITORIALE VOLONTARIATO PROTEZIONE CIVILE E SOCIALE CO.TE.R ODV", "Via Normanni, 5", "Palermo", "PA"], ["1401", "E.R.A. (EUROPEAN RADIOAMATEURS ASSOCIATION) -SEZIONE DI CORLEONE ODV", "Via Salvatore Aldisio, 161", "Corleone", "PA"], ["1402", "ASSOCIAZIONE VIGILI DEL FUOCO VOLONTARI SEZIONE DI ENNA", "Via Basilicata, 6", "Troina", "EN"], ["1405", "ATTIVITA' OPERATIVA PROTEZIONE CIVILE E SOCIALE ODV", "Via Vinciguerra, 35", "Polizzi Generosa", "PA"], ["1406", "SERVIZI PROTEZIONE CIVILE E SOCIALE ODV", "Via Bergamo, 27", "Palermo", "PA"], ["1407", "O.A.S.S. DELLA CROCE GIOVANNEA ODV – SEZIONE DI BORGETTO (PA)", "Via della Resistenza, 3", "Borgetto", "PA"], ["1408", "GRUPPO COMUNALE VOLONTARI DI PROTEZIONE CIVILE DI OLIVERI", "Piazza Luigi Pirandello, 1", "Oliveri", "ME"], ["1409", "NUCLEO PROTEZIONE CIVILE SANTA MARIA DI LICODIA ODV", "Strada Trainara, 3", "Santa Maria di Licodia", "CT"], ["1410", "NOIS ODV MILITELLO ROSMARINO NUCLEO OPERATIVO INTERFORZE SICILIA", "C.da Santa Maria, s.n.", "Militello Rosmarino", "ME"], ["1411", "RANGERS INTERNATIONAL DELEGAZIONE PIRAINO", "Via Dante Alighieri, 16", "Piraino", "ME"], ["1412", "AMBULANZE MESSINA SOCCORSO ODV", "Via Edoardo Boner, isolato 480, 35", "Messina", "ME"], ["1414", "ASSOCIAZIONE NAZIONALE ELIOS DELEGAZIONE COMUNALE DI ROCCAVALDINA ODV", "Via Panoramica, 6", "Roccavaldina", "ME"], ["1415", "APS DIPARTIMENTO SOLIDARIETA' EMERGENZE FIC SICILIA", "Via Sardegna, 36", "Enna", "EN"], ["1416", "NOIS ODV CAPIZZI NUCLEO OPERATIVO INTERFORZE SICILIA", "Via Piazza San Giacomo, 1", "Capizzi", "ME"], ["1417", "CORPO SANITARIO EMERGENZA E SOCCORSO ODV - ETS", "Corso IV aprile, 11", "Misilmeri", "PA"], ["1418", "ARI RAGUSA ODV ASSOCIAZIONE RADIOAMATORI ITALIANI", "Via S.P. 2 5 k m 6 + 450 c.da T r ib a st o n e", "Ragusa", "RG"], ["1419", "VIGILANZA AMBIENTALE PELORITANI ODV", "Viale della Pace, 12", "Monforte San Giorgio", "ME"], ["1420", "CROCE ROSSA ITALIANA- COMITATO DI ACIREALE - ODV", "Via Lazzaretto, 14 B/C", "Acireale", "CT"], ["1421", "ASSOCIAZIONE NAZIONALE VIGILI DEL FUOCO VOLONTARI DELEGAZIONE DI SALEMI", "C.da Gorgazzo, s.n.c.", "Salemi", "TP"], ["1422", "ODV GRUPPO DI VOLONTARIATO – PROTEZIONE CIVILE E AMBIENTALE ASSOCIAZIONE NAZIONALE DEL FANTE SEZIONE PROVINCIALE DI PALERMO", "Piazza San Francesco di Paola, 37", "Palermo", "PA"], ["1423", "ORGANIZZAZIONE PER LA LOGISTICA E MEZZI SPECIALI MAGNAVIS ODV- GRUPPO MONFORTE SAN GIORGIO", "Viale della Pace, 12", "Monforte San Giorgio", "ME"], ["1424", "CROCE ROSSA ITALIANA- COMITATO DI ROCCALUMERA E TAORMINA", "Via Collegio, 1", "Roccalumera", "ME"], ["1425", "G.I.V.A. GRUPPO INTERNAZIONALE VOLONTARIATO ARCOBALENO DELEGAZIONE DI ROMETTA", "Piazza Graziella Campagna, 13", "Rometta", "ME"], ["1426", "CROCE ROSSA ITALIANA- COMITATO DI TRAPANI", "Viale delle Province Casa Santa", "Erice", "TP"], ["1427", "ASS. ALBATROSA PACECO 2024 – ODV – SICILIA", "Via Marsala, 54", "Paceco", "TP"], ["1428", "CROCE ROSSA ITALIANA - COMITATO DI ALCAMO", "Strada Statale 113 km 326,00, 47", "Alcamo", "TP"], ["1429", "FIF SICILIA 4x4 – PROTEZIONE CIVILE", "XIII Traversa, 41", "Belpasso", "CT"], ["1430", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI LINGUAGLOSSA", "Piazza Municipio, 23", "Linguaglossa", "CT"], ["1431", "ASSOCIAZIONE NAZIONALE VIGILI DEL FUOCO IN CONGEDO – DELEGAZIONE DI CUSTONACI ODV", "Via Scucina, 150", "Custonaci", "TP"], ["1432", "ASSOCIAZIONE NAZIONALE VIGILI DEL FUOCO IN CONGEDO - DELEGAZIONE DI VALDERICE ODV", "Piazza G.Verdi, s.n.c.", "Valderice", "TP"], ["1433", "OPERE DI ASSISTENZA SOCCORSO E SOLIDARIETA' DELLA CROCE GIOVANNEA SEZIONE DI CINISI ETS – ODV", "Piazza Pietro Venuti, s.n.c.", "Cinisi", "PA"], ["1434", "NEW GIOIOSA SOCCORSO ODV", "Via Umbero I, 66", "Gioiosa Marea", "ME"], ["1435", "ASSOCIAZIONE NAZIONALE CARABINIERI COORDINAMENTO REGIONALE SICILIA ODV", "Piazza degli Aragonesi, 19/A", "Palermo", "PA"], ["1436", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI BLUFI", "Piazza Municipio, 1", "Blufi", "PA"], ["1437", "ASSOCIAZIONE NAZIONALE S.S.T. SEARCH AND RESCUE", "Via G.Oberdan, 42", "Canicattì", "AG"], ["1438", "ORGANIZZAZIONE NAZIONALE GIUBBE D'ITALIA VOLONTARIATO - ODV SEZIONE PALERMO", "Via Calogero Nicastro, 1", "Palermo", "PA"], ["1439", "SOCCORIAMOLI ODV", "Via del Santo, 52", "Messina", "ME"], ["1440", "PIAZZA ARMERINA SOCCORSO-ODV", "Via Nino Martoglio, 2", "Piazza Armerina", "EN"], ["1441", "CNGEI SEZIONE SCOUT DI NISCEMI BADEN POWELL – APS", "Via Asti, s.n.c.", "Niscemi", "CL"], ["1442", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI S. STEFANO DI QUISQUINA", "Via Roma, 142", "Santo Stefano Quisquina", "AG"], ["1443", "GUARDIA COSTIERA AUSILIARIA CENTRO OPERATIVO DELLE ISOLE EOLIE LIPARI ODV", "Via Vittorio Emanuele, 30", "Lipari", "ME"], ["1444", "ORGANIZZAZIONE NAZIONALE VOLONTARIATO GIUBBE D'ITALIA ODV SEZIONE BAGHERIA", "Via Mulè, 2", "Bagheria", "PA"], ["1445", "ASSOCIAZIONE UNIONE NAZIONALE ARMA CARABINIERIVOLONTARIATO E PROTEZIONE CIVILE ODV – DELEGAZIONE DI LICATA", "Via Della Salvia, 26", "Licata", "AG"], ["1446", "ASSOCIAZIONE ITALIANA SICUREZZA AMBIENTALE “ODV”", "Via Rocca, 21", "Licata", "AG"], ["1447", "SALEMI SOCCORSO", "C.da Filci, 1083", "Trapani", "TP"], ["1448", "RANGERS INTERNATIONAL ODV DELEGAZIONE DI PATTI", "Via Cattaneo, 14", "Patti", "ME"], ["1449", "ARI-SEZIONE DI TERMNI IMERESE ODV", "Via Capaci, 11", "Bagheria", "PA"], ["1450", "RANGERS INTERNATIONAL DELEGAZIONE DI MOTTA D'AFFERMO ODV", "Via Santa Maria, 5", "Motta D'Affermo", "ME"], ["1451", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI CORLEONE", "Piazza Garibaldi, 1", "Corleone", "PA"], ["1452", "ASSOCIAZIONE NAZIONALE CARABINIERI – NUCLEO REGIONALE DI VOLONTARIATO E PROTEZIONE CIVILE – ISPETTORATO SICILIA ODV", "Piazza degli Aragonesi, 19/A", "Palermo", "PA"], ["1453", "CORPO NAZIONALE GUARDIA AI FUOCHI – G.O.I.-GUARDIA AI FUOCHI ETS/ODV", "Via Giove c/da Serroni, 2", "Mazara del Vallo", "TP"], ["1454", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI BRONTE", "Via Arcangelo Spedalieri, 40", "Bronte", "CT"], ["1455", "RANGERS INTERNATIONAL DISTRETTO 055 SICILIA O.D.V.", "Via Generale Cascino", "Castell'Umberto", "ME"], ["1456", "S.S.T. ODV SQUADRE DI SOCCORSO TECNICO – DELEGAZIONE DI PORTO EMPEDOCLE", "Via Siracusa, 12", "Porto Empedocle", "AG"], ["1457", "ORGANIZZAZIONE PER LA LOGISTICA E MEZZI SPECIALI “MAGNA VIS”- GRUPPO LOCALE DI PALAZZO ADRIANO", "C.da Aicella, s.n.c.", "Palazzo Adriano", "PA"], ["1459", "ASSOCIAZIONE PROMOZIONE SOCIALE GUARDIE AMBIENTALI EUROPEE E PROTEZIONE CIVILE", "Via A. De Gasperi, 52", "Trappeto", "PA"], ["1460", "ASSOCIAZIONE I FALCHI DELEGAZIONE DI SCIACCA -ODV", "Cortile Liguori, 63", "Sciacca", "AG"], ["1461", "ASSOCIAZIONE NAZIONALE VOLONTARIATO E COMUNICAZIONE SOLIDALE VILLABATE PFP ODV", "Via Giuseppe Mazzini, 1", "Villabate", "PA"], ["1462", "S.E.A. SERVIZI EMERGENZA ASSISTENZIALI", "Via Antonio Marinuzzi, 145", "Palermo", "PA L"], ["1463", "ASSOCIAZIONE NAZIONALE DI VOLONTARIATO DI PROTEZIONE CIVILE AQUILE", "Via Puglia, 1", "Campofelice di Roccella", "PA"], ["1464", "ODV PROCIV SANITA' BASCHI NERI", "Via Briseide, 1", "Palermo", "PA"], ["1466", "CROCE ROSSA ITALIANA – COMITATO DI MAZARA DEL VALLO ODV", "Corso Armando Diaz, 113", "Mazara del Vallo", "TP"], ["1468", "GUARDIA SICILIANA AMBIENTALE", "Via Foibe Istriane, 3", "Gravina di Catania", "CT"], ["1469", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI TERME VIGLIATORE", "Via del Mare n. 69", "Terme Vigliatore", "ME"], ["1470", "ASSOCIAZIONE ITALIANA PROTEZIONE ANIMALI A.I.P.A. - APS", "Via Serve della Divina Provvidenza, 18", "Catania", "CT"], ["1471", "GRUPPO DI VOLONTARIATO E PROTEZIONE CIVILE DELLA ASSOCIAZIONE NAZIONALE POLIZIA DI STATO", "Via Canonico Nunzio Agnello, 17", "Siracusa", "SR"], ["1472", "RANGERS INTERNATIONAL DELEGAZIONE HIDRA", "Via Dei Combattenti, 18", "Francofonte", "SR"], ["1473", "ASSOCIAZIONE VOLONTARI DI PROTEZIONE CIVILE FERLA ODV", "Via Calvario, 1", "Ferla", "SR"], ["1474", "ASSOCIAZIONE RANGERS INTERNATIONAL DELEGAZIONE TERRE SICANE SAMBUCA DI SICILIA", "Via Stazione, 44", "Sambuca di Sicilia", "AG"], ["1475", "CROCE ROSSA ITALIANA – COMITATO DI AVOLA ODV", "Via Santa Lucia, 86", "Avola", "SR"], ["1476", "ASSOCIAZIONE VOLONTARI EOLIE ORGANIZZAZIONE DI VOLONTARIATO", "Vicolo Diana, s.n.c.", "Lipari", "ME"], ["1477", "ON.V.G.I. SEZIONE DI TRAPANI", "Via Vincenzo Fazio, 22 Fulgatore", "Trapani", "TP"], ["1478", "AVIS PROVINCIALE AGRIGENTO", "Via Pompei, snc", "Sciacca", "AG"], ["1479", "GRUPPO SOCCORRITORI ONLUS", "Via Nicolò della Valle, 123", "Alcamo", "TP"], ["1480", "SEZIONE E.R.A. DI ALTAVILLA MILICIA ODV", "C.da Piano Olivo, s.n.c.", "Altavilla Milicia", "PA"], ["1481", "ASSOCIAZIONE DI VOLONTARIATO PER LA PROTEZIONE CIVILE (P.C.B.)", "Via Castriota, 60", "Biancavilla", "CT"], ["1482", "ASSOCIAZIONE RADIOAMATORI ITALIANI SEZIONE DI AGRIGENTO ODV", "Via Diodoro Siculo, 1", "Agrigento", "AG"], ["1483", "RANGERS INTERNATIONAL O.D.V. DELEGAZIONE DI LONGI", "Via F. Cottone, 13", "Longi", "ME"], ["1484", "SPELEO TEAM TRAPANI ETS", "Via Case di Grazia, 14", "Valderice", "TP"], ["1485", "NUOVA ACROPOLI RAGUSA ODV", "Via Del Gelso, 41", "Ragusa", "RG"], ["1486", "ASS. NUCLEO OPERATIVO PROTEZIONE CIVILE EMERGENZA AMBIENTALE O.D.V. (N.O.P.C.E.A.)", "Via Venuti, 7", "Cinisi", "PA"], ["1487", "PROTEZIONE CIVILE – ASSOCIAZIONE NAZIONALE BERSAGLIERI NUCLEO DI PALERMO ODV", "Via Galileo Galilei, 72", "Palermo", "PA"], ["1488", "ASSOCIAZIONE NUCLEO OPERATIVO VOLONTARI DI PROTEZIONE CIVILE ED EMERGENZA AMBIENTALE N.O.P.C.E.A. CARINI ODV", "Via Antonio Gagini, 44", "Carini", "PA"], ["1489", "C.N.G.E.I. SEZIONE SCOUT RAGUSA APS", "Via Diaz, 25", "Ragusa", "RG"], ["1490", "NUCLEO SOMMOZZATORI E SOCCORSO ACQUATICO DI PROTEZIONE CIVILE REGIONE SICILIA ODV", "Via Libertà, 129", "Isola delle Femmine", "PA"], ["1491", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI CASSARO", "Via Regina Margherita, 112", "Cassaro", "SR"], ["1492", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI SCICLI", "Via F. M. Penna, 2", "Scicli", "RG"], ["1493", "ASSOCIAZIONE CIVICI VOLONTARI ANTINCENDIO XIRBI", "C.da Pescazzo, s.n.c.", "Caltanissetta", "CL"], ["1494", "E.R.A. EUROPEAN RADIOAMATEURS ASSOCIATION - CITTA DI NASO ODV", "Via Marconi, 2", "Naso", "ME"], ["1495", "G.I.V.A. - GRUPPO INTERNAZIONALE VOLONTARIATO ARCOBALENO - DELEGAZIONE DI MESSINA -ODV", "Via Janni, 1A", "Messina", "ME"], ["1496", "PROTEZIONE CIVILE SANTO STEFANO QUISQUINA ODV", "Via Teatro, 6", "Santo Stefano Quisquina", "AG"], ["1497", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI CAMPOREALE", "Via Marco Minghetti, 85", "Camporeale", "PA"], ["1498", "PROTEZIONE CIVILE ANB NUCLEO DI TERME VIGLIATORE", "C.da Franchini, 3", "Terme Vigliatore", "ME"], ["1499", "ASSOCIAZIONE NAZIONALE S.S.T. “SEARCH AND RESCUE” ODV DELEGAZIONE MELILLI (SR)", "C.da Passo di Siracusa, s.n.c.", "Melilli", "SR"], ["1500", "ORGANIZZAZIONE DI VOLONTARIATO CROCE SOFIA", "Via Giacomo Besio, 123", "Palermo", "PA"], ["1501", "CROCE ROSSA ITALIANA - COMITATO DI FIUMEFREDDO DI SICILIA", "Via Nino Martoglio, 3", "Fiumefreddo di Sicilia", "CT"], ["1502", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI CAMMARATA", "Via Roma, s.n.c.", "Cammarata", "AG"], ["1503", "ORATORIO SALESIANO RAGUSA ADS- APS", "Corso Italia, 477", "Ragusa", "RG"], ["1504", "SOCCORSO ALPINO E SPELEOLOGO SICILIANO ODV", "Viale Minerva, 28", "Palermo", "PA"], ["1505", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI COLLESANO", "Via Vittorio Emanuele, 2", "Collesano", "PA"], ["1506", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI SANTA DOMENICA VITTORIA", "Piazza Aldo Moro, 29", "Santa Domenica Vittoria", "ME"], ["1507", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI CAMPOROTONDO ETNEO", "Via Umberto, 46", "Camporotondo Etneo", "CT"], ["1508", "CORPO FORESTALE VOLONTARIATO ENTE DI SORVEGLIANZA AMBIENTALE E FORESTALE ODV ETS STAZIONE MESSINA", "Via San Felice, 3", "Messina", "ME"], ["1509", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI GIULIANA", "C.da Licciardo, s.n.c.", "Giuliana", "PA"], ["1510", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI PIANA DEGLI ALBANESI", "Via Palmiro Togliatti, 2", "Piana degli Albanesi", "PA"], ["1511", "GISELLA APS", "Via Leonardo da Vinci, 150", "Partanna", "TP"], ["1512", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI MILAZZO", "Via Francesco Crispi, 9", "Milazzo", "ME"], ["1513", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI MESSINA", "Via Franza, 2", "Messina", "ME"], ["1514", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI GALATI MAMERTINO", "Via Roma, 90", "Galati Mamertino", "ME"], ["1515", "EUROPEAN RADIOAMATEURS ASSOCIATION ODV", "Via Porta Agrigento, 86/90", "Raffadali", "AG"], ["1516", "NUCLEO VOLONTARI DI PROTEZIONE CIVILE", "Via Alessandro Manzoni, 40", "Piazza Armerina", "EN"], ["1517", "INSIEME", "C.da Galice, 2", "Patti", "ME"], ["1518", "ASSOCIAZIONE PROTEZIONE CIVILE RAMACCA-ODV", "Via San Giuseppe, 16", "Ramacca", "CT"], ["1519", "ASSOCIAZIONE RANGERS INTERNATIONAL EUROPE-ODV", "Via Roma, 327", "Gagliano Castelferrato", "EN"], ["1520", "ODV GRUPPO VOLONTARIATO E PROTEZIONE CIVILE DELLA ASSOCIAZIONE NAZIONALE DELLA POLIZIA DI STATO – SEZIONE DI PALERMO", "Via Agostino Catalano, 26", "Palermo", "PA"], ["1521", "A.L.I. VOLONTARI IN EMERGENZA - ODV", "Via Cagliari, 12", "Catania", "CT"], ["1522", "LENTO VAGARE APS", "Via Crocci, 264", "Valderice", "TP"], ["1523", "ASSOCIAZIONE NAZIONALE VIGILI DEL FUOCO IN CONGEDO DELEGAZIONE DI PIAZZA ARMERINA ODV", "Contrada Piano Cannata, s.n.c.", "Piazza Armerina", "EN"], ["1524", "OLMS MAGNA VIS MONTELEPRE", "C.da Mandra di Mezzo, s.n.c.", "Montelepre", "PA"], ["1525", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI PORTOPALO DI CAPO PASSERO", "Via LucioTasca, 33", "Portopalo di Capo Passero", "SR"], ["1526", "ASSOCIAZIONE VOLONTARI PROTEZIONE CIVILE SAN CONO ODV", "Via Bruno Buozzi, 18", "San Cono", "CT"], ["1527", "CROCE ROSSA ITALIANA - COMITATO DI SIRACUSA", "Via Elorina, 39", "Siracusa", "SR"], ["1528", "GRUPPO COMUNALE VOLONTARIATO DI PROTEZIONE CIVILE DI SAN GREGORIO DI CATANIA", "Piazza G. Marconi, 11", "San Gregorio di Catania", "CT"], ["1529", "ORGANIZZAZIONE NAZIONALE VOLONTARIATO GIUBBE D'ITALIA ODV SEZIONE - DI PALERMO 2", "Via Empedocle Restivo, 70", "Palermo", "PA"], ["1530", "S.S.T. ODV SQUADRE DI SOCCORSO TECNICO – DELEGAZIONE DI PALMA DI MONTECHIARO", "Via Rossini Gioacchino, 50", "Palma di Montechiaro", "AG"], ["1531", "CORPO FORESTALE VOLONTARIO ENTE DI SORVEGLIANZA AMBIENTALE E FORESTALE ODV", "Via Palermo, 168", "Palma di Montechiaro", "AG"]];
const PROVINCE_LIST = Array.from(new Set(ASSOCIAZIONI_DB.map((r) => r[4]))).filter(Boolean).sort();

const LOGO_DATA_URI = "data:image/jpeg;base64,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";

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
function fmtDuration(start, end) {
  if (!start) return "—";
  const ms = (end || Date.now()) - start;
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return `${h}h ${String(m).padStart(2, "0")}m`;
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
  const [volontari, setVolontari] = useState([]);
  const [mezzi, setMezzi] = useState([]);
  const [config, setConfig] = useState({
    nomeEmergenza: "Emergenza Protezione Civile",
    associazioni: [ASSOCIAZIONE_DEFAULT],
    specializzazioni: SPECIALIZZAZIONI,
    tipiMezzo: TIPI_MEZZO,
    turni: TURNI_DEFAULT,
  });
  const [archivio, setArchivio] = useState([]);
  const [associazioneCorrente, setAssociazioneCorrente] = useState(null);
  const [associazioniDb, setAssociazioniDb] = useState(
    ASSOCIAZIONI_DB.map((r) => ({ cod: r[0], denominazione: r[1], sede: r[2], comune: r[3], provincia: r[4] }))
  );

  const [tab, setTab] = useState("operatore");
  const [fullscreenOpen, setFullscreenOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loginUser, setLoginUser] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [loginError, setLoginError] = useState("");

  const [tick, setTick] = useState(0);
  const [toast, setToast] = useState(null);

  // ---------- caricamento iniziale ----------
  useEffect(() => {
    (async () => {
      try {
        const [v, m, c, a, ac, db] = await Promise.allSettled([
          window.storage.get(KEY_VOL, true),
          window.storage.get(KEY_MEZZI, true),
          window.storage.get(KEY_CONFIG, true),
          window.storage.get(KEY_ARCHIVIO, true),
          window.storage.get(KEY_ASSOC_CORRENTE, false),
          window.storage.get(KEY_ASSOC_DB, true),
        ]);
        if (v.status === "fulfilled" && v.value) setVolontari(JSON.parse(v.value.value));
        if (m.status === "fulfilled" && m.value) setMezzi(JSON.parse(m.value.value));
        if (c.status === "fulfilled" && c.value) {
          const parsed = JSON.parse(c.value.value);
          setConfig({
            nomeEmergenza: "Emergenza Protezione Civile",
            associazioni: [ASSOCIAZIONE_DEFAULT],
            specializzazioni: SPECIALIZZAZIONI,
            tipiMezzo: TIPI_MEZZO,
            turni: TURNI_DEFAULT,
            ...parsed,
          });
        }
        if (a.status === "fulfilled" && a.value) setArchivio(JSON.parse(a.value.value));
        if (ac.status === "fulfilled" && ac.value) setAssociazioneCorrente(JSON.parse(ac.value.value));
        if (db.status === "fulfilled" && db.value) setAssociazioniDb(JSON.parse(db.value.value));
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

  // aggiornamento periodico dati condivisi (multi-dispositivo)
  useEffect(() => {
    const poll = setInterval(async () => {
      try {
        const [v, m, c, db] = await Promise.allSettled([
          window.storage.get(KEY_VOL, true),
          window.storage.get(KEY_MEZZI, true),
          window.storage.get(KEY_CONFIG, true),
          window.storage.get(KEY_ASSOC_DB, true),
        ]);
        if (v.status === "fulfilled" && v.value) setVolontari(JSON.parse(v.value.value));
        if (m.status === "fulfilled" && m.value) setMezzi(JSON.parse(m.value.value));
        if (c.status === "fulfilled" && c.value) {
          const parsed = JSON.parse(c.value.value);
          setConfig({
            nomeEmergenza: "Emergenza Protezione Civile",
            associazioni: [ASSOCIAZIONE_DEFAULT],
            specializzazioni: SPECIALIZZAZIONI,
            tipiMezzo: TIPI_MEZZO,
            turni: TURNI_DEFAULT,
            ...parsed,
          });
        }
        if (db.status === "fulfilled" && db.value) setAssociazioniDb(JSON.parse(db.value.value));
      } catch (e) {
        // silenzioso: mantiene l'ultimo stato noto
      }
    }, POLL_MS);
    return () => clearInterval(poll);
  }, []);

  // gestione uscita da fullscreen tramite ESC/browser
  useEffect(() => {
    function onFsChange() {
      if (!document.fullscreenElement) setFullscreenOpen(false);
    }
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  async function persist(key, value) {
    try {
      await window.storage.set(key, JSON.stringify(value), true);
    } catch (e) {
      console.error("Errore salvataggio", key, e);
      showToast("Errore di salvataggio — riprova");
    }
  }

  function saveVolontari(next) {
    setVolontari(next);
    persist(KEY_VOL, next);
  }
  function saveMezzi(next) {
    setMezzi(next);
    persist(KEY_MEZZI, next);
  }
  function saveConfig(next) {
    setConfig(next);
    persist(KEY_CONFIG, next);
  }
  function saveArchivio(next) {
    setArchivio(next);
    persist(KEY_ARCHIVIO, next);
  }
  function saveAssociazioniDb(next) {
    setAssociazioniDb(next);
    persist(KEY_ASSOC_DB, next);
  }

  // ---------- azioni operatore ----------
  function incorporaVolontario(data) {
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
      luogoAttivita: (data.luogoAttivita || "").trim(),
      inizioTurno: data.inizioTurno || "",
      fineTurno: data.fineTurno || "",
      pastoRichiesto: data.pastoRichiesto || "No",
      oraIngresso: Date.now(),
      oraUscita: null,
      stato: "in campo",
    };
    saveVolontari([rec, ...volontari]);
    showToast(`${rec.nome} ${rec.cognome} incorporato/a`);
  }
  function scorporaVolontario(id) {
    saveVolontari(
      volontari.map((v) => (v.id === id ? { ...v, oraUscita: Date.now(), stato: "rientrato", fineTurno: fmtTime(Date.now()) } : v))
    );
  }
  function updateVolontario(id, patch) {
    saveVolontari(volontari.map((v) => (v.id === id ? { ...v, ...patch } : v)));
  }
  function deleteVolontario(id) {
    saveVolontari(volontari.filter((v) => v.id !== id));
  }
  function metteMezzoInServizio(data) {
    const rec = {
      id: genId(),
      targa: data.targa.trim(),
      tipo: data.tipo,
      associazione: (data.associazione || ASSOCIAZIONE_DEFAULT).trim(),
      codiceAssociazione: (data.codiceAssociazione || "").trim(),
      kmIniziali: data.kmIniziali || "",
      buonoBenzina: data.buonoBenzina || "No",
      referenteVolontarioId: data.referenteVolontarioId || "",
      oraIngresso: Date.now(),
      oraUscita: null,
      stato: "in servizio",
    };
    saveMezzi([rec, ...mezzi]);
    showToast(`Mezzo ${rec.targa} in servizio`);
  }
  function rientraMezzo(id) {
    saveMezzi(mezzi.map((m) => (m.id === id ? { ...m, oraUscita: Date.now(), stato: "rientrato" } : m)));
  }
  function checkoutMezzo(id, kmFinali) {
    saveMezzi(
      mezzi.map((m) => (m.id === id ? { ...m, oraUscita: Date.now(), stato: "rientrato", kmFinali: kmFinali || "" } : m))
    );
  }
  function updateMezzo(id, patch) {
    saveMezzi(mezzi.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  }
  function deleteMezzo(id) {
    saveMezzi(mezzi.filter((m) => m.id !== id));
  }

  // ---------- admin ----------
  function handleLogin(e) {
    e.preventDefault();
    if (loginUser === ADMIN_USER && loginPass === ADMIN_PASS) {
      setIsAdmin(true);
      setLoginError("");
      setLoginPass("");
    } else {
      setLoginError("Credenziali non valide");
    }
  }
  function handleLogout() {
    setIsAdmin(false);
    setTab("operatore");
  }
  function chiudiEmergenza() {
    if (!window.confirm("Chiudere l'emergenza corrente e archiviare i dati? L'elenco operativo verrà azzerato.")) return;
    const entry = {
      id: genId(),
      nomeEmergenza: config.nomeEmergenza,
      dataChiusura: Date.now(),
      volontari,
      mezzi,
    };
    saveArchivio([entry, ...archivio]);
    saveVolontari([]);
    saveMezzi([]);
    saveConfig({ ...config, nomeEmergenza: "Nuova emergenza" });
    showToast("Emergenza archiviata e dati azzerati");
  }

  function aggiungiAssociazione(nome) {
    const n = nome.trim();
    if (!n) return;
    const lista = config.associazioni || [];
    if (lista.some((a) => a.toLowerCase() === n.toLowerCase())) return;
    saveConfig({ ...config, associazioni: [...lista, n] });
  }
  function rimuoviAssociazione(nome) {
    saveConfig({ ...config, associazioni: (config.associazioni || []).filter((a) => a !== nome) });
  }
  async function impostaAssociazioneCorrente(assoc) {
    setAssociazioneCorrente(assoc);
    try {
      await window.storage.set(KEY_ASSOC_CORRENTE, JSON.stringify(assoc), false);
    } catch (e) {
      console.error("Errore salvataggio associazione corrente", e);
    }
    aggiungiAssociazione(assoc.denominazione);
  }
  async function cambiaAssociazione() {
    setAssociazioneCorrente(null);
    try {
      await window.storage.delete(KEY_ASSOC_CORRENTE, false);
    } catch (e) {
      // chiave già assente o errore non bloccante
    }
  }

  // ---------- database associazioni (admin) ----------
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

  // ---------- liste configurabili (specializzazioni / tipi mezzo) ----------
  function aggiungiSpecializzazione(nome) {
    const n = nome.trim();
    if (!n) return;
    const lista = config.specializzazioni?.length ? config.specializzazioni : SPECIALIZZAZIONI;
    if (lista.some((x) => x.toLowerCase() === n.toLowerCase())) return;
    saveConfig({ ...config, specializzazioni: [...lista, n] });
  }
  function rimuoviSpecializzazione(nome) {
    const lista = config.specializzazioni?.length ? config.specializzazioni : SPECIALIZZAZIONI;
    saveConfig({ ...config, specializzazioni: lista.filter((x) => x !== nome) });
  }
  function aggiungiTipoMezzo(nome) {
    const n = nome.trim();
    if (!n) return;
    const lista = config.tipiMezzo?.length ? config.tipiMezzo : TIPI_MEZZO;
    if (lista.some((x) => x.toLowerCase() === n.toLowerCase())) return;
    saveConfig({ ...config, tipiMezzo: [...lista, n] });
  }
  function rimuoviTipoMezzo(nome) {
    const lista = config.tipiMezzo?.length ? config.tipiMezzo : TIPI_MEZZO;
    saveConfig({ ...config, tipiMezzo: lista.filter((x) => x !== nome) });
  }
  function aggiungiTurno(turno) {
    const nome = (turno.nome || "").trim();
    const inizio = turno.inizio || "";
    const fine = turno.fine || "";
    if (!nome || !inizio || !fine) return;
    const lista = config.turni?.length ? config.turni : TURNI_DEFAULT;
    saveConfig({ ...config, turni: [...lista, { id: genId(), nome, inizio, fine }] });
  }
  function rimuoviTurno(id) {
    const lista = config.turni?.length ? config.turni : TURNI_DEFAULT;
    saveConfig({ ...config, turni: lista.filter((t) => t.id !== id) });
  }

  const volontariInCampo = volontari.filter((v) => v.stato === "in campo").length;
  const mezziInServizio = mezzi.filter((m) => m.stato === "in servizio").length;
  const associazioniInCampoSet = new Set([
    ...volontari.filter((v) => v.stato === "in campo").map((v) => v.associazione || ASSOCIAZIONE_DEFAULT),
    ...mezzi.filter((m) => m.stato === "in servizio").map((m) => m.associazione || ASSOCIAZIONE_DEFAULT),
  ]);
  const mezziPerTipo = TIPI_MEZZO.map((t) => ({
    tipo: t,
    n: mezzi.filter((m) => m.stato === "in servizio" && m.tipo === t).length,
  })).filter((x) => x.n > 0);

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
        config={config}
        volontariInCampo={volontariInCampo}
        mezziInServizio={mezziInServizio}
        tick={tick}
        onGoHome={() => setTab("operatore")}
      />

      <div style={styles.tabRow} className="no-print">
        <button
          onClick={() => setTab("admin")}
          className="tab-btn"
          style={tab === "admin" ? styles.tabActive : styles.tabInactive}
        >
          <ShieldPlus size={16} style={{ marginRight: 6 }} /> Admin
        </button>
        <button
          onClick={() => setTab("riepilogo")}
          className="tab-btn"
          style={tab === "riepilogo" ? styles.tabActive : styles.tabInactive}
        >
          <LayoutGrid size={16} style={{ marginRight: 6 }} /> Riepilogo
        </button>
      </div>

      <div style={styles.main}>
        {tab === "operatore" && (
          <OperatorView
            volontari={volontari}
            mezzi={mezzi}
            config={config}
            tick={tick}
            associazioneCorrente={associazioneCorrente}
            associazioniDb={associazioniDb}
            onSetAssociazioneCorrente={impostaAssociazioneCorrente}
            onCambiaAssociazione={cambiaAssociazione}
            onIncorpora={incorporaVolontario}
            onScorpora={scorporaVolontario}
            onMezzoIn={metteMezzoInServizio}
            onMezzoOut={rientraMezzo}
          />
        )}
        {tab === "riepilogo" && (
          <RiepilogoView
            volontariInCampo={volontariInCampo}
            associazioniInCampoSet={associazioniInCampoSet}
            mezziPerTipo={mezziPerTipo}
            mezziInServizio={mezziInServizio}
            onOpenFullscreen={() => setFullscreenOpen(true)}
          />
        )}
        {tab === "admin" &&
          (isAdmin ? (
            <AdminView
              volontari={volontari}
              mezzi={mezzi}
              config={config}
              archivio={archivio}
              associazioniDb={associazioniDb}
              onSaveConfig={saveConfig}
              onAddAssociazione={aggiungiAssociazione}
              onRemoveAssociazione={rimuoviAssociazione}
              onAddAssociazioneDb={aggiungiAssociazioneDb}
              onUpdateAssociazioneDb={modificaAssociazioneDb}
              onDeleteAssociazioneDb={eliminaAssociazioneDb}
              onAddSpecializzazione={aggiungiSpecializzazione}
              onRemoveSpecializzazione={rimuoviSpecializzazione}
              onAddTipoMezzo={aggiungiTipoMezzo}
              onRemoveTipoMezzo={rimuoviTipoMezzo}
              onAddTurno={aggiungiTurno}
              onRemoveTurno={rimuoviTurno}
              onUpdateVolontario={updateVolontario}
              onDeleteVolontario={deleteVolontario}
              onScorporaVolontario={scorporaVolontario}
              onUpdateMezzo={updateMezzo}
              onDeleteMezzo={deleteMezzo}
              onCheckoutMezzo={checkoutMezzo}
              onLogout={handleLogout}
              onChiudiEmergenza={chiudiEmergenza}
            />
          ) : (
            <LoginBox
              loginUser={loginUser}
              loginPass={loginPass}
              setLoginUser={setLoginUser}
              setLoginPass={setLoginPass}
              loginError={loginError}
              onSubmit={handleLogin}
            />
          ))}
      </div>

      {toast && (
        <div style={styles.toast} className="no-print">
          {toast}
        </div>
      )}

      {fullscreenOpen && (
        <FullscreenBoard
          config={config}
          volontariInCampo={volontariInCampo}
          associazioniInCampoSet={associazioniInCampoSet}
          mezziPerTipo={mezziPerTipo}
          mezziInServizio={mezziInServizio}
          onClose={() => {
            if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
            setFullscreenOpen(false);
          }}
        />
      )}
    </div>
  );
}

// ================= STATUS BAR =================
function StatusBar({ config, volontariInCampo, mezziInServizio, tick, onGoHome }) {
  const now = new Date();
  return (
    <div style={styles.statusBar}>
      <button style={styles.brandRow} className="no-print" onClick={onGoHome} title="Torna alla home">
        <div style={styles.logoBadge}>
          <img src={LOGO_DATA_URI} alt="Stemma Misericordia S.M. di Licodia" style={styles.logoImg} />
        </div>
        <div>
          <div style={styles.orgName}>FRATERNITA DI MISERICORDIA DI S.M. DI LICODIA</div>
          <div style={styles.orgSub}>Gestione Volontari · Protezione Civile</div>
        </div>
      </button>
      <div style={styles.flapRow}>
        <FlapStat label="EMERGENZA" value={config.nomeEmergenza} wide />
        <FlapStat label="VOLONTARI IN CAMPO" value={String(volontariInCampo).padStart(2, "0")} accent="orange" />
        <FlapStat label="MEZZI IN SERVIZIO" value={String(mezziInServizio).padStart(2, "0")} accent="green" />
        <FlapStat label="ORA" value={now.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })} />
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
function RiepilogoView({ volontariInCampo, associazioniInCampoSet, mezziPerTipo, mezziInServizio, onOpenFullscreen }) {
  const associazioni = Array.from(associazioniInCampoSet);
  return (
    <div style={{ display: "grid", gap: 20 }}>
      <div
        style={{ ...styles.card, cursor: "pointer" }}
        onClick={async () => {
          onOpenFullscreen();
          try {
            const target = document.getElementById("pc-app-root") || document.documentElement;
            if (target.requestFullscreen) await target.requestFullscreen();
          } catch (err) {
            // se il browser nega il fullscreen, il pannello resta comunque visibile a tutto schermo via overlay
          }
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 style={{ ...styles.cardTitle, margin: 0 }}>Quadro operativo</h2>
          <span style={styles.btnSecondary}>
            <Maximize2 size={14} style={{ marginRight: 6 }} /> Apri a schermo intero
          </span>
        </div>
        <div style={styles.statGrid}>
          <StatCard label="Volontari in campo" value={volontariInCampo} accent="orange" />
          <StatCard label="Associazioni in campo" value={associazioni.length} />
          <StatCard label="Mezzi in servizio" value={mezziInServizio} accent="green" />
        </div>
      </div>

      {mezziPerTipo.length > 0 && (
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Mezzi in campo per tipo</h2>
          <div style={{ display: "grid", gap: 8 }}>
            {mezziPerTipo.map(({ tipo, n }) => (
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

function FullscreenBoard({ config, volontariInCampo, associazioniInCampoSet, mezziPerTipo, mezziInServizio, onClose }) {
  const associazioni = Array.from(associazioniInCampoSet);
  return (
    <div style={styles.fullscreenOverlay}>
      <button style={styles.fullscreenClose} onClick={onClose}>
        <Minimize2 size={16} style={{ marginRight: 6 }} /> Esci
      </button>
      <div style={styles.fullscreenBrand}>{config.nomeEmergenza}</div>
      <div style={styles.fullscreenGrid}>
        <div style={styles.fullscreenStat}>
          <div style={styles.fullscreenLabel}>Volontari in campo</div>
          <div style={{ ...styles.fullscreenValue, color: "var(--orange)" }}>{volontariInCampo}</div>
        </div>
        <div style={styles.fullscreenStat}>
          <div style={styles.fullscreenLabel}>Associazioni in campo</div>
          <div style={styles.fullscreenValue}>{associazioni.length}</div>
        </div>
        <div style={styles.fullscreenStat}>
          <div style={styles.fullscreenLabel}>Mezzi in servizio</div>
          <div style={{ ...styles.fullscreenValue, color: "var(--green)" }}>{mezziInServizio}</div>
        </div>
      </div>

      {mezziPerTipo.length > 0 && (
        <div style={styles.fullscreenSection}>
          <div style={styles.fullscreenSectionTitle}>Mezzi per tipo</div>
          <div style={styles.fullscreenChipRow}>
            {mezziPerTipo.map(({ tipo, n }) => (
              <div key={tipo} style={styles.fullscreenChip}>
                {tipo} <b>{n}</b>
              </div>
            ))}
          </div>
        </div>
      )}

      {associazioni.length > 0 && (
        <div style={styles.fullscreenSection}>
          <div style={styles.fullscreenSectionTitle}>Associazioni presenti</div>
          <div style={styles.fullscreenChipRow}>
            {associazioni.map((a) => (
              <div key={a} style={styles.fullscreenChip}>
                {a}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ================= LOGIN =================
function LoginBox({ loginUser, loginPass, setLoginUser, setLoginPass, loginError, onSubmit }) {
  return (
    <div style={{ maxWidth: 380, margin: "40px auto" }}>
      <div style={styles.card}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <ShieldPlus size={20} color="var(--navy)" />
          <h2 style={styles.cardTitle}>Accesso Admin</h2>
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
function OperatorView({
  volontari,
  mezzi,
  config,
  tick,
  associazioneCorrente,
  associazioniDb,
  onSetAssociazioneCorrente,
  onCambiaAssociazione,
  onIncorpora,
  onScorpora,
  onMezzoIn,
  onMezzoOut,
}) {
  const [subTab, setSubTab] = useState("home");
  const [justIncorporated, setJustIncorporated] = useState(null);
  const [justRegistratoMezzo, setJustRegistratoMezzo] = useState(null);
  const associazioni = config?.associazioni?.length ? config.associazioni : [ASSOCIAZIONE_DEFAULT];
  const specializzazioniList = config?.specializzazioni?.length ? config.specializzazioni : SPECIALIZZAZIONI;
  const tipiMezzoList = config?.tipiMezzo?.length ? config.tipiMezzo : TIPI_MEZZO;
  const turniList = config?.turni?.length ? config.turni : TURNI_DEFAULT;
  const inizioTurnoOptions = Array.from(new Set(turniList.map((t) => t.inizio))).sort();
  const fineTurnoOptions = Array.from(new Set(turniList.map((t) => t.fine))).sort();

  const assocNome = associazioneCorrente?.denominazione || associazioni[0];
  const assocCodice = associazioneCorrente?.cod || "";

  const emptyVForm = {
    associazione: assocNome,
    codiceAssociazione: assocCodice,
    cognome: "",
    nome: "",
    luogoNascita: "",
    dataNascita: "",
    telefono: "",
    beneficiLegge: "No",
    specializzazione: specializzazioniList[0],
    luogoAttivita: "",
    inizioTurno: inizioTurnoOptions[0] || "",
    fineTurno: fineTurnoOptions[0] || "",
    pastoRichiesto: "No",
  };
  const emptyMForm = {
    associazione: assocNome,
    codiceAssociazione: assocCodice,
    tipo: tipiMezzoList[0],
    targa: "",
    kmIniziali: "",
    buonoBenzina: "No",
    referenteVolontarioId: "",
  };
  const [vForm, setVForm] = useState(emptyVForm);
  const [mForm, setMForm] = useState(emptyMForm);

  // corregge il caso in cui l'associazione venga selezionata dopo il primo montaggio del componente
  useEffect(() => {
    if (!associazioneCorrente) return;
    setVForm((f) => ({ ...f, associazione: associazioneCorrente.denominazione || f.associazione, codiceAssociazione: associazioneCorrente.cod || "" }));
    setMForm((f) => ({ ...f, associazione: associazioneCorrente.denominazione || f.associazione, codiceAssociazione: associazioneCorrente.cod || "" }));
  }, [associazioneCorrente]);

  const mezziAttiviList = mezzi.filter((m) => m.stato === "in servizio").sort((a, b) => b.oraIngresso - a.oraIngresso);
  const volontariAttivi = volontari.filter((v) => v.stato === "in campo").sort((a, b) => b.oraIngresso - a.oraIngresso);

  const referentiDisponibili = volontari.filter(
    (v) => (v.associazione || ASSOCIAZIONE_DEFAULT).trim().toLowerCase() === (mForm.associazione || "").trim().toLowerCase()
  );

  const now = new Date();
  const dataOggi = now.toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit", year: "numeric" });

  function submitVolontario(e) {
    e.preventDefault();
    if (!vForm.nome.trim() || !vForm.cognome.trim()) return;
    onIncorpora(vForm);
    setJustIncorporated({ nome: vForm.nome.trim(), cognome: vForm.cognome.trim() });
    setVForm({ ...emptyVForm });
  }
  function submitMezzo(e) {
    e.preventDefault();
    if (!mForm.targa.trim()) return;
    onMezzoIn(mForm);
    setJustRegistratoMezzo({ targa: mForm.targa.trim() });
    setMForm({ ...emptyMForm });
  }

  if (!associazioneCorrente) {
    return <SelezionaAssociazioneView onConferma={onSetAssociazioneCorrente} associazioniDb={associazioniDb} />;
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
                  <input style={{ ...styles.input, background: "#EFEBE1", color: "#777" }} value={dataOggi} disabled />
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
                  <label style={styles.label}>Specializzazione</label>
                  <select
                    style={styles.input}
                    value={vForm.specializzazione}
                    onChange={(e) => setVForm({ ...vForm, specializzazione: e.target.value })}
                  >
                    {specializzazioniList.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
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
                  <label style={styles.label}>Inizio turno</label>
                  <select style={styles.input} value={vForm.inizioTurno} onChange={(e) => setVForm({ ...vForm, inizioTurno: e.target.value })}>
                    {inizioTurnoOptions.length === 0 && <option value="">Nessun turno configurato</option>}
                    {inizioTurnoOptions.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={styles.label}>Fine turno</label>
                  <select style={styles.input} value={vForm.fineTurno} onChange={(e) => setVForm({ ...vForm, fineTurno: e.target.value })}>
                    {fineTurnoOptions.length === 0 && <option value="">Nessun turno configurato</option>}
                    {fineTurnoOptions.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={styles.label}>Richiesta pasto</label>
                  <select style={styles.input} value={vForm.pastoRichiesto} onChange={(e) => setVForm({ ...vForm, pastoRichiesto: e.target.value })}>
                    {SI_NO.map((v) => (
                      <option key={v}>{v}</option>
                    ))}
                  </select>
                </div>
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
                  <label style={styles.label}>Tipo</label>
                  <select style={styles.input} value={mForm.tipo} onChange={(e) => setMForm({ ...mForm, tipo: e.target.value })}>
                    {tipiMezzoList.map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={styles.label}>Targa</label>
                  <input style={styles.input} value={mForm.targa} onChange={(e) => setMForm({ ...mForm, targa: e.target.value })} />
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
  const [provincia, setProvincia] = useState("");
  const [queryComune, setQueryComune] = useState("");
  const [selezionata, setSelezionata] = useState(null);

  const db = associazioniDb && associazioniDb.length ? associazioniDb : ASSOCIAZIONI_DB.map((r) => ({ cod: r[0], denominazione: r[1], sede: r[2], comune: r[3], provincia: r[4] }));
  const provinceList = useMemo(() => Array.from(new Set(db.map((a) => a.provincia))).filter(Boolean).sort(), [db]);

  const risultati = useMemo(() => {
    if (modo === "codice") {
      const q = queryCodice.trim();
      if (!q) return [];
      return db.filter((a) => a.cod.includes(q)).slice(0, 30);
    } else {
      if (!provincia) return [];
      const qc = queryComune.trim().toLowerCase();
      return db.filter((a) => a.provincia === provincia && (!qc || a.comune.toLowerCase().includes(qc))).slice(0, 40);
    }
  }, [modo, queryCodice, provincia, queryComune, db]);

  function scegli(a) {
    setSelezionata({ cod: a.cod, denominazione: a.denominazione, sede: a.sede, comune: a.comune, provincia: a.provincia });
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
              {modo === "codice" ? "Digita un codice per cercare." : provincia ? "Nessun risultato." : "Seleziona una provincia per cercare."}
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

      {selezionata && (
        <div style={{ ...styles.card, borderColor: "var(--green)" }}>
          <h2 style={styles.cardTitle}>Associazione confermata</h2>
          <div style={{ display: "grid", gap: 10 }}>
            <div>
              <label style={styles.label}>Codice</label>
              <input style={{ ...styles.input, background: "#EFEBE1", color: "#777" }} value={selezionata.cod} disabled />
            </div>
            <div>
              <label style={styles.label}>Denominazione</label>
              <input style={{ ...styles.input, background: "#EFEBE1", color: "#777" }} value={selezionata.denominazione} disabled />
            </div>
            <div>
              <label style={styles.label}>Sede</label>
              <input style={{ ...styles.input, background: "#EFEBE1", color: "#777" }} value={selezionata.sede} disabled />
            </div>
            <div style={styles.grid2} className="grid2-force">
              <div>
                <label style={styles.label}>Comune</label>
                <input style={{ ...styles.input, background: "#EFEBE1", color: "#777" }} value={selezionata.comune} disabled />
              </div>
              <div>
                <label style={styles.label}>Provincia</label>
                <input style={{ ...styles.input, background: "#EFEBE1", color: "#777" }} value={selezionata.provincia} disabled />
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
            <button style={styles.btnPrimary} onClick={() => onConferma(selezionata)}>
              Avanti →
            </button>
            <button style={styles.btnSecondary} onClick={() => setSelezionata(null)}>
              Cambia selezione
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
// ================= ADMIN / REPORT =================
function AdminView({
  volontari,
  mezzi,
  config,
  archivio,
  associazioniDb,
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
  onAddTurno,
  onRemoveTurno,
  onUpdateVolontario,
  onDeleteVolontario,
  onScorporaVolontario,
  onUpdateMezzo,
  onDeleteMezzo,
  onCheckoutMezzo,
  onLogout,
  onChiudiEmergenza,
}) {
  const [subTab, setSubTab] = useState("home");
  const associazioni = config.associazioni || [];
  const specializzazioniList = config?.specializzazioni?.length ? config.specializzazioni : SPECIALIZZAZIONI;
  const tipiMezzoList = config?.tipiMezzo?.length ? config.tipiMezzo : TIPI_MEZZO;

  const volontariInCampoN = volontari.filter((v) => v.stato === "in campo").length;
  const mezziInServizioN = mezzi.filter((m) => m.stato === "in servizio").length;
  const associazioniPartecipanti = Array.from(
    new Set([
      ...volontari.filter((v) => v.stato === "in campo").map((v) => v.associazione || ASSOCIAZIONE_DEFAULT),
      ...mezzi.filter((m) => m.stato === "in servizio").map((m) => m.associazione || ASSOCIAZIONE_DEFAULT),
    ])
  );

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }} className="no-print">
        {subTab !== "home" ? (
          <button style={styles.backBtn} onClick={() => setSubTab("home")}>
            ← Torna alla home Admin
          </button>
        ) : (
          <div />
        )}
        <button style={styles.btnGhost} onClick={onLogout}>
          <LogOut size={16} style={{ marginRight: 6 }} /> Esci
        </button>
      </div>

      {subTab === "home" && (
        <div style={styles.homeGrid}>
          <button style={styles.homeTile} onClick={() => setSubTab("panoramica")}>
            <LayoutGrid size={30} />
            <div style={styles.homeTileLabel}>Panoramica</div>
          </button>
          <button style={styles.homeTile} onClick={() => setSubTab("associazioni")}>
            <ShieldPlus size={30} />
            <div style={styles.homeTileLabel}>Associazioni</div>
          </button>
          <button style={styles.homeTile} onClick={() => setSubTab("partecipanti")}>
            <Users size={30} />
            <div style={styles.homeTileLabel}>Associazioni partecipanti</div>
          </button>
          <button style={styles.homeTile} onClick={() => setSubTab("volontari")}>
            <Users size={30} />
            <div style={styles.homeTileLabel}>Volontari</div>
          </button>
          <button style={styles.homeTile} onClick={() => setSubTab("mezzi")}>
            <Truck size={30} />
            <div style={styles.homeTileLabel}>Mezzi</div>
          </button>
          <button style={styles.homeTile} onClick={() => setSubTab("impostazioni")}>
            <RotateCcw size={30} />
            <div style={styles.homeTileLabel}>Impostazioni</div>
          </button>
        </div>
      )}

      {subTab === "panoramica" && (
        <PanoramicaTab volontari={volontari} mezzi={mezzi} volontariInCampoN={volontariInCampoN} mezziInServizioN={mezziInServizioN} />
      )}

      {subTab === "associazioni" && (
        <AssociazioniDbTab
          associazioniDb={associazioniDb}
          onAdd={onAddAssociazioneDb}
          onUpdate={onUpdateAssociazioneDb}
          onDelete={onDeleteAssociazioneDb}
        />
      )}

      {subTab === "partecipanti" && (
        <PartecipantiTab
          associazioniPartecipanti={associazioniPartecipanti}
          volontari={volontari}
          mezzi={mezzi}
          associazioniDb={associazioniDb}
          turniList={config?.turni?.length ? config.turni : TURNI_DEFAULT}
        />
      )}

      {subTab === "volontari" && (
        <VolontariTab
          volontari={volontari}
          associazioni={associazioni}
          specializzazioniList={specializzazioniList}
          onUpdate={onUpdateVolontario}
          onDelete={onDeleteVolontario}
          onScorpora={onScorporaVolontario}
        />
      )}

      {subTab === "mezzi" && (
        <MezziTab
          mezzi={mezzi}
          volontari={volontari}
          associazioni={associazioni}
          tipiMezzoList={tipiMezzoList}
          onUpdate={onUpdateMezzo}
          onDelete={onDeleteMezzo}
          onCheckout={onCheckoutMezzo}
        />
      )}

      {subTab === "impostazioni" && (
        <ImpostazioniTab
          config={config}
          archivio={archivio}
          specializzazioniList={specializzazioniList}
          tipiMezzoList={tipiMezzoList}
          turniList={config?.turni?.length ? config.turni : TURNI_DEFAULT}
          onSaveConfig={onSaveConfig}
          onAddSpecializzazione={onAddSpecializzazione}
          onRemoveSpecializzazione={onRemoveSpecializzazione}
          onAddTipoMezzo={onAddTipoMezzo}
          onRemoveTipoMezzo={onRemoveTipoMezzo}
          onAddTurno={onAddTurno}
          onRemoveTurno={onRemoveTurno}
          onChiudiEmergenza={onChiudiEmergenza}
        />
      )}
    </div>
  );
}

// ================= ADMIN: PANORAMICA =================
function PanoramicaTab({ volontari, mezzi, volontariInCampoN, mezziInServizioN }) {
  const specializzazioneSet = Array.from(new Set(volontari.map((v) => v.specializzazione)));
  const perSpecializzazione = specializzazioneSet.map((s) => ({ s, n: volontari.filter((v) => v.specializzazione === s).length }));
  const oreTotali = volontari.reduce((sum, v) => sum + (v.oraUscita || Date.now()) - v.oraIngresso, 0) / 3600000;

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <div style={styles.statGrid}>
        <StatCard label="Volontari in campo" value={volontariInCampoN} accent="orange" />
        <StatCard label="Volontari totali registrati" value={volontari.length} />
        <StatCard label="Mezzi in servizio" value={mezziInServizioN} accent="green" />
        <StatCard label="Ore uomo totali" value={oreTotali.toFixed(1)} />
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
function PartecipantiTab({ associazioniPartecipanti, volontari, mezzi, associazioniDb, turniList }) {
  const [promptFor, setPromptFor] = useState(null);
  const [giorno, setGiorno] = useState(() => new Date().toISOString().slice(0, 10));
  const [turnoId, setTurnoId] = useState(turniList[0]?.id || "");
  const [avviso, setAvviso] = useState("");

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

  function buildRegistroHtml(associazione, giornoFmt, turno, volontariFiltrati, mezziFiltrati) {
    const righeVol = volontariFiltrati.length
      ? volontariFiltrati
          .map(
            (v) => `<tr>
        <td>${escapeHtml(v.cognome)}</td><td>${escapeHtml(v.nome)}</td><td>${escapeHtml(v.luogoNascita)}</td>
        <td>${escapeHtml(v.dataNascita)}</td><td>${escapeHtml(v.telefono)}</td><td>${escapeHtml(v.beneficiLegge)}</td>
        <td>${escapeHtml(v.specializzazione)}</td><td>${escapeHtml(v.luogoAttivita)}</td>
        <td>${escapeHtml(v.inizioTurno)}</td><td>${escapeHtml(v.fineTurno)}</td><td>${escapeHtml(v.pastoRichiesto)}</td>
      </tr>`
          )
          .join("")
      : `<tr><td colspan="11">&nbsp;</td></tr>`;

    const righeMezzi = mezziFiltrati.length
      ? mezziFiltrati
          .map(
            (m) => `<tr>
        <td>${escapeHtml(m.tipo)}</td><td>${escapeHtml(m.targa)}</td><td>${escapeHtml(m.kmIniziali)}</td>
        <td>${escapeHtml(m.kmFinali)}</td><td>${escapeHtml(m.buonoBenzina)}</td><td></td><td></td><td></td>
      </tr>`
          )
          .join("")
      : `<tr><td colspan="8">&nbsp;</td></tr>`;

    const sedeTxt = associazione.sede || [associazione.comune, associazione.provincia ? `(${associazione.provincia})` : ""].filter(Boolean).join(" ");

    return `<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="utf-8" />
<title>Registro ${escapeHtml(associazione.denominazione)} - ${escapeHtml(giornoFmt)}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; color: #111; margin: 0; padding: 24px 28px; }
  .sheet { max-width: 1000px; margin: 0 auto; }
  .header-row { display: flex; gap: 20px; align-items: flex-start; border-bottom: 2px solid #111; padding-bottom: 12px; margin-bottom: 16px; }
  .cod-box { border: 1px solid #111; padding: 6px 14px; text-align: center; font-size: 11px; font-weight: 600; }
  .cod-box div { font-size: 18px; margin-top: 4px; }
  .field-line { font-size: 13px; margin-bottom: 4px; }
  .section-title { font-weight: 700; letter-spacing: 0.08em; font-size: 14px; margin: 10px 0 8px; text-transform: uppercase; }
  table { width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 6px; }
  th, td { border: 1px solid #111; padding: 5px 6px; height: 22px; }
  th { background: #EFEBE1; font-size: 10px; text-transform: uppercase; }
  .footer { margin-top: 40px; text-align: right; font-size: 13px; border-top: 1px solid #111; padding-top: 30px; width: 280px; margin-left: auto; }
  @media print { body { padding: 10px 14px; } }
</style>
</head>
<body>
  <div class="sheet">
    <div class="header-row">
      <div class="cod-box">COD. ASS.<div>${escapeHtml(associazione.cod) || "—"}</div></div>
      <div style="flex:1">
        <div class="field-line"><b>Associazione:</b> ${escapeHtml(associazione.denominazione)}</div>
        <div class="field-line"><b>Sede di:</b> ${escapeHtml(sedeTxt)}</div>
      </div>
      <div style="text-align:right">
        <div class="field-line"><b>Data:</b> ${escapeHtml(giornoFmt)}</div>
        <div class="field-line"><b>Turno:</b> ${escapeHtml(turno.nome)} (${escapeHtml(turno.inizio)}–${escapeHtml(turno.fine)})</div>
      </div>
    </div>

    <div class="section-title">V O L O N T A R I &nbsp; P R E S E N T I</div>
    <table>
      <thead><tr>
        <th>Cognome</th><th>Nome</th><th>Luogo Nascita</th><th>Data Nascita</th><th>Telefono</th>
        <th>Rich. benefici legge</th><th>Specializzazione</th><th>Luogo attività</th>
        <th>Inizio turno ore</th><th>Fine turno ore</th><th>Richiesta pasto</th>
      </tr></thead>
      <tbody>${righeVol}</tbody>
    </table>

    <div class="section-title" style="margin-top:20px">M E Z Z I &nbsp; U T I L I Z Z A T I</div>
    <table>
      <thead><tr>
        <th>Tipo</th><th>Targa</th><th>Km iniziali</th><th>Km finali</th>
        <th>Richiesta buono benz.</th><th>Referente del mezzo</th><th>Servizio espletato</th><th>alim</th>
      </tr></thead>
      <tbody>${righeMezzi}</tbody>
    </table>

    <div class="footer">Il Responsabile/Il Referente dell'Associazione</div>
  </div>
  <script>window.onload = function(){ setTimeout(function(){ window.print(); }, 250); };</script>
</body>
</html>`;
  }

  function generaRegistro(nome) {
    const turno = turniList.find((t) => t.id === turnoId);
    if (!turno) {
      setAvviso("Configura almeno un turno in Impostazioni prima di generare il registro.");
      return;
    }
    const giornoFmt = new Date(giorno + "T00:00:00").toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit", year: "numeric" });
    const volontariFiltrati = volontari.filter(
      (v) =>
        (v.associazione || ASSOCIAZIONE_DEFAULT) === nome &&
        fmtDate(v.oraIngresso) === giornoFmt &&
        v.inizioTurno === turno.inizio &&
        v.fineTurno === turno.fine
    );
    const mezziFiltrati = mezzi.filter((m) => (m.associazione || ASSOCIAZIONE_DEFAULT) === nome && fmtDate(m.oraIngresso) === giornoFmt);

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
    setPromptFor(null);
  }

  return (
    <div style={styles.card}>
      <h2 style={styles.cardTitle}>Associazioni in campo ({associazioniPartecipanti.length})</h2>
      {avviso && <div style={{ ...styles.errorText, marginBottom: 10 }}>{avviso}</div>}
      <div style={{ display: "grid", gap: 8 }}>
        {associazioniPartecipanti.length === 0 && <div style={styles.emptyText}>Nessuna associazione attualmente in campo.</div>}
        {associazioniPartecipanti.map((a) => (
          <div key={a} style={{ display: "grid", gap: 8 }}>
            <div style={styles.rowItem}>
              <span style={styles.pillGreen}>{a}</span>
              <button
                style={styles.btnSecondary}
                onClick={() => {
                  setPromptFor(promptFor === a ? null : a);
                  setTurnoId(turniList[0]?.id || "");
                  setAvviso("");
                }}
              >
                <Printer size={14} style={{ marginRight: 6 }} /> Stampa registro
              </button>
            </div>
            {promptFor === a && (
              <div style={{ ...styles.card, background: "#FAF8F3" }}>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
                  <div>
                    <label style={styles.label}>Giorno</label>
                    <input style={styles.input} type="date" value={giorno} onChange={(e) => setGiorno(e.target.value)} />
                  </div>
                  <div>
                    <label style={styles.label}>Turno</label>
                    <select style={styles.input} value={turnoId} onChange={(e) => setTurnoId(e.target.value)}>
                      {turniList.length === 0 && <option value="">Nessun turno configurato</option>}
                      {turniList.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.nome} ({t.inizio}–{t.fine})
                        </option>
                      ))}
                    </select>
                  </div>
                  <button style={styles.btnPrimary} onClick={() => generaRegistro(a)} disabled={!turnoId}>
                    Genera registro
                  </button>
                  <button style={styles.btnGhost} onClick={() => setPromptFor(null)}>
                    Annulla
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ================= ADMIN: VOLONTARI =================
// ================= ADMIN: VOLONTARI =================
function VolontariTab({ volontari, associazioni, specializzazioniList, onUpdate, onDelete, onScorpora }) {
  const [search, setSearch] = useState("");
  const [statoFiltro, setStatoFiltro] = useState("tutti");
  const [specializzazioneFiltro, setSpecializzazioneFiltro] = useState("tutte");
  const [associazioneFiltro, setAssociazioneFiltro] = useState("tutte");
  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState({});

  const filtrati = useMemo(() => {
    return volontari.filter((v) => {
      if (statoFiltro !== "tutti" && v.stato !== statoFiltro) return false;
      if (specializzazioneFiltro !== "tutte" && v.specializzazione !== specializzazioneFiltro) return false;
      if (associazioneFiltro !== "tutte" && (v.associazione || ASSOCIAZIONE_DEFAULT) !== associazioneFiltro) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        if (!`${v.nome} ${v.cognome}`.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [volontari, statoFiltro, specializzazioneFiltro, associazioneFiltro, search]);

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
      "Specializzazione", "Luogo attività", "Benefici L.266", "Pasto richiesto", "Inizio turno", "Fine turno", "Uscita effettiva", "Stato",
    ]];
    filtrati.forEach((v) =>
      rows.push([
        v.cognome, v.nome, v.luogoNascita || "", v.dataNascita || "", v.telefono || "",
        v.associazione || ASSOCIAZIONE_DEFAULT, v.codiceAssociazione || "", v.specializzazione, v.luogoAttivita || "",
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
          {associazioni.map((a) => (
            <option key={a}>{a}</option>
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
                <td style={styles.td} colSpan={10}>
                  <span style={styles.emptyText}>Nessun risultato per i filtri selezionati.</span>
                </td>
              </tr>
            )}
            {filtrati.map((v) =>
              editingId === v.id ? (
                <tr key={v.id}>
                  <td style={styles.td} colSpan={10}>
                    <div style={{ display: "grid", gap: 8, padding: "8px 0" }}>
                      <div style={styles.grid2} className="grid2-force">
                        <input style={styles.input} value={editDraft.cognome} onChange={(e) => setEditDraft({ ...editDraft, cognome: e.target.value })} placeholder="Cognome" />
                        <input style={styles.input} value={editDraft.nome} onChange={(e) => setEditDraft({ ...editDraft, nome: e.target.value })} placeholder="Nome" />
                      </div>
                      <div style={styles.grid2} className="grid2-force">
                        <input style={styles.input} list="associazioni-list-admin" value={editDraft.associazione} onChange={(e) => setEditDraft({ ...editDraft, associazione: e.target.value })} placeholder="Associazione" />
                        <select style={styles.input} value={editDraft.specializzazione} onChange={(e) => setEditDraft({ ...editDraft, specializzazione: e.target.value })}>
                          {specializzazioniList.map((s) => (
                            <option key={s}>{s}</option>
                          ))}
                        </select>
                      </div>
                      <div style={styles.grid2} className="grid2-force">
                        <input style={styles.input} value={editDraft.luogoAttivita} onChange={(e) => setEditDraft({ ...editDraft, luogoAttivita: e.target.value })} placeholder="Luogo attività" />
                        <input style={styles.input} value={editDraft.telefono} onChange={(e) => setEditDraft({ ...editDraft, telefono: e.target.value })} placeholder="Telefono" />
                      </div>
                      <div style={styles.grid2} className="grid2-force">
                        <input style={styles.input} value={editDraft.inizioTurno || ""} onChange={(e) => setEditDraft({ ...editDraft, inizioTurno: e.target.value })} placeholder="Inizio turno (HH:MM)" />
                        <input style={styles.input} value={editDraft.fineTurno || ""} onChange={(e) => setEditDraft({ ...editDraft, fineTurno: e.target.value })} placeholder="Fine turno (HH:MM)" />
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
                <tr key={v.id}>
                  <td style={styles.td}>
                    {v.cognome} {v.nome}
                  </td>
                  <td style={styles.td}>{v.associazione || ASSOCIAZIONE_DEFAULT}</td>
                  <td style={styles.td}>{v.specializzazione}</td>
                  <td style={styles.td}>{v.luogoAttivita || "—"}</td>
                  <td style={styles.td}>{v.telefono || "—"}</td>
                  <td style={styles.td}>{v.inizioTurno || fmtTime(v.oraIngresso)}</td>
                  <td style={styles.td}>{v.fineTurno || "—"}</td>
                  <td style={styles.td}>{fmtDuration(v.oraIngresso, v.oraUscita)}</td>
                  <td style={styles.td}>
                    <span style={v.stato === "in campo" ? styles.pillOrange : styles.pillGreen}>{v.stato}</span>
                  </td>
                  <td style={styles.td} className="no-print">
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {v.stato === "in campo" && (
                        <button style={styles.btnGhostRed} onClick={() => onScorpora(v.id)}>
                          Scorpora
                        </button>
                      )}
                      <button style={styles.btnSecondary} onClick={() => startEdit(v)}>
                        Modifica
                      </button>
                      <button style={styles.btnGhostRed} onClick={() => window.confirm(`Eliminare ${v.nome} ${v.cognome}?`) && onDelete(v.id)}>
                        Elimina
                      </button>
                    </div>
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
function MezziTab({ mezzi, volontari, associazioni, tipiMezzoList, onUpdate, onDelete, onCheckout }) {
  const [search, setSearch] = useState("");
  const [statoFiltro, setStatoFiltro] = useState("tutti");
  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState({});
  const [checkingOutId, setCheckingOutId] = useState(null);
  const [kmFinaliDraft, setKmFinaliDraft] = useState("");

  const filtrati = useMemo(() => {
    return mezzi.filter((m) => {
      if (statoFiltro !== "tutti" && m.stato !== statoFiltro) return false;
      if (search.trim() && !m.targa.toLowerCase().includes(search.trim().toLowerCase())) return false;
      return true;
    });
  }, [mezzi, statoFiltro, search]);

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

  function exportCsv() {
    const rows = [["Targa", "Tipo", "Associazione", "Codice associazione", "Km iniziali", "Km finali", "Buono benzina", "Referente", "Ingresso", "Uscita", "Stato"]];
    filtrati.forEach((m) =>
      rows.push([
        m.targa, m.tipo, m.associazione || ASSOCIAZIONE_DEFAULT, m.codiceAssociazione || "", m.kmIniziali || "", m.kmFinali || "",
        m.buonoBenzina || "No", referenteNome(m.referenteVolontarioId), fmtDate(m.oraIngresso) + " " + fmtTime(m.oraIngresso),
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
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Targa</th>
              <th style={styles.th}>Tipo</th>
              <th style={styles.th}>Associazione</th>
              <th style={styles.th}>Km iniziali</th>
              <th style={styles.th}>Km finali</th>
              <th style={styles.th}>Referente</th>
              <th style={styles.th}>Ingresso</th>
              <th style={styles.th}>Stato</th>
              <th style={styles.th} className="no-print"></th>
            </tr>
          </thead>
          <tbody>
            {filtrati.length === 0 && (
              <tr>
                <td style={styles.td} colSpan={9}>
                  <span style={styles.emptyText}>Nessun risultato per i filtri selezionati.</span>
                </td>
              </tr>
            )}
            {filtrati.map((m) =>
              editingId === m.id ? (
                <tr key={m.id}>
                  <td style={styles.td} colSpan={9}>
                    <div style={{ display: "grid", gap: 8, padding: "8px 0" }}>
                      <div style={styles.grid2} className="grid2-force">
                        <input style={styles.input} value={editDraft.targa} onChange={(e) => setEditDraft({ ...editDraft, targa: e.target.value })} placeholder="Targa" />
                        <select style={styles.input} value={editDraft.tipo} onChange={(e) => setEditDraft({ ...editDraft, tipo: e.target.value })}>
                          {tipiMezzoList.map((t) => (
                            <option key={t}>{t}</option>
                          ))}
                        </select>
                      </div>
                      <input style={styles.input} list="associazioni-list-admin2" value={editDraft.associazione} onChange={(e) => setEditDraft({ ...editDraft, associazione: e.target.value })} placeholder="Associazione" />
                      <input style={styles.input} type="number" value={editDraft.kmIniziali} onChange={(e) => setEditDraft({ ...editDraft, kmIniziali: e.target.value })} placeholder="Km iniziali" />
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
                  <td style={styles.td}>{m.associazione || ASSOCIAZIONE_DEFAULT}</td>
                  <td style={styles.td}>{m.kmIniziali || "—"}</td>
                  <td style={styles.td}>{m.kmFinali || "—"}</td>
                  <td style={styles.td}>{referenteNome(m.referenteVolontarioId)}</td>
                  <td style={styles.td}>{fmtTime(m.oraIngresso)}</td>
                  <td style={styles.td}>
                    <span style={m.stato === "in servizio" ? styles.pillOrange : styles.pillGreen}>{m.stato}</span>
                  </td>
                  <td style={styles.td} className="no-print">
                    {checkingOutId === m.id ? (
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
                        {m.stato === "in servizio" && (
                          <button
                            style={styles.btnGhostRed}
                            onClick={() => {
                              setCheckingOutId(m.id);
                              setKmFinaliDraft("");
                            }}
                          >
                            Rientra
                          </button>
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
function ImpostazioniTab({
  config,
  archivio,
  specializzazioniList,
  tipiMezzoList,
  turniList,
  onSaveConfig,
  onAddSpecializzazione,
  onRemoveSpecializzazione,
  onAddTipoMezzo,
  onRemoveTipoMezzo,
  onAddTurno,
  onRemoveTurno,
  onChiudiEmergenza,
}) {
  const [nomeEmergenza, setNomeEmergenza] = useState(config.nomeEmergenza);
  const [nuovaSpec, setNuovaSpec] = useState("");
  const [nuovoTipo, setNuovoTipo] = useState("");
  const [nuovoTurno, setNuovoTurno] = useState({ nome: "", inizio: "", fine: "" });

  useEffect(() => {
    setNomeEmergenza(config.nomeEmergenza);
  }, [config.nomeEmergenza]);

  function exportArchivioCsv(entry) {
    const rows = [["Cognome", "Nome", "Associazione", "Specializzazione", "Luogo attività", "Inizio turno", "Fine turno", "Uscita"]];
    entry.volontari.forEach((v) =>
      rows.push([
        v.cognome, v.nome, v.associazione || ASSOCIAZIONE_DEFAULT, v.specializzazione || "", v.luogoAttivita || "",
        v.inizioTurno || fmtTime(v.oraIngresso), v.fineTurno || "", v.oraUscita ? fmtTime(v.oraUscita) : "",
      ])
    );
    downloadCsv(`archivio_${entry.nomeEmergenza.replace(/\s+/g, "_")}.csv`, rows);
  }

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <div style={styles.card}>
        <h2 style={styles.cardTitle}>Nome emergenza</h2>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <input style={{ ...styles.input, width: 280 }} value={nomeEmergenza} onChange={(e) => setNomeEmergenza(e.target.value)} placeholder="Nome emergenza" />
          <button style={styles.btnSecondary} onClick={() => onSaveConfig({ ...config, nomeEmergenza })}>
            Salva nome
          </button>
        </div>
      </div>

      <div style={styles.card}>
        <h2 style={styles.cardTitle}>Specializzazioni volontari</h2>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
          {specializzazioniList.map((s) => (
            <span key={s} style={styles.chip}>
              {s}
              <button style={styles.chipRemove} onClick={() => onRemoveSpecializzazione(s)} title="Rimuovi">
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            style={{ ...styles.input, maxWidth: 260 }}
            placeholder="Nuova specializzazione"
            value={nuovaSpec}
            onChange={(e) => setNuovaSpec(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                onAddSpecializzazione(nuovaSpec);
                setNuovaSpec("");
              }
            }}
          />
          <button
            style={styles.btnSecondary}
            onClick={() => {
              onAddSpecializzazione(nuovaSpec);
              setNuovaSpec("");
            }}
          >
            <Plus size={14} style={{ marginRight: 6 }} /> Aggiungi
          </button>
        </div>
      </div>

      <div style={styles.card}>
        <h2 style={styles.cardTitle}>Tipi mezzo</h2>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
          {tipiMezzoList.map((t) => (
            <span key={t} style={styles.chip}>
              {t}
              <button style={styles.chipRemove} onClick={() => onRemoveTipoMezzo(t)} title="Rimuovi">
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            style={{ ...styles.input, maxWidth: 260 }}
            placeholder="Nuovo tipo mezzo"
            value={nuovoTipo}
            onChange={(e) => setNuovoTipo(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                onAddTipoMezzo(nuovoTipo);
                setNuovoTipo("");
              }
            }}
          />
          <button
            style={styles.btnSecondary}
            onClick={() => {
              onAddTipoMezzo(nuovoTipo);
              setNuovoTipo("");
            }}
          >
            <Plus size={14} style={{ marginRight: 6 }} /> Aggiungi
          </button>
        </div>
      </div>

      <div style={styles.card}>
        <h2 style={styles.cardTitle}>Turni di servizio</h2>
        <p style={{ fontSize: 13, color: "#666", marginBottom: 12 }}>
          Definisci gli orari di inizio e fine turno disponibili nel modulo "Inserisci volontari".
        </p>
        <div style={{ display: "grid", gap: 8, marginBottom: 12 }}>
          {turniList.length === 0 && <div style={styles.emptyText}>Nessun turno configurato.</div>}
          {turniList.map((t) => (
            <div key={t.id} style={styles.rowItem}>
              <div>
                <div style={styles.rowTitle}>{t.nome}</div>
                <div style={styles.rowMeta}>
                  {t.inizio} – {t.fine}
                </div>
              </div>
              <button style={styles.btnGhostRed} onClick={() => onRemoveTurno(t.id)}>
                Rimuovi
              </button>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div>
            <label style={styles.label}>Nome turno</label>
            <input
              style={{ ...styles.input, width: 180 }}
              placeholder="Es. Turno Mattina"
              value={nuovoTurno.nome}
              onChange={(e) => setNuovoTurno({ ...nuovoTurno, nome: e.target.value })}
            />
          </div>
          <div>
            <label style={styles.label}>Inizio</label>
            <input
              style={{ ...styles.input, width: 110 }}
              type="time"
              value={nuovoTurno.inizio}
              onChange={(e) => setNuovoTurno({ ...nuovoTurno, inizio: e.target.value })}
            />
          </div>
          <div>
            <label style={styles.label}>Fine</label>
            <input
              style={{ ...styles.input, width: 110 }}
              type="time"
              value={nuovoTurno.fine}
              onChange={(e) => setNuovoTurno({ ...nuovoTurno, fine: e.target.value })}
            />
          </div>
          <button
            style={styles.btnSecondary}
            onClick={() => {
              onAddTurno(nuovoTurno);
              setNuovoTurno({ nome: "", inizio: "", fine: "" });
            }}
          >
            <Plus size={14} style={{ marginRight: 6 }} /> Aggiungi turno
          </button>
        </div>
      </div>

      <div style={styles.card}>
        <h2 style={styles.cardTitle}>
          <Archive size={16} style={{ marginRight: 6, verticalAlign: -3 }} /> Storico emergenze ({archivio.length})
        </h2>
        <div style={{ display: "grid", gap: 8 }}>
          {archivio.length === 0 && <div style={styles.emptyText}>Nessuna emergenza archiviata.</div>}
          {archivio.map((e) => (
            <div key={e.id} style={styles.rowItem}>
              <div>
                <div style={styles.rowTitle}>{e.nomeEmergenza}</div>
                <div style={styles.rowMeta}>
                  Chiusa il {fmtDate(e.dataChiusura)} · {e.volontari.length} volontari · {e.mezzi.length} mezzi
                </div>
              </div>
              <button style={styles.btnSecondary} onClick={() => exportArchivioCsv(e)}>
                <Download size={14} style={{ marginRight: 6 }} /> CSV
              </button>
            </div>
          ))}
        </div>
      </div>

      <div style={{ ...styles.card, borderColor: "var(--red)" }}>
        <h2 style={{ ...styles.cardTitle, color: "var(--red)" }}>Chiusura emergenza</h2>
        <p style={{ fontSize: 13, color: "#555", marginBottom: 12 }}>
          Archivia i dati correnti nello storico e azzera l'elenco operativo per iniziare una nuova emergenza.
        </p>
        <button style={styles.btnDanger} onClick={onChiudiEmergenza}>
          <RotateCcw size={16} style={{ marginRight: 6 }} /> Chiudi emergenza e azzera
        </button>
      </div>
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
  logoBadge: { width: 46, height: 58, borderRadius: 6, background: "var(--paper)", padding: 3, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 1px 4px rgba(0,0,0,0.35)" },
  logoImg: { width: "100%", height: "100%", objectFit: "contain" },
  orgName: { fontFamily: "'Oswald', sans-serif", fontSize: 15, letterSpacing: "0.03em", lineHeight: 1.2 },
  orgSub: { fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, opacity: 0.65, marginTop: 2 },
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
  assocBanner: { display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, background: "white", border: "1px solid var(--line)", borderRadius: 10, padding: "12px 16px" },
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
  toast: { position: "fixed", bottom: 20, left: "50%", transform: "translateX(-50%)", background: "var(--ink)", color: "var(--paper)", padding: "10px 18px", borderRadius: 8, fontSize: 13, boxShadow: "0 4px 20px rgba(0,0,0,0.2)" },
  fullscreenOverlay: { position: "fixed", inset: 0, background: "var(--ink)", color: "var(--paper)", zIndex: 1000, padding: "40px 6vw", display: "flex", flexDirection: "column", alignItems: "center", overflowY: "auto" },
  fullscreenClose: { position: "absolute", top: 20, right: 24, background: "#1F252F", color: "var(--paper)", border: "1px solid #2B323F", padding: "8px 14px", borderRadius: 6, fontSize: 13, display: "flex", alignItems: "center" },
  fullscreenBrand: { fontFamily: "'Oswald', sans-serif", fontSize: "clamp(20px, 3vw, 32px)", letterSpacing: "0.03em", textTransform: "uppercase", opacity: 0.85, marginBottom: 30, marginTop: 10, textAlign: "center" },
  fullscreenGrid: { display: "flex", gap: "4vw", flexWrap: "wrap", justifyContent: "center", marginBottom: 40 },
  fullscreenStat: { textAlign: "center" },
  fullscreenLabel: { fontFamily: "'IBM Plex Mono', monospace", fontSize: "clamp(12px, 1.4vw, 16px)", opacity: 0.6, letterSpacing: "0.06em", marginBottom: 8, textTransform: "uppercase" },
  fullscreenValue: { fontFamily: "'IBM Plex Mono', monospace", fontSize: "clamp(48px, 10vw, 120px)", fontWeight: 500, fontVariantNumeric: "tabular-nums", lineHeight: 1 },
  fullscreenSection: { width: "100%", maxWidth: 900, marginTop: 20 },
  fullscreenSectionTitle: { fontFamily: "'Oswald', sans-serif", fontSize: 15, textTransform: "uppercase", letterSpacing: "0.04em", opacity: 0.6, marginBottom: 12, textAlign: "center" },
  fullscreenChipRow: { display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" },
  fullscreenChip: { background: "#1F252F", border: "1px solid #2B323F", borderRadius: 8, padding: "10px 16px", fontSize: 15, fontFamily: "'IBM Plex Mono', monospace" },
  chip: { display: "inline-flex", alignItems: "center", gap: 6, background: "#EFEBE1", padding: "5px 10px", borderRadius: 20, fontSize: 12 },
  chipRemove: { background: "transparent", color: "#999", fontSize: 14, lineHeight: 1, padding: 0 },
};
