'use strict';

const { application } = require('express');

const express = require('express');
const app = express();
const Joi = require('joi');
const cors = require('cors');

app.use(express.json());
app.use(
  cors({
    origin: '*',
  })
);

const rows = 20;
const columns = ['A', 'B', 'C', 'D', 'E'];
const seats = [];
const parties = [{ seats: ['1B', '5C'], bags: 2 }];

function populateSeats(rows, columns) {
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < columns.length; j++) {
      let newSeat = {
        id: i + 1 + columns[j],
        status: 'not-checked-in',
      };
      seats.push(newSeat);
    }
  }
}

populateSeats(rows, columns);

//READ request handlers
app.get('/', (req, res) => {
  res.send('Hello world');
});

app.get('/api/seats', (req, res) => {
  res.send(seats);
});

app.get('/api/seats/:id', (req, res) => {
  const seat = seats.find((s) => s.id === req.params.id);
  if (!seat) res.status(404).send(`Seat not found with id '${req.params.id}'.`);
  res.send(seat);
});

app.get('/api/parties', (req, res) => {
  res.send(parties);
});

//CREATE Request Handler
// I don't think I'll need this for seats in my application, but I do think I'll need it for something else. I'm going to add this alongside the tutorial I'm following and replace it later on with a CREATE handler that's useful to the application.
app.post('/api/seats', (req, res) => {
  const { error } = validateSeats(req.body);
  if (error) {
    res.status(400).send(error.details[0].message);
    return;
  }
  const newSeat = {
    id: req.body.id,
    status: req.body.status,
  };
  seats.push(newSeat);
  res.send(newSeat);
});

app.post('/api/parties', (req, res) => {
  const { error } = validateParties(req.body);
  if (error) {
    res.status(400).send(error.details[0].message);
    return;
  }
  const newParty = {
    seats: req.body.seats,
    bags: req.body.bags,
  };
  parties.push(newParty);
  res.send(newParty);
});

//UPDATE Request Handler
// This one will be used by the app to move seats through the 4 statuses
app.put('/api/seats/:id', (req, res) => {
  const seat = seats.find((s) => s.id === req.params.id);
  if (!seat) res.status(404).send(`Seat not found with id ${req.params.id}`);

  const { error } = validateSeats(req.body);
  if (error) {
    res.status(400).send(error.details[0].message);
    return;
  }

  seat.status = req.body.status;
  res.send(seat);
});

//DELETE Request Handler
// Not sure I will need this one in the application, but I'm going to implement it to delete a seat just for learning purposes.
app.delete('/api/seats/:id', (req, res) => {
  const seatIndex = seats.findIndex((s) => s.id === req.params.id);
  if (!seatIndex)
    res.status(404).send(`Seat not found with id ${req.params.id}`);

  const [seat] = seats.splice(seatIndex, 1);
  res.send(seat);
});

function validateSeats(seat) {
  const schema = Joi.object({
    id: Joi.string().pattern(new RegExp('[0-9]{1,2}[A-Z]')).required(),
    status: Joi.string()
      .valid('not-checked in', 'checked-in', 'boarding', 'seated')
      .required(),
  });
  return schema.validate(seat);
}

function validateParties(party) {
  const schema = Joi.object({
    seats: Joi.array()
      .items(Joi.string().pattern(new RegExp('[0-9]{1,2}[A-Z]')))
      .required(),
    bags: Joi.number().required(),
  });
  return schema.validate(party);
}

const port = process.env.PORT || 5001;
app.listen(port, () => console.log(`listening on port ${port}...`));
