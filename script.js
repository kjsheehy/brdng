'use strict';

const seatMap = document.getElementById('seat-map');
const submitSeatsButton = document.getElementById('submit-seats');

const rows = 20;
const seats = ['A', 'B', 'C', 'D', 'E'];

for (let i = 0; i < rows; i++) {
  const newRow = document.createElement('div');
  newRow.setAttribute('class', 'seat-row');
  newRow.setAttribute('id', `row${i + 1}`); //Do I ever need this?
  //console.log(seatMap);

  for (let j = 0; j < seats.length; j++) {
    let seatButton = document.createElement('button');
    seatButton.setAttribute('class', 'seat-button');
    seatButton.setAttribute('id', i + 1 + seats[j]);
    let seatID = document.createTextNode(i + 1 + seats[j]);
    seatButton.appendChild(seatID);
    seatButton.onclick = function () {
      this.classList.toggle('selected-seat');
    };
    newRow.appendChild(seatButton);
  }
  seatMap.appendChild(newRow);
}

submitSeatsButton.onclick = function () {
  let selectedSeatEls = document.getElementsByClassName('selected-seat');
  let selectedSeats = [];
  for (let el of selectedSeatEls) {
    selectedSeats.push(el.id);
  }
  console.log(selectedSeats);
};
