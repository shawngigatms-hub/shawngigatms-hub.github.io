const PROXIES = [
'https://r.jina.ai/http://',
'https://r.jina.ai/https://'
];

function getGoogleDocUrl(doc_id) {
    return `https://docs.google.com/document/d/${doc_id}`;
}

async function _fetchText(url) {
    return fetch(url, { credentials: 'omit' }).then(function (resp) {
        if (!resp.ok) throw new Error('HTTP ' + resp.status);
        return resp.text();
    });
}

async function updateGoogleDoc(doc_id, text) {
    const GAS_URL = `my_gas_url`;

    return fetch(GAS_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            doc_id: doc_id,
            text: text,
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP 錯誤: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        // 處理來自 Apps Script 的回傳訊息
        if (data.status === 'success') {
            return { success: true, error: '' };
        } else {
            return { success: false, error: data.message };
        }
    })
    .catch(err => {
        return { success: false, error: err.message };
    });
}

async function exportGoogleDoc(doc_id) {
    const DIRECT_URL = `${getGoogleDocUrl(doc_id)}/export?format=txt`;

    // 嘗試直連，失敗再走代理
    const targets = [DIRECT_URL]
        .concat(PROXIES.map(function (p) { return p + DIRECT_URL.replace(/^https?:\/\//, ''); }));

    for (let i = 0; i < targets.length; i++) {
        try {
            const isProxy = i > 0; // 第 0 個是直連，其餘為代理
            let text = await _fetchText(targets[i]);

            // 過濾內容
            text = (function filterText() {
                const lines = text.split(/\r?\n/);
                let startIndex = 0;
                if (isProxy) {
                    for (let j = 0; j < lines.length; j++) {
                        if (lines[j].trim() === 'Markdown Content:') { startIndex = j + 1; break; }
                    }
                }
                const filteredAry = lines
                    .slice(startIndex)
                    .map(function (l) { return (l || '').trim(); });                // 移除開頭和結尾的空白字元
                const filtered = removeConsecutiveBlanks(filteredAry).join('\n');   // 移除連續空白
                return filtered || '（規則文件為空）'
            })();

            return {success: true, text: text}; // 成功即結束
        } catch (err) {
            if (i === targets.length - 1) {
                return {success: false, text: 
                    '無法讀取規則文件。\n' +
                    '可能原因：文件未公開或瀏覽器的 CORS 限制。\n\n' +
                    '建議：\n' +
                    '1) 於 Google 文件：檔案 → 分享 → 發布到網路上（或設定任何知道連結者可檢視）。\n' +
                    '2) 使用公開匯出連結（txt）：\n' +
                    '   https://docs.google.com/document/d/<文件ID>/export?format=txt\n' +
                    '3) 或於程式中配置代理以繞過 CORS。\n\n' +
                    '最後錯誤：' + err.message};
            }
        }
    }
    return {success: false, text: '沒有提供URL'};
}

function removeConsecutiveBlanks(arr) {
  const result = [];
  let wasLastElementBlank = false;

  for (const item of arr) {
    // 檢查元素是否為空字串或只包含空白字元
    const isCurrentElementBlank = (typeof item === 'string' && item.trim() === '');
    
    // 如果當前元素不是空白，或者上一個元素也不是空白，則保留當前元素
    if (!isCurrentElementBlank || !wasLastElementBlank) {
      result.push(item);
    }
    
    // 更新標記，供下一個迴圈使用
    wasLastElementBlank = isCurrentElementBlank;
  }
  return result;
}

function downloadText(content, fullFileName) {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);

    // 創建一個下載連結元素
    const a = document.createElement('a');
    a.href = url;
    a.download = fullFileName;

    // 模擬點擊連結來觸發下載
    document.body.appendChild(a);
    a.click();

    // 下載完成後釋放資源
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}