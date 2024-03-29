'use strict';

const page1 = document.getElementById('check-in-page');
const messageEl = document.getElementById('message');
const seatMap = document.getElementById('seat-map');
const submitSeatsButton = document.getElementById('submit-seats');
const bagsDropdown = document.getElementById('number-bags');
const seatedButton = document.getElementById('seated');
const flightSelect = document.getElementById('flight-select');
const boardMessageEl = document.getElementById('board-message');

const apiURL = 'https://kjsheehy.com/brdng/api';

const rows = 20;
const seats = ['A', 'B', 'C', 'D', 'E', 'F'];
let flightID;
let partyID;
let intervalID;

populateSeatMap();
populateFlightSelect();

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
  flightSelect.disabled = true;
  flightID = flightSelect.value;
  const seatButtons = document.getElementsByClassName('seat-button');
  for (let i = 0; i < seatButtons.length; i++) {
    seatButtons[i].disabled = false;
  }
  //fetch parties for the selected flight and only enable the buttons for seats not represented in the parties
  fetch(`${apiURL}/parties/${flightID}`)
    .then((res) => res.json())
    .then((parties) => {
      parties.forEach((party) => {
        party.seats.forEach((seat) => {
          let seatButton = document.getElementById(seat);
          seatButton.disabled = true;
        });
      });
    });
};

function populateSeatMap() {
  for (let i = 0; i < rows; i++) {
    const newRow = document.createElement('div');
    newRow.setAttribute('class', 'seat-row');
    newRow.setAttribute('id', `row${i + 1}`);

    for (let j = 0; j < seats.length; j++) {
      let seatButton = document.createElement('button');
      seatButton.setAttribute(
        'class',
        j === 3 ? 'seat-button right-aisle' : 'seat-button'
      );
      seatButton.setAttribute('id', i + 1 + seats[j]);
      let seatID = document.createTextNode(i + 1 + seats[j]);
      seatButton.appendChild(seatID);
      seatButton.onclick = function () {
        this.classList.toggle('selected-seat');
        updateBagsDropdown();
      };
      seatButton.disabled = true;
      newRow.appendChild(seatButton);
    }
    seatMap.appendChild(newRow);
  }
}

function updateBagsDropdown() {
  bagsDropdown.innerText = '';
  let maxBags = document.getElementsByClassName('selected-seat').length;
  if (maxBags) {
    for (let i = 0; i <= maxBags; i++) {
      let bagOption = document.createElement('option');
      bagOption.setAttribute('class', 'bag-option');
      bagOption.setAttribute('value', i);
      bagOption.innerHTML = i;
      bagsDropdown.appendChild(bagOption);
    }
    bagsDropdown.disabled = false;
  } else {
    bagsDropdown.disabled = true;
  }
}

submitSeatsButton.onclick = function () {
  let selectedSeatEls = document.getElementsByClassName('selected-seat');
  let selectedSeats = [];
  for (let el of selectedSeatEls) {
    selectedSeats.push(el.id);
  }
  if (flightID === '' || selectedSeats.length === 0) return;
  fetch(`${apiURL}/parties/${flightID}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      flightID,
      seats: selectedSeats,
      bags: {
        number: bagsDropdown.options[bagsDropdown.selectedIndex].value,
      },
    }),
  })
    .then((res) => {
      if (!res.ok)
        throw new Error('Something went wrong. Please try that again.');
      return res.json();
    })
    .then((data) => {
      partyID = data.id;
      let bagLocationMessage = '';
      if (data.bags.location === 'overhead')
        bagLocationMessage = ` There is space for your bags in the overhead compartments. We're 100% sure of it, and airlines NEVER over-promise and under-deliver.`;
      else if (data.bags.location === 'gateCheck')
        bagLocationMessage = ` There will not be space for your bags in the overhead compartments. Please take your bags to the counter now to gate check them. With one text, we can have your bags "disappeared", so don't give us any attitude.`;
      page1.classList.add('hidden');
      messageEl.classList.remove('hidden');
      messageEl.innerText = `You've checked in seat(s) ${data.seats} with a total of ${data.bags.number} carry-on bag(s). We'll let you know here when your party can board.${bagLocationMessage}`;
      intervalID = setInterval(checkBoardingStatus, 5000);
    })
    .catch((error) => console.log(error));
};

seatedButton.onclick = function () {
  fetch(`${apiURL}/seated/${flightID}/${partyID}`, {
    method: 'PUT',
  }).then((res) => {
    boardMessageEl.classList.add('hidden');
    messageEl.innerText = res.ok
      ? 'Thank you for using brdng! Enjoy your flight!'
      : 'Something went wrong. Please use the back button and try again.';
    seatedButton.classList.add('hidden');
  });
};

function checkBoardingStatus() {
  fetch(`${apiURL}/boardingStatus/${flightID}/${partyID}`)
    .then((res) => res.json())
    .then((status) => {
      if (status === 'boarding') {
        boardMessageEl.classList.remove('hidden');
        seatedButton.classList.remove('hidden');
        clearInterval(intervalID);
      }
    });
}
