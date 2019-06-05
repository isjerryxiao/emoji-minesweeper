/* global twemoji, alert, MouseEvent, game */
const numbers = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣']
const iDevise = navigator.platform.match(/^iP/)
const feedback = document.querySelector('.feedback')
const emojiset = ['🔹', '💣', '🚩', '◻']
const serverurl = 'http://localhost:8000/mscore.aspx'

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
        this.screen = new Array(this.number_of_cells)
        this.screen_old = new Array(this.number_of_cells)
        this.init()
    }


    transfer = (data) => {
        // report data:
        // new row col mines (existing game can override this)
        // move row col
        // return data:
        // win grid1 grid2 grid3 ...
        // die grid1 grid2 grid3 ...
        // cont grid1 grid2 grid3 ...
        // [x]x[y]_[mine]_[moves]_[time] grid1 grid2 grid3 ...

        let http = new XMLHttpRequest()
        http.open('POST', serverurl, true)

        // We are sending plain text
        http.setRequestHeader('Content-type', 'text/plain')

        http.onreadystatechange = () => {
            if (http.readyState == 4 && http.status == 200) {
                console.log(http.responseText)
            }
            else {
                console.log('http request failed for ...')
            }
        }
        http.send(data)
    }

    sendmove = (row, col) => {
        return undefined
    }


    gentestscreen = () => {
        let map = new Array(this.number_of_cells)
        for (let i=0; i<=9; i++)
            for (let j=0; j<=9; j++)
                map[this.getIndex(i, j)] = 11 - j
        return map
    }

    updateScreen = (row, col) => {
        // upopened = 9, opened = 0-8, flagged = 10, stepped = 11
        for (let n = 0; n < this.number_of_cells; n++) {
            [row, col] = this.getRowCol(n)
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
        return undefined
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
        if (this.number_of_cells > 300) { alert('too big, should have less than 300 cells'); return false }
        if (this.number_of_cells <= this.number_of_bombs) { alert('more bombs than cells, can\'t do it'); return false }
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
        this.screen = this.gentestscreen()
        this.updateScreen()
      }

    makeMove = (row, col) => {
        if (row < 0 || col < 0)
            console.log(`!! bad row col: ${[row, col]}`)
        else {
            console.log(`${[row, col]}`)
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
        document.getElementById('timer').textContent = '0.00'
        document.querySelector('.wrapper').classList.remove('won', 'lost')
        document.querySelector('.result-emoji').textContent = ''
        document.querySelector('.default-emoji').innerHTML = this.usetwemoji ? twemoji.parse('😀') : '😀'
        document.querySelector('.js-settings').innerHTML = this.usetwemoji ? twemoji.parse('🔧') : '🔧'
      }
}
