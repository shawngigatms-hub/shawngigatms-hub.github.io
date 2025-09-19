class RulesNote {
    constructor() {
        /** @type {Map<string, { value: string, category: '正確字詞'|'取代字詞' }>} */
        this.rulesMap = new Map();
        this.ruleContent = '';
    }

    getCorrectText(key) {
        const mapValue = this.rulesMap.get(key);
        if (!mapValue) return key;
        const text = (mapValue.category != '正確字詞') ? (mapValue.value || '') : key;
        return text;
    }

    loadRule(ruleText) {
        this.rulesMap.clear();
        this.ruleContent = ruleText;

        let currentCategory = null; // '正確字詞' | '取代字詞' | null
        const lines = (ruleText || '').split(/\r?\n/);
        for (let i = 0; i < lines.length; i++) {
            let line = lines[i];
            if (!line) continue;
            line = line.trim();
            if (!line) continue;

            // 1) 若首字元為單引號(') 略過
            if (line.charAt(0) === "'") continue;

            // 2) 若首字元為 '['
            if (line.charAt(0) === '[') {
                if (line.indexOf('[correct]') === 0) {
                    currentCategory = '正確字詞';
                } else {
                    currentCategory = '取代字詞';
                }
                continue; // 下一列
            }

            // 3) 其他列：根據目前類型分割並建字典
            //    僅保留前兩個非空 token：第一個為 key，第二個為 value（可省略）
            const tokens = line.split('=').filter(function (t) { return t !== ''; });
            if (tokens.length < 1) continue; // 至少需要 key
            const key = tokens[0];
            const value = tokens.length >= 2 ? tokens[1] : '';
            if (!key) continue;

            if (!currentCategory) {
                // 若尚未遇到任何類別標記，預設視為 '取代字詞'
                currentCategory = '取代字詞';
            }

            this.rulesMap.set(key, { value: value, category: currentCategory });
        }
    }

    findNextKeyOccurrence(text, startIndex) {
        let scanStart = Math.max(0, startIndex || 0);
        while (scanStart <= text.length) {
            let bestIdx = -1;
            let bestKey = '';
            let category = '';
            this.rulesMap.forEach((value, key) => {
                const idx = text.indexOf(key, scanStart);
                if (idx !== -1 && (bestIdx === -1 || idx < bestIdx)) {
                    bestIdx = idx;
                    bestKey = key;
                    category = value.category;
                }
            });

            // 沒找到
            if (bestIdx === -1) return { index: -1, key: '' };

            // 略過『正確字詞』
            if (category === '正確字詞') {
                scanStart = bestIdx + bestKey.length;
                continue; // 繼續往後找下一個
            }
            return { index: bestIdx, key: bestKey };
        }
        return { index: -1, key: '' };
    }

    findPrevKeyOccurrence(text, startIndex) {
        let scanEnd = Math.min(text.length, (startIndex != null ? startIndex : text.length));
        while (scanEnd >= 0) {
            let bestIdx = -1;
            let bestKey = '';
            let category = '';
            this.rulesMap.forEach((value, key) => {
                const idx = text.lastIndexOf(key, scanEnd - 1);
                if (idx !== -1 && (bestIdx === -1 || idx > bestIdx)) {
                    bestIdx = idx;
                    bestKey = key;
                    category = value.category;
                }
            });

            // 沒找到
            if (bestIdx === -1) return { index: -1, key: '' };

            // 略過『正確字詞』
            if (category === '正確字詞') {
                scanEnd = bestIdx;
                continue; // 繼續往前找上一個
            }
            return { index: bestIdx, key: bestKey };
        }
        return { index: -1, key: '' };
    }
}