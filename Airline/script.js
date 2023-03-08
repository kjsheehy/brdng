'use strict';

const startBoardingButton = document.getElementById('boarding-button');
const elapsedTimeEl = document.getElementById('elapsed-boarding-time');
let startTime;
const seatMap = document.getElementById('seat-map');
const overheadEl = document.getElementById('overhead');
const gateCheckEl = document.getElementById('gate-check');

const rows = 20;
const seats = ['A', 'B', 'C', 'D', 'E'];
const baggageCapacity = 50;

populateSeatMap(rows, seats);
overheadEl.textContent = `0 / ${baggageCapacity}`;
setInterval(updateInfo, 5000);

function updateInfo() {
  fetch(`http://localhost:5001/api/seats`)
    .then((response) => response.json())
    .then((seatArr) => {
      seatArr.forEach((seat) => {
        let seatEl = document.getElementById(seat.id);
        seatEl.classList.remove(
          'not-checked-in',
          'checked-in',
          'boarding',
          'seated'
        );
        seatEl.classList.add(seat.status);
      });
    });
  fetch('http://localhost:5001/api/baggage')
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
  startTime = new Date();
  setInterval(updateTime, 1000);
};

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
