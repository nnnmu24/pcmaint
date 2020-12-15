
/**********
 * 画面制御クラス
 **********/

//Log.level = Log.ERROR;
//const Const = new ConstClass();
const fs = require('fs');

    // 初期処理
    function initPcmaint() {
        // Electron用の初期処理
        initElectron();

        let viewControl = new PcmaintViewControl();
        viewControl.init();
    }

// クラス：画面制御（全体の処理）
class PcmaintViewControl {
/*
    contentsAreaControl;
*/
    init() {
        // 定数定義
//        Object.freeze(Const);

        // 各エリア制御オブジェクトの生成
        this.infoNoticeAreaControl = new PcmaintInfoNoticeAreaControl(this, this.configManager, this.stateManager);

        // 各エリアの表示
        this.infoNoticeAreaControl.display();

        // 各エリアのイベント登録
        this.infoNoticeAreaControl.registEvent();
    }
}

// 情報通知領域
class PcmaintInfoNoticeAreaControl extends AreaControl {
/*
    viewControl;
    configManager;
    stateManager;
    partsPolicyArray;
    detailHiddenSet;
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
        ];

        this.detailHiddenSet = new Set();
    }

    display() {
        super.display();
        this.readNotice();
    }

    // 通知領域を読み込む
    readNotice() {
        this._parseAndDisplayReport("area_report_bkup", "report_bkup.txt", "バックアップ(データ)");
        this._parseAndDisplayReport("area_report_bwch", "report_bwch.txt", "ブラウザキャッシュ");
        this._parseAndDisplayReport("area_report_chst", "report_chst.txt", "スタートアップ");
        this._parseAndDisplayReport("area_report_evlg_sys", "report_evlg_sys.txt", "イベント(システム)");
        this._parseAndDisplayReport("area_report_evlg_sec", "report_evlg_sec.txt", "イベント(セキュリティ)");
        this._parseAndDisplayReport("area_report_evlg_def", "report_evlg_def.txt", "イベント(WinDefender)");
        this.detailHiddenSet.add("initialized");
    }

    eventDetail(e) {
        let elementDetail = document.getElementById(this.elementName);
        if (this.detailHiddenSet.has(this.elementName)) {
            elementDetail.style.visibility = "hidden";
            this.detailHiddenSet.delete(this.elementName);
        } else {
            elementDetail.style.visibility = "visible";
            this.detailHiddenSet.add(this.elementName);
        }
        this.control.readNotice();
    }

    _parseAndDisplayReport(id, path, title) {
        const basePath = dataPath;
        let noticeObject = new Object();
        noticeObject.head = "";
        noticeObject.report = new Array();

        // レポートファイル
        let lines = null
        try {
            lines = fs.readFileSync(basePath + "\\" + path, "utf8").split("\n");
        } catch (e) {
        }

        if (lines != null) {
            // 先頭が[HEAD]→結果をnoticeObject.result、日付をnoticeObject.dateへ
            // 先頭が[REPORT]→noticeObject.reportへ
            lines.forEach((linestr, index) => {
                if (linestr.startsWith("[HEAD]")) {
                    let head = linestr.substring("[HEAD]".length);
                    let headArray = head.split(",");
                    if (headArray.length < 2) {
                        noticeObject.result = "取得失敗";
                        noticeObject.date = "";
                    } else {
                        noticeObject.result = headArray[1].trim();
                        noticeObject.date = headArray[0];
                    }
                } else if (linestr.startsWith("[REPORT][NOTICE!]")) {
                    noticeObject.report.push(linestr.substring("[REPORT][NOTICE!]".length));
                } else if (linestr.startsWith("[REPORT]")) {
                    noticeObject.report.push(linestr.substring("[REPORT]".length));
                }
            });
        } else {
            noticeObject.result = "未実施";
            noticeObject.date = "";
        }

        let textContentResult = "";
        let textContentDate = "";
        let textContentDetail = null;
        try {
            // HEAD
            textContentResult = noticeObject.result;
            textContentDate = noticeObject.date;

            //DETAIL
            if (noticeObject.report != null && 0 < noticeObject.report.length) {
                textContentDetail = "";
                noticeObject.report.forEach((v, index) => {
                    textContentDetail = textContentDetail + v + "<br>";
                });
            }
        } catch (e) {
        }

        // 結果によるスタイルの変更
        let colorFont = "#130377";
        let colorBack = "#dadaeb";
        let colorBorder = "#130377";
        if (textContentResult != "未実施" &&
            textContentResult != "成功" &&
            textContentResult != "異常なし") {
            colorFont = "#fdf6e6";
            colorBack = "#e3393d";
            colorBorder = "#000000";
        }

        // ダッシュボード表示
        let idDetail = "td_" + id;
        let areaWidth = "97%";
        let tdDetail = '<td rowspan="4" id="' + idDetail + '" class="item_report_detail" style="background-color:' + colorFont + '; color:' + colorBack + ';">' + textContentDetail + '</td>';
        if (textContentDetail == null || this.detailHiddenSet.has(idDetail)) {
            tdDetail = '<td rowspan="4" id="' + idDetail + '"></td>';
            areaWidth = "150px";
        }
        let textContent =
            '  <table>'
            + '    <tr>'
            + '      <td><span class="item_report_title" style="color:' + colorFont + ';">' + title + '</span></td>'
            + tdDetail
            + '    </tr>'
            + '    <tr>'
            + '      <td><div class="item_report_result" style="color:' + colorFont + ';">' + textContentResult + '</div></td>'
            + '    </tr>'
            + '    <tr>'
            + '      <td><div class="item_report_date" style="color:' + colorFont + ';">' + textContentDate + '</div></td>'
            + '    </tr>'
            + '    <tr style="height: 100%;">'
            + '      <td></td>'
            + '    </tr>'
            + '  </table>';
        let element = document.getElementById(id);
        element.innerHTML = textContent;
        element.style.width = areaWidth;
        element.style.color = colorFont;
        element.style.backgroundColor = colorBack;
        element.style.borderColor = colorBorder;

        // 詳細の表示、非表示のイベント
        if (textContentDetail != null) {
            // 最初の一回だけ
            if (!this.detailHiddenSet.has("initialized")) {
                element.addEventListener('click', {
                    control: this,
                    detailHiddenSet: this.detailHiddenSet,
                    elementName: idDetail,
                    handleEvent: this.eventDetail,
                });
            }
        }
    }
}
