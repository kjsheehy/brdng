'use strict';

const page1 = document.getElementById('check-in-page');
const messageEl = document.getElementById('message');
const seatMap = document.getElementById('seat-map');
const submitSeatsButton = document.getElementById('submit-seats');
const bagsDropdown = document.getElementById('number-bags');

const rows = 20;
const seats = ['A', 'B', 'C', 'D', 'E'];
const flightID = 'FA227';
let partyID = undefined;

for (let i = 0; i < rows; i++) {
  const newRow = document.createElement('div');
  newRow.setAttribute('class', 'seat-row');
  newRow.setAttribute('id', `row${i + 1}`);

  for (let j = 0; j < seats.length; j++) {
    let seatButton = document.createElement('button');
    seatButton.setAttribute('class', 'seat-button');
    seatButton.setAttribute('id', i + 1 + seats[j]);
    let seatID = document.createTextNode(i + 1 + seats[j]);
    seatButton.appendChild(seatID);
    seatButton.onclick = function () {
      this.classList.toggle('selected-seat');
      updateBagsDropdown();
    };
    newRow.appendChild(seatButton);
  }
  seatMap.appendChild(newRow);
}

const updateSeatStatus = (id, newStatus) => {
  fetch(`http://localhost:5001/api/seats/${id}`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      id: id,
      status: newStatus,
    }),
  })
    .then((res) => {
      if (!res.ok) throw new Error('Something went wrong');
      return res.json();
    })
    .catch((error) => console.log(error));
};

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
  for (let i = 0; i < selectedSeats.length; i++) {
    updateSeatStatus(selectedSeats[i], 'checked-in');
  }
  fetch('http://localhost:5001/api/parties', {
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
      messageEl.innerText = `You've checked in seat(s) ${data.seats} with a total of ${data.bags.number} carry-on bags. We'll let you know here when your party can board.${bagLocationMessage}`;
      setInterval(checkBoardingStatus, 5000);
    })
    .catch((error) => console.log(error));
};

function checkBoardingStatus() {
  fetch(`http://localhost:5001/api/boardingStatus/${partyID}`)
    .then((res) => res.json())
    .then((readyToBoard) => {
      console.log(
        `Boarding status for party id ${partyID}: ${
          readyToBoard ? 'ready' : 'not ready'
        }`
      );
      if (readyToBoard) {
        messageEl.innerText = 'Your party may now board.';
      }
    });
}
