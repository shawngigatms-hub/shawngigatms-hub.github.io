class SrtTable extends EventTarget {
    // private variables
    #table = null;

    constructor(selector) {
        super();

        this.#table = new Handsontable($(selector)[0], {
            themeName: 'ht-theme-main',
            // other options
            colHeaders: ['Name', 'Start Time', 'Text', 'End Time', 'Text'],
            colWidths: [100, 100, 260, 100, 260],
            manualColumnResize: true,
            rowHeaders: true,
            autoWrapRow: true,
            autoWrapCol: true,
            contextMenu: true,
            outsideClickDeselects: false,
            height: '100%',
            width: '100%',
            licenseKey: 'non-commercial-and-evaluation',
            afterSelectionEnd: (startRow) => this.#invokeSlectionChange(startRow),
        });
    }

    loadUsers(nameList) {
        // 遍歷 nameList，並將其與 existingData 結合
        let updatedData = [];
        let existingData = this.#table.getData();
        for (let i = 0; i < nameList.length; i++) {
            // 檢查 existingData 是否有對應的列
            if (existingData[i]) {
                // 如果有，就更新該列的第一個元素
                let row = [...existingData[i]]; // 複製現有的列，避免直接修改
                row[0] = nameList[i];
                updatedData.push(row);
            } else {
                // 如果沒有，就新增一個新的列
                // 表格有5個欄位
                let newRow = [nameList[i], '', '', '', ''];
                updatedData.push(newRow);
            }
        }
        updatedData.push(['', '', '', '', '']); // 多一空白列
        this.#table.loadData(updatedData);
    }

    on(eventName, callback) { this.addEventListener(eventName, callback);}

    getSelectedRowIndex() {
        let rowIndex = -1;
        const selection = this.#table.getSelected();
        if (selection) {
            // getSelected() 回傳的格式是 [row_start, col_start, row_end, col_end]
            const [startRow, startCol, endRow, endCol] = selection[0];
            rowIndex = startRow;
        }
        return rowIndex;
    }

    getRowCount() { return this.#table.countRows(); }

    getColumnCount() { return this.#table.countCols(); }

    getRowData(rowIndex) { 
        function safeText(data) {
            if (data === null || data === undefined) {
                return '';
            }
            return String(data).trim();
        }

        if (typeof rowIndex !== 'number' || rowIndex < 0) return null;
        
        const rowData = this.#table.getDataAtRow(rowIndex);
        if (rowData === null || rowData === undefined) return null;

        return {
            rowIndex: rowIndex,
            name: safeText(rowData[0]),
            startTimeString: safeText(rowData[1]),
            startText: safeText(rowData[2]),
            endTimeString: safeText(rowData[3]),
            endText: safeText(rowData[4])
        };
    }

    setRowData(data) {
        let updatedData = [
            [data.rowIndex, 0, data.name],
            [data.rowIndex, 1, data.startTimeString],     // start time
            [data.rowIndex, 2, data.startText],           // start text
            [data.rowIndex, 3, data.endTimeString],       // end time
            [data.rowIndex, 4, data.endText]              // end text
        ];
        this.#table.setDataAtCell(updatedData);
    }

    selectRow(rowIndex) {
        if (rowIndex < this.getRowCount()) {
            this.#table.selectCells([[rowIndex, 0, rowIndex, this.getColumnCount() - 1]]);
            this.#invokeSlectionChange(rowIndex);
        }
    }

    #invokeSlectionChange(startRow) {
        // 觸發 selection-change event
        const rowData = this.getRowData(Math.max(startRow, 0));
        this.dispatchEvent(new CustomEvent('selection-change', {
            detail: rowData
        }));
    }
}