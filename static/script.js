/* Called when click on marker (ISS) */
function onClick(e) {
    window.open(this.options.url);
}

/* Add ISS Marker */
function createISS(lat, lon){
	iss_icon = L.icon({
    iconUrl: 'static/iss.png',
    iconRetinaUrl: 'iss@2x.png',
    iconSize: [128, 128],
	});

  lon = lon - 360;
  // Add 3 ISS to allow on left and right sides
  // There is LeafLet parameter for copying map but it's quite laggy
  for(var i = 0; i < 3; i++){
    console.log(lon + ' ' + lat);
    var station = new L.Marker([lat, lon], {
      icon: new L.DivIcon({
          className: 'iss-icon',
          html: '<span id="iss">🛰️</span>'
      }),
			url: 'http://maps.google.com/maps?z=12&t=m&q=loc:' + lat + '+' + lon
    });

    mul_iss[i] = station;
    station.addTo(map);
    lon = lon + 360;
    mul_iss[i].on('click', onClick);
  }
}

function moveISS(lat, lon){
  console.log("Got new coords [" + lat + ", " + lon + "]"); 

  if(follow){
    map.panTo(new L.LatLng(lat, lon));
  }

  lon = lon - 360;
  for(var i = 0; i < mul_iss.length; i++){
	  mul_iss[i].setLatLng([lat, lon])
		mul_iss[i].options.url = 'http://maps.google.com/maps?z=12&t=m&q=loc:' + lat + '+' + lon
    lon = lon + 360;
  }
}

/*
 * Function for sending http request. Used for receiving current ISS position
 * from API.
 * Args:
 *  url: API-request url.
 *  callback: callback function after recieving response.
 */
function httpGet(url, callback)
{
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() { 
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
            callback(xmlHttp.responseText);
    }
    xmlHttp.open("GET", url, true); // true for asynchronous 
    xmlHttp.send(null);
}

/*==============================================================================
 * Main section.
 *=============================================================================/

/* Set to 'true' camera will follow ISS */
follow = false
/* Information elements exists */
infoExist = false

/*
 * Initialize map.
 */
var map = L.map('mapid').setView([0, 0], 3);
map.setMaxBounds( [[-90,-360], [90,360]] )

L.tileLayer(
	'https://api.mapbox.com/styles/v1/mapbox/streets-v9/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1Ijoic25hc2hlIiwiYSI6ImRFWFVLLWcifQ.IcYEbFzFZGuPmMDAGfx4ew', 
	{
    maxZoom: 18,
    minZoom: 3,
    maxBoundsViscosity: 0.5
    //noWrap: true
  }
).addTo(map);

var mul_iss = [];

// Create ISS on the map
httpGet(window.location.href + 'coords', createISS);
httpGet(window.location.href + 'issfullinfo', function(response){
  data = JSON.parse(response);

  lat = data['latitude'];
  lon = data['longitude'];
  createISS(lat, lon);  
});

// Update ISS position every 3 seconds.
setInterval(function(){
  httpGet(window.location.href + 'issfullinfo', function(response){
    data = JSON.parse(response);

    lat = data['latitude'];
    lon = data['longitude'];
    moveISS(lat, lon);  
    infoiss.update(data);  
  })},
  3000 // [ms]
);

//==============================================================================
// Add windows with people in space
//==============================================================================
// Adding info window
var info = L.control();

info.onAdd = function (map) {
  this._div = L.DomUtil.create('div', 'info'); // create a div with a class "info"
  return this._div;
};

// method that we will use to update the control based on feature properties passed
info.update = function (data) {
    var str = ''; 
    people_arr = data['people']
    for(i = 0; i < people_arr.length; i++){
      var url = people_arr[i]['name'].replace(' ', '+')
      str += '<div class="item"><a target="_blank" rel="noopener noreferrer" href="https://duckduckgo.com/?q=' + url + '&t=ffab&ia=news&iax=about"> 👨‍🚀 ' + people_arr[i]['name'] + '</a></div>'
    }

    this._div.innerHTML = '<h4>People in space:</h4>' + str
};

//==============================================================================
// Add windows with information about ISS
//==============================================================================
// Adding info window
var infoiss = L.control({ position : 'bottomright' });

infoiss.onAdd = function (map) {
  this._div = L.DomUtil.create('div', 'infoiss');
  return this._div;
};

// method that we will use to update the control based on feature properties passed
infoiss.update = function (data) {
    var str = ''; 
    var array_keys = ['latitude', 'longitude', 'altitude', 'velocity'];
 
    str += '<div class="item"><a target="_blank" rel="noopener noreferrer" href="http://maps.google.com/maps?z=12&t=m&q=loc:' + data['latitude'] + '+' + data['longitude'] + '">' + Number(data['latitude']).toFixed(4) + ', ' + Number(data['longitude']).toFixed(4) + '</a></div>'
    
    str += '<div class="item"> Altitude: ' + Number(data['altitude']).toFixed(2) + ' km</div>'
    str += '<div class="item"> Velocity: ' + Number(data['velocity']).toFixed(2) + ' km/h</div>'

    this._div.innerHTML = '<h4>Information:</h4>' + str
};


//==============================================================================
// Add "Follow" mode button 
//==============================================================================
var followButton = L.easyButton('<img src="static/crosshair.svg" id="follow-mode-icon">', function(btn, map){
    follow = !follow;
    button = document.getElementsByClassName('easy-button-button leaflet-bar-part leaflet-interactive unnamed-state-active')[0];
    if(follow){
      button.setAttribute("style", "background-color: #ffb8b8;");
    } else {
      button.removeAttribute("style");
    }
  }).addTo( map );

//==============================================================================
// Create terminator
//==============================================================================
var terminator = L.terminator()
function updateTerminator(t) {
    var t2 = L.terminator();
    t.setLatLngs(t2.getLatLngs());
    t.redraw();
}

//==============================================================================
// Add info elements if not mobile
//==============================================================================
function addNonMobileElements(){
  var width = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
  if( width > 480 && !infoExist) { // is desktop
    console.log('Switched to desktop')
    infoExist = true

    // Make element small
    document.getElementsByClassName('leaflet-control-zoom-in')[0].classList.remove("big-control")
    document.getElementsByClassName('leaflet-control-zoom-out')[0].classList.remove("big-control")
    document.querySelector('.easy-button-button').classList.remove("big-control")

    // Set controls elements back to initial position
    map.zoomControl.setPosition('topleft');
    followButton.setPosition('topleft');

    info.addTo(map);
    infoiss.addTo(map);

    // Add day/night overlay
    // It's too heavy for mobile
    terminator.addTo(map)
    var terminatorRefreshTimer = setInterval(function(){updateTerminator(terminator)}, 1000);

    document.getElementsByClassName('infoiss')[0].setAttribute('display', 'block')

    // Update information window about people in space
    httpGet(window.location.href + 'people', function(response){
      data = JSON.parse(response);
      info.update(data);  
    });
    
    var infoRefreshTimer = setInterval(
      function(){
        httpGet(window.location.href + 'people', function(response){
          data = JSON.parse(response);
          info.update(data);  
        })
      },
      86400000 // Every 24 hour
    );

  } else if( width < 480) { // is mobile 
    console.log('Switched to mobile')
    // Remove all elements as they eat screen or laggy (terminator)
    infoExist = false
    info.remove();
    document.getElementsByClassName('infoiss')[0].setAttribute('display', 'none')
    terminator.remove()
    clearInterval(infoRefreshTimer);
    clearInterval(infoissRefreshTimer);
    clearInterval(terminatorRefreshTimer);
    // Move control elements to the right side
    map.zoomControl.setPosition('topright');
    followButton.setPosition('topright');
    // Change of position should preceed addition of new classes as
    // setPosition() resets classList
    // Make control element bigger
    document.getElementsByClassName('leaflet-control-zoom-in')[0].classList.add("big-control")
    document.getElementsByClassName('leaflet-control-zoom-out')[0].classList.add("big-control")
    document.querySelector('.easy-button-button').classList.add("big-control")
  } else {
    console.log('Don\'t switch')
  }
}

// Call it once to open pop-ups if we are on desktop
addNonMobileElements()
window.addEventListener('resize', addNonMobileElements)
window.addEventListener('load', addNonMobileElements)
