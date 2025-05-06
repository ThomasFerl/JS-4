

import * as globals      from "./tfWebApp/globals.js";
import * as utils        from "./tfWebApp/utils.js";    
import * as dialogs      from "./tfWebApp/tfDialogs.js";
import { TFWorkSpace }   from "./tfWebApp/tfObjects.js";
import { TFWindow    }   from "./tfWebApp/tfWindows.js"; 
import { TBanf       }   from "./banf.js";
import { TFDateTime }    from "./tfWebApp/utils.js";    

var menuContainer = null;
var dashBoard     = null;


export function main(capt1,capt2)
{
   
    var ws = new TFWorkSpace('mainWS' , capt1,capt2 );

    var l  = dialogs.setLayout( ws.handle , {gridCount:27,head:2} )
  
    menuContainer = l.head;
    dashBoard     = l.dashBoard;
    menuContainer.backgroundColor = 'gray';
    menuContainer.buildGridLayout_templateColumns('14em 14em 14em 14em 14em 1fr');
    menuContainer.buildGridLayout_templateRows('1fr');


  var btn1 = dialogs.addButton( menuContainer , "" , 1 , 1 , 1 , 1 , "neue Banfvorlage"  )
      btn1.callBack_onClick = function() { addBanf() };
      btn1.heightPx = 47;
      btn1.margin   = 4;

      var btn2 = dialogs.addButton( menuContainer , "" , 2 , 1 , 1 , 1 , "Banfvorlage bearbeiten"  )
      btn2.callBack_onClick = function() { editBanf() };
      btn2.heightPx = 47;
      btn2.margin   = 4;

  var btn3 = dialogs.addButton( menuContainer , "cssAbortBtn01" , 3 , 1 , 1 , 1 , "Banfvorlage löschen"  )
      btn3.callBack_onClick = function() { delBanf() };
      btn3.heightPx = 47;
      btn3.margin   = 4;


      updateView();
}      


function updateView()
{
  var response = utils.webApiRequest('LSBANF' , {} );
  if(response.error) {dialogs.showMessage(response.errMsg);return; }
  var grid = dialogs.createTable( dashBoard , response.result , '' , '');
}

function addBanf()
{
  var   aBanf = { 
                 ID	                  : 0,
                 POSITIONSTEXT        : '10',
                 MENGE                : 1,
                 MENGENEINHEIT        : 'Stk',
                 PREIS                :  0,
                 WARENGRUPPE          : '',
                 LIEFERDATUM          : new TFDateTime().formatDateTime('dd.mm.yyyy'),
                 LIEFERANT            : "",
                 WERK                 : "EMS",
                 EINKAEUFERGRUPPE     : "",
                 EINKAUFSORGANISATION : "",
                 ANFORDERER           : "",
                 BEMERKUNG            : "",
                 SACHKONTO            : "",
                 AUFTRAG              : "",
                 OWNER                : "",
               };

        var b = new TBanf(aBanf);
        b.edit(function(){this.updateView()});
}

function editBanf()
{}  

function delBanf()
{}

