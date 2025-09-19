class HighlightContent extends EventTarget {
  // private variables
  #quill = null;
  #lastFound = { index: -1, key: "" };

  constructor(targetSelector, placeholder, {
              titleSelector = '',
              enableCtrlS = false,
              enableDragDrop = false,
            }) {
    super();

    const $title = $(titleSelector);
    this.#quill = new Quill(targetSelector, {
      placeholder: placeholder,
      theme: 'bubble',
    });
    let _currentFileName = 'default_check.txt';

    // quill event - 監聽焦點 進入/離開 事件
    this.#quill.on('selection-change', (range, oldRange, source) => {
      if (oldRange === null && range !== null) {
        // 進入焦點事件
      }
      else if (oldRange !== null && range === null) {
        // 離開焦點事件
        // 觸發 leave event
        this.dispatchEvent(new CustomEvent('leave'));
      }
    });

    // quill event - text-change
    this.#quill.on('text-change', (delta, oldDelta, source) => {
      if (source === 'user') {
        $title?.addClass('has-star');
      }
    });

    // DOM event - keydown
    $(this.#quill.root).on('keydown', (e) => {
      const text = this.getText();
      if (!text) return;
      const cursor = this.getCursorPos();
      if (cursor < 0 || cursor === null) return;

      // Shift + F3：找上一個
      if ((e.key === 'F3' || e.keyCode === 114) && e.shiftKey) {
        e.preventDefault();
        // 觸發 find-previous event
        this.dispatchEvent(new CustomEvent('find-previous', {
          detail: { text: text, cursor: cursor }
        }));
        return;
      }

      // F3：找下一個（不重頭）
      if (e.key === 'F3' || e.keyCode === 114) {
        e.preventDefault();
        // 觸發 find-next event
        this.dispatchEvent(new CustomEvent('find-next', {
          detail: { text: text, cursor: cursor }
        }));
        return;
      }

      // F4：以 value 取代目前反白選取的 key
      if (e.key === 'F4') {
        e.preventDefault();
        if (this.#lastFound.index === -1) return;
        // 觸發 correct-text event
        this.dispatchEvent(new CustomEvent('correct-text', {
          detail: { found: this.#lastFound }
        }));
        return;
      }
    });

    if (enableCtrlS) {
      // DOM event - keydown
      $(this.#quill.root).on('keydown', (e) => {
        // ctrl + s
        if ((e.key === 'S' || e.key === 's') && e.ctrlKey) {
          e.preventDefault();
          const textContent = this.getText();
          const blob = new Blob([textContent], { type: 'text/plain' });
          // 創建一個下載連結
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');

          // 設定下載連結的屬性
          a.href = url;
          // 使用原始檔案名稱來命名
          a.download = _currentFileName;

          // 模擬點擊，觸發下載
          document.body.appendChild(a);
          a.click();

          // 清理暫時的 URL 物件和 DOM 元素
          document.body.removeChild(a);
          URL.revokeObjectURL(url);

          // update title
          $title?.removeClass('has-star');
          return;
        }
      });
    }

    if (enableDragDrop) {
      // DOM event - drag-drop
      $(this.#quill.root).on({
        'dragover dragenter': (e) => {
          e.preventDefault();
          e.stopPropagation();
          $(this.#quill.root).addClass('drag-hover');
        },
        'dragleave drop': (e) => {
          e.preventDefault();
          e.stopPropagation();
          $(this.#quill.root).removeClass('drag-hover');
        },
        'drop': (e) => {
          var files = e.originalEvent.dataTransfer.files;
          if (files.length > 0) {
            var file = files[0];
            var reader = new FileReader();
            reader.onload = (event) => {
              var fileContent = event.target.result;
              this.setText(fileContent);

              // 儲存檔案名稱
              _currentFileName = file.name;
            };
            reader.readAsText(file);
          }
        }
      });
    }
  }

  on(eventName, callback) { this.addEventListener(eventName, callback);}

  getLastFound() { return this.#lastFound; }

  getText() { return this.#quill.getText(); }

  setText(text) { this.#quill.setText(text); }

  appendText(text) { this.#quill.insertText(this.#quill.getLength(), text); }

  getCursorPos() {
    let range = this.#quill.getSelection();
    return range ? range.index : null;
  }

  setCursorPos(index) { this.#quill.setSelection(index); }

  replaceText(startIndex, oldText, newText) {
    const Delta = Quill.import('delta');

    // 清除高亮
    this.clearHighlight();

    // 執行取代
    this.#quill.updateContents(new Delta()
      .retain(startIndex)
      .delete(oldText.length)
      .insert(newText)
    );

    // 重新設定選取範圍在新文字上
    this.highlightText(newText, startIndex);
  }

  clearHighlight() {
    this.#quill.removeFormat(this.#lastFound.index, this.#lastFound.key.length);
    this.#lastFound = { index: -1, key: "" };
  }

  highlightText(key, index = -1) {
    // 清除highlight
    this.clearHighlight();
    if (!key) return;

    let idx = index;
    if (index === -1) {
      const text = this.#quill.getText();
      idx = text.indexOf(key);
      if (idx === -1) return;
    }

    // 著色
    this.#quill.formatText(idx, key.length, {
      background: '#007bff'
    });

    // 滾動到idx可見的位置
    const bounds = this.#quill.getBounds(idx);
    const newScrollTop = bounds.top + this.#quill.root.scrollTop;
    this.#quill.root.scrollTop = newScrollTop;

    // 紀錄highlight位置
    this.#lastFound = { index: idx, key: key };
  }
}