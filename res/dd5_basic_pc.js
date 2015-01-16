dd5.loader.jsonp.load_rules( { 'version':'alpha',
'source' : 'basic_pc',
'entity': [
   { 'type':'system'   , 'id':'character', // Implementation of basec system rules
      'subrules': [
         ' adj.str_mod  : floor( ( you.str - 10 ) / 2 ) ', ' adj.dex_mod  : floor( ( you.dex - 10 ) / 2 ) ',
         ' adj.con_mod  : floor( ( you.con - 10 ) / 2 ) ', ' adj.int_mod  : floor( ( you.int - 10 ) / 2 ) ',
         ' adj.wis_mod  : floor( ( you.wis - 10 ) / 2 ) ', ' adj.cha_mod  : floor( ( you.cha - 10 ) / 2 ) ',
         ' adj.str_half : floor( you.str_mod / 2 ) ', ' adj.dex_half : floor( you.dex_mod / 2 ) ',
         ' adj.con_half : floor( you.con_mod / 2 ) ', ' adj.int_half : floor( you.int_mod / 2 ) ',
         ' adj.wis_half : floor( you.wis_mod / 2 ) ', ' adj.cha_half : floor( you.cha_mod / 2 ) ',
         ' adj.str_chk  : you.str_mod ', ' adj.dex_chk  : you.dex_mod ',
         ' adj.con_chk  : you.con_mod ', ' adj.int_chk  : you.int_mod ',
         ' adj.wis_chk  : you.wis_mod ', ' adj.cha_chk  : you.cha_mod ',
         ' adj.str_save : you.str_mod ', ' adj.dex_save : you.dex_mod ',
         ' adj.con_save : you.con_mod ', ' adj.int_save : you.int_mod ',
         ' adj.wis_save : you.wis_mod ', ' adj.cha_save : you.cha_mod ',
         ' adj.athletic : you.str_mod ',
      ]
   },
   { 'type':'attribute', 'id':'str', 'physical':1, 'mental':0 },
   { 'type':'attribute', 'id':'dex', 'physical':1, 'mental':0 },
   { 'type':'attribute', 'id':'con', 'physical':1, 'mental':0 },
   { 'type':'attribute', 'id':'int', 'physical':0, 'mental':1 },
   { 'type':'attribute', 'id':'wis', 'physical':0, 'mental':1 },
   { 'type':'attribute', 'id':'cha', 'physical':0, 'mental':1 },

   { 'type':'language' , 'id':'common',   'letter':'common',   'rarity':'standard' },
   { 'type':'language' , 'id':'dwarvish', 'letter':'dwarvish', 'rarity':'standard' },
   { 'type':'language' , 'id':'elvish',   'letter':'elvish',   'rarity':'standard' },
   { 'type':'language' , 'id':'giant',    'letter':'dwarvish',  'rarity':'standard' },
   { 'type':'language' , 'id':'gnomish',  'letter':'dwarvish',  'rarity':'standard' },
   { 'type':'language' , 'id':'goblin',   'letter':'dwarvish',  'rarity':'standard' },
   { 'type':'language' , 'id':'halfing',  'letter':'common',    'rarity':'standard' },
   { 'type':'language' , 'id':'orc',     'letter':'dwarvish',  'rarity':'standard' },

   { 'type':'language' , 'id':'abyssal',  'letter':'infernal',  'rarity':'exotic' },
   { 'type':'language' , 'id':'celestial', 'letter':'celestial',  'rarity':'exotic' },
   { 'type':'language' , 'id':'draconic', 'letter':'draconic',   'rarity':'exotic' },
   { 'type':'language' , 'id':'deepspeech', 'letter': null,     'rarity':'exotic' },
   { 'type':'language' , 'id':'infernal', 'letter': 'infernal',  'rarity':'exotic' },
   { 'type':'language' , 'id':'primordial', 'letter': 'dwarvish',  'rarity':'exotic' },
   { 'type':'language' , 'id':'sylvan',   'letter': 'elvish',    'rarity':'exotic' },
   { 'type':'language' , 'id':'undercommon', 'letter': 'elvish',  'rarity':'exotic' },

   { 'type':'alignment', 'id':'lg', 'lawful':1, 'chaotic':0, 'good':1, 'evil':0 },
   { 'type':'alignment', 'id':'ng', 'lawful':0, 'chaotic':0, 'good':1, 'evil':0 },
   { 'type':'alignment', 'id':'cg', 'lawful':0, 'chaotic':1, 'good':1, 'evil':0 },
   { 'type':'alignment', 'id':'ln', 'lawful':1, 'chaotic':0, 'good':0, 'evil':0 },
   { 'type':'alignment', 'id':'tn', 'lawful':0, 'chaotic':0, 'good':0, 'evil':0 },
   { 'type':'alignment', 'id':'cn', 'lawful':0, 'chaotic':1, 'good':0, 'evil':0 },
   { 'type':'alignment', 'id':'le', 'lawful':1, 'chaotic':0, 'good':0, 'evil':1 },
   { 'type':'alignment', 'id':'ne', 'lawful':0, 'chaotic':0, 'good':0, 'evil':1 },
   { 'type':'alignment', 'id':'ce', 'lawful':0, 'chaotic':1, 'good':0, 'evil':1 },

   { 'type':'gender', 'id':'male' },
   { 'type':'gender', 'id':'female' },
   { 'type':'gender', 'id':'gender-x' },
   { 'type':'gender', 'id':'gender-t' },
   { 'type':'gender', 'id':'gender-other' },
],
'character': [
   {'id': 'pc', // Standard PC
      'subrules': [
         ' include : db.entity( "character" ) ',
         ' slot.alignment : db.entity({ type: "alignment" }) ',
         ' slot.race : db.race() ',
         { 'feature': 'pc_ability',
            'subrules': [
               ' slot.str : 10 [3,18] ',
               ' slot.dex : 10 [3,18] ',
               ' slot.con : 10 [3,18] ',
               ' slot.int : 10 [3,18] ',
               ' slot.wis : 10 [3,18] ',
               ' slot.cha : 10 [3,18] ',
            ]
         },
      ]
   },
],
'race': [
   {'id': 'human',
      'subrules': [
         ' slot.gender : db.entity({ type: "gender" }) ',
         ' adj.speed : 30 ',
         ' adj.size : 3 ',
         //' prof.common ',
         //' prof.tongue : db.entity({ type: "language" }) ',
         //' slot.subrace : db.feature({ type: "subrace", race: "human" }) '
      ]
   },
],
'feature' : [
   { 'id': 'human-basic', 'type': 'subrace', 'race': 'human',
      'subrules': [
         { 'subrule': 'adj', 'property' : 'db.entity({type:"ability"})', 'value': 1 },
      ]
   },
   { 'id': 'human-phb', 'type': 'subrace', 'race': 'human',
      'subrules': [
         { 'slot' : 'bonus_ability', 'options' : 'db.entity({"type:ability"})', 'count': 2 },
         { 'subrule': 'adj', 'property' : 'feature.bonus_ability[0]', 'value': 1 },
         { 'subrule': 'adj', 'property' : 'feature.bonus_ability[1]', 'value': 1 },
         'slot.feat : db.feat() ',
      ]
   },
]


/*
//      ' set.prof_mod : [ 2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5,6,6,6,6 ][ you.level ] ',
//      ' adj.str_sv   : you.prof_str_sv ? you.prof_mod : 0 ',
      { 'slot':'bonus_language', 'count':'you.int_mod', 'options':'#entity({type:language,rarity:common})' },
      { 'slot':'background', 'options':'#background' },
      { 'slot':'level', 'minVal': 1, 'maxVal': 20, 'default': 1 },
      { 'slot':'level_1', 'level':'1', 'options':'#class' },
      { 'slot':'level_2', 'level':'2', 'options':'#class' },
      { 'slot':'level_3', 'level':'3', 'options':'#class' }
   ]
}*/
} );