'use strict';

const express = require('express');
const app = express();
const Joi = require('joi');
const cors = require('cors');

const port = process.env.PORT || 5001;
app.listen(port, () => console.log(`listening on port ${port}...`));

app.use(express.json());
app.use(
  cors({
    origin: '*',
  })
);

const rows = 20;
const columns = ['A', 'B', 'C', 'D', 'E'];
const seats = [];
const parties = [];
const baggage = {
  overhead: 0,
  gateCheck: 0,
  capacity: 50,
};
const flights = [
  {
    flightID: 'FA227',
    flightTime: new Date('2023-12-17T03:24:00'),
    boardingStart: undefined,
  },
  {
    flightID: 'FA863',
    flightTime: new Date('2023-12-17T05:45:00'),
    boardingStart: undefined,
  },
  {
    flightID: 'FA986',
    flightTime: new Date('2023-12-17T012:30:00'),
    boardingStart: undefined,
  },
];

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

app.get('/api/boardingStatus/:id', (req, res) => {
  let party = parties.find((p) => p.id === req.params.id);
  console.log(party);
  if (!party)
    res
      .status(404)
      .send(JSON.stringify(`Party with id '${req.params.id}' not found.`));
  res.send(party.readyToBoard);
});

app.get('/api/baggage', (req, res) => {
  res.send(baggage);
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
    id: req.body.seats[0],
    flightID: req.body.flightID,
    seats: req.body.seats,
    bags: {
      number: req.body.bags.number,
      location: trackBaggageCapacity(req.body.bags.number)
        ? 'overhead'
        : 'gateCheck',
    },
    checkInTime: new Date(),
    readyToBoard: false,
  };
  parties.push(newParty);
  res.status(201).send(newParty);
});

//UPDATE Request Handlers
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

//Airline UI tells Server when to start the boarding process
app.put('/api/boardingStart', (req, res) => {
  const flight = flights.find((f) => f.flightID === req.body.flightID);
  if (!flight) {
    res.status(404).send(`Flight with ID ${req.body.flightID} not found`);
    return;
  }
  flight.boardingStart = new Date();
  board(flight);
  res.send(flight);
});

//Passenger UI tells Server when party is seated
app.put('/api/seated/:partyID', (req, res) => {
  const party = parties.find((p) => p.id === req.params.partyID);
  console.log('party: ', party);
  if (!party) {
    res.status(404).send(`Party with id ${req.paramss.partyID} not found.`);
    return;
  }
  party.seats.forEach((partySeat) => {
    const seat = seats.find((seatsSeat) => partySeat === seatsSeat.id);
    seat.status = 'seated';
  });
  res.send();
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
    flightID: Joi.string().required(),
    seats: Joi.array()
      .items(Joi.string().pattern(new RegExp('[0-9]{1,2}[A-Z]')))
      .required(),
    bags: Joi.object({
      number: Joi.number().required(),
      location: Joi.string().valid('overhead', 'gateCheck'),
    }),
  });
  return schema.validate(party);
}

function trackBaggageCapacity(numBags) {
  if (numBags + baggage.overhead <= baggage.capacity) {
    baggage.overhead += numBags;
    return true;
  } else {
    baggage.gateCheck += numBags;
    return false;
  }
}

function board() {
  //For starters, let's just tell the first party to board. (Rather, let's indicate in the first party's object that it is ready to board.)
  // How can I do that?
  // How about sorting the parties array by checkInTime?
  // But won't the parties array already be sorted by checkInTime because I added each party to the array when the party checked in?
  //Yep!
  //So, given that the array is already sorted by checkInTime, I should just need to set the first party object to be ready to board (object at index 0)

  //parties[0].readyToBoard = true;
  //console.log(parties[0]);
  if (parties[0]) {
    parties[0].readyToBoard = true;
  }
}
