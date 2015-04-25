/*
 *  Andrew Palma
 *  CS290
 *  23-Apr-2015
 */

var settings = null;
var f_results = [];
var i_results = [];
var num_records_display = 0;

function Gist(id, description, url) {
    this.id = id;
    this.description = description;
    this.url = url;
}

function createRow(gist, fave_bool, index) {
    var bvalue;
    var bclick;
    var trow = document.createElement('tr');
    if (!fave_bool) trow.setAttribute('id', gist.id);
    
    var td1 = document.createElement('td');
    var td2 = document.createElement('td');
    
    var aTag = document.createElement('a');
    aTag.setAttribute('href', gist.url);
    aTag.setAttribute('target', '_blank');
    
    // following needed because Firefox and Safari not support innerText
    if (document.all)
    aTag.innerText = gist.description ? gist.description : 'No description';
    else
    aTag.textContent = gist.description ? gist.description : 'No description'; 
    td1.appendChild(aTag);
    trow.appendChild(td1);
    
    if (fave_bool) {
        bvalue = 'Remove';
        bclick = 'delFromFaves(id)';
/*
 *  Note to self.  I had to hack here.  Putting the id value into
 *  bclick was screwing up in going doing remove fave, but working
 *  well for add fave????  Something about having the long id value
 *  in the parens.
 *  So I took it out and put id attribute in button tag
 *  So have to get the parentNode when doing remove().
 */       
    } else {
        bvalue = 'Add';
        bclick = 'addToFaves(' + index + ')';
    }

    var buttonTag = document.createElement('input');
    buttonTag.setAttribute('type', 'button');
    buttonTag.setAttribute('value', bvalue);
    buttonTag.setAttribute('onclick', bclick);
    if (fave_bool) buttonTag.setAttribute('id', gist.id);
    td2.appendChild(buttonTag);
    trow.appendChild(td2);
    
    return trow;
}


function createInitTable(g_array, sec_id, fave_bool) {
    var tablId = fave_bool ? 'fave_table' : 'get_table';
    var tbodyId = fave_bool ? 'fave_tbody' : 'get_tbody';
    var tabl = document.getElementById(tablId);
    if (tabl != null) tabl.remove();
    var mySec = document.getElementById(sec_id);
    
    tabl = document.createElement('table');
    tabl.setAttribute('id', tablId);
    
    var tablBdy = document.createElement('tbody');
    tablBdy.setAttribute('id', tbodyId);
    
    var gist = null;
    var row;
    
    for (var i = 0; i < g_array.length; i++) {
        if (fave_bool) {
            gist = settings.faves[g_array[i]];
            row = createRow(gist, true, 0);
        } else {
            gist = g_array[i];
            row = createRow(gist, false, i);
        }
        tablBdy.appendChild(row);
    }
    
    tabl.appendChild(tablBdy);
    mySec.appendChild(tabl);
}

function addToFaves(index) {
    var gist = f_results[index];
    if (gist instanceof Gist) {
        settings.faves[gist.id] = gist;
        localStorage.setItem('userSettings', JSON.stringify(settings));
        
        // rm from get
        var grow = document.getElementById(gist.id);
        grow.remove();
        // add to fave
        var frow = createRow(gist, true, 0);
        var tbody = document.getElementById('fave_tbody');
        tbody.appendChild(frow);
        return true;
    } else {
        console.error('Attempted to add non-gist');
        return false;
    }
}

function delFromFaves(gid) {
    var gist = settings.faves[gid];
    // rm from fave
    var frow = document.getElementById(gid).parentNode.parentNode;
    frow.remove();
    // add to get
    var grow = createRow(gist, false, f_results.length);
    var tbody = document.getElementById('get_tbody');
    tbody.appendChild(grow);
    
    f_results.push(gist);
    delete settings.faves[gid];
    localStorage.setItem('userSettings', JSON.stringify(settings));
}

    
function filterGists(arrRes) {
    var filtered = [];
    var prog_lang;
    
    // get list of checked languages
    var checkedLangs = [];
    var checks = document.getElementsByName('langs[]');
    for (var i = 0; i < checks.length; i++) {
        if (checks[i].checked) checkedLangs.push(checks[i].value);
    }
     
    for (var i = 0; i < num_records_display; i++) {
        for (var fkey in arrRes[i].files) {
            prog_lang = arrRes[i].files[fkey].language;
        }
        if (!checkedLangs || checkedLangs.length == 0 ||  checkedLangs.indexOf(prog_lang) > -1) {
            if (settings.faves && !(arrRes[i].id in settings.faves)) {
                filtered.push(new Gist(arrRes[i].id, arrRes[i].description, arrRes[i].html_url));
            }
        }
    }
    return filtered;
}

   
/* reference code for CORS from http://www.html5rocks.com/en/tutorials/cors/ */

// Create the XHR object.
function createCORSRequest(method, url) {
  var xhr = new XMLHttpRequest();
  if ("withCredentials" in xhr) {
    // XHR for Chrome/Firefox/Opera/Safari.
    xhr.open(method, url, true);
  } else if (typeof XDomainRequest != "undefined") {
    // XDomainRequest for IE.
    xhr = new XDomainRequest();
    xhr.open(method, url);
  } else {
    // CORS not supported.
    xhr = null;
  }
  return xhr;
}


function getGists2() {
    var url = 'https://api.github.com/gists/public?page=2&per_page=75';
    
    // make ajax call to get results
    var req = createCORSRequest('GET', url);
  	if (!req) {
        alert('CORS not supported');
        return;
    }
    
    req.onload = function() {
        if (this.status === 200) {
            i_results = i_results.concat(JSON.parse(this.responseText));
            f_results = filterGists(i_results);
            createInitTable(f_results, 'get_section', false);
        } else {
            alert('No 200 status... Error');
        }
    };
    
    req.onerror = function() {
        alert('Woops, there was an error making the request.');
    };

    req.send();
}

function getGists1() {
    var url = 'https://api.github.com/gists/public?page=1&per_page=75';
    
    // get number of total records to get as selected page number * 30
    var pages = document.getElementsByName('num_pages')[0].value;
    if (pages > 5) pages = 5;
    else if (pages < 1) pages = 1;
    num_records_display = pages * 30;
    
    // make ajax call to get results
    var req = createCORSRequest('GET', url);
  	if (!req) {
        alert('CORS not supported');
        return;
    }
    
    req.onload = function() {
        if (this.status === 200) {
            i_results = JSON.parse(this.responseText);
            getGists2();
        } else {
            alert('No 200 status... Error');
        }
    };
    
    req.onerror = function() {
        alert('Woops, there was an error making the request.');
    };

    req.send();
}


window.onload = function() {
    var settingsStr = localStorage.getItem('userSettings');
    var keys = [];
    if (settingsStr === null) {
        settings = {'faves':{}};
        localStorage.setItem('userSettings', JSON.stringify(settings));
    } else {
        settings = JSON.parse(localStorage.getItem('userSettings'));
        for (var key in settings.faves) {
            if (settings.faves.hasOwnProperty(key)) {
                keys.push(key);
            }
        }
    }
    //  display favorites
    createInitTable(keys, "fave_section", true);   
}

    
        
    
    
    