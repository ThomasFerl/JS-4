import * as globals      from "./tfWebApp/globals.js";
import * as utils        from "./tfWebApp/utils.js";    

import { TFLabel, 
         TFPanel , 
         TFSlider,
         TFButton,
         TFCheckBox,
         TFListCheckbox,
         TFEdit,
         TFComboBox,
         TFPopUpMenu,
         Screen,
         TFWorkSpace, }      from "./tfWebApp/tfObjects.js";
import { TFWindow }      from "./tfWebApp/tfWindows.js";


export function main(capt1,capt2)
{
  var ws = new TFWorkSpace('mainWS' , 'Test' , 'Hallo Welt' );

  var wnd = new TFWindow(ws, 'TEST' , '50%' , '70%' , 'CENTER');     
  
  wnd.shadow = 0;
}
    
    
     
