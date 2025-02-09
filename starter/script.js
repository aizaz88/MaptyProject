'use strict';

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

///////----------Workout----------///////
class WorkOut {
  date = new Date();
  id = (Date.now() + '').slice(-10);
  constructor(coords, distance, duration) {
    this.coords = coords;
    this.distance = distance;
    this.duration = duration;
  }

  _setDescription() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    }  ${this.date.getDate()}`;
  }
}
////------------Running class--------------/////
class Running extends WorkOut {
  type = 'running';
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
    this._setDescription();
  }

  calcPace() {
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

////----------Cyling class-------------/////
class Cycling extends WorkOut {
  type = 'cycling';
  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this.calcspeed();
    this._setDescription();
  }

  calcspeed() {
    this.speed = this.distance / (this.duration / 60);
    return this.pace;
  }
}

class App {
  //Properties
  #map;
  #mapEvent;
  #workouts = [];

  constructor() {
    //get-position---
    this._getPosition();
    //Local storage----
    this._getLocalStorage();
    //handlers
    form.addEventListener('submit', this._newWorkout.bind(this));
    inputType.addEventListener('change', this._toggleElevationFeild);
    containerWorkouts.addEventListener('click', this._moveToPopup.bind(this));
  }

  ///////////////////////////
  _getPosition() {
    if (navigator.geolocation)
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this), //Bind uses because in regular func cal this is set to undefined
        function (err) {
          alert('Location cannot get...');
        }
      );
  }
  //////////////////////////
  ///////////////////////
  _loadMap(pos) {
    // console.log(pos);
    const { latitude, longitude } = pos.coords;
    const coords = [latitude, longitude];

    //LeafLet function
    this.#map = L.map('map').setView(coords, 13);
    //console.log(map);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    //PopUp----Handling clicks on map
    this.#map.on('click', this._showForm.bind(this));

    //Adding marker to map from workout (local storage)
    this.#workouts.forEach(workout => {
      this._renderWorkoutMarker(workout);
    });
  }
  ///////////////////////////
  /////////////////////////
  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    inputDistance.focus();
  }
  ///////////////////////////
  /////////////////////////
  _toggleElevationFeild() {
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
  }

  /////////////////////////
  _newWorkout(e) {
    //Valid check function

    const isValidinputs = (...inputs) =>
      inputs.every(inp => Number.isFinite(inp));
    const allPos = (...inputs) => inputs.every(inp => inp > 0);

    e.preventDefault();
    const { lat, lng } = this.#mapEvent.latlng;
    //--------------get data----------
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    let workout;
    //if workout is Running
    if (type === 'running') {
      const cadence = +inputCadence.value;
      //valid data check( is Number or not negative)
      if (
        !isValidinputs(distance, duration, cadence) ||
        !allPos(distance, duration, cadence)
      )
        //Guard clause
        return alert('Invalid inputs... ');

      workout = new Running([lat, lng], distance, duration, cadence);
    }
    //if workout is Cycling
    if (type === 'cycling') {
      const elevation = +inputElevation.value;
      //valid data check( is Number or not negative)
      if (
        !isValidinputs(distance, duration, elevation) ||
        !allPos(distance, duration)
      )
        //Guard clause
        return alert('Invalid inputs... ');

      workout = new Cycling([lat, lng], distance, duration, elevation);
    }

    //Push the workout to private workout-Array of App....
    this.#workouts.push(workout);

    //Marker on map
    this._renderWorkoutMarker(workout);

    //Render workout on list UI
    this._renderWorkout(workout);

    //Hide form ---
    this._hideform();

    //Local storage
    this._setLocalStorage();
  }

  _hideform() {
    //Input feilds clear....
    inputCadence.value =
      inputDistance.value =
      inputDuration.value =
      inputElevation.value =
        '';
    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => (form.style.display = 'grid'));
  }
  //////////////////////////////////////////
  _renderWorkoutMarker(workout) {
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
      .setPopupContent(
        `${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${workout.description}`
      )
      .openPopup();
  }
  ///////////////////////
  _renderWorkout(workout) {
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
    if (workout.type === 'running') {
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
    }

    if (workout.type === 'cycling') {
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
      `;
    }
    form.insertAdjacentHTML('afterend', html);
  }

  _moveToPopup(e) {
    const workoutEl = e.target.closest('.workout');
    //console.log(workoutEl);

    if (!workoutEl) return;
    const workout = this.#workouts.find(
      work => work.id === workoutEl.dataset.id
    );
    // console.log(workout);
    this.#map.setView(workout.coords, 13, {
      animate: true,
      pan: {
        duration: 1,
      },
    });
  }

  _setLocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this.#workouts));
  }

  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('workouts'));
    //console.log(data);

    if (!data) return;

    this.#workouts = data;
    this.#workouts.forEach(workout => {
      this._renderWorkout(workout);
    });
  }

  reset() {
    localStorage.removeItem('workouts');
    location.reload();
  }
}

const app = new App();
