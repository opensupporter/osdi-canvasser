"use strict";

var _data;
var _people;
var _sample = {
  first_name: 'Josh',
  last_name: 'Cohen',
  email: 'joshco@foobazio.com'
}
  var _ls = window.localStorage;

var container = document.getElementById('container');
var viewport = document.getElementById('viewport');

$( document ).delegate("#localstore", "pageinit", function() {
  showLocal();
});

if ( _ls['osdi_aep'] == undefined || _ls['osdi_aep'] == "") {
  _ls['osdi_aep'] = 'http://api.opensupporter.org/api/v1';
  var uri = getPeopleURI();
  _ls['osdi_people_uri'] = uri;
  console.log('Set empty aep to ' + _ls['osdi_aep'] + ' PURI ' + uri);
}

$('#osdi_server').val(_ls['osdi_aep']);
$('#people_uri').text(_ls['osdi_people_uri']);

/*
$( "a" ).on( "click", function( event ){

  // Prevent the usual navigation behavior
  event.preventDefault();

  // grab new URL
  var newUrl = $(this).attr( "href" );
  console.log('going to ' + newUrl);
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
  clearButton('#btnReset');
  console.log('Clicked Reset');
  });

$('#btnSave').click(function (event) {
    event.preventDefault();
    console.log('Save Clicked')
     if ( $('#email').val() == "" ) {
    alert('Email must not be blank');
    return null;
  }
  
    saveForm();
    clearButton('#btnSave');
    $('#btnSave').parent().removeClass('ui-btn-active');
  });

// upload button
$('#btnUpload').click(uploadPeople);
$('#btnClearLocal').click(clearLocal);
$('#btnUpdateServer').click(setServerAEP);
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
    savePerson(p);
}

// people stuff
function uploadPeople() {
  busy(true);
  window.setTimeout( uploadPeopleInner, 100);
}

function busy(yes) {
  if ( yes ) {
    $('#status').html('<span style="color: red">Busy Working...</span>');
  } else {
    $('#status').html('Ready...');
  }
}

function uploadPeopleInner() {
  

  
  var resourceUrl = _ls['osdi_people_uri'];
  var people = loadPeople();
   for(var key in people) {
      uploadPerson(people[key], resourceUrl);

  }
  busy(false);
}

function clearLocal() {
  var r=confirm('Delete: Are you sure?');
  if ( r == true) {
    _ls.removeItem('people');  
  }
  

}
function showLocal() {
  console.log('In showLocal');
  $('#record-list').empty();
  var people = loadPeople();
  for(var key in people) {
    console.log('Adding ' + key);
    $('#record-list').append('<li>' + key + '</li>');
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
function savePerson(p) {
  console.log(this);
  var people = loadPeople();
  people[p.email] = p;

  var json=JSON.stringify(people);
  _ls['people'] = json;
  $('#btnReset').click();

}

function processForm() {
  var p={};

  p['first_name']=$('#first_name').val();
  p['last_name']=$('#last_name').val();
  p['email']=$('#email').val();
  console.log('Generated person ');
  console.log(p);
  return p;


}
// Server stuff
function setServerAEP() {
  var aep = $('#osdi_server').val();
  _ls['osdi_aep'] = aep;
  var peopleUrl = getPeopleURI();
  _ls['osdi_people_uri'] = peopleUrl;
  console.log('Set AEP: ' + aep);
  console.log('Set PRUI: ' + peopleUrl);

  $('#osdi_server').val(_ls['osdi_aep']);
  $('#people_uri').text(_ls['osdi_people_uri']);
}

function getPeopleURI() {

  var aep=getAEP();

  var peopleUrl = aep['_links']['people']['href'];
  console.log('People URL: ' + peopleUrl);
  return peopleUrl;
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
  var json = JSON.stringify(person);

  var response

  // busy on
 
  // do POST to server synchronous
  // Settings to pass to jquery to fetch the data
  console.log('Pre ajax');
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
  console.log(response);
  // busy off


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