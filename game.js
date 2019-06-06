/* global twemoji, alert, MouseEvent, game */
const numbers = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣']
const iDevise = navigator.platform.match(/^iP/)
const feedback = document.querySelector('.feedback')
const emojiset = ['🔹', '💣', '🚩', '◻']
const serverurl = 'http://localhost:5000/mscore.aspx'


class Game {
    constructor (cols, rows, number_of_bombs, usetwemoji) {
        this.number_of_cells = cols * rows
        this.map = document.getElementById('map')
        this.cols = Number(cols)
        this.rows = Number(rows)
        this.number_of_bombs = Number(number_of_bombs)
        this.emojiset = emojiset
        this.numbermoji = [this.emojiset[0]].concat(numbers)
        this.usetwemoji = usetwemoji || false
        this.state = 0 // 0 for not prepared, 1 for normal, 2 for won, 3 for dead.
        this.update_timer = undefined
        this.is_updating = false
        this.time = 0
        this.moves = 0
        this.init()
    }

    cleanup = () => {
        clearInterval(this.update_timer)
    }

    transfer = (data, callback, ...callback_args) => {
        // outgoing data:
        // new row col mines (existing game can override this)
        // move row col
        // refresh
        // return data:
        // [x]x[y]_[mine]_[moves]_[time]_[state] grid1 grid2 grid3 ...
        if (this.is_updating) {
            console.log('A transfer event is aborted.')
            return
        }
        this.is_updating = true
        let http = new XMLHttpRequest()
        http.open('POST', serverurl, true)

        // We are sending plain text
        http.setRequestHeader('Content-type', 'text/plain')

        http.onreadystatechange = () => {
            if (http.readyState == 4 && http.status == 200) {
                // console.log(http.responseText)
                callback(http.responseText, ...callback_args)
                this.is_updating = false
            }
        }
        http.send(data)
    }

    decodeUpdateScreen = (response) => {
        if (response.length == this.number_of_cells) {
            switch (this.state) {
                case 2:
                    this.cleanup()
                    document.querySelector('.wrapper').classList.add('won')
                    let wemoji = '😎'
                    document.getElementById('result').innerHTML = this.usetwemoji ? twemoji.parse(wemoji) : wemoji
                    break
                case 3:
                    this.cleanup()
                    document.querySelector('.wrapper').classList.add('lost')
                    let lemoji = '😵'
                    document.getElementById('result').innerHTML = this.usetwemoji ? twemoji.parse(lemoji) : lemoji
                    break
                case 1:
                    break
                default:
                    console.log(`!! invalid state ${this.state}`)
                    return undefined
            }
            let scr_t = response
            let scr = new Array()
            for (let i of scr_t)
                scr.push(Number(i))
            this.screen = scr
            this.updateScreen()
        }
        else
            console.log(`!! bad response from server ${response}`)
    }

    sendMove = (row, col) => {
        if (this.state != 1) {
            console.log('state: ' + this.state)
            return
        }
        this.transfer(`move ${row} ${col}`, this.checkParams, `(${row}, ${col}) clicked`)
    }

    sendRefresh = () => {
        this.transfer('refresh', this.checkParams)
    }
    sendInit = () => {
        this.transfer(`new ${this.rows} ${this.cols} ${this.number_of_bombs}`, this.checkParams)
    }

    checkParams = (responseText, logmsg=false) => {
        try {
            if (responseText == 'NoGame') { document.querySelector('.js-new-game').click() }
            if (responseText == 'Failed') { console.log('server Fail'); return }
            let response = responseText.split(' ')
            if (logmsg)
                console.log(logmsg)
            let [row_col, mines, moves, time, state] = response[0].split('_')
            let [row, col] = row_col.split('x')
            if (this.rows == row && this.cols == col && this.number_of_bombs == mines) {
                this.time = Number(time)
                this.moves = Number(moves)
                document.getElementById('moves').textContent = this.moves
                let seconds = 0
                if (this.time == 0)
                    seconds = 0
                else
                    seconds = (new Date() / 1000 - this.time).toFixed(0)
                document.getElementById('timer').textContent = seconds
                this.state = Number(state)
                this.decodeUpdateScreen(response.slice(1))


            }
            else {
                if (row > 0 && col > 0 && row * col > mines) {
                    document.getElementById('rows').value = row
                    document.getElementById('cols').value = col
                    document.getElementById('bombs').value = mines
                    // restart game with proper parameters
                    console.log('Request board resize')
                    this.cleanup()
                    document.querySelector('.js-new-game').click()
                }
                else
                    console.log(`!! server reported invalid size ${[row, col, mines]}`)
            }
            // this.start_time = time
        } catch (err) {
            console.log(err)
            console.log('You may restart the game.')
        }
    }

    updateScreen = () => {
        // upopened = 9, opened = 0-8, flagged = 10, stepped = 11
        for (let n = 0; n < this.number_of_cells; n++) {
            let [row, col] = this.getRowCol(n)
            let btn = this.map.childNodes[row].childNodes[col].childNodes[0]
            let grid = this.screen[n]
            let old = this.screen_old[n]
            if (old == screen)
                continue
            btn.childNodes[0].remove()
            if (grid >= 0 && grid <= 8)
                var emoji = this.numbermoji[grid].cloneNode()
            else if (grid == 9)
                var emoji = this.emojiset[3].cloneNode()
            else if (grid == 10)
                var emoji = this.emojiset[2].cloneNode()
            else if (grid == 11)
                var emoji = this.emojiset[1].cloneNode()
            else
                console.log(`!! grid ${n} is ${grid}`)
            btn.appendChild(emoji)
        }
        this.screen_old = this.screen
    }


    getIndex = (r, c) => {
        if (r >= this.rows || r < 0) return -1
        if (c >= this.cols || c < 0) return -1
        return this.cols * r + c
    }

    getRowCol = (n) => {
        if (n >= this.number_of_cells)
            return [-1, -1]
        let r = Math.floor(n / this.cols)
        let c = n - this.cols * r
        return [r, c]
    }

    init = () => {
        this.prepareEmoji()
        let setDefaults = () => {
            this.rows = 10
            this.cols = 10
            this.number_of_bombs = 10
            this.number_of_cells = this.cols * this.rows
        }
        if (this.number_of_cells > 300) { alert('too big, should have less than 300 cells, use defaults'); setDefaults() }
        if (this.number_of_cells <= this.number_of_bombs) { alert('more bombs than cells, use defaults'); setDefaults() }
        console.log(`Started a new game with [row, col, mines] ${[this.rows, this.cols, this.number_of_bombs]}`)

        this.screen = new Array(this.number_of_cells)
        this.screen_old = new Array(this.number_of_cells)

        this.map.innerHTML = ''

        var row = document.createElement('div')
        row.setAttribute('role', 'row')
        // <div role='row'>

        for (let n = 0; n < this.number_of_cells; n++) {
            var cell = document.createElement('span')
            cell.setAttribute('role', 'gridcell') // <span role="gridcell">
            cell.setAttribute('num', n)
            var mine = document.createElement('button')
            mine.type = 'button'
            mine.setAttribute('aria-label', 'Field')
            mine.className = 'cell'
            mine.appendChild(this.emojiset[3].cloneNode())
            cell.appendChild(mine)
            row.appendChild(cell)
            if (this.getRowCol(n)[1] + 1 == this.cols)  {
                this.map.appendChild(row)
                row = document.createElement('div')
                row.setAttribute('role', 'row')
            }
        }

        this.resetMetadata()
        this.bindEvents()
        //this.updateBombsLeft()

        this.sendInit()
        this.update_timer = setInterval(this.sendRefresh, 1000)
      }

    makeMove = (row, col) => {
        if (row < 0 || col < 0)
            console.log(`!! bad row col: ${[row, col]}`)
        else {
            this.sendMove(row, col)
        }
    }

    bindEvents = () => {
        let cells = document.getElementsByClassName('cell')
        for (let target of cells)
            target.addEventListener('click', (event) => {
                if (event.view) {
                    let n = target.parentNode.getAttribute('num')
                    let [row, col] = this.getRowCol(n)
                    this.makeMove(row, col)
                }
            })
    }


    prepareEmoji = () => {
        let that = this
        function makeEmojiElement (emoji) {
            var ele
            if (that.usetwemoji) {
                if (emoji.src) {
                    ele = emoji
                } else {
                    ele = document.createElement('img')
                    ele.className = 'emoji'
                    ele.setAttribute('aria-hidden', 'true')
                    ele.src = twemoji.parse(emoji).match(/src=\"(.+)\">/)[1]
                }
            } else {
                ele = document.createTextNode(emoji.alt || emoji.data || emoji)
            }
            return ele
        }

        this.emojiset = this.emojiset.map(makeEmojiElement)
        this.numbermoji = this.numbermoji.map(makeEmojiElement)
      }

    resetMetadata = () => {
        document.getElementById('timer').textContent = '0'
        document.querySelector('.wrapper').classList.remove('won', 'lost')
        document.querySelector('.result-emoji').textContent = ''
        document.querySelector('.default-emoji').innerHTML = this.usetwemoji ? twemoji.parse('😀') : '😀'
        document.querySelector('.js-settings').innerHTML = this.usetwemoji ? twemoji.parse('🔧') : '🔧'
    }
}
