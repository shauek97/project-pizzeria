import {settings, select, classNames} from './settings.js';
import Product from './components/Product.js';
import Cart from './components/Cart.js';
import Booking from './components/Booking.js';
import Home from './components/Home.js';


const app = {
  initBooking: function(){
    const thisApp = this;
    thisApp.widgetContainer = document.querySelector(select.containerOf.booking);
    new Booking(thisApp.widgetContainer);

  },

  initHome: function(){
    new Home();
  },

  initPages: function(){
    const thisApp = this;

    thisApp.pages = document.querySelector(select.containerOf.pages).children;
    thisApp.navLinks = document.querySelectorAll(select.nav.links);
    
    const idFromHash = window.location.hash.replace('#/', '');


    let pageMatchingHash = thisApp.pages[0].id;

    for(let page of thisApp.pages){
      if(page.id == idFromHash){
        pageMatchingHash = page.id;
        break;
      }
    }
    
    thisApp.activatePage(pageMatchingHash);

    for(let link of thisApp.navLinks){
      link.addEventListener('click', function(event){
        const clickedElement = this;
        event.preventDefault();

        // get page id from href attribute
        const id = clickedElement.getAttribute('href').replace('#', '');
        
        //run thisApp.activatePate with that id
        thisApp.activatePage(id);

        //change url hash
        window.location.hash = '#/' + id;
      });
    }
    
  }, 

  homePagesLink: function(){
    const thisApp = this;
    const orderWindow = document.querySelector('.box-one');
    const bookingWindow = document.querySelector('.box-two');
    console.log(orderWindow);
    console.log(bookingWindow);

    orderWindow.addEventListener('click', function(event){

      console.log(orderWindow);
      const clickedElement = this;
      event.preventDefault();

      const id = clickedElement.getAttribute('href').replace('#', '');
      thisApp.activatePage(id);
      window.location.hash = '#/' + id;
    });

    bookingWindow.addEventListener('click', function(event){
      console.log(bookingWindow);
      const clickedElement = this;
      event.preventDefault();

      const id = clickedElement.getAttribute('href').replace('#', '');
      thisApp.activatePage(id);
      window.location.hash = '#/' + id;
    });
  },
  
  activatePage: function(pageId){
    const thisApp = this;
    // add class "active" to matching pages

    //remove class active from not matching

    for(let page of thisApp.pages){
      page.classList.toggle(classNames.pages.active, page.id == pageId);
    }

    for(let link of thisApp.navLinks){
      link.classList.toggle(
        classNames.nav.active,
        link.getAttribute('href') == '#' + pageId
      );
    }
  },

  initMenu: function(){
    const thisApp = this;

    for(let productData in thisApp.data.products){
      new Product(thisApp.data.products[productData].id, thisApp.data.products[productData]);
    }
  },

  initCart: function(){
    const thisApp = this;

    const cartElem = document.querySelector(select.containerOf.cart);
    thisApp.cart = new Cart(cartElem);

    thisApp.productList = document.querySelector(select.containerOf.menu); 

    thisApp.productList.addEventListener('add-to-cart', function(event){
      app.cart.add(event.detail.product);
    });
  },

  initData: function(){
    const thisApp = this;
      
    thisApp.data = {};
    const url = settings.db.url + '/' + settings.db.products;

    fetch(url)
      .then(function(rawResponse){
        return rawResponse.json();
      })
      .then(function(parsedResponse){

        thisApp.data.products = parsedResponse;
        thisApp.initMenu();
      });
  },

  init: function(){
    const thisApp = this;
    thisApp.initPages();
    thisApp.initData();
    thisApp.initCart();
    thisApp.initBooking();
    thisApp.initHome();
    thisApp.homePagesLink();
  },

};

app.init();


