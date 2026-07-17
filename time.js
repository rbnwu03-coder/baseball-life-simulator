function nextDay(){

player.day++;

if(player.day>30){

player.day=1;

player.month++;

}

if(player.month>12){

player.month=1;

player.year++;

player.age++;

alert("升了一歲！");
}

}