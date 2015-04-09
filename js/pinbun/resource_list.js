/*                                                                                                                      <![CDATA[ ex: softtabstop=3 shiftwidth=3 tabstop=3 expandtab */
var pinbun; // Globals
if ( ! pinbun ) throw Error( '[pinbin.langlist] Pineapplebun must be loaded first.' );

pinbun.locales = [
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

pinbun.themes = [ // Name is localised
{
   code  : 'deepsea',
   files : {
      css: 'css/deepsea.css',
      res: [ 'img/deepsea/letter-d.svg' ],
   },
},
{
   code  : 'mariner',
   files : {
      css: 'css/mariner.css',
      res: [ 'img/mariner/letter-d.svg' ],
   },
},
];

/*]]>*/