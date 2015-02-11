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

{ entry:'entity', type:'language' , id:'common',     letter:'common',    language:'standard' },
{ entry:'entity', type:'language' , id:'dwarvish',   letter:'dwarvish',  language:'standard' },
{ entry:'entity', type:'language' , id:'elvish',     letter:'elvish',    language:'standard' },
{ entry:'entity', type:'language' , id:'giant',      letter:'dwarvish',  language:'standard' },
{ entry:'entity', type:'language' , id:'gnomish',    letter:'dwarvish',  language:'standard' },
{ entry:'entity', type:'language' , id:'goblin',     letter:'dwarvish',  language:'standard' },
{ entry:'entity', type:'language' , id:'halfing',    letter:'common',    language:'standard' },
{ entry:'entity', type:'language' , id:'orc',        letter:'dwarvish',  language:'standard' },

{ entry:'entity', type:'language' , id:'abyssal',    letter:'infernal',  language:'exotic' },
{ entry:'entity', type:'language' , id:'celestial',  letter:'celestial', language:'exotic' },
{ entry:'entity', type:'language' , id:'draconic',   letter:'draconic',  language:'exotic' },
{ entry:'entity', type:'language' , id:'deepspeech', letter: null,       language:'exotic' },
{ entry:'entity', type:'language' , id:'infernal',   letter:'infernal',  language:'exotic' },
{ entry:'entity', type:'language' , id:'primordial', letter:'dwarvish',  language:'exotic' },
{ entry:'entity', type:'language' , id:'sylvan',     letter:'elvish',    language:'exotic' },
{ entry:'entity', type:'language' , id:'undercommon',letter:'elvish',    language:'exotic' },

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
   ' adj.prof_mod : [ 2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5,6,6,6,6 ][ you.level ] ',
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
   ' adj.ac : 10 ',
   ' feature.dex_to_ac  : adj.ac : you.dex_mod ',
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
      ' adj.point_cost : [,,,,,,,,0,1,2,3,4,5,7,9][you["pc.pc_ability.str"]] + [,,,,,,,,0,1,2,3,4,5,7,9][you["pc.pc_ability.dex"]] + \
                         [,,,,,,,,0,1,2,3,4,5,7,9][you["pc.pc_ability.con"]] + [,,,,,,,,0,1,2,3,4,5,7,9][you["pc.pc_ability.int"]] + \
                         [,,,,,,,,0,1,2,3,4,5,7,9][you["pc.pc_ability.wis"]] + [,,,,,,,,0,1,2,3,4,5,7,9][you["pc.pc_ability.cha"]] || 0',
   ] },
   ' slot.alignment : db.entity({ type: "alignment" }) ',
   ' slot.race : db.race() ',
] }, /*
      { 'slot':'bonus_language', 'count':'you.int_mod', 'options':'db.entity({type:"language"})', 'level': 1 },
      { 'slot':'background', 'options':'#background' },
      { 'slot':'level'  , 'min_val': 1, 'max_val': 20, 'default': 1 },
      { 'slot':'level_1', 'level':'1', 'options':'#class' }, */
////////////////////////////////////////////////////////////////////////////////////////////////////////////
{ entry:'race', id: 'dwarf', subrules: [
   ' slot.gender : db.entity({ type: "gender" }) ',
   ' adj.speed : 25 ',
   ' adj.size : 3 ',
   ' adj.con : 2 ',
   ' prof.language            : entity    : common, dwarvish ',
   ' prof.weapon              : equipment : battleaxe, handaxe, light-hammer, warhammer ',
   ' profSlot.tool.bonus_prof : equipment : smith-tool, brewer-tool, mason-tool ',
   ' slot.subrace  : db.feature({ type: "subrace", of: "dwarf" }) ',
] },
{ feature: 'dwarf-hill', type: 'subrace', of: 'dwarf', subrules: [
   ' adj.wis : 1 ',
] },
{ feature: 'dwarf-mountain', type: 'subrace', of: 'dwarf', subrules: [
   ' adj.str : 2 ',
   ' prof.armour : db.equipment({ type: "armour", armour: [ "light", "medium" ] }) ',
] },
////////////////////////////////////////////////////////////////////////////////////////////////////////////
{ entry:'race', id: 'elf', subrules: [
   ' slot.gender : db.entity({ type: "gender" }) ',
   ' adj.speed : 30 ',
   ' adj.size : 3 ',
   ' adj.dex : 2 ',
   ' prof.language : entity : common, elvish ',
   ' prof.skill    : entity : perception ',
   ' slot.subrace  : db.feature({ type: "subrace", of: "elf" }) '
] },
{ feature: 'elf-high', type: 'subrace', of: 'elf', subrules: [
   ' adj.int : 1 ',
   ' prof.weapon   : equipment : longsword, shortsword, shortbow, longbow ',
   ' profSlot.language.bonus_language : db.entity({ language: "standard" }) ',
] },
{ feature: 'elf-wood', type: 'subrace', of: 'elf', subrules: [
   ' adj.wis : 1 ',
   ' adj.speed : 5 ',
   ' prof.weapon   : equipment : longsword, shortsword, shortbow, longbow ',
] },
////////////////////////////////////////////////////////////////////////////////////////////////////////////
{ entry:'race', id: 'halfling', subrules: [
   ' slot.gender : db.entity({ type: "gender" }) ',
   ' adj.speed : 25 ',
   ' adj.size : 2 ',
   ' adj.dex : 2 ',
   ' prof.language : entity : common, halfing ',
   ' slot.subrace : db.feature({ type: "subrace", of: "halfling" }) '
] },
{ feature: 'halfling-lightfoot', type: 'subrace', of: 'halfling', subrules: [
   ' adj.cha : 1 ',
] },
{ feature: 'halfling-stout', type: 'subrace', of: 'halfling', subrules: [
   ' adj.con : 1 ',
] },
////////////////////////////////////////////////////////////////////////////////////////////////////////////
{ entry:'race', id: 'human', subrules: [
   ' slot.gender : db.entity({ type: "gender" }) ',
   ' adj.speed : 30 ',
   ' adj.size : 3 ',
   ' prof.language : entity : common ',
   ' profSlot.language.bonus_language : db.entity({ language: "standard" }) ',
   ' slot.subrace : db.feature({ type: "subrace", of: "human" }) ',
] },
{ feature: 'human-basic', type: 'subrace', of: 'human', subrules: [
   { adj: 'toCId( db.entity({ type: "ability" }) )', value: 1 }, // Increase ALL abilities by one
] },
{ feature: 'human-phb', type: 'subrace', of: 'human', subrules: [
   { slot : 'bonus_ability', options : 'db.entity({ type: "ability" })', count: 2 },
   { adj : 'toCId( you.bonus_ability )', value: 1, dependent_attribute: 'bonus_ability' },
   ' profSlot.skill.bonus_prof : db.entity({ type: "skill" }) ',
   ' slot.feat : db.feat() ',
] },
////////////////////////////////////////////////////////////////////////////////////////////////////////////
{ entry:'equipment', type: 'armour', id: 'padded'        , armour: 'light' , cost:  5, weight:  8, subrules: [ 'adj.ac : 1' ] },
{ entry:'equipment', type: 'armour', id: 'leather'       , armour: 'light' , cost: 10, weight: 10, subrules: [ 'adj.ac : 1' ] },
{ entry:'equipment', type: 'armour', id: 'studdedleather', armour: 'light' , cost: 45, weight: 13, subrules: [ 'adj.ac : 2' ] },
{ entry:'equipment', type: 'armour', id: 'hide'          , armour: 'medium', cost: 10, weight: 12, subrules: [ 'adj.ac : 2' ] },
{ entry:'equipment', type: 'armour', id: 'chainshirt'    , armour: 'medium', cost: 50, weight: 20, subrules: [ 'adj.ac : 3' ] },
{ entry:'equipment', type: 'armour', id: 'scalemail'     , armour: 'medium', cost: 50, weight: 45, subrules: [ 'adj.ac : 4' ] },
{ entry:'equipment', type: 'armour', id: 'breastplate'   , armour: 'medium', cost:400, weight: 20, subrules: [ 'adj.ac : 4' ] },
{ entry:'equipment', type: 'armour', id: 'halfplate'     , armour: 'medium', cost:750, weight: 40, subrules: [ 'adj.ac : 5' ] },

{ entry:'equipment', type: 'weapon', id: 'handaxe', weapon: [ 'melee', 'simple' ], damage:"1d6", dmg_type: "slashing",
   cost:  5, weight: 2, light:1, thrown: [20,60] },
{ entry:'equipment', type: 'weapon', id: 'light-hammer', weapon: [ 'melee', 'simple' ], damage:"1d4", dmg_type: "bludgeoning",
   cost:  2, weight: 2, light:1, thrown: [20,60] },
{ entry:'equipment', type: 'weapon', id: 'battleaxe', weapon: [ 'melee', 'martial' ], damage:"1d8", dmg_type: "slashing",
   cost: 10, weight: 4, versatile:"1d10" },
{ entry:'equipment', type: 'weapon', id: 'longsword', weapon: [ 'melee', 'martial' ], damage:"1d8", dmg_type: "slashing",
   cost: 15, weight: 3, versatile:"1d10" },
{ entry:'equipment', type: 'weapon', id: 'shortsword', weapon: [ 'melee', 'martial' ], damage:"1d6", dmg_type: "piercing",
   cost: 10, weight: 2, finesse:1, light:1 },
{ entry:'equipment', type: 'weapon', id: 'warhammer', weapon: [ 'melee', 'martial' ], damage:"1d8", dmg_type: "bludgeoning",
   cost: 15, weight: 2, versatile:"1d10" },
{ entry:'equipment', type: 'weapon', id: 'shortbow', weapon: [ 'ranged', 'simple' ], range:[80,320], damage:"1d6", dmg_type: "piercing",
   cost: 25, weight: 2, ammunition:1, 'two-handed':1 },
{ entry:'equipment', type: 'weapon', id: 'longbow', weapon: [ 'ranged', 'martial' ], ranged:[150,600], damage:"1d8", dmg_type: "piercing",
   cost: 50, weight: 2, ammunition:1, heavy:1, 'two-handed':1 },
{ entry:'equipment', type: 'tool', id: 'smith-tool' },
{ entry:'equipment', type: 'tool', id: 'brewer-tool' },
{ entry:'equipment', type: 'tool', id: 'mason-tool' },
],
} );