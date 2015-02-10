var pinbun; // Globals
if ( ! pinbun ) throw new Error( '[pinbin.langlist] Pineapplebun must be loaded first.' );

pinbun.lang = [
{
   code  : 'en-US',
   name  : 'English (US)',
   label : 'EN',
},
{
   code  : 'zh-Hant',
   name  : 'Chinese 中文（正體）',
   label : 'ZH',
}
];

pinbun.theme = [
{
   code  : 'deepsea',
   file  : [ 'deepsea.css' ],
},
];