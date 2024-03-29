'use strict';

const flightSelect = document.getElementById('flight-select');
const boardingMethodSelect = document.getElementById('boarding-method-select');
const numberPassengersBoardingEl = document.getElementById('number-passengers');
const startBoardingButton = document.getElementById('boarding-button');
const closeBoardingButton = document.getElementById('close-boarding-button');
const elapsedBoardingTimeLabelEl = document.getElementById(
  'elapsed-boarding-time-label'
);
const elapsedTimeEl = document.getElementById('elapsed-boarding-time');
let startTime;
const seatMap = document.getElementById('seat-map');
const overheadEl = document.getElementById('overhead');
const gateCheckEl = document.getElementById('gate-check');

const rows = 20;
const seats = ['A', 'B', 'C', 'D', 'E', 'F'];
const baggageCapacity = 50;
let flightID;
let timerIntervalID;
const apiURL = 'https://kjsheehy.com/brdng/api';

populateSeatMap(rows, seats);
overheadEl.textContent = `0 / ${baggageCapacity}`;

populateFlightSelect();
populateBoardingMethods();

function populateFlightSelect() {
  fetch(`${apiURL}/flightIDs`)
    .then((res) => res.json())
    .then((flightIDs) => {
      flightIDs.forEach((id) => {
        let flightOption = document.createElement('option');
        flightOption.setAttribute('value', id);
        flightOption.innerText = id;
        flightSelect.appendChild(flightOption);
      });
    });
}

flightSelect.onchange = function () {
  flightID = flightSelect.value;
  startBoardingButton.disabled = false;
  flightSelect.disabled = true;
  updateInfo();
  setInterval(updateInfo, 1000);
};

function populateBoardingMethods() {
  fetch(`${apiURL}/boardingMethods`)
    .then((res) => res.json())
    .then((methods) => {
      methods.forEach((method) => {
        let methodOption = document.createElement('option');
        methodOption.setAttribute('value', method);
        methodOption.innerText = method;
        boardingMethodSelect.appendChild(methodOption);
      });
    });
}

function updateInfo() {
  fetch(`${apiURL}/parties/${flightID}`)
    .then((res) => res.json())
    .then((parties) => {
      parties.forEach((party) => {
        party.seats.forEach((seat) => {
          let seatEl = document.getElementById(seat);
          seatEl.classList.remove(
            'not-checked-in',
            'checked-in',
            'boarding',
            'seated'
          );
          seatEl.classList.add(party.status);
        });
      });
    });
  fetch(`${apiURL}/baggage/${flightID}`)
    .then((res) => {
      if (!res.ok)
        throw new Error('Error fetching baggage info from the server');
      return res.json();
    })
    .then((data) => {
      overheadEl.textContent = `${data.overhead} / ${data.capacity}`;
      gateCheckEl.textContent = `${data.gateCheck}`;
    })
    .catch((error) => console.log(error));
}

const startBoarding = function () {
  if (boardingMethodSelect.value === 'Free for All')
    numberPassengersBoardingEl.value = '120';
  fetch(`${apiURL}/boardingStart`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      flightID,
      boardingMethod: boardingMethodSelect.value,
      numberPassengersBoarding: numberPassengersBoardingEl.value,
    }),
  })
    .then((res) => {
      if (!res.ok) throw new Error('Something went wrong');
      return res.json();
    })
    .then((data) => {
      startTime = new Date();
      timerIntervalID = setInterval(updateTime, 1000);
      startBoardingButton.disabled = true;
      closeBoardingButton.disabled = false;
      boardingMethodSelect.disabled = true;
      numberPassengersBoardingEl.disabled = true;
      updateInfo();
    })
    .catch((error) => console.log(error));
};

function closeBoarding() {
  fetch(`${apiURL}/boardingClose/${flightID}`, {
    method: 'PUT',
  })
    .then((res) => {
      if (!res.ok) throw new Error('Something went wrong');
      return res.json();
    })
    .then((data) => {
      closeBoardingButton.disabled = true;
      clearInterval(timerIntervalID);
      elapsedBoardingTimeLabelEl.textContent = 'Total Boarding Time';
      elapsedTimeEl.textContent = msToHMS(data.boardingTime);
    })
    .catch((error) => console.log(error));
}

function updateTime() {
  let elapsedTime = Date.now() - startTime;
  elapsedTimeEl.textContent = msToHMS(elapsedTime);
}

function msToHMS(ms) {
  let time = ms / 1000;
  let hours = Math.trunc(time / 3600);
  let minutes = Math.trunc((time % 3600) / 60);
  let seconds = Math.trunc(time % 60);

  hours = hours >= 10 ? hours : '0' + hours;
  minutes = minutes >= 10 ? minutes : '0' + minutes;
  seconds = seconds >= 10 ? seconds : '0' + seconds;

  return hours + ':' + minutes + ':' + seconds;
}

startBoardingButton.onclick = startBoarding;
closeBoardingButton.onclick = closeBoarding;

function populateSeatMap(rows, seats) {
  for (let i = 0; i < rows; i++) {
    const newRow = document.createElement('div');
    newRow.setAttribute('class', 'seat-row');
    newRow.setAttribute('id', `row${i + 1}`);

    for (let j = 0; j < seats.length; j++) {
      let seatIcon = document.createElement('div');
      seatIcon.setAttribute(
        'class',
        j === 3 ? 'seat-icon right-aisle' : 'seat-icon'
      );
      seatIcon.setAttribute('id', i + 1 + seats[j]);
      let seatID = document.createTextNode(i + 1 + seats[j]);
      seatIcon.appendChild(seatID);
      newRow.appendChild(seatIcon);
    }
    seatMap.appendChild(newRow);
  }
}
