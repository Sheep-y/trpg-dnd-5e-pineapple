代號：菠蘿包
============

本角色產生器使用 [ES6](https://leanpub.com/understandinges6/read/) JavaScript。不需伺服器，解壓後可直接用火狐執行。

目前正從原型過渡到開發型，計劃在實驗好職業和法術選擇(含法術重訓)後將會來一次大重構。 <br/>
此簡易說明使用中文純為打擊英語人仕的參與意慾。正規文檔和源碼嚴格劃一採用英語。

速成導覽
--------

此導覽不能取代實際閱讀源碼。 <br/>
doc 檔案夾下有物件架構圖，`rule` 和 `runtime` 部分已大致定案。 <br/>
源碼在 res 資料夾。sparrow 為自家泛用程序庫，pinbun 為主程序，dd5 為系統模型。

角色由規則 `Rule` 組成。規則有兩種，首先是 `dd5.res` 自動收錄的資源 `Resourse`，這些資源又包含其他資源和/或實際做事的子規則 `Subrule`。 <br/>
戴入時，`dd5.loader` 將規則字串拆成選項物件(數據也可以直接提供物件)，然後創建所被定義的資源。 <br/>
子規則的細節，例如調整值的項目和量，會保持字串型態被 `compile_property` 封裝成函數，於首次執行時組譯。 <br/>
資源是靜態的，戴入後應該只會自組譯而不會改變。動態物件(例如編輯中的角色)需要 1:1 繼承相應規則。

程序開始時會呼叫主程序 `pinbun`，主程序戴入完數據後會創造被編輯的角色並初始化角色建構介面。 <br/>
介面是由遍歷角色的規則模組化生成的。各模組會監聽角色的屬性和結構事件，藉以部分或完整刷新。為了效率，這些事件都先緩存後觸發。

角色的狀態主要經由查詢實現。例如 `pinbun.activeCharacter.queryChar('str_chk')` 可以獲得目前角色的力量檢定加值，或者查詢 `'prof$language'` 可以獲得所有通曉語言。 <br/>
規則元素會用 `query_hook` 宣佈自己所響應的查詢，由角色物件記錄著。 <br/>
查詢系統將會是本程序的核心，穩定後將需要詳細文檔，但目前尚未成熟。