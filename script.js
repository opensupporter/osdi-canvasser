"use strict";
 
var container = document.getElementById('container');
var viewport = document.getElementById('viewport');
 
 var indexCounter = 0;
 var indexMax = 0;
 
function nextImage() {

	indexCounter += 1;
	if ( indexCounter > indexMax) {
		indexCounter=0;
	}
	showImage(indexCounter);


}

function showImage(index) {
	var offset = index * viewport.clientWidth;
	console.log('viewportw: ' + viewport.clientWidth + ' offset: ' + offset);
	container.style.marginLeft = '-' + offset + 'px';
	indexCounter = index;
}

function apiSuccess(result){
  // debugger;
  var photos = result['items'];
  indexMax = photos.length-1;
 
  for (var i = photos.length - 1; i >= 0; i--) {
    var currentPhoto = photos[i];
    var imageSrc = currentPhoto['media']['m'];
    // console.log(imageSrc);
 
    var henrysImage = new Image();
    henrysImage.src = imageSrc;
 
    var henrysDiv = document.createElement('div');
 
    henrysDiv.appendChild(henrysImage);
    henrysDiv.className = 'post';
    henrysDiv.style.width= viewport.clientWidth + 'px';
 
    container.appendChild(henrysDiv);
 
  };
 
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
  jQuery.ajax(ajaxSettings);
}
 
jQuery(document).ready(function(){
  getPosts();
});