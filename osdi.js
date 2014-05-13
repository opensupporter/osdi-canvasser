// TODO 
// addresses are now inline
// restructure data 
//    person->data
//    person->tags ['tag','tag']
//    person->self
//    person->tags
// detect if not chrome and alert
// add tagging support
// misc refactoring
//
// deal with non-json error response? or fix on server to always report json
// bump

"use strict";

var _data;
var _people;
var _sample = {
  first_name: 'Josh',
  last_name: 'Cohen',
  email: 'joshco@foobazio.com'
}

var _ls = window.localStorage;
var _counter_idx;
var _counter_count;

osdiLogClear();

var container = document.getElementById('container');
var viewport = document.getElementById('viewport');

$( document ).delegate("#localstore", "pageinit", function() {
  showLocal();
});

$( document ).ready(function() {
    console.log( "Document Ready!" );
    var is_chrome = navigator.userAgent.toLowerCase().indexOf('chrome') > -1;
    if ( ! is_chrome ) {
    //  alert('Please use Chrome');
    }
    if (_ls['osdi_aep'] == undefined || _ls['osdi_aep'] == "") {
        setServerAEP();
      } else {
        updateServerUI();
      }
    swizzleCounter();
  
});

function updateServerUI() {
    $('#osdi_server').val(_ls['osdi_aep']);
    $('#people_uri').text(_ls['osdi_people_uri']);
    $('#logger_uri').text(_ls['logger_uri']);
    $('#logo').attr('src',_ls['brand_logo']);
    $('#person_signup_uri').text(_ls['person_signup_uri']);
    $('#logo_uri').text(_ls['brand_logo']);
    if ( present(_ls['brand_logo'])) {
     $('#logo').attr('src',_ls['brand_logo']);
    } else {
     $('#logo').attr('src',null);
    }
    $('#canvasser_email').val(_ls['canvasser_email']);
    
}

// if ( _ls['osdi_aep'] == undefined || _ls['osdi_aep'] == "") {
//   _ls['osdi_aep'] = $('#osdi_server').val();
//   var uri = getPeopleURI();
//   _ls['osdi_people_uri'] = uri;
//   osdiLog('Set empty aep to ' + _ls['osdi_aep'] + ' PURI ' + uri);
// }

// $('#osdi_server').val(_ls['osdi_aep']);
// $('#people_uri').text(_ls['osdi_people_uri']);
// $('#logo').attr('src',_ls['brand_logo']);

/*
$( "a" ).on( "click", function( event ){

  // Prevent the usual navigation behavior
  event.preventDefault();

  // grab new URL
  var newUrl = $(this).attr( "href" );
  osdiLog('going to ' + newUrl);
  // Alter the url according to the anchor's href attribute, and
  // store the data-foo attribute information with the url
  $.mobile.navigate( newUrl );

 
});
*/
//getPeople();

// form buttons
$('#btnProcess').click(function (event) {
    event.preventDefault();
    uploadForm();
  });

$('#btnReset').click(function (event) {
 // clearButton('#btnReset');
  $("#myForm")[0].reset()
  console.log('Clicked Reset');
  });

$('#btnSave').click(function (event) {
    event.preventDefault();
    console.log('Save Clicked');

    // we need to allow blank email.
  //    if ( $('#email').val() == "" ) {
  //   alert('Email must not be blank');
   
  // } else {
      if ( saveForm() != null ) {
         saveConfirmation();
  swizzleCounter();
    } else {
    alert("Missing Required Fields");
    }
  // }
 
  
  });

function saveConfirmation() {
  if ( $('#save_confirmation').prop('checked')) {
    $.mobile.changePage('#saved');
    setTimeout(function() { 
      $.mobile.changePage('#newrecord');
    },1000);

  }
}

function showLogs()
{
  $("#log-messages").html( osdiLogMessages().join("<br/>"));
  $.mobile.changePage('#logger');
}

function showSavedScreen() {

    window.location = '#saved';

      setTimeout(function() {
      window.location = '#newrecord';
    },1000);
}
// upload button
$('#btnUpload').click(uploadPeople);
$('#btnClearLocal').click(clearLocal);
$('#btnUpdateServer').click(setServerAEPUI);
$('#btnShowLogs').click(showLogs);
$('.local-refresh').click(showLocal);

function clearButton(btnStringId) {
  $(btnStringId).parent().removeClass('ui-btn-active');
}

function doImage() {
	var image= new Image();
	image.src="http://my.washingtonunitedformarriage.org/assets/web/avatar-face-wa.png";
	return image;
}
function setBusy(status) {
  if (status) {
    $('#status').text('Busy');
  } else {
    $('#status').text('Ready');
  }
}

function uploadForm() {
    var p=processForm();
    uploadPerson(p);

}

function saveForm() {
    var p=processForm();
    if ( p != null ) {
      savePerson(p);

    } 
      
    return p;
}

// people stuff
function uploadPeople() {
  var _counter_count = countPeople();
   if ( _counter_count == 0 ) {
    alert('No records to upload!');
    return;
  }
  if ( ! present(_ls['person_signup_uri'])) {
    alert('Invalid OSDI Server. Update AEP');
    return;
  }
  busy(true);
 
  window.setTimeout( processUploads, 100);

}

function busy(yes) {
  if ( yes ) {
    $('#status').html('<span style="color: red">Busy Working...</span>');
     $.mobile.loading('show');
  } else {
    $('#status').html('Ready...');
    $.mobile.loading('hide');
  }
}

function counter(idx,count) {
  $('#counter').html( idx + ' / ' + count);
}

function clearCounter() {
  $('#counter').html('');
}

function countPeople() {
  var people=loadPeople();
  var count = Object.keys(people).length;

  return count;
}

function updateCounter() {
  var count = countPeople();
  $(".store-count").text( "(" + count + ")");
}
function swizzleCounter() {
  updateCounter();
  $(".store-count").effect("pulsate",{times:4},1000)
}

function verifyUpload(prune) {
  var people=loadPeople();
  var status;
  _ls['failures'] = 0;
  var failures = 0;

  for (var key in people) {
    status = people[key]['status_code']

    if (status != 200) {
      // there was an error
      osdiLog("Error " + status + " uploading " + key);
      failures++
      } else {
      if (prune == true) {
        osdiLog("OK to remove " + key);
        deletePerson(key);
      }
    }
  }
  _ls['failures'] = failures;
  return failures
}

function uploadLogs(logger_uri,status) {
  var json = JSON.stringify(_ls);
  var res=exec_ajax(json,logger_uri + "?status=" + status);
  return res;
}

function postProcess() {
  // are there failures?
  var failures = verifyUpload(false);
  var res;
  var msgs = [];

  if ( present(_ls['logger_uri'])) {
     // upload logs
    if ( failures > 0 ) {
      msgs.push("There were " + failures + " errors, logs uploaded");
      res=uploadLogs(_ls['logger_uri'],901);
    } else if ( $("#always_log").prop('checked') ) {
      msgs.push("No errors.  Logging transmitted")
      res=uploadLogs(_ls['logger_uri'],900);
    }

    if ( res.status == 200 ) {
      // logs uploaded successfully
      if ( $("#auto_clean").prop('checked') ) {
        //clean
        msgs.push('Clearing local store')
        clearLocalInner();
        osdiLogClear();

      }  
    } else {
      msgs.push('Could not send logs!')
    }
    

  } else {
    // no logging so just prune
    verifyUpload(true);

  }
 
  var log_messages = osdiLogMessages();

  $("#log-messages").html(msgs.join("<br/>") +  "<br/><br/>" + log_messages.join("<br/>"));
  window.location = "#logger";
   
}

function uploadPeopleInner() {
  


  
  var resourceUrl = _ls['osdi_people_uri'];
  var people = loadPeople();
  _counter_count = countObjectProperties(people);
  _counter_idx = 0;

   for(var key in people) {
      _counter_idx++;
      counter(_counter_idx,_counter_count);
      window.setTimeout(function () {
        uploadPerson(people[key], resourceUrl)}, 300);

  }
  busy(false);
}

function processUploads() {
  var resourceUrl = _ls['person_signup_uri'];
  var people = loadPeople();
  var kys = Object.keys(people);
  var mykey;
  _counter_count = countObjectProperties(people);

  _counter_idx = 0;
  osdiLog("Preparing to upload " + _counter_count + " items");
  function doChunk() {
    mykey=kys[_counter_idx];
    osdiLog("Processing " + mykey + " idx " + _counter_idx);

    counter(_counter_idx +1 ,_counter_count);
    uploadPerson(people[mykey],resourceUrl);
    //tagPerson(people[mykey]);
    _counter_idx++;

    if (_counter_idx < _counter_count) {
      setTimeout(doChunk,100);
    } else {
     
      clearCounter();
      postProcess();
      busy(false)
      
    }

  }
  doChunk();

 //  busy(false);

}


function clearLocal() {
  var r=confirm('Delete: Are you sure?');
  if ( r == true) {
    clearLocalInner();  
  }
  

}
function clearLocalInner() {
      _ls.removeItem('people');  
      swizzleCounter();
  }

function showLocal() {
  console.log('In showLocal');
  $('#record-list').empty();
  var people = loadPeople();
  for(var key in people) {
    console.log('Adding ' + key);
    var fn = people[key]['data']['given_name'] + ' ' + people[key]['data']['family_name'];
    $('#record-list').append('<li>' + fn + ' &lt;' + key + '&gt;</li>');
    $('#record-list').listview('refresh'); 
   // $('body').append(localStorage.getItem(key));
  }

}

function loadPeople(){
  var peopleRaw = _ls['people'];
  if ( peopleRaw == "" || peopleRaw == undefined) {
    // it's empty so send back an empty hash
    return {};
  }
  var people = JSON.parse(peopleRaw);
  return people;

}

function loadPerson(email){
  var peopleRaw = _ls['people'];
  if ( peopleRaw == "" || peopleRaw == undefined) {
    // it's empty so send back an empty hash
    return {};
  }
  var people = JSON.parse(peopleRaw);
  return people[email];

}

function deletePerson(key) {
   
  var people = loadPeople();
  delete people[key]
  var json=JSON.stringify(people);
  _ls['people'] = json;

}

function savePerson(p) {
  console.log(this);
  var people = loadPeople();
  var email = p.data.email_addresses[0].address
  var hkey;

  var name = p.data.given_name + p.data.family_name;
  if (email) {
    hkey=email;
   } else {
      hkey = name;
   }

  people[hkey] = p;

  var json=JSON.stringify(people);
  _ls['people'] = json;
  $('#btnReset').click();

}

function processForm() {
  if ( ! present($('#first_name').val())
   && !present($('#last_name').val())
   && ! present($('#email').val())
   ) {
    return null;
  }
    
  var q={};
  q['data'] = {};
  var p = q['data'];
  p['add_tags'] = []
  
  var tags = p['add_tags'];


  p['given_name']=$('#first_name').val();
  p['family_name']=$('#last_name').val();
  p['email_addresses']= [ { 
      "address" : $('#email').val(),
      "primary" : true
    }];

  p['phone_numbers'] = [];
  p['phone_numbers'][0] = {
    'number' : $('#phone_number').val(),
    'sms_permission' : $('#sms_permission').val()
  }
  
  var a={
    "address_lines": [ $('#address1').val(),$('#address2').val() ],
    "locality": $('#city').val(),
    "region": $('#state').val(),
    "postal_code": $('#postal_code').val()
  }
  p['postal_addresses'] = [ a ];
  
  // // handle checkboxes for tags
  // if ( $('#volunteer').prop('checked') ){
  //   tags.push('volunteer');
  // }
  $( ".tags" ).each(function() {
    if ( $( this ).prop('checked') ) {
     tags.push( $(this).val() ); 
    }
    
  });

  console.log('Generated person ');
  console.log(q);
  return q;


}
// Server stuff
function setServerAEPUI() {
  if ( ! present( $('#canvasser_email').val() )) {
    alert("Please enter canvasser email");
    return;
  } else {
    _ls['canvasser_email'] =  $('#canvasser_email').val();
  }

  busy(true);
  setTimeout(setServerAEP,300);
}

function setServerAEP() {
 
  var aep = $('#osdi_server').val();
  _ls['osdi_aep'] = aep;
  var peopleUrl = getPeopleURI();
  _ls['osdi_people_uri'] = peopleUrl;
  console.log('Set AEP: ' + aep);
  
  updateServerUI();
  busy(false);
}

function nav(obj, expression) {
  var ret=undefined;

  try {
    ret = eval(expression);
  } catch (e) {
    ret = undefined;
  }
  return ret;
}

function getOSDIStatus(json) {
  var obj;
  var str;
  try {
    obj = JSON.parse(json);
    str = obj['osdi:status']['status'] + ' ' + obj['osdi:status']['description'];  
  } catch (e) {
    str = "Undetermined";
  }
  
  return str;

}
function present(obj) {
  if ( obj != undefined && obj != null && obj != ""
    && obj != "undefined" && obj != "null"){
    return true;

  } else {
    return false;
  }
}

function getPeopleURI() {

  var aep=getAEP();

  var peopleUrl = aep['_links']['osdi:people']['href'];
  console.log('People URL: ' + peopleUrl);  
  try {
     _ls['person_signup_uri'] = aep['_links']['osdi:person_signup_helper']['href'];
  } catch (e) {
    alert("Cannot find OSDI Server");
  }
 
  if ( ! present(_ls['person_signup_uri'])) {
    alert('Invalid OSDI Server');
  }

  // optional
  _ls['brand_logo'] = nav(aep,"obj['_links']['canvasser:brand_logo']['href']" ) ;
  _ls['logger_uri'] = nav(aep, "obj['_links']['canvasser:logger']['href']" ) ;
  console.log("Got here");


  return peopleUrl;
}

function getOSDILinkURI(rel) {

  var aep=getAEP();

  var linkUri = aep['_links'][rel]['href'];
   
  return linkUri;
}

function getAEP() {
  var response;

   console.log('Get AEP');
  var ajaxSettings = {
    // The url to flickrs api
    url: _ls['osdi_aep'],
    async: false,
    type: "GET",
    // The function to execute when the api has finished loading
    //success: apiSuccessOSDI,
  };
  // Pass all the settings to being fetching the data
  response = $.ajax(ajaxSettings);
  console.log(response);
  var aep = JSON.parse(response.responseText);
  return aep;

}
function uploadPerson(person, resourceUrl) {
  // serialize to JSON
  var json = JSON.stringify(person['data']);

  var response;
  var response_json;
  // busy on
 
  // do POST to server synchronous
  // Settings to pass to jquery to fetch the data
  osdiLog('Uploading person ' + personEmail(person));
 
  response = exec_ajax(json,resourceUrl);

  response_json = response.responseText;
  person['save_response'] = response_json;
  person['status_code'] = response.status;
  person['request_id'] = response.getResponseHeader('OSDI-Request-ID');

  savePerson(person);
  if ( response.status > 299) {
    osdiLog("Upload Error " + personEmail(person) + " status " + response.status);
    osdiLog(getOSDIStatus(response.responseText));
  } else {
    osdiLog("Upload Success " + personEmail(person) + " status " + response.status);
  }
  console.log(response);
  // busy off


}

function tagPerson(person) {
  var save_response=JSON.parse(person['save_response']);

  var tagUrl =save_response['_links']['osdi:tags']['href'];
  var json;

  person['tags'].map( function (tagName) {
    console.log ("Tagging [" + tagName + "] " + personEmail(person) );
    tagObject(tagName,tagUrl);

  });

  
}

function personEmail(person) {
  var pe = person['data']['email_addresses'][0]['address'];
  return pe;
}
function tagObject(tagName, tagUrl) {
  var tagHash = { 
    "name" : tagName
  };

  var json = JSON.stringify(tagHash);

  var response = exec_ajax(json,tagUrl);


}

function exec_ajax(json,resourceUrl) {
  var response;

   var ajaxSettings = {
    // The url to flickrs api
    url: resourceUrl,
    // The format we want it in
    dataType: 'json',
    async: false,
    type: "POST",
    data: json,
    // The function to execute when the api has finished loading
    //success: apiSuccessOSDI,
  };
  // Pass all the settings to being fetching the data
  response = $.ajax(ajaxSettings);
  console.log(response.status + ' POST ' + resourceUrl );
  return response;
}

function apiSuccessOSDI(data) {
	_data=data;
  _people = _data['_embedded']['people'];
	console.log(data);
  renderPeople(_people);

}

// This function is to be called when reddits api responds
function apiSuccess(data){
  console.info('flickr response', data);
  // Reddit returns a lot of data, find the bit we actually want
  var whiteMeat = data['items'];
  // Loop through the reddit posts
  for (var i = whiteMeat.length - 1; i >= 0; i--) {
    // Assign the post to a variable for neatness
    var data = whiteMeat[i];
    // Generate the image for the post
    var postImage = new Image();
    // *on* the images load event, execute the imageload function
    postImage.onload = imageLoad;
    // Set the image source to the url we got from flickr
    postImage.src = data['media']['m'].replace('_m', '_b');
    // Disable the browser default behaviour, can interfere with swiping
    postImage.draggable = false;
  };
}

function renderPeople(data) {

	for (var i=0;i<data.length;i++) {
    var p=data[i];
		console.log('Person: ' + p);
    $('#people').append("<h2>" + p.first_name + ' ' + p.last_name + "</h2>");
    $('#people').append("<p>" + p.email + '</p>');
	}
}

function getPosts(){
  // Settings to pass to jquery to fetch the data
  var ajaxSettings = {
    // The url to flickrs api
    url: 'http://api.flickr.com/services/feeds/photos_public.gne?format=json&jsoncallback=?',
    // The format we want it in
    dataType: 'jsonp',
    // The function to execute when the api has finished loading
    success: apiSuccess,
  };
  // Pass all the settings to being fetching the data
  $.ajax(ajaxSettings);
}

function getPeople(){
  // Settings to pass to jquery to fetch the data
  var ajaxSettings = {
    // The url to flickrs api
    url: 'http://192.168.40.1:3000/api/v1/people/',
    // The format we want it in
    dataType: 'json',
    // The function to execute when the api has finished loading
    success: apiSuccessOSDI,
  };
  // Pass all the settings to being fetching the data
  $.ajax(ajaxSettings);
}

// count of items in an object
function countObjectProperties(obj)
{
    var count = 0;
    for(var i in obj)
        if(obj.hasOwnProperty(i))
            count++;

    return count;
}

function osdiLog(msg) 
{
  console.log(msg);
  var log_messages = JSON.parse(_ls['log_messages']);
  log_messages.push(msg);
  _ls['log_messages']= JSON.stringify(log_messages);
}

function osdiLogClear()
{
  _ls['log_messages'] = "[]";
}

function osdiLogMessages() {
  var log_messages = JSON.parse(_ls['log_messages']);
  return log_messages;
}

// app cache stuff
// Check if a new cache is available on page load.
window.addEventListener('load', function(e) {

  window.applicationCache.addEventListener('updateready', function(e) {
    if (window.applicationCache.status == window.applicationCache.UPDATEREADY) {
      // Browser downloaded a new app cache.
      if (confirm('A new version of this site is available. Load it?')) {
        window.location.reload();
      }
    } else {
      // Manifest didn't changed. Nothing new to server.
    }
  }, false);

}, false);
