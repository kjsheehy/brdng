'use strict';

const page1 = document.getElementById('check-in-page');
const messageEl = document.getElementById('message');
const seatMap = document.getElementById('seat-map');
const submitSeatsButton = document.getElementById('submit-seats');
const bagsDropdown = document.getElementById('number-bags');

const rows = 20;
const seats = ['A', 'B', 'C', 'D', 'E'];

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
    .then((data) => console.log(data))
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
  console.log(bagsDropdown.options[bagsDropdown.selectedIndex].value);
  fetch('http://localhost:5001/api/parties', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      seats: selectedSeats,
      bags: bagsDropdown.options[bagsDropdown.selectedIndex].value,
    }),
  })
    .then((res) => {
      if (!res.ok)
        throw new Error('Something went wrong. Please try that again.');
      return res.json();
    })
    .then((data) => {
      console.log(data);
      page1.classList.add('hidden');
      messageEl.classList.remove('hidden');
      messageEl.innerText = `You've checked in seat(s) ${data.seats} with a total of ${data.bags} overhead carry-on bags. We'll let you know here when your party can board.`;
    })
    .catch((error) => console.log(error));
};
