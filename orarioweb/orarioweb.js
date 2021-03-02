/*
OrarioWeb.js
Vittorio Lo Mele, Giovedì 25 Febbraio 2021
*/

var globJson;
var lastId;
var cycleLock;

//init tabella datatable
var dt = $('#tabellaorario').DataTable({
    "paging": false,
    "searching": false,
    "order": [[1, "asc"]],
    "language": {
        "url": "//cdn.datatables.net/plug-ins/1.10.22/i18n/Italian.json"
    },
    "columnDefs": [
        {
            "targets": [0],
            "visible": false,
            "searchable": false
        }
    ],
    "createdRow": function (row, data, dataIndex) {
        //console.log(data[0]); //debug
        if (data[0] == true) {
            $(row).addClass('riga-attiva');
        }
    }
});

//controlla il local data storage per l'impostazione di autostart link
if (window.localStorage.getItem('autostart')) {
    //checka la checkbox
    $("#autoStartCheckb").prop("checked", true);
}

//registra listener checkbox per cambiare localstorage e listener tasti
$("#autoStartCheckb").change(function () {
    window.localStorage.setItem('autostart', this.checked);
});
$("#btn-apri").click(function () {
    globJson.forEach(jelement => {
        secs = nowsec();
        today = new Date();
        if (today.getDay() == jelement.GiornoSettimana && jelement.IntervalloInizio < secs && jelement.IntervalloFine > secs) {
            var tab = window.open(jelement.Link, '_blank');
            tab.focus();
        }
    });
});

$("#btn-aggiorna").click(function () {
    orarioAjax();
});

//ottieni l'orario corrente in secondi
function nowsec() {
    var date = new Date();
    var mintosec = date.getMinutes() * 60;
    var hourstosec = date.getHours() * 3600;
    return hourstosec + mintosec + date.getSeconds();
}

function launchLink(link, lid) {
    if (lid != lastId && window.localStorage.getItem('autostart')) {
        lastId = lid;
        var tab = window.open(link, '_blank');
        tab.focus();
    }
}

//codice data a formato leggibile
function dateCodeToHuman(code) {
    switch (code) {
        case 1:
            return "Lunedì";
        case 2:
            return "Martedì";
        case 3:
            return "Mercoledì";
        case 4:
            return "Giovedì";
        case 5:
            return "Venerdì";
        case 6:
            return "Sabato";
        case 7:
            return "Domenica";
    }
}

//restituisce codice html per rendere il link cliccabile
function linkify(link) {
    return '<a href="' + link + '" target="_blank">' + link + '</a>'
}

function linkifyMat(link, materia) {
    return '<b>Attivo ora: </b><a class="riga-attiva" href="' + link + '" target="_blank">' + materia + '</a>'
}

//build tabella da array json
function buildTable(jsonData) {
    dt.clear();
    cycleLock = false; //reset lock
    jsonData.forEach(jelement => {
        secs = nowsec();
        today = new Date();
        if (today.getDay() == jelement.GiornoSettimana && jelement.IntervalloInizio < secs && jelement.IntervalloFine > secs) {
            buildTableRow(jelement, true);
            cycleLock = true; //blocca il reset del link attivo
            $("#linkattivo").html(linkifyMat(jelement.Link, jelement.Materia));
            launchLink(jelement.Link, jelement.Id);

        } else {
            buildTableRow(jelement, false);
        }
    });
    if(!cycleLock){
        $("#linkattivo").html("<b>Attivo ora: </b>Nessuno");
    }
    dt.draw();
}

//funzione build riga
function buildTableRow(jobject, isActive) {
    dt.row.add([
        isActive,
        jobject.Id,
        dateCodeToHuman(jobject.GiornoSettimana),
        secondsToHuman(jobject.IntervalloInizio),
        secondsToHuman(jobject.IntervalloFine),
        jobject.Materia,
        linkify(jobject.Link)
    ]);
}

//converte il valore in secondi in una stringa leggibile da un umano
function secondsToHuman(seconds) {
    var hours, minutes, hoursS, minutesS;
    minutes = seconds / 60; //calcola i minuti rimanenti
    hours = Math.floor(minutes / 60); //calcola le ore rimanenti
    minutes = minutes % 60; //assegna a minuti il modulo (resto divisione)...
    //...di se stesso per lasciare solo i minuti rimanenti

    //se il valore di ore è minore di 10 aggiunge uno zero per adattarsi al formato 24 ore
    if (hours < 10) {
        hoursS = "0" + hours;
    }
    else {
        hoursS = hours;
    }
    //stessa cosa per i minuti
    if (minutes < 10) {
        minutesS = "0" + minutes;
    }
    else {
        minutesS = minutes;
    }
    //combina le due stringhe con i due punti e ritorna
    s = hoursS + ":" + minutesS;
    return s;
}

//ottieni param
var getUrlParameter = function getUrlParameter(sParam) {
    var sPageURL = window.location.search.substring(1),
        sURLVariables = sPageURL.split('&'),
        sParameterName,
        i;

    for (i = 0; i < sURLVariables.length; i++) {
        sParameterName = sURLVariables[i].split('=');

        if (sParameterName[0] === sParam) {
            return typeof sParameterName[1] === undefined ? true : decodeURIComponent(sParameterName[1]);
        }
    }
    return false;
};

//ottieni orario
function orarioAjax() {
    $.ajax({
        type: "GET",
        url: "https://mrbackslash.it/api-orario/get.php?codice=" + getUrlParameter("c")
    }).done(function (jsonResult) {
        //orario letto
        if(jsonResult.success){
            globJson = jsonResult.data;
            buildTable(jsonResult.data);
        }
    }).fail(function () {
        //fail
        alert("Impossibile leggere il file orario!");
    });
}
orarioAjax();

//setta esecuzione periodica
var i = setInterval(function () {
    buildTable(globJson);
}, 5000);