'use strict';

const startBoardingButton = document.getElementById('boarding-button');
const elapsedTimeEl = document.getElementById('elapsed-boarding-time');
let startTime;

const startBoarding = function () {
  startTime = new Date();
  //console.log(startTime);
  //console.log('hours', startTime.getHours());
  setInterval(updateTime, 1000);
};

const updateTime = function () {
  let elapsedTime = Date.now() - startTime;

  elapsedTimeEl.textContent = msToHMS(elapsedTime);
};

const msToHMS = function (ms) {
  let time = ms / 1000;
  let hours = Math.trunc(time / 3600);
  let minutes = Math.trunc((time % 3600) / 60);
  let seconds = Math.trunc(time % 60);

  hours = hours >= 10 ? hours : '0' + hours;
  minutes = minutes >= 10 ? minutes : '0' + minutes;
  seconds = seconds >= 10 ? seconds : '0' + seconds;

  return hours + ':' + minutes + ':' + seconds;
};

console.log(msToHMS(3905001));

startBoardingButton.onclick = startBoarding;
