'use strict'

const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

// creating new workout
class WorkOut {
    date = new Date();
    // creating a new id
    id = (Date.now() + '').slice(-10);

    constructor(coords, distance, duration) {
        this.coords = coords;  //[lat, lng]
        this.distance = distance; //km
        this.duration = duration; //min
    }
}

class Cycling extends WorkOut {
    constructor(coords, distance, duration, cadence) {
        super(coords, distance, duration);
        this.cadence = cadence; //the number of revolutions of the crank per min while cycling
        this.calcSpeed();
    }
    // speed  km/h
    calcSpeed() {
        this.speed = this.distance / (this.duration / 60);
    }
}
class Running extends WorkOut {
    constructor(coords, distance, duration, elevationGain) {
        super(coords, distance, duration);
        this.elevationGain = elevationGain;
        this.calcPace();  //no need for return in calcPace
    }
    // pace min/km
    calcPace() {
        this.pace = this.duration / this.distance;
    }
}

const running = new Running([-39, 56], 30, 10, 128)
console.log(running);

/////////////////////////////////////////////////////////////////////////////////////////
//................APPLICATION ARCHITECTURE...................../////////////////////////

class App {
    // private
    #map;
    #mapEvent;

    constructor() {
        this._getPosition();

        form.addEventListener('submit',this._newWorkout.bind(this));

        //toggle between cycling and running
        inputType.addEventListener('change', this._toggleElevationField.bind());
    }

    _getPosition(){
        if(navigator.geolocation)
            navigator.geolocation.getCurrentPosition(this._loadMap.bind(this), function(){
            alert('Could not get your location')
            }
        );
    }

    _loadMap(position) {
        const { latitude } = position.coords;
        const { longitude } = position.coords;
        console.log(`https://www.google.co.ke/maps/@${latitude},${longitude}`);
        const coords = [latitude, longitude];
        // leaflet code
        this.#map = L.map('map').setView(coords, 13);
        L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
            attribution: 
                '&copy; <a href="http://openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(this.#map);
        //Handling click on map
        this.#map.on('click', this._showForm.bind(this)); 
    }
         

    _showForm(mapE) {
        this.#mapEvent = mapE;
        form.classList.remove('hidden');
        inputDistance.focus();  
    }

    _toggleElevationField() {
        inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
        inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    }

    _newWorkout(e) {
        e.preventDefault();
    
            //clear input fields
        inputDistance.value = inputCadence.value = inputDuration.value = inputElevation.value = '';
            //display maker
            // console.log(mapEvent);
        const { lat, lng } = this.#mapEvent.latlng
        L.marker([lat, lng])
        .addTo(this.#map)
        .bindPopup(
            L.popup({
                maxWidth: 250,
                minWidth: 100,
                autoClose: false,
                closeOnClick: false,
                className: 'running-popup'
            })
        )
        .setPopupContent('Workout')
        .openPopup();
    }
}

const app = new App();



   
    