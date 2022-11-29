
class Home{
  constructor(){
    const thisHome = this;
    thisHome.carousel();
  }

  carousel(){
    var elem = document.querySelector('.main-carousel');
    var flkty = new Flickity( elem, {
      // options
      autoPlay: true,
      draggable: false,
      cellAlign: 'left',
      contain: true,
    });

    // element argument can be a selector string
    //   for an individual element
    var flkty = new Flickity( '.main-carousel', {
      // options
    });
  }

}

export default Home;
