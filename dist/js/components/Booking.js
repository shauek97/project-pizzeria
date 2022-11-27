import {select, settings, templates, classNames} from '../settings.js';
import utils from '../utils.js';
import AmountWidget from './AmountWidget.js';
import DatePicker from './DatePicker.js';
import HourPicker from './HourPicker.js';

class Booking{
  constructor(element){
    const thisBooking = this;
    thisBooking.render(element);
    thisBooking.initWidgets();
    thisBooking.getData();
    thisBooking.sendBooking();
    thisBooking.selected = {};
  }

  getData(){
    const thisBooking = this;

    const startDateParam = settings.db.dateStartParamKey + '=' + utils.dateToStr(thisBooking.datePicker.minDate);
    const endDateParam = settings.db.dateEndParamKey + '=' + utils.dateToStr(thisBooking.datePicker.maxDate);

    const params = {
      bookings: [
        startDateParam,
        endDateParam,
      ],
      eventsCurrent: [
        settings.db.notRepeatParam,
        startDateParam,
        endDateParam, 
      ],
      eventsRepeat: [ 
        settings.db.repeatParam,
        endDateParam, 
      ],
    };

    console.log('params', params);

    const urls = {
      bookings:      settings.db.url  + '/' + settings.db.bookings + '?' + params.bookings.join('&'),
      eventsCurrent: settings.db.url  + '/' + settings.db.events   + '?' + params.eventsCurrent.join('&'),
      eventsRepeat:  settings.db.url  + '/' + settings.db.events  + '?' + params.eventsRepeat.join('&'),
    };
    
    console.log(urls);
    

    Promise.all([
      fetch(urls.bookings),
      fetch(urls.eventsCurrent),
      fetch(urls.eventsRepeat),
    ])
      .then(function(allResponses){
        const bookingsResponse = allResponses[0];
        const eventsCurrentResponse = allResponses[1]; 
        const eventsRepeatResponse = allResponses[2];

        return Promise.all([
          bookingsResponse.json(),
          eventsCurrentResponse.json(),
          eventsRepeatResponse.json(),
        ]);
      })
      .then(function([bookings, eventsCurrent, eventsRepeat]){
        console.log(bookings);
        console.log(eventsCurrent);
        console.log(eventsRepeat);
        thisBooking.parseData(bookings, eventsCurrent, eventsRepeat);
      });
  }

  parseData( bookings, eventsCurrent, eventsRepeat){
    const thisBooking = this;
    thisBooking.booked = {};
    for(let item of bookings){
      thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
    }

    for(let item of eventsCurrent){
      thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
    }
    
    const minDate = thisBooking.datePicker.minDate;
    const maxDate = thisBooking.datePicker.maxDate;
    
    for(let item of eventsRepeat){
      if(item.repeat == 'daily'){ 
        for(let loopDate = minDate; loopDate <= maxDate; loopDate = utils.addDays(loopDate, 1)){
          thisBooking.makeBooked(utils.dateToStr(loopDate), item.hour, item.duration, item.table);
        }
      }
    }

    thisBooking.updateDOM();

    console.log('thisbooking.booked', thisBooking.booked);
  }

  makeBooked(date, hour, duration, table){
    const thisBooking = this;

    if(typeof thisBooking.booked[date] == 'undefined'){
      thisBooking.booked[date] = {};
    }

    const startHour = utils.hourToNumber(hour);

    if(typeof thisBooking.booked[date][startHour] == 'undefined'){
      thisBooking.booked[date][startHour] = [];
    }

    thisBooking.booked[date][hour].push(table);

    for(let hourBlock = startHour; hourBlock < startHour + duration; hourBlock += 0.5){
      console.log('loop', hourBlock); 
      
      if(typeof thisBooking.booked[date][hourBlock] == 'undefined'){
        thisBooking.booked[date][hourBlock] = [];

        thisBooking.booked[date][hourBlock].push(table);
      }
    }
  }

  updateDOM(){
    const thisBooking = this;

    thisBooking.date = thisBooking.datePicker.value;
    thisBooking.hour = utils.hourToNumber(thisBooking.hourPicker.value);
    
    let allAvilable = false;

    if(
      typeof thisBooking.booked[thisBooking.date] == 'undefined'
      ||
      typeof thisBooking.booked[thisBooking.date][thisBooking.hour] == 'undefined'
    ){
      allAvilable = true;
    }

    for(let table of thisBooking.dom.tables){
      let tableId = table.getAttribute(settings.booking.tableIdAttribute);
      if(!isNaN(tableId)){
        tableId = parseInt(tableId);
      }

      if(
        !allAvilable
        &&
        thisBooking.booked[thisBooking.date][thisBooking.hour].includes(tableId)
      ){
        table.classList.add(classNames.booking.tableBooked);
      }else {
        table.classList.remove(classNames.booking.tableBooked);
      }
    }
  }

  render(element){
    const thisBooking = this;
    const generatedHTML = templates.bookingWidget();
    thisBooking.element = utils.createDOMFromHTML(generatedHTML);

    thisBooking.dom = {};
    thisBooking.dom.wrapper = element;
    thisBooking.dom.wrapper.appendChild(thisBooking.element);
    thisBooking.dom.peopleAmount = document.querySelector(select.booking.peopleAmount);
    thisBooking.dom.hoursAmount = document.querySelector(select.booking.hoursAmount);
    thisBooking.dom.datePicker = document.querySelector(select.widgets.datePicker.wrapper);
    thisBooking.dom.hourPicker = document.querySelector(select.widgets.hourPicker.wrapper);
    thisBooking.dom.phone = document.querySelector(select.booking.phone);
    thisBooking.dom.address = document.querySelector(select.booking.address);
    thisBooking.dom.submitBtn = document.querySelector(select.booking.formSubmit);
    thisBooking.dom.tables = thisBooking.dom.wrapper.querySelectorAll(select.booking.tables);
    thisBooking.dom.floorPlan = thisBooking.dom.wrapper.querySelector(select.booking.floorPlan);
    thisBooking.dom.orderConfirm = thisBooking.dom.wrapper.querySelector(select.booking.orderConfirmation);
    thisBooking.dom.water = thisBooking.dom.wrapper.querySelector(select.booking.water);
    thisBooking.dom.bread = thisBooking.dom.wrapper.querySelector(select.booking.bread);
  }

  initWidgets(){
    const thisBooking = this;
    thisBooking.peopleAmount = new AmountWidget(thisBooking.dom.peopleAmount);
    thisBooking.hoursAmount = new AmountWidget(thisBooking.dom.hoursAmount);

    thisBooking.datePicker = new DatePicker(thisBooking.dom.datePicker);
    thisBooking.hourPicker = new HourPicker(thisBooking.dom.hourPicker);

    console.log(thisBooking.dom.floorPlan);

    thisBooking.dom.wrapper.addEventListener('updated', function(){
      thisBooking.updateDOM();
    });

    thisBooking.dom.floorPlan.addEventListener('click', function(event){
      const clickedElement = event.target;
      thisBooking.initTables(clickedElement);
    });

    thisBooking.dom.submitBtn.addEventListener('click', function(event){
      event.preventDefault();
      console.log('clickedSubmit');
      thisBooking.sendBooking();
    });
  }


  initTables(oneTable){
    const thisBooking = this;
    const oneTableId = oneTable.getAttribute('data-table');
    //console.log(thisBooking.dom.tables);
    //console.log(oneTable);
    
    
    if(!oneTable.classList.contains(classNames.booking.tableBooked)){
      
      for(let table of thisBooking.dom.tables){
        if(table.classList.contains(classNames.booking.tableSelected) 
        && table !== oneTable){
          table.classList.remove(classNames.booking.tableSelected);
        }
      }
      
      if(!oneTable.classList.contains(classNames.booking.tableSelected)){
        oneTable.classList.add(classNames.booking.tableSelected);
        thisBooking.selected = oneTableId;

      }else{
        oneTable.classList.remove(classNames.booking.tableSelected);
        thisBooking.selected = null;
      }
      
    }else{
      alert('Sorry, this table is already taken.');
    }
    console.log(thisBooking.selected);
  }

  sendBooking(){
    const thisBooking = this;
    const url = settings.db.url + '/' + settings.db.bookings;
    const water = thisBooking.dom.water;
    const bread = thisBooking.dom.bread;
    const starters = [];

    console.log(water);
    console.log(bread);
    if(water.checked){
      starters.push(water.value);
    }

    if(bread.checked){
      starters.push(water.value, bread.value);
    }

    const bookLoad = {};
    bookLoad.peopleAmount = thisBooking.peopleAmount.value;
    bookLoad.hoursAmount = thisBooking.hoursAmount.value;
    bookLoad.table = thisBooking.selected;
    bookLoad.datePicked = thisBooking.datePicker.value;
    bookLoad.hourPicked = thisBooking.hourPicker.value;
    bookLoad.starters = starters;
    bookLoad.phone = thisBooking.dom.phone.value;
    bookLoad.address = thisBooking.dom.address.value;

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bookLoad),
    };

    fetch(url, options)
      .then(function(response){
        return response.json();
      }).then(function(parsedResponse){
        console.log('parsedResponse', parsedResponse);
      });
   


    

  }

}

export default Booking;