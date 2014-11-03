dd5.loader.jsonp.load( { "version":"20140325",
"id": "dd5_phb",
"sourcebook" : "phb",
"comment": "Coder: sheepy",
"entity": [
   { "type":"language" , "id":"common",   "letter":"Common",   "rarity":"common" },
   { "type":"language" , "id":"dwarvish", "letter":"Dwarvish", "rarity":"common" },
   { "type":"language" , "id":"elvish",   "letter":"Elvish",   "rarity":"common" },
   { "type":"language" , "id":"halfing",  "letter":"Halfing",  "rarity":"common" },
   { "type":"alignment", "id":"lg", "name":"Lawful Good",     "lawful":1, "chaotic":0, "good":1, "evil":0 },
   { "type":"alignment", "id":"ng", "name":"Neutral Good",    "lawful":0, "chaotic":0, "good":1, "evil":0 },
   { "type":"alignment", "id":"cg", "name":"Chaotic Good",    "lawful":0, "chaotic":1, "good":1, "evil":0 },
   { "type":"alignment", "id":"ln", "name":"Lawful Neutral",  "lawful":1, "chaotic":0, "good":0, "evil":0 },
   { "type":"alignment", "id":"tn", "name":"True Neutral",    "lawful":0, "chaotic":0, "good":0, "evil":0 },
   { "type":"alignment", "id":"cn", "name":"Chaotic Neutral", "lawful":0, "chaotic":1, "good":0, "evil":0 },
   { "type":"alignment", "id":"le", "name":"Lawful Evil",     "lawful":1, "chaotic":0, "good":0, "evil":1 },
   { "type":"alignment", "id":"ne", "name":"Neutral Evil",    "lawful":0, "chaotic":0, "good":0, "evil":1 },
   { "type":"alignment", "id":"ce", "name":"Chaotic Evil",    "lawful":0, "chaotic":1, "good":0, "evil":1 }
],
"character": [
{"id": "sys", // Implementation of basec system rules
   "type":"system",
   "subrules": [
      " adj.str_mod : floor( ( you.str - 10 ) / 2 ) ",
      " adj.str_chk : you.str_mod ", // alias of { "part":"adj", "property":"str_chk", "value":"you.str_mod" },
      " adj.str_sv  : you.str_mod ",
      " adj.athletic : you.str_mod ",
   ]
},
{"id": "pc", // Standard PC
   "type":"pc",
   "subrules": [
//      " set.prof_mod : [ 2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5,6,6,6,6 ][ you.level ] ",
//      " adj.str_sv   : you.prof_str_sv ? you.prof_mod : 0 ",
      " include      : #character.sys ",
/*
      { "slot":"str", "minVal": 3, "maxVal": 18, "default": 10 },
      { "slot":"dex", "minVal": 3, "maxVal": 18, "default": 10 },
      { "slot":"con", "minVal": 3, "maxVal": 18, "default": 10 },
      { "slot":"int", "minVal": 3, "maxVal": 18, "default": 10 },
      { "slot":"wis", "minVal": 3, "maxVal": 18, "default": 10 },
      { "slot":"cha", "minVal": 3, "maxVal": 18, "default": 10 },

      { "slot":"race", "options":"#race" },
      { "slot":"alignment", "options":"#entity({type:alignment})" },
      { "slot":"bonus_language", "count":"you.int_mod", "options":"#entity({type:language,rarity:common})" },
      //{ "slot":"bonus_language", "count":"you.int_mod@{level:0}", "options":"#entity[@type=language][@rarity=common]" },
      { "slot":"background", "options":"#background" },
      { "slot":"level", "minVal": 1, "maxVal": 20, "default": 1 },
      { "slot":"level_1", "level":'1', "options":"#class" },
      { "slot":"level_2", "level":'2', "options":"#class" },
      { "slot":"level_3", "level":'3', "options":"#class" }
            */
   ]
}
],
"race":[
{"id": "dwarf",
   "subrules": [
      "set.speed : 30",
   ]
}
]
   /* ability_generation id="standard" name="Standard Array" option="16,14,13,12,10,8" />
   <ability_generation id="pt_buy_30" name="Normal Point Buy" min="8" max="16">
      <point score="9" point="1" />
      <point score="10" point="2" />
      <point score="11" point="3" />
      <point score="12" point="4" />
      <point score="13" point="5" />
      <point score="14" point="7" />
      <point score="15" point="9" />
      <point score="16" point="12" />
   </ability_generation-->

   <race id="dwarf">
      <feature id="size" set.size="m" />
      <feature id="speed" set.speed="25" />
      <feature id="language" prof.language="[common,dwarvish]" />
      <feature id="darkvision" set.darkvision.min="60" /> <!-- <set prop="darkvision" value="60" min="true" /> -->
      <feature id="ability_score_adjustment">
         <adj prop="con" value="1" />
      </feature>
      <feature id="dwarven_weapon_proficiency">
         <prof type="weapon" value="[battleaxe,handaxe,throwing_hammer,warhammer]" />
      </feature>
      <feature id="dwarven_resilience">
         <save victim="you" if="effect{type=poison}" set.advantage="1" />
         <damage victim="you" if="effect{type=poison}" set.resistant="1" />
      </feature>
      <feature id="stonecunning" /><!-- advantage on int(history) check related to origin of stonework. when exploring underground, you cannot get lost. -->
      <feature id="subrace">
         <slot>
            <feature id="hill">
               <feature id="ability_score_adjustment" adj.str="1" />
               <feature id="dwarven_toughness" adj.hp_max="you.level" />
            </feature>
            <feature id="mountain">
               <feature id="ability_score_adjustment" adj.wis="1" />
               <feature id="armor_mastery">
                  <prof type="weapon" value="#eq{type=armor}{category=light,medium}" />
                  <adj prop="ac" value="1" if="you.equiped{type=armor}{category=medium,heavy}" />
               </feature>
            </feature>
         </slot>
      </feature>
   </race>
</pinapplebun>
*/
} );