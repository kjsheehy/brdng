'use strict';

const express = require('express');
const app = express();
const Joi = require('joi');
const cors = require('cors');

const port = process.env.PORT || 5001;
const uriBase = '/brdng/api';

app.listen(port, () => console.log(`listening on port ${port}...`));

app.use(express.static('public'));

app.use(express.json());
app.use(
  cors({
    origin: '*',
  })
);

const rows = 20;
const columns = ['A', 'B', 'C', 'D', 'E', 'F'];

const boardingMethods = [
  {
    name: 'First Come, First Served',
    compareFunction: undefined,
  },
  {
    name: 'Front to Back',
    compareFunction: frontToBack,
  },
  {
    name: 'Back to Front',
    compareFunction: backToFront,
  },
  {
    name: 'Free for All',
    compareFunction: undefined,
  },
];

const flights = [
  {
    flightID: 'FA227',
    flightTime: new Date('2023-12-17T03:24:00'),
    boardingStart: undefined,
    boarding: false,
    board,
    boardingMethod: undefined,
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
    boarding: false,
    board,
    boardingMethod: undefined,
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
    boarding: false,
    board,
    boardingMethod: undefined,
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
    status: 'checked-in',
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

//more test data
const fa863 = findFlight('FA863');
fa863.parties = [
  {
    id: '1A',
    flightID: 'FA986',
    seats: ['1A', '1B', '1C', '1D', '1E', '2A', '2B', '2C', '2D', '2E'],
    bags: {
      number: 3,
      location: trackBaggageCapacity('FA986', 3),
    },
    checkInTime: new Date(),
    status: 'checked-in',
  },
  {
    id: '19A',
    flightID: 'FA986',
    seats: [
      '19A',
      '19B',
      '19C',
      '19D',
      '19E',
      '20A',
      '20B',
      '20C',
      '20D',
      '20E',
    ],
    bags: {
      number: 0,
      location: trackBaggageCapacity('FA986', 0),
    },
    checkInTime: new Date(),
    status: 'checked-in',
  },
];

//READ request handlers
app.get(`${uriBase}/flightIDs`, (req, res) => {
  const flightIDs = flights.map((f) => f.flightID);
  res.send(flightIDs);
});

app.get(`${uriBase}/boardingMethods`, (req, res) => {
  res.send(boardingMethods.map((method) => method.name));
});

app.get(`${uriBase}/parties/:flightID`, (req, res) => {
  const flight = findFlight(req.params.flightID);
  res.send(flight.parties);
});

app.get(`${uriBase}/boardingStatus/:flightID/:id`, (req, res) => {
  const flight = findFlight(req.params.flightID);
  const party = flight.parties.find((p) => p.id === req.params.id);
  if (!party)
    res
      .status(404)
      .send(JSON.stringify(`Party with id '${req.params.id}' not found.`));
  res.send(JSON.stringify(party.status));
});

app.get(`${uriBase}/baggage/:flightID`, (req, res) => {
  const flight = findFlight(req.params.flightID);
  res.send(flight.baggage);
});

//CREATE Request Handlers
app.post(`${uriBase}/parties/:flightID`, (req, res) => {
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
  if (flight.boarding) flight.board();
  res.status(201).send(newParty);
});

//UPDATE Request Handlers

//Airline UI tells Server when to start the boarding process
app.put(`${uriBase}/boardingStart`, (req, res) => {
  const flight = flights.find((f) => f.flightID === req.body.flightID);
  const boardingMethod = boardingMethods.find(
    (method) => method.name === req.body.boardingMethod
  );
  if (!flight) {
    res.status(404).send(`Flight with ID ${req.body.flightID} not found`);
    return;
  }
  flight.boardingStart = new Date();
  flight.boarding = true;
  flight.boardingMethod = boardingMethod.compareFunction;
  flight.numberPassengersBoarding = req.body.numberPassengersBoarding;
  flight.board();
  res.send(flight);
});

app.put(`${uriBase}/boardingClose/:flightID`, (req, res) => {
  const flight = flights.find((f) => f.flightID === req.params.flightID);
  if (!flight) {
    res.status(404).send(`Flight with ID ${req.params.flightID} not found`);
    return;
  }
  flight.boardingClose = new Date();
  flight.boardingTime = flight.boardingClose - flight.boardingStart;
  flight.boarding = false;
  res.send(flight);
});

//Passenger UI tells Server when party is seated
app.put(`${uriBase}/seated/:flightID/:partyID`, (req, res) => {
  const flight = findFlight(req.params.flightID);
  const party = flight.parties.find((p) => p.id === req.params.partyID);
  if (!party) {
    res.status(404).send(`Party with id ${req.params.partyID} not found.`);
    return;
  }
  party.status = 'seated';
  if (flight.boarding) flight.board();
  res.send();
});

function validateParties(party) {
  const schema = Joi.object({
    id: Joi.string(),
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

function board() {
  let numPassengersCurrentlyBoarding = this.parties.reduce((accum, party) => {
    return party.status === 'boarding' ? accum + party.seats.length : accum;
  }, 0);
  const checkedInParties = this.parties.filter(
    (party) => party.status === 'checked-in'
  );
  checkedInParties.sort(this.boardingMethod);
  if (numPassengersCurrentlyBoarding < this.numberPassengersBoarding) {
    checkedInParties.some((party) => {
      party.status = 'boarding';
      numPassengersCurrentlyBoarding += party.seats.length;
      return numPassengersCurrentlyBoarding >= this.numberPassengersBoarding;
    });
  }
}

function findFlight(flightID) {
  return flights.find((f) => f.flightID === flightID);
}

function frontToBack(a, b) {
  return a.id.slice(0, -1) - b.id.slice(0, -1);
}

function backToFront(a, b) {
  return b.id.slice(0, -1) - a.id.slice(0, -1);
}
