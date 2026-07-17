const randomEvents = [

{
text:"隊長邀請你留下來加練打擊。",

effect(){

player.contact += 2;

player.mental += 1;

}

},

{
text:"教練稱讚你的守備。",

effect(){

player.fielding += 2;

}

},

{
text:"練習量過大，身體有些疲勞。",

effect(){

player.mental -= 1;

}

},

{
text:"隊友約你一起慢跑。",

effect(){

player.speed += 2;

}

}

];