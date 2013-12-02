"use strict";

var _data;
var _people;
var _sample = {
  first_name: 'Josh',
  last_name: 'Cohen',
  email: 'joshco@foobazio.com'
}

var container = document.getElementById('container');
var viewport = document.getElementById('viewport');

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

$('#btnProcess').click(uploadForm);
$('#btnSave').click(saveForm);


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

function savePerson(p) {
  var ls = window.localStorage;
  var json=JSON.stringify(p);
  ls[p.email] = json;

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
function uploadPerson(person) {
  // serialize to JSON
  var json = JSON.stringify(person);

  var response

  // busy on
  setBusy(true);
  // do POST to server synchronous
  // Settings to pass to jquery to fetch the data
  console.log('Pre ajax');
  var ajaxSettings = {
    // The url to flickrs api
    url: 'http://192.168.40.1:3000/api/v1/people/',
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
  setBusy(false);

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
