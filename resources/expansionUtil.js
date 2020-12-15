
class FileUtil {

    static readFile(path) {
        const fs = require('fs');
        try {
            const content = fs.readFileSync(path);
            return content.toString();
        } catch (e) { 
            throw e;
        }
    }

    //fileを保存（パスと内容を指定）
    static writeFile(path, data) {
        fs.writeFile(path, data, (error) => {
            if (error != null) {
                alert("save error.");
                return;
            }
        })
    }
}

class ExecUtil {

    static exec(command, params) {
        const exec = require('child_process');
        exec.exec(command, params,
            function(e, stdout, stderr) {
                // エクスプローラのexitコードは1でも正常なので除外
                if (command.startsWith("explorer") && e.code == 1) {
                    return;
                }
                if (e) {
                    throw e;
                }
            }
        );
    }
}
