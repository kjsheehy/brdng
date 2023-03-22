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

const flights = [
  {
    flightID: 'FA227',
    flightTime: new Date('2023-12-17T03:24:00'),
    boardingStart: undefined,
    baggage: {
      overhead: 0,
      gateCheck: 0,
      capacity: 50,
    },
    parties: [],
  },
  {
    flightID: 'FA863',
    flightTime: new Date('2023-12-17T05:45:00'),
    boardingStart: undefined,
    baggage: {
      overhead: 0,
      gateCheck: 0,
      capacity: 50,
    },
    parties: [],
  },
  {
    flightID: 'FA986',
    flightTime: new Date('2023-12-17T012:30:00'),
    boardingStart: undefined,
    baggage: {
      overhead: 0,
      gateCheck: 0,
      capacity: 50,
    },
    parties: [],
  },
];

//Create some test data
const fa986 = findFlight('FA986');
fa986.parties = [
  {
    id: '1A',
    flightID: 'FA986',
    seats: ['1A', '1B', '1C', '1D', '1E'],
    bags: {
      number: 3,
      location: trackBaggageCapacity('FA986', 3),
    },
    checkInTime: new Date(),
    status: 'checked-in',
  },
  {
    id: '18C',
    flightID: 'FA986',
    seats: ['18C', '18D', '18E'],
    bags: {
      number: 0,
      location: trackBaggageCapacity('FA986', 0),
    },
    checkInTime: new Date(),
    status: 'checked-in',
  },
  {
    id: '12B',
    flightID: 'FA986',
    seats: ['12B', '12C', '12D', '12E'],
    bags: {
      number: 4,
      location: trackBaggageCapacity('FA986', 4),
    },
    checkInTime: new Date(),
    status: 'checked-in',
  },
  {
    id: '5A',
    flightID: 'FA986',
    seats: ['5A', '5B', '5C', '5D', '5E'],
    bags: {
      number: 3,
      location: trackBaggageCapacity('FA986', 3),
    },
    checkInTime: new Date(),
    status: 'boarding',
  },
  {
    id: '19A',
    flightID: 'FA986',
    seats: ['19A', '19B', '19C', '20A', '20B', '20C', '20D', '20E'],
    bags: {
      number: 5,
      location: trackBaggageCapacity('FA986', 5),
    },
    checkInTime: new Date(),
    status: 'checked-in',
  },
  {
    id: '16A',
    flightID: 'FA986',
    seats: ['16A'],
    bags: {
      number: 1,
      location: trackBaggageCapacity('FA986', 1),
    },
    checkInTime: new Date(),
    status: 'checked-in',
  },
  {
    id: '13E',
    flightID: 'FA986',
    seats: ['13A', '13B', '13C', '13D', '13E', '14C', '14D', '14E'],
    bags: {
      number: 4,
      location: trackBaggageCapacity('FA986', 4),
    },
    checkInTime: new Date(),
    status: 'checked-in',
  },
];

//READ request handlers
app.get('/api/flightIDs', (req, res) => {
  const flightIDs = flights.map((f) => f.flightID);
  res.send(flightIDs);
});

app.get('/api/parties/:flightID', (req, res) => {
  const flight = findFlight(req.params.flightID);
  res.send(flight.parties);
});

app.get('/api/boardingStatus/:flightID/:id', (req, res) => {
  const flight = findFlight(req.params.flightID);
  const party = flight.parties.find((p) => p.id === req.params.id);
  if (!party)
    res
      .status(404)
      .send(JSON.stringify(`Party with id '${req.params.id}' not found.`));
  res.send(JSON.stringify(party.status));
});

app.get('/api/baggage/:flightID', (req, res) => {
  const flight = findFlight(req.params.flightID);
  res.send(flight.baggage);
});

//CREATE Request Handlers
app.post('/api/parties/:flightID', (req, res) => {
  const { error } = validateParties(req.body);
  if (error) {
    res.status(400).send(error.details[0].message);
    return;
  }
  const flight = findFlight(req.params.flightID);
  const newParty = {
    id: req.body.seats[0],
    flightID: req.body.flightID,
    seats: req.body.seats,
    bags: {
      number: req.body.bags.number,
      location: trackBaggageCapacity(req.params.flightID, req.body.bags.number),
    },
    checkInTime: new Date(),
    status: 'checked-in',
  };
  flight.parties.push(newParty);
  res.status(201).send(newParty);
});

//UPDATE Request Handlers

//Airline UI tells Server when to start the boarding process
app.put('/api/boardingStart/:flightID', (req, res) => {
  const flight = flights.find((f) => f.flightID === req.params.flightID);
  if (!flight) {
    res.status(404).send(`Flight with ID ${req.params.flightID} not found`);
    return;
  }
  flight.boardingStart = new Date();
  board(req.params.flightID);
  res.send(flight);
});

app.put('/api/boardingClose/:flightID', (req, res) => {
  const flight = flights.find((f) => f.flightID === req.params.flightID);
  if (!flight) {
    res.status(404).send(`Flight with ID ${req.params.flightID} not found`);
    return;
  }
  flight.boardingClose = new Date();
  flight.boardingTime = flight.boardingClose - flight.boardingStart;
  res.send(flight);
});

//Passenger UI tells Server when party is seated
app.put('/api/seated/:flightID/:partyID', (req, res) => {
  const flight = findFlight(req.params.flightID);
  const party = flight.parties.find((p) => p.id === req.params.partyID);
  if (!party) {
    res.status(404).send(`Party with id ${req.params.partyID} not found.`);
    return;
  }
  party.status = 'seated';
  res.send();
});

function validateParties(party) {
  const schema = Joi.object({
    id: Joi.string().required().unique(),
    flightID: Joi.string().required(),
    seats: Joi.array()
      .items(Joi.string().pattern(new RegExp('[0-9]{1,2}[A-Z]')))
      .required(),
    bags: Joi.object({
      number: Joi.number().required(),
      location: Joi.string().valid('overhead', 'gateCheck', 'N/A'),
    }),
  });
  return schema.validate(party);
}

function trackBaggageCapacity(flightID, numBags) {
  const flight = findFlight(flightID);
  if (numBags == 0) return 'N/A';
  else if (numBags + flight.baggage.overhead <= flight.baggage.capacity) {
    flight.baggage.overhead += numBags;
    return 'overhead';
  } else {
    flight.baggage.gateCheck += numBags;
    return 'gateCheck';
  }
}

function board(flightID) {
  //For starters, let's just tell the first party to board. (Rather, let's indicate in the first party's object that it is ready to board.
  //Alright, now it's time to make this more robust. Make this clear for boarding the number of parties that add up to 10 (or more if a party pushes it over the line).
  //Still first come, first served, so the existing array order is good.
  const flight = findFlight(flightID);
  let numPassengersBoarding = flight.parties.reduce((accum, party) => {
    return party.status === 'boarding' ? accum + party.seats.length : accum;
  }, 0);
  const checkedInParties = flight.parties.filter(
    (party) => party.status === 'checked-in'
  );

  if (numPassengersBoarding < 10) {
    checkedInParties.some((party) => {
      party.status = 'boarding';
      numPassengersBoarding += party.seats.length;
      return numPassengersBoarding >= 10;
    });
  }
}

function findFlight(flightID) {
  return flights.find((f) => f.flightID === flightID);
}
