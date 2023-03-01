'use strict';

const startBoardingButton = document.getElementById('boarding-button');
const elapsedTimeEl = document.getElementById('elapsed-boarding-time');
let startTime;
const seatMap = document.getElementById('seat-map');
const baggageCapacityEl = document.getElementById('baggage-capacity');

const rows = 20;
const seats = ['A', 'B', 'C', 'D', 'E'];
const baggageCapacity = 50;

populateSeatMap(rows, seats);
baggageCapacityEl.textContent = `0 / ${baggageCapacity}`;

const updateSeatStatus = function () {
  fetch(`http://localhost:5001/api/seats`)
    .then((response) => response.json())
    .then((seatArr) => {
      console.log(seatArr);
      seatArr.forEach((seat) => {
        let seatEl = document.getElementById(seat.id);
        seatEl.classList.remove('not-checked-in', 'checked-in', 'boarding', 'seated');
        seatEl.classList.add(seat.status);
      });
    });
};

setInterval(updateSeatStatus, 5000);

const startBoarding = function () {
  startTime = new Date();
  setInterval(updateTime, 1000);
};

const updateTime = function () {
  let elapsedTime = Date.now() - startTime;

  elapsedTimeEl.textContent = msToHMS(elapsedTime);
};

const msToHMS = function (ms) {
  let time = ms / 1000;
  let hours = Math.trunc(time / 3600);
  let minutes = Math.trunc((time % 3600) / 60);
  let seconds = Math.trunc(time % 60);

  hours = hours >= 10 ? hours : '0' + hours;
  minutes = minutes >= 10 ? minutes : '0' + minutes;
  seconds = seconds >= 10 ? seconds : '0' + seconds;

  return hours + ':' + minutes + ':' + seconds;
};

startBoardingButton.onclick = startBoarding;

function populateSeatMap(rows, seats) {
  for (let i = 0; i < rows; i++) {
    const newRow = document.createElement('div');
    newRow.setAttribute('class', 'seat-row');
    newRow.setAttribute('id', `row${i + 1}`);

    for (let j = 0; j < seats.length; j++) {
      let seatIcon = document.createElement('div');
      seatIcon.setAttribute('class', 'seat-icon');
      seatIcon.setAttribute('id', i + 1 + seats[j]);
      let seatID = document.createTextNode(i + 1 + seats[j]);
      seatIcon.appendChild(seatID);
      newRow.appendChild(seatIcon);
    }
    seatMap.appendChild(newRow);
  }
}
