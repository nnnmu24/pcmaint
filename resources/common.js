
/**********
 * 定数クラス
 **********/

class ConstClass {
/*
    TYPE_TEXT;
    TYPE_NUMBER;
    TYPE_DATE;
    PARTS_TEXT;
    PARTS_CHECK;
    PARTS_BUTTON;
    PARTS_SELECT;
    PARTS_IMAGE;
    PARTS_HTML;
*/
    constructor() {
        this.TYPE_TEXT = "text";
        this.TYPE_NUMBER = "num";
        this.TYPE_DATE = "date";
        this.PARTS_TEXT = "text";
        this.PARTS_CHECK = "checkbox";
        this.PARTS_BUTTON = "button";
        this.PARTS_SELECT = "select";
        this.PARTS_IMAGE = "img";
        this.PARTS_HTML = "html";
    }
}



/**********
 * フレームワーククラス
 * （継承するクラスより先に宣言すること）
 **********/

class PartsPolicy {

/*
    configManager;
    stateManager;

    id;                  // ID
    type;                // 入力項目の種別（ConstClassに定義した値）
    valueRule;           // 入力チェック関数
    valueFunctionOption; // 入力エリア表示時に使用するオプション
    valueFunction;       // 入力エリア表示関数
    eventFunctionOption; // イベント処理時に使用するオプション
    eventFunction;       // イベント関数
*/
    constructor(
        configManager,
        stateManager,
        id,
        type,
        valueRule,
        valueFunctionOption,
        valueFunction,
        eventFunctionOption,
        eventFunction) {

        this.configManager = configManager;
        this.stateManager = stateManager;
        this.id = id;
        this.type = type;
        this.valueRule = valueRule;
        this.valueFunctionOption = valueFunctionOption;
        this.valueFunction = valueFunction;
        this.eventFunctionOption = eventFunctionOption;
        this.eventFunction = eventFunction;
    }
}

class EventCustomData {
/*
    viewControl;
    configManager;
    stateManager;
    option;
*/
    constructor(viewControl, configManager, stateManager, option) {
        this.viewControl = viewControl;
        this.configManager = configManager;
        this.stateManager = stateManager;
        this.option = option;
    }
}

class AreaControl {
/*
    viewControl;
    configManager;
    stateManager;
*/
    constructor(viewControl, configManager, stateManager) {
        this.viewControl = viewControl;
        this.configManager = configManager;
        this.stateManager = stateManager;
    }

    display() {
        // 子クラスには「partsPolicyArray」という配列変数名でポリシーを格納する
        this.partsPolicyArray.forEach((value, index) => {
            if (value.valueFunction == null) {
                return;
            }
            AreaControl._displaySub(value);
        });
    }

    static _displaySub(value) {
        let displayElement = document.getElementById(value.id);
        let displayValue = value.valueFunction(value.valueFunctionOption);
        if (value.type == Const.PARTS_TEXT) {
            displayElement.value = displayValue;
        } else if (value.type == Const.PARTS_CHECK) {
            displayElement.checked = displayValue;
        } else if (value.type == Const.PARTS_BUTTON) {
            ;
        } else if (value.type == Const.PARTS_SELECT) {
            // SELECTの場合、valueFunctionOptionに選択項目の2次元配列
            // valueFunctionの戻り値には選択値
            value.valueFunctionOption.forEach((value, index) => {
                let option = document.createElement("option");
                option.value = value[0];
                option.text = value[1];
                displayElement.appendChild(option);
                if (displayValue == option.value) {
                    // 選択値に合致する項目を選択状態に
                    option.selected = true;
                }
            });
        } else if (value.type == Const.PARTS_HTML) {
            displayElement.innerHTML = displayValue;
        }
    }

    registEvent() {
        this.partsPolicyArray.forEach((value, index) => {
            if (value.eventFunction == null) {
                return;
            }

            let displayElement = document.getElementById(value.id);
            let eventAction = "click";
            if (value.type == Const.PARTS_TEXT) {
                eventAction = "blur";
            } else if (value.type == Const.PARTS_CHECK) {
                eventAction = "change";
            } else if (value.type == Const.PARTS_BUTTON) {
                eventAction = "click";
            } else if (value.type == Const.PARTS_SELECT) {
                eventAction = "change";
            } else if (value.type == Const.PARTS_IMAGE) {
                eventAction = "click";
            } else if (value.type == Const.PARTS_HTML) {
                eventAction = "click";
            }
            displayElement.addEventListener(eventAction, {
                viewControl: this.viewControl,
                configManager: this.configManager,
                stateManager: this.stateManager,
                option: value.eventFunctionOption,
                partsPolicy: value,
                handleEvent: this.eventFunctionBase,
            });
        });
    }

    eventFunctionBase(e) {
        // 入力値チェック
        if (this.partsPolicy.valueRule != null) {
            if (!this.partsPolicy.valueRule(e.target.value)) {
                // 入力値異常時は元の値で再表示
                AreaControl._displaySub(this.partsPolicy);
                return;
            }
        }

        // イベントの実行
        this.partsPolicy.eventFunction(e, new EventCustomData(
            this.viewControl, this.configManager, this.stateManager, this.option
        ));
    }
}



/**********
 * 画面制御クラス
 **********/

//Log.level = Log.ERROR;
const Const = new ConstClass();

let dataPath;
let contentObjectGroupMap;
let contentObjectMap;
let commandObject;

    // 初期処理
    function init() {
        // Electron用の初期処理
        initElectron();

        // 外部定義ファイルの読み込み
        initGlobal();

        let viewControl = new ViewControl();
        viewControl.init();
    }

    // Electron用の初期処理
    function initElectron() {
        // 同期メッセージを送信して、返信内容に格納されている外部パスを取得する
        var { ipcRenderer } = require("electron");
        dataPath = ipcRenderer.sendSync('synchronous-message', {message:'path'});
    }

    // グローバル変数の定義
    function initGlobal() {
        // 外部定義ファイルの読み込み
        let externalObjectContent = require(dataPath + '/data/content.js');
        contentObjectGroupMap = externalObjectContent.contentObjectGroupMapInit();
        contentObjectMap = externalObjectContent.contentObjectMapInit();
        commandObject = externalObjectContent.commandObject;
    }

// クラス：画面制御（全体の処理）
class ViewControl {
/*
    configManager;
    stateManager;
    menuAreaControl;
    configAreaControl;
    infoNoticeAreaControl;
    fileOpenAreaControl;
    contentsAreaControl;
*/
    init() {
        // 定数定義
        Object.freeze(Const);

        // 設定の読み込み
        this.stateManager = null;
        this.configManager = new ConfigManager();
        this.configManager.load();

        // 各エリア制御オブジェクトの生成
        this.menuAreaControl = new MenuAreaControl(this, this.configManager, this.stateManager);
        this.configAreaControl = new ConfigAreaControl(this, this.configManager, this.stateManager);
        this.infoNoticeAreaControl = new InfoNoticeAreaControl(this, this.configManager, this.stateManager);
        this.fileOpenAreaControl = new FileOpenAreaControl(this, this.configManager, this.stateManager);
        this.contentsAreaControl = new ContentsAreaControl(this, this.configManager, this.stateManager);

        // 各エリアの表示
        this.menuAreaControl.display();
        this.configAreaControl.display();
        this.infoNoticeAreaControl.display();
        this.fileOpenAreaControl.display();
        this.contentsAreaControl.display();

        // 各エリアのイベント登録
        this.menuAreaControl.registEvent();
        this.configAreaControl.registEvent();
        this.infoNoticeAreaControl.registEvent();
        this.fileOpenAreaControl.registEvent();
        this.contentsAreaControl.registEvent();
    }
}

// メニュー領域
class MenuAreaControl extends AreaControl {
/*
    viewControl;
    configManager;
    stateManager;
    partsPolicyArray;

    isShowCustom;
*/
    constructor(viewControl, configManager, stateManager) {
        super(viewControl, configManager, stateManager);
        this.viewControl = viewControl;
        this.configManager = configManager;
        this.stateManager = stateManager;

        this.isShowCustom = false;

        this.partsPolicyArray =[
            // リンク：「設定エリア」の表示
            new PartsPolicy(configManager, stateManager,
                "menuConfigIcon", Const.PARTS_HTML,
                null, null, null, null, this.showCustom),

            // リンク：「ヘルプ」の表示
            new PartsPolicy(configManager, stateManager,
                "menuHelpIcon", Const.PARTS_HTML,
                null, null, null, "content_004", this.showDialog),
        ];
    }

    // 設定領域の表示・非表示
    showCustom(e) {
        let customArea = document.getElementById("custom");
        if (this.isShowCustom == true) {
            this.isShowCustom = false;
            customArea.style.display = "none";
        } else {
            this.isShowCustom = true;
            customArea.style.display = "block";
        }
    }

    // ドキュメントを疑似ダイアログで開く
    showDialog(e, eventCustomData) {
        let textPath = PcPortalUtil.getContentPath(eventCustomData.option, null);
        if (textPath == null) {
            PcPortalUtil.actionError("invalid ID setting[" + eventCustomData.option + "]");
            return;
        }
        let contentObjectType = contentObjectMap.get(eventCustomData.option).type;

        // コンテンツの種類、テキスト、HTML、マークダウンを拡張子で識別
        let textType = null;
        if (contentObjectType != "auto") {
            textType = contentObjectType;
        } else {
            let ext = textPath.slice((textPath.lastIndexOf('.') - 1 >>> 0) + 2);
            if (ext == "txt") {
                textType = "plain";
            } else if (ext == "htm" || ext == "html") {
                textType = "html";
            } else if (ext == "md") {
                textType = "markdown";
            } else {
                textType = "plain";
            }
        }

        // 表示内容の取得
        let textContent = PcPortalUtil.getContent(eventCustomData.option);
        if (textContent == null) {
            PcPortalUtil.actionError("invalid ID setting[" + this.option + "]");
            return;
        }

        eventCustomData.viewControl.contentsAreaControl.dialogAreaControl.showDialogCommon(textContent, textType);
    }
}

// 設定領域
class ConfigAreaControl extends AreaControl {
/*
    viewControl;
    configManager;
    stateManager;
    partsPolicyArray;
*/
    constructor(viewControl, configManager, stateManager) {
        super(viewControl, configManager, stateManager);
        this.viewControl = viewControl;
        this.configManager = configManager;
        this.stateManager = stateManager;

        this.partsPolicyArray =[
            // 選択：「ダイアログの文字」の表示
            new PartsPolicy(configManager, stateManager,
                "customDialogFontSize", Const.PARTS_SELECT,
                null, [["large", "大"],["medium", "中"],["small", "小"]],
                function() {return this.configManager.customDialogFontSize},
                null, this.eventCustomDialogFontSize),

            // テキスト：「通知領域の高さ(px)」の表示
            new PartsPolicy(configManager, stateManager,
                "customNoticeHeight", Const.PARTS_TEXT,
                NumberUtil.isNumber,
                null, function() {return this.configManager.customNoticeHeight},
                null, this.eventCustomNoticeHeight),

            // テキスト：「スケジュール領域の高さ(px)」の表示
            new PartsPolicy(configManager, stateManager,
                "customScheduleHeight", Const.PARTS_TEXT,
                NumberUtil.isNumber,
                null, function() {return this.configManager.customScheduleHeight},
                null, this.eventCustomScheduleHeight),

            // テキスト：「タスク領域の高さ(px)」の表示
            new PartsPolicy(configManager, stateManager,
                "customTaskHeight", Const.PARTS_TEXT,
                NumberUtil.isNumber,
                null, function() {return this.configManager.customTaskHeight},
                null, this.eventCustomTaskHeight),

            // テキスト：「スケジュールの表示期間(日)」の表示
            new PartsPolicy(configManager, stateManager,
                "customScheduleDisplayTerm", Const.PARTS_TEXT,
                NumberUtil.isNumber,
                null, function() {return this.configManager.customScheduleDisplayTerm},
                null, this.eventCustomScheduleDisplayTerm),

            // ボタン：「タスクのチェック状態クリア」の表示
            new PartsPolicy(configManager, stateManager,
                "customTaskCheckClear", Const.PARTS_BUTTON,
                null, null, function() {return this.configManager.customTaskCheckClear},
                null, this.eventCustomTaskClearCheck),

            // チェックボックス：「タスクのチェック項目を表示」の表示
            new PartsPolicy(configManager, stateManager,
                "customTaskDisplayChecked", Const.PARTS_CHECK,
                null, null, function() {return this.configManager.customTaskDisplayChecked},
                null, this.eventCustomTaskDisplayChecked),
        ];
    }

    // カスタマイズ：ダイアログの文字
    eventCustomDialogFontSize(e) {
        this.configManager.customDialogFontSize = e.target.value;
        this.configManager.save();
    }

    // カスタマイズ：通知領域の高さ
    eventCustomNoticeHeight(e, eventCustomData) {
        this.configManager.customNoticeHeight = e.target.value;
        this.configManager.save();
        eventCustomData.viewControl.infoNoticeAreaControl.readNotice();
    }

    // カスタマイズ：スケジュール領域の高さ
    eventCustomScheduleHeight(e, eventCustomData) {
        this.configManager.customScheduleHeight = e.target.value;
        this.configManager.save();
        eventCustomData.viewControl.infoNoticeAreaControl.readSchedule();
    }

    // カスタマイズ：タスク領域の高さ
    eventCustomTaskHeight(e, eventCustomData) {
        this.configManager.customTaskHeight = e.target.value;
        this.configManager.save();
        eventCustomData.viewControl.infoNoticeAreaControl.readTask();
    }

    // カスタマイズ：スケジュールの表示期間
    eventCustomScheduleDisplayTerm(e, eventCustomData) {
        this.configManager.customScheduleDisplayTerm = e.target.value;
        this.configManager.save();
        eventCustomData.viewControl.infoNoticeAreaControl.readSchedule();
    }

    // カスタマイズ：タスクのチェック状態クリア
    eventCustomTaskClearCheck(e, eventCustomData) {
        let ret = window.confirm("タスクのチェック状態をクリアしますか？");
        if (ret == false) {
            return;
        }

        // Cookie内のキー先頭"task_"を削除
        this.configManager.customTaskCheckedSet.clear();
        this.configManager.save();
        eventCustomData.viewControl.infoNoticeAreaControl.readTask();
    }

    // カスタマイズ：タスクのチェック項目を表示
    eventCustomTaskDisplayChecked(e, eventCustomData) {
        if (e.target.checked) {
            this.configManager.customTaskDisplayChecked = true;
        } else {
            this.configManager.customTaskDisplayChecked = false;
        }
        this.configManager.save();
        eventCustomData.viewControl.infoNoticeAreaControl.readTask();
    }
}

// 情報通知領域
class InfoNoticeAreaControl extends AreaControl {
/*
    viewControl;
    configManager;
    stateManager;
    partsPolicyArray;
*/
    constructor(viewControl, configManager, stateManager) {
        super(viewControl, configManager, stateManager);
        this.viewControl = viewControl;
        this.configManager = configManager;
        this.stateManager = stateManager;

        this.partsPolicyArray =[
            // リンク：「設定エリア」の表示
            new PartsPolicy(configManager, stateManager,
                null, null, null, null, null, null, null),
            // 画像：「通知」編集アイコンの押下
            new PartsPolicy(configManager, stateManager,
                "icon_edit_notice", Const.PARTS_IMAGE,
                null, null, null, "content_001", this.editContents),
            // 画像：「スケジュール」編集アイコンの押下
            new PartsPolicy(configManager, stateManager,
                "icon_edit_schedule", Const.PARTS_IMAGE,
                null, null, null, "content_002", this.editContents),
            // 画像：「タスク」編集アイコンの押下
            new PartsPolicy(configManager, stateManager,
                "icon_edit_task", Const.PARTS_IMAGE,
                null, null, null, "content_003", this.editContents),
        ];
    }

    display() {
        super.display();
        this.readNotice();
        this.readSchedule();
        this.readTask();
    }

    // イベント処理：編集
    editContents(e, eventCustomData) {
        let textPath = PcPortalUtil.getContentPath(eventCustomData.option, "file:///");
        if (textPath == null) {
            PcPortalUtil.actionError("invalid ID setting[" + eventCustomData.option + "]");
            return;
        }
        ExecUtil.exec(commandObject.editor + ' "' + textPath + '"');
    }

    // 通知領域を読み込む
    readNotice() {

        // コンテンツを取得し、行単位で分割
        let displayArea = document.getElementById("item_notice");
        let textContent = PcPortalUtil.getContent("content_001");
        if (textContent == null) {
            PcPortalUtil.actionError("invalid ID setting[content_001]");
            return;
        }
        let displayContent = textContent;

        // 高さの設定と表示
        let customHeight = this.configManager.customNoticeHeight;
        this._readSub(displayArea, displayContent, customHeight);
    }

    // スケジュール領域を読み込む
    readSchedule() {

        // コンテンツを取得し、行単位で分割
        let displayArea = document.getElementById("item_schedule");
        let textContent = PcPortalUtil.getContent("content_002");
        if (textContent == null) {
            PcPortalUtil.actionError("invalid ID setting[content_002]");
            return;
        }
        let textContentArray = textContent.split(/\r\n|\r|\n/);

        // 日付要素
        let nowDate = new Date();
        let nowInt = parseInt(String(nowDate.getFullYear())
            + paddingZero2(nowDate.getMonth() + 1)
            + paddingZero2(nowDate.getDate()) + "000000");

        let endDate = nowDate;
        endDate.setDate(nowDate.getDate() + parseInt(this.configManager.customScheduleDisplayTerm));
        let endInt = parseInt(String(endDate.getFullYear())
            + paddingZero2(endDate.getMonth() + 1)
            + paddingZero2(endDate.getDate()) + "000000");

        // 表示文字列生成
        let displayContent = "";
        textContentArray.forEach((element, index) => {
            let date = element.substr(0, "yyyyMMddHHddss".length);
            let item = element.substr("yyyyMMddHHddss=".length);
            let dateInt = parseInt(date);

            // 表示判定
            let isDisplay = true;
            if (isNaN(dateInt)) {
                isDisplay = false;
            } else if (dateInt < nowInt) {
                // 現在日より未来の項目を表示
                isDisplay = false;
            } else {
                // 表示期間が設定されている場合は、その期間内のもの
                if (-1 < this.configManager.customScheduleDisplayTerm && endInt < dateInt) {
                    isDisplay = false;
                }
            }

            if (isDisplay) {
                displayContent = displayContent + formatDate(date) + " " + item + "<br>";
            }
        });

        // 高さの設定と表示
        let customHeight = this.configManager.customScheduleHeight;
        this._readSub(displayArea, displayContent, customHeight);
    }

    // タスク領域を読み込む
    readTask() {

        // コンテンツを取得し、行単位で分割
        let displayArea = document.getElementById("item_task");
        let textContent = PcPortalUtil.getContent("content_003");
        if (textContent == null) {
            PcPortalUtil.actionError("invalid ID setting[content_003]");
            return;
        }
        let textContentArray = textContent.split(/\r\n|\r|\n/);

        // Cookieの取得
        let cookieMap = readCookie();

        // チェックボックスの生成
        let displayContent = "";
        let taskidArray = new Array();
        textContentArray.forEach((element, index) => {
            let taskid = element.substr(0, "nnnn".length);
            let item = element.substr("nnnn=".length);

            if (taskid != "") {
                let id = "task_" + taskid;
                taskidArray.push(id);

                // チェック有無の判定
                let isCheck = "";
                if (this.configManager.customTaskCheckedSet.has(id)) {
                    isCheck = "checked";
                }

                // チェック済の項目を非表示にする設定の場合は、表示対象外
                if (this.configManager.customTaskDisplayChecked || isCheck == "") {
                    displayContent = displayContent
                        + "<input type='checkbox' id='" + id + "' value='" + id + "'" + isCheck + ">" + item + "<br>";
                }
            }
        });

        // 高さの設定と表示
        let customHeight = this.configManager.customTaskHeight;
        this._readSub(displayArea, displayContent, customHeight);

        taskidArray.forEach((value, index) => {
            // テーブル上のチェックボックス：カラムの表示/非表示
            let element = document.getElementById(value);
            if (element != null) {
                element.addEventListener("change", {
                    viewControl: this.viewControl,
                    configManager: this.configManager,
                    statusManager: this.statusManager,
                    handleEvent: this.checkTask
                });
            }
        });
    }

    _readSub(displayArea, displayContent, customHeight) {
        const customHeightMin = 20;
        if (customHeight == 0) {
            displayArea.style.display = "none";
        } else if (customHeight < 0) {
            displayArea.style.display = "block";
            displayArea.style.height = "100%";
            displayArea.innerHTML = displayContent;
        } else if (customHeightMin < customHeight) {
            displayArea.style.display = "block";
            displayArea.style.height = customHeight + "px";
            displayArea.innerHTML = displayContent;
        } else {
            displayArea.style.display = "block";
            displayArea.style.height = String(customHeightMin) + "px";
            displayArea.innerHTML = displayContent;
        }
    }

    // イベント：タスクのチェック時
    checkTask(e) {
        if (e.target.checked) {
            this.configManager.customTaskCheckedSet.add(e.target.id);
        } else {
            this.configManager.customTaskCheckedSet.delete(e.target.id);
        }
        this.configManager.save();
    }
}

class FileOpenAreaControl extends AreaControl {
/*
    viewControl;
    configManager;
    stateManager;
    partsPolicyArray;
    dialogAreaControl;
*/
    constructor(viewControl, configManager, stateManager) {
        super(viewControl, configManager, stateManager);
        this.viewControl = viewControl;
        this.configManager = configManager;
        this.stateManager = stateManager;

        this.dialogAreaControl = new DialogAreaControl();

        this.partsPolicyArray =[
            // ファイル：ファイルを開く
            new PartsPolicy(configManager, stateManager,
                "fileSelect", Const.PARTS_TEXT, null,
                null, null,
                this.dialogAreaControl, this.showDialogFromSelect),
        ];
    }

    // ファイル選択したドキュメントを疑似ダイアログで開く
    showDialogFromSelect(e, eventCuntomData) {
        if (e.target.files.length < 1) {
            return;
        }
        let file = e.target.files[0];
        let reader = new FileReader();
        reader.onload = () => {
            eventCuntomData.option.showDialogCommon(reader.result, "plain");
        };
        reader.readAsText(file);
    }
}


class ContentsAreaControl extends AreaControl {
/*
    viewControl;
    configManager;
    stateManager;
    partsPolicyArray;
    dialogAreaControl;
*/
    constructor(viewControl, configManager, stateManager) {
        super(viewControl, configManager, stateManager);
        this.viewControl = viewControl;
        this.configManager = configManager;
        this.stateManager = stateManager;

        this.dialogAreaControl = new DialogAreaControl();

        this.partsPolicyArray =[
        ];
    }

    display() {
        super.display();

        // 表示対象コンテンツグループの生成
        let triggerColumnGroup = document.querySelectorAll(".item_content_group");
            triggerColumnGroup.forEach(element => {
            let id = element.id;
            let contentObjectGroup = PcPortalUtil.getContentObjectGroup(id);
            if (contentObjectGroup == null) {
                PcPortalUtil.actionError("invalid GROUP ID setting[" + id + "]");
                return;
            }
            if (contentObjectGroup.element.length < 1) {
                document.getElementById(id).remove();
                return;
            }
            let elementChildHtml = "";
            contentObjectGroup.element.forEach(elementChild => {
                elementChildHtml += 
                    '<div class="item_content_title item_content" id="' + elementChild + '"></div>';
            });
            let elementHtml =
                '<div class="item_group_title">' + contentObjectGroup.label + '</div>' +
                '<div class="area_content_frame">' +
                elementChildHtml +
                '</div>' +
                '</div>';
            element.innerHTML = elementHtml;
        });

        // 表示対象コンテンツの生成
        let triggerColumn = document.querySelectorAll(".item_content");
        triggerColumn.forEach(element => {
            let id = element.id;
            let idFolder = "item_content_folder_" + element.id;
            let idEdit = "item_content_edit_" + element.id;
            let idWindow = "item_content_window_" + element.id;
            let idContent = "item_content_content_" + element.id;
            let contentObject = PcPortalUtil.getContentObject(id);
            if (contentObject == null) {
                PcPortalUtil.actionError("invalid ID setting[" + id + "]");
                return;
            }
            let label = contentObject.label;

            // 要素の表示
            let elementHtmlStyle = 'style="margin-left: 2px;margin-right: 2px;"';
            let elementHtml =
                '<img ' + elementHtmlStyle + ' id="' + idFolder + '" title="フォルダを開く" src="./resources/images/icon_folder_16.png">' +
                '<img ' + elementHtmlStyle + ' id="' + idEdit + '" title="編集" src="./resources/images/icon_edit_16.png">' +
                '<img ' + elementHtmlStyle + ' id="' + idWindow + '" title="別ウィンドウで開く" src="./resources/images/icon_window_16.png">' +
                '<a   id="' + idContent + '" href="javascript:void(0);">' + label + '</a>';
            element.innerHTML = elementHtml;

            // イベントの登録
            document.getElementById(idFolder).addEventListener("click", {
                option: id, control: this, handleEvent: this.openContentsFolder
            });
            document.getElementById(idEdit).addEventListener("click", {
                option: id, control: this, handleEvent: this.editContents
            });
            document.getElementById(idWindow).addEventListener("click", {
                option: id, control: this, handleEvent: this.openContentsWindow
            });
            document.getElementById(idContent).addEventListener("click", {
                option: id, control: this, handleEvent: this.showDialog
            });
        });
    }

    // ドキュメントのフォルダを開く
    openContentsFolder(e) {
        let textPath = PcPortalUtil.getContentPath(this.option, "file:///");
        if (textPath == null) {
            PcPortalUtil.actionError("invalid ID setting[" + this.option + "]");
            return;
        }
        ExecUtil.exec(commandObject.explorer + ' "' + sliceDirectory(textPath) + '"');
    }

    // ドキュメントを編集する
    editContents(e) {
        let textPath = PcPortalUtil.getContentPath(this.option, "file:///");
        if (textPath == null) {
            PcPortalUtil.actionError("invalid ID setting[" + this.option + "]");
            return;
        }
        ExecUtil.exec(commandObject.editor + ' "' + textPath + '"');
    }

    // ドキュメントを別ウィンドウで開く
    openContentsWindow(e) {
        let textPath = PcPortalUtil.getContentPath(this.option, null);
        if (textPath == null) {
            PcPortalUtil.actionError("invalid ID setting[" + this.option + "]");
            return;
        }
        window.open(textPath, contentObjectMap.get(this.option).label);
    }

    // ドキュメントを疑似ダイアログで開く
    showDialog(e) {
        let textPath = PcPortalUtil.getContentPath(this.option, null);
        if (textPath == null) {
            PcPortalUtil.actionError("invalid ID setting[" + this.option + "]");
            return;
        }
        let contentObjectType = contentObjectMap.get(this.option).type;

        // コンテンツの種類、テキスト、HTML、マークダウンを拡張子で識別
        let textType = null;
        if (contentObjectType != "auto") {
            textType = contentObjectType;
        } else {
            let ext = textPath.slice((textPath.lastIndexOf('.') - 1 >>> 0) + 2);
            if (ext == "txt") {
                textType = "plain";
            } else if (ext == "htm" || ext == "html") {
                textType = "html";
            } else if (ext == "md") {
                textType = "markdown";
            } else {
                textType = "plain";
            }
        }

        // 表示内容の取得
        let textContent = PcPortalUtil.getContent(this.option);
        if (textContent == null) {
            PcPortalUtil.actionError("invalid ID setting[" + this.option + "]");
            return;
        }

        this.control.dialogAreaControl.showDialogCommon(textContent, textType);
    }
}

class DialogAreaControl {

    // 疑似ダイアログを閉じる
    hideDialog(e) {
        let backTarget = document.getElementById("area_dialog_back");
        backTarget.style.visibility = "hidden";
        let dialogArea = document.getElementById("area_dialog");
        dialogArea.style.visibility = "hidden";
    }

    // ドキュメントを疑似ダイアログで開く
    showDialogCommon(textContent, textType) {
        // ダイアログのサイズと位置
        let dialogArea = document.getElementById("area_dialog");
        let da_w = Math.floor((window.innerWidth / 10) * 8);
        let da_h = Math.floor((window.innerHeight / 10) * 8);
        let da_x = Math.floor((window.innerWidth - da_w) / 2) + document.documentElement.scrollLeft;
        let da_y = Math.floor((window.innerHeight - da_h) / 2) + document.documentElement.scrollTop;
        dialogArea.style.width = da_w + "px";
        dialogArea.style.height = da_h + "px";
        dialogArea.style.left = da_x + "px";
        dialogArea.style.top = da_y + "px";
        let dc_w = da_w - 20;
        let dc_h = da_h - 80;

        // 表示内容のカスタム要素
        // 文字サイズ
        dialogArea.style.fontSize = customDialogFontSize;
        let content = null;
        if (textType == "plain") {
            content = "<pre>" + textContent + "</pre>";
        } else if (textType == "html") {
            content = textContent;
        } else if (textType == "markdown") {
            content = marked(textContent);
        } else {
            content = "<pre>" + textContent + "</pre>";
        }

        // ダイアログのソース
        dialogArea.innerHTML =
            "<html><body>"
            + "<div class='area_dialog_frame'>"
            + "  <div class='item_dialog_frame_content' style='width:" + dc_w + "px; height:" + dc_h + "px;'>"
            + content
            + "  </div>"
            + "  <hr>"
            + "    <div class='item_dialog_button'>"
            + "      <a href='#' id='button_dialog_close' class='button_dialog_button'>CLOSE</a>"
            + "    </div>"
            + "  </div>"
            + "</body></html>";

        // ダイアログ背景
        let backTarget = document.getElementById("area_dialog_back");
        backTarget.style.visibility = "visible";

        dialogArea.style.visibility = "visible";

        // イベント登録
        document.getElementById("button_dialog_close").addEventListener("click", {
            handleEvent: this.hideDialog
        });
    }
}



/**********
 * 設定クラス
 **********/

class ConfigManager {
/*
    // 保存時のキー、表コードとする
    key;

    // ダイアログの文字
    customDialogFontSize;
    // 通知領域の高さ(px)
    customNoticeHeight;
    // スケジュール領域の高さ(px)
    customScheduleHeight;
    // タスク領域の高さ(px)
    customTaskHeight;
    // スケジュールの表示期間(日)
    customScheduleDisplayTerm;
    // タスクのチェック状態クリア
    customTaskCheckClear;
    // タスクのチェック項目を表示
    customTaskDisplayChecked;
    // タスクのチェック有無
    customTaskCheckedSet;
    customTaskCheckedSetArray;
*/
    constructor() {
        this.key = "PC_PORTAL";

        this.customDialogFontSize = "medium";
        this.customNoticeHeight = -1;
        this.customScheduleHeight = -1;
        this.customTaskHeight = -1;
        this.customScheduleDisplayTerm = 360;
        this.customTaskCheckClear = "";
        this.customTaskDisplayChecked = true;
        this.customTaskCheckedSet = new Set();
    }

    save() {
        this.customTaskCheckedSetArray = Array.from(this.customTaskCheckedSet);

        // ローカルストレージにJSON形式で保存
        let saveString = JSON.stringify(this);
        localStorage.setItem(this.key, saveString);
    }

    load() {
        // JSON形式の保存情報をローカルストレージから取得
        let loadString = localStorage.getItem(this.key);
        if (loadString == null) {
            return;
        }
        let loadObject = JSON.parse(loadString);

        // 保存情報をオブジェクトに戻す
        this.customDialogFontSize      = loadObject.customDialogFontSize;
        this.customNoticeHeight        = loadObject.customNoticeHeight;
        this.customScheduleHeight      = loadObject.customScheduleHeight;
        this.customTaskHeight          = loadObject.customTaskHeight;
        this.customScheduleDisplayTerm = loadObject.customScheduleDisplayTerm;
        this.customTaskCheckClear      = loadObject.customTaskCheckClear;
        this.customTaskDisplayChecked  = loadObject.customTaskDisplayChecked;

        if (loadObject.customTaskCheckedSetArray != null &&
            loadObject.customTaskCheckedSetArray != undefined) {
            loadObject.customTaskCheckedSetArray.forEach((value) => {
                this.customTaskCheckedSet.add(value);
            });
        }
    }
}


//******************************************************************************
//ユーティリティ

    // 2桁のゼロパディング
    function paddingZero2(value) {
      return ("00" + String(value)).slice(-2);
    }

    // パスよりディレクトリを取得
    function sliceDirectory(path) {
      return path.substr(0, path.lastIndexOf("\\"));
    }

    // 日付のフォーマット、yyyy/MM/dd HH:MM:ss
    function formatDate(num) {
      var value = String(num);
      var year = value.substr(0, 4);
      var month = value.substr(4, 2);
      var day = value.substr(6, 2);
      var hour = value.substr(8, 2);
      var minute = value.substr(10, 2);
      var second = value.substr(12, 2);
      return String(year) + "/" + String(month) + "/" + String(day) + " " + String(hour) + ":" + String(minute) + ":" + String(second);
    }

    // Cookieを読み込んで連想配列に格納
    function readCookie() {
      var cookies = document.cookie;
      var cookieSplit = cookies.split(/;/);
      var cookieMap = {};
      cookieSplit.forEach((element, index) => {
          var position = element.indexOf("=");
          if (position != -1) {
              var key = element.substr(0, position).trim();
              var value = element.substr(position + 1);
              cookieMap[key] = value;
          }
      });
      return cookieMap;
    }


class PcPortalUtil {
    static getContentObjectGroup(id) {
        let contentObjectGroup = contentObjectGroupMap.get(id);
        if (contentObjectGroup == undefined) {
            return null;
        }
        return contentObjectGroup;
    }

    static getContentObject(id) {
        let contentObject = contentObjectMap.get(id);
        if (contentObject == undefined) {
            return null;
        }
        return contentObject;
    }

    static getContentPath(id, prefix) {
        let textPath = null;
        let contentObject = PcPortalUtil.getContentObject(id);
        if (contentObject == null) {
            return null;
        }
        if (contentObject.pathAbs) {
            textPath = contentObject.path;
        } else {
            textPath = dataPath + "\\" + contentObject.path;
        }

        // prefixを指定している場合は除去
        if (prefix != null && textPath.startsWith(prefix)) {
            textPath = textPath.substr(prefix.length);
        }
        return textPath;
    }

    // ダイアログコンテンツの取得
    static getContent(id) {
        let contentObject = PcPortalUtil.getContentObject(id);
        if (contentObject == null) {
            return null;
        }

        try {
            let path;
            if (contentObject.pathAbs) {
                path = contentObject.path;
            } else {
                path = dataPath + "\\" + contentObject.path;
            }
            let content = FileUtil.readFile(path);
            return content;
        } catch (e) {
            return null;
        }
    }

    static actionError(message) {
        alert(message);
    }
}

class NumberUtil {
    // 数値チェック
    static isNumber(value) {
        return value != null && isFinite(value);
    }

    // 0以上の正の整数チェック
    static isNumberNaturalInteger(value) {
        if (!NumberUtil.isNumber(value)) {
            return false;
        }
        let valueNum = value - 0;
        if (!Number.isInteger(valueNum)) {
            return false;
        }
        if (valueNum < 0) {
            return false;
        }
        return true;
    }

    // 1以上の正の整数チェック
    static isNumberPositiveInteger(value) {
        if (!NumberUtil.isNumber(value)) {
            return false;
        }
        let valueNum = value - 0;
        if (!Number.isInteger(valueNum)) {
            return false;
        }
        if (valueNum < 1) {
            return false;
        }
        return true;
    }
}
