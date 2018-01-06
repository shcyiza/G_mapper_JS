//this librarie was made to get info from gmaps api
//Get the distance, duration of the journey, and the maps from a variable to a reference point, the variable being the input in the form and the reference point is defined in the data attributes of your map element.

(function(global, gmaps_api_script) {
  const _G_M_ = {
    gmaps_key: "",
    gmaps_api_el: null,
    empty_field_el: "<i>Remplissez-une addresse</i>",
    no_g_places_exeption: "G_mapper depends on the Google Place Library to work, add '&libraries=places' at the end of the src attributes of your google maps API script tag. see https://developers.google.com/maps/documentation/javascript/places"
  }

  _G_M_.calculateAndDisplayRoute = function(Obj, directionsService, directionsDisplay) {
    // This function is the one that makes all the interaction with the google API's
    directionsService.route({
      origin: Obj.getGeopointA(),
      destination: Obj.getGeopointB(),
      travelMode: google.maps.TravelMode.DRIVING
    }, function(response, status) {
      if (status === google.maps.DirectionsStatus.OK) {
        var totaldistance = 0;
        var totalduration = 0;
        var route = response.routes[0];
        // display total distance information.
        for (var i = 0; i < route.legs.length; i++) {
          totaldistance = totaldistance + route.legs[i].distance.value;
        }
        for (var i = 0; i < route.legs.length; i++) {
          totalduration = totalduration + route.legs[i].duration.value;
        }
        Obj.distanceNode().innerHTML = "<b>" + (totaldistance / 1000).toFixed(2) + " km</b>" +
          " et <b>" + (totalduration / 60).toFixed(0) + " min</b> <br> en voiture de <u>" + Obj.startPlacename() + "</u>";
        directionsDisplay.setDirections(response);
      } else {
        window.alert('Directions request failed due to ' + status);
      }
    });
  };

  _G_M_.eventCallbackToThis = function(el, event, fn, contxt_obj, args) {
    //Pollyfill so that a function called back by an occuring event
    // doesnt have the event itself as the this variable (=contextual object)
    args = args || []
    el.addEventListener(event, function() {
      fn.apply(contxt_obj, args);
    })
  };

  _G_M_.loadGmapsApi = function() {
    //this library depends on the google maps API to work.
    //this function loads for the user so he doesnt have to import it himself.
    //A key is key is still required though
    this.gmaps_api_el = document.createElement("script");
    var script = this.gmaps_api_el
    script.type = "text/javascript";
    script.id = "gmapper_dependencies";
    script.src = "https://maps.googleapis.com/maps/api/js?key=" + this.gmaps_key + "&libraries=places";
    document.getElementsByTagName("head")[0].appendChild(script);
  };

  _G_M_.gmapper_objects = []; //this array collects all the objects
  //that are meant to interact with the DOM
  _G_M_.gmapper_inputs = [];
  //this array collects all the inputs fields that are meant to work with the lib


  const G_mapper = {
    //The prototype on which everything relies
    input_field: "",
    render_node: "",
    distanceNode: function() {
      return this.render_node.children.namedItem("distance");
    },
    mapNode: function() {
      return this.render_node.children.namedItem("map");
    },
    getGeopointA: function() {
      return this.input_field.value;
    },
    getGeopointB: function() {
      return this.distanceNode().dataset.gmapperEndpoint;
    },
    startPlacename: function() {
      if (this.getGeopointB() !== "") {
        return this.getGeopointB()
      } else {
        return "Votre point de départ"
      }
    },
    setGmapsKey: function() {
      if (this.input_field.dataset.gmapsKey !== "") {
        _G_M_.gmaps_key = this.input_field.dataset.gmapsKey
      }
    },
    renderingForEmptyInputs: function(Fn) {
      //render a place holder if the input field is empty 
      //and trigger the a function given function if not
      if (this.input_field.value !== "") {
        Fn.apply(this);
      } else {
        this.mapNode().innerHTML = "";
        this.distanceNode().innerHTML = _G_M_.empty_field_el;
      };
    },
    initCalculation: function() {
      this.renderingForEmptyInputs(function() {
        var directionsService = new google.maps.DirectionsService;
        var directionsDisplay = new google.maps.DirectionsRenderer;
        directionsDisplay.setMap(new google.maps.Map(this.mapNode(), {}));
        _G_M_.calculateAndDisplayRoute(this, directionsService, directionsDisplay);
      })
    },
    reloadCalculation: function() {
      var directionsService = new google.maps.DirectionsService;
      var directionsDisplay = new google.maps.DirectionsRenderer;
      directionsDisplay.setMap(new google.maps.Map(this.mapNode(), {}));
      _G_M_.calculateAndDisplayRoute(this, directionsService, directionsDisplay);
    },
    initMap: function() {
      this.autocomplete = new google.maps.places.Autocomplete(this.input_field);
      this.initCalculation();
    },
    reloadMap: function() {
      var self = this;
      this.renderingForEmptyInputs(function() {
        this.autocomplete.addListener('place_changed', function() {
          //this google map api event listener is needed
          //otherwise the JS engine don't take the autocompleted value into consideration
          //when its reloading the calculation as the input field change
          //and cause unaccurate and weird results this event listener fixes this
          self.mapNode().innerHTML = "";
          self.reloadCalculation();
        });
      });
    },
    init: function() {
      //this is the methode that does the first initialization
      //it checks if google maps API was already loaded correctly
      //and initialize the render of the calution as well as the render of the map
      var self = this
        //one way to master the this keyword (=contextual object)
      var gmaps_api_script = document.querySelector("script[src^='https://maps.googleapis.com/maps/api/js']")
      if (gmaps_api_script && gmaps_api_script !== _G_M_.gmaps_api_el) {
        if (gmaps_api_script.src.indexOf("&libraries=places") !== -1) {
          this.initMap();
        } else {
          throw _G_M_.no_g_places_exeption
        }
      } else {
        if (!_G_M_.gmaps_api_el) {
          _G_M_.loadGmapsApi();
        }
        _G_M_.gmaps_api_el.addEventListener("load", function() {
          //if our code loads the google maps API we must listen to a load event of API
          //so the JS engine don't run the initialization before the API is loaded
          self.initMap();
        });
      }
      _G_M_.eventCallbackToThis(this.input_field, "change", this.reloadMap, this); //adding an event listener
      //to track changes in input and reload the calculaions and the map accordingly
      //it use another way to master the this keywork, see line 31 for the comments
    },
  }

  document.addEventListener("DOMContentLoaded", function() {
    _G_M_.gmapper_inputs = [].slice.call(document.querySelectorAll("[data-gmapper-input]"));
    //those lines wait for the DOM to be loaded to do eveything neccesary for it to work as intended
    //it look for all input fields where the data attribut "gmaper-input" is placed
    //It create all the instances of G_mapper as proto, set the google API key, and initialize everything
    for (var x = 0; x < _G_M_.gmapper_inputs.length; x++) {
      _G_M_.gmapper_objects[x] = { name: _G_M_.gmapper_inputs[x].id };
      Object.setPrototypeOf(_G_M_.gmapper_objects[x], G_mapper);
      _G_M_.gmapper_objects[x].input_field = _G_M_.gmapper_inputs[x];
      _G_M_.gmapper_objects[x].render_node = document.querySelector(
        '[data-gmapper-render-for="' + _G_M_.gmapper_inputs[x].id + '"]'
      );
      _G_M_.gmapper_objects[x].setGmapsKey();
      _G_M_.gmapper_objects[x].init();
    }
  });
})(window);
