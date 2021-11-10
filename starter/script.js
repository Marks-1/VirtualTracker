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
            const cadence = +inputCadence.value;
            // check if data is valid
            // if (!Number.isFinite(distance) || !Number.isFinite(duration) || !Number.isFinite(cadence)) {
            //     return alert("Inputs have to be positive numbers!")
            // }
            if (
                !validInputs(distance, duration, cadence) || 
                !allPositive(distance, duration, cadence)
            )
                return alert("Inputs have to be positive numbers!");

            workout = new Running([lat, lng], distance, duration, cadence);
        }
        
        // if workout cycling, create cycling object
        if (type === "cycling") {
            const elevation = +inputElevation.value;
            // check if data is valid
            if(
                // !Number.isFinite(distance)|| !Number.isFinite(duration) || !Number.isFinite(elevation)) 
                !validInputs(distance, duration, elevation) || 
                !allPositive(distance, duration)
                )
                return alert("Inputs have to be positive numbers!");
                workout = new Cycling([lat, lng], distance, duration, elevation);
            }
            
        // add new object to workout array
        this.#workouts.push(workout);
        // console.log(workout);

        // render workout on map as a maker //display maker
        this._renderWorkOutMarker(workout);

        // Render workout on list
        this._renderWorkout(workout);

         // Hide form + clear input fields
        this._hideForm();

        // Set local storage to all workouts
        this._setLocalStorage();
        
        //Hide form + clear input fields
        inputDistance.value = inputCadence.value = inputDuration.value = inputElevation.value = '';
    }
    _renderWorkOutMarker(workout) {
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
        .setPopupContent(`${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${workout.description}`)
        .openPopup();
    }

    _renderWorkout(workout){
        let html = `
        <li class="workout workout--${workout.type}" data-id="${workout.id}">
          <h2 class="workout__title">${workout.description}</h2>
          <div class="workout__details">
            <span class="workout__icon">${
              workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'
            }</span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
          </div>
      `;
  
      if (workout.type === 'running')
        html += `
          <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.pace.toFixed(1)}</span>
            <span class="workout__unit">min/km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">🦶🏼</span>
            <span class="workout__value">${workout.cadence}</span>
            <span class="workout__unit">spm</span>
          </div>
        </li>
        `;
  
      if (workout.type === 'cycling')
        html += `
          <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.speed.toFixed(1)}</span>
            <span class="workout__unit">km/h</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⛰</span>
            <span class="workout__value">${workout.elevationGain}</span>
            <span class="workout__unit">m</span>
          </div>
        </li>
        `;
  
      form.insertAdjacentHTML('afterend', html);
    }

    _moveToPopup(e) {
        // BUGFIX: When we click on a workout before the map has loaded, we get an error. But there is an easy fix:
        if (!this.#map) return;
    
        const workoutEl = e.target.closest('.workout');
    
        if (!workoutEl) return;
    
        const workout = this.#workouts.find(
          work => work.id === workoutEl.dataset.id
        );
    
        this.#map.setView(workout.coords, this.#mapZoomLevel, {
          animate: true,
          pan: {
            duration: 1,
          },
        });
    
        // using the public interface
        // workout.click();
      }
    
      _setLocalStorage() {
        localStorage.setItem('workouts', JSON.stringify(this.#workouts));
      }
    
      _getLocalStorage() {
        const data = JSON.parse(localStorage.getItem('workouts'));
    
        if (!data) return;
    
        this.#workouts = data;
    
        this.#workouts.forEach(work => {
          this._renderWorkout(work);
        });
      }
    
      reset() {
        localStorage.removeItem('workouts');
        location.reload();
      }
}

const app = new App();

// work on rendering the workouts

   
    