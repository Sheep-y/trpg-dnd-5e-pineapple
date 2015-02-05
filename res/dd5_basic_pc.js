dd5.loader.jsonp.load_rules( { 'version':'alpha',
'source' : 'basic_pc',
'data': [

{ entry:'entity', type:'ability', id:'str', physical:1 },
{ entry:'entity', type:'ability', id:'dex', physical:1 },
{ entry:'entity', type:'ability', id:'con', physical:1 },
{ entry:'entity', type:'ability', id:'int', mental:1   },
{ entry:'entity', type:'ability', id:'wis', mental:1   },
{ entry:'entity', type:'ability', id:'cha', mental:1   },

{ entry:'entity', type:'proficiency', id:'language' },
{ entry:'entity', type:'proficiency', id:'skill'    },
{ entry:'entity', type:'proficiency', id:'save'     },
{ entry:'entity', type:'proficiency', id:'tool'     },
{ entry:'entity', type:'proficiency', id:'weapon'   },
{ entry:'entity', type:'proficiency', id:'armour'   },

{ entry:'entity', type:'skill', id:'athletic',      ability:'str', physical:1 },
{ entry:'entity', type:'skill', id:'acrobatics',    ability:'dex', physical:1 },
{ entry:'entity', type:'skill', id:'sleightofhand', ability:'dex', physical:1 },
{ entry:'entity', type:'skill', id:'stealth',       ability:'dex', physical:1 },
{ entry:'entity', type:'skill', id:'arcana',        ability:'int', mental:1, knowledge:1 },
{ entry:'entity', type:'skill', id:'history',       ability:'int', mental:1, knowledge:1 },
{ entry:'entity', type:'skill', id:'nature',        ability:'int', mental:1, knowledge:1 },
{ entry:'entity', type:'skill', id:'religion',      ability:'int', mental:1, knowledge:1 },
{ entry:'entity', type:'skill', id:'animalhandling',ability:'wis', mental:1  },
{ entry:'entity', type:'skill', id:'insight',       ability:'wis', mental:1, social:1  },
{ entry:'entity', type:'skill', id:'medicine',      ability:'wis', mental:1  },
{ entry:'entity', type:'skill', id:'perception',    ability:'wis', mental:1  },
{ entry:'entity', type:'skill', id:'survival',      ability:'wis', mental:1  },
{ entry:'entity', type:'skill', id:'deception',     ability:'cha', mental:1, social:1 },
{ entry:'entity', type:'skill', id:'intimidation',  ability:'cha', mental:1, social:1 },
{ entry:'entity', type:'skill', id:'performance',   ability:'cha', mental:1, social:1 },
{ entry:'entity', type:'skill', id:'persuasion',    ability:'cha', mental:1, social:1 },

{ entry:'entity', type:'language' , id:'common',     letter:'common',    rarity:'standard' },
{ entry:'entity', type:'language' , id:'dwarvish',   letter:'dwarvish',  rarity:'standard' },
{ entry:'entity', type:'language' , id:'elvish',     letter:'elvish',    rarity:'standard' },
{ entry:'entity', type:'language' , id:'giant',      letter:'dwarvish',  rarity:'standard' },
{ entry:'entity', type:'language' , id:'gnomish',    letter:'dwarvish',  rarity:'standard' },
{ entry:'entity', type:'language' , id:'goblin',     letter:'dwarvish',  rarity:'standard' },
{ entry:'entity', type:'language' , id:'halfing',    letter:'common',    rarity:'standard' },
{ entry:'entity', type:'language' , id:'orc',        letter:'dwarvish',  rarity:'standard' },

{ entry:'entity', type:'language' , id:'abyssal',    letter:'infernal',  rarity:'exotic' },
{ entry:'entity', type:'language' , id:'celestial',  letter:'celestial', rarity:'exotic' },
{ entry:'entity', type:'language' , id:'draconic',   letter:'draconic',  rarity:'exotic' },
{ entry:'entity', type:'language' , id:'deepspeech', letter: null,       rarity:'exotic' },
{ entry:'entity', type:'language' , id:'infernal',   letter: 'infernal', rarity:'exotic' },
{ entry:'entity', type:'language' , id:'primordial', letter: 'dwarvish', rarity:'exotic' },
{ entry:'entity', type:'language' , id:'sylvan',     letter: 'elvish',   rarity:'exotic' },
{ entry:'entity', type:'language' , id:'undercommon',letter: 'elvish',   rarity:'exotic' },

{ entry:'entity', type:'alignment', id:'lg', lawful:1, chaotic:0, good:1, evil:0 },
{ entry:'entity', type:'alignment', id:'ng', lawful:0, chaotic:0, good:1, evil:0 },
{ entry:'entity', type:'alignment', id:'cg', lawful:0, chaotic:1, good:1, evil:0 },
{ entry:'entity', type:'alignment', id:'ln', lawful:1, chaotic:0, good:0, evil:0 },
{ entry:'entity', type:'alignment', id:'tn', lawful:0, chaotic:0, good:0, evil:0 },
{ entry:'entity', type:'alignment', id:'cn', lawful:0, chaotic:1, good:0, evil:0 },
{ entry:'entity', type:'alignment', id:'le', lawful:1, chaotic:0, good:0, evil:1 },
{ entry:'entity', type:'alignment', id:'ne', lawful:0, chaotic:0, good:0, evil:1 },
{ entry:'entity', type:'alignment', id:'ce', lawful:0, chaotic:1, good:0, evil:1 },

{ entry:'entity', type:'gender', id:'male' },
{ entry:'entity', type:'gender', id:'female' },
{ entry:'entity', type:'gender', id:'gender-x' },
{ entry:'entity', type:'gender', id:'gender-t' },
{ entry:'entity', type:'gender', id:'gender-other' },
////////////////////////////////////////////////////////////////////////////////////////////////////////////
{ entry:'character', id: 'system', subrules: [ // Implementation of basec system rules
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
   ' adj.athletic       : you.str_mod ',
   ' adj.acrobatics     : you.dex_mod ',
   ' adj.sleightofhand  : you.dex_mod ',
   ' adj.stealth        : you.dex_mod ',
   ' adj.arcana         : you.int_mod ',
   ' adj.history        : you.int_mod ',
   ' adj.nature         : you.int_mod ',
   ' adj.religion       : you.int_mod ',
   ' adj.animalhandling : you.wis_mod ',
   ' adj.insight        : you.wis_mod ',
   ' adj.medicine       : you.wis_mod ',
   ' adj.perception     : you.wis_mod ',
   ' adj.survival       : you.wis_mod ',
   ' adj.deception      : you.cha_mod ',
   ' adj.intimidation   : you.cha_mod ',
   ' adj.performance    : you.cha_mod ',
   ' adj.persuasion     : you.cha_mod ',
] },
////////////////////////////////////////////////////////////////////////////////////////////////////////////
{ entry:'character', id: 'pc', subrules: [ // Standard PC
   ' numSlot.level : 1 [1,20] ',
   ' include : db.character( "system" ) ',
   { feature: 'pc_ability', subrules: [
      ' numSlot.str : 10 [3,18] ',
      ' numSlot.dex : 10 [3,18] ',
      ' numSlot.con : 10 [3,18] ',
      ' numSlot.int : 10 [3,18] ',
      ' numSlot.wis : 10 [3,18] ',
      ' numSlot.cha : 10 [3,18] ',
   ] },
   ' slot.alignment : db.entity({ type: "alignment" }) ',
   ' slot.race : db.race() ',
] }, /*
      ' adj.prof_mod : [ 2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5,6,6,6,6 ][ you.level ] ',
      { 'slot':'bonus_language', 'count':'you.int_mod', 'options':'#entity({type:language,rarity:common})' },
      { 'slot':'background', 'options':'#background' },
      { 'slot':'level'  , 'min_val': 1, 'max_val': 20, 'default': 1 },
      { 'slot':'level_1', 'level':'1', 'options':'#class' }, */
////////////////////////////////////////////////////////////////////////////////////////////////////////////
{ entry:'race', id: 'dwarf', subrules: [
   ' slot.gender : db.entity({ type: "gender" }) ',
   ' adj.speed : 25 ',
   ' adj.size : 3 ',
   ' adj.con : 2 ',
   ' prof.language : common, dwarvish ',
   ' slot.subrace : db.feature({ type: "subrace", of: "dwarf" }) '
] },
{ entry:'feature', id: 'dwarf-hill', type: 'subrace', of: 'dwarf', subrules: [
   ' adj.wis : 1 ',
] },
{ entry:'feature', id: 'dwarf-mountain', type: 'subrace', of: 'dwarf', subrules: [
   ' adj.str : 2 ',
] },
////////////////////////////////////////////////////////////////////////////////////////////////////////////
{ entry:'race', id: 'elf', subrules: [
   ' slot.gender : db.entity({ type: "gender" }) ',
   ' adj.speed : 30 ',
   ' adj.size : 3 ',
   ' adj.dex : 2 ',
   ' prof.language : common, elvish ',
   ' slot.subrace : db.feature({ type: "subrace", of: "elf" }) '
] },
{ entry:'feature', id: 'elf-high', type: 'subrace', of: 'elf', subrules: [
   ' adj.int : 1 ',
   ' profSlot.language.bonus_language : db.entity({ type: "language", rarity: "standard" }) ',
] },
{ entry:'feature', id: 'elf-wood', type: 'subrace', of: 'elf', subrules: [
   ' adj.wis : 1 ',
   ' adj.speed : 5 ',
] },
////////////////////////////////////////////////////////////////////////////////////////////////////////////
{ entry:'race', id: 'halfling', subrules: [
   ' slot.gender : db.entity({ type: "gender" }) ',
   ' adj.speed : 25 ',
   ' adj.size : 2 ',
   ' adj.dex : 2 ',
   ' prof.language : common, halfing ',
   ' slot.subrace : db.feature({ type: "subrace", of: "halfling" }) '
] },
{ entry:'feature', id: 'halfling-lightfoot', type: 'subrace', of: 'halfling', subrules: [
   ' adj.cha : 1 ',
] },
{ entry:'feature', id: 'halfling-stout', type: 'subrace', of: 'halfling', subrules: [
   ' adj.con : 1 ',
] },
////////////////////////////////////////////////////////////////////////////////////////////////////////////
{ entry:'race', id: 'human', subrules: [
   ' slot.gender : db.entity({ type: "gender" }) ',
   ' adj.speed : 30 ',
   ' adj.size : 3 ',
   ' prof.language : common ',
   ' profSlot.language.bonus_language : db.entity({ type: "language", rarity: "standard" }) ',
   ' slot.subrace : db.feature({ type: "subrace", of: "human" }) '
] },
{ entry:'feature', id: 'human-basic', type: 'subrace', of: 'human', subrules: [
   { adj: 'toCId( db.entity({ type: "ability" }) )', value: 1 }, // Increase ALL abilities by one
] },
{ entry:'feature', id: 'human-phb', type: 'subrace', of: 'human', subrules: [
   { slot : 'bonus_ability', options : 'db.entity({ type: "ability" })', count: 2 },
   { adj : 'toCId( you.bonus_ability )', value: 1, dependent_attribute: 'bonus_ability' },
   ' profSlot.skill.bonus_skill : db.entity({ type: "skill" }) ',
   ' slot.feat : db.feat() ',
] },
],
} );