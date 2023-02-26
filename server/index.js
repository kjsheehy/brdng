'use strict';

//const express = require('express');
//const app = express();
//const Joi = require('joi');
//app.use(express.json());

const rows = 20;
const columns = ['A', 'B', 'C', 'D', 'E'];
const seats = [];

function populateSeats(rows, columns) {
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < columns.length; j++) {
      let newSeat = {
        id: i + 1 + columns[j],
        status: 'Not checked in',
      };
      seats.push(newSeat);
    }
  }
}

populateSeats(rows, columns);
