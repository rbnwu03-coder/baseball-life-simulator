function checkInjury(){

if(player.stamina<20){

let chance=Math.random();

if(chance<0.2){

player.injury=true;

alert("過度疲勞，你受傷了。");

}

}

}
