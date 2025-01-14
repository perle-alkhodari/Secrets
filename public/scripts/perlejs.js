$(document).ready(function(){

    var exploreMessage = $(".exlore-message");

    var homeUsername = $(".home-username");
    homeUsername.animate({marginTop: '0px', opacity: 1 }, 1000, function(){
        exploreMessage.animate({ marginTop: '0px', opacity: 1}, 1000,);
    }
    );

    

});


