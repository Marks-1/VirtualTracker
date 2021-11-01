'use strict'

const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

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
    type = 'cycling';
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
    type = 'running';
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

// const running = new Running([-39, 56], 30, 10, 128)
// console.log(running);

/////////////////////////////////////////////////////////////////////////////////////////
//................APPLICATION ARCHITECTURE...................../////////////////////////
const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class App {
    // private
    #map;
    #mapEvent;
    #workouts = [];

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
        // helper functions
        const validInputs = (...inputs) => 
            inputs.every(inp => Number.isFinite(inp));

        // no negative for distance, duration and cadence
        const allPositive = (...inputs) => inputs.every(inp => inp > 0);

        e.preventDefault();

        // get data from form
        const type = inputType.value;
        const distance = +inputDistance.value;
        const duration = +inputDuration.value;
        const { lat, lng } = this.#mapEvent.latlng;
        let workout;
        
        // if workout running, create running object
        if (type === "running") {
            const elevation = +inputElevation.value;
            // check if data is valid
            // if (!Number.isFinite(distance) || !Number.isFinite(duration) || !Number.isFinite(elevation)) {
            //     return alert("Inputs have to be positive numbers!")
            // }
            if (
                !validInputs(distance, duration, elevation) || 
                !allPositive(distance, duration)
            )
                return alert("Inputs have to be positive numbers!");

            workout = new Running([lat, lng], distance, duration, elevation);
        }
        
        // if workout cycling, create cycling object
        if (type === "cycling") {
            const cadence = +inputCadence.value;
            // check if data is valid
            if(
                // !Number.isFinite(distance)|| !Number.isFinite(duration) || !Number.isFinite(cadence)) 
                !validInputs(distance, duration, cadence) || 
                !allPositive(distance, duration, cadence)
                )
                return alert("Inputs have to be positive numbers!");
                workout = new Cycling([lat, lng], distance, duration, cadence);
            }
            
            // add new object to workout array
            this.#workouts.push(workout);
            console.log(workout);

        // render workout on map as a maker //display maker
        this.renderWorkOutMarker(workout);
        
        //Hide form + clear input fields
        inputDistance.value = inputCadence.value = inputDuration.value = inputElevation.value = '';
    }
    renderWorkOutMarker(workout) {
        
        L.marker(workout.coords)
        .addTo(this.#map)
        .bindPopup(
            L.popup({
                maxWidth: 250,
                minWidth: 100,
                autoClose: false,
                closeOnClick: false,
                className: `${workout.type}-popup`,
            })
        )
        .setPopupContent('workout')
        .openPopup();
    }
}

const app = new App();

// work on rendering the workouts

   
    