#!/usr/bin/env python3
# -*- coding: utf-8 -*-
from flask import Flask, request
from flask_cors import CORS


UNOPENED_CELL = 9
FLAGGED_CELL = 10
STEPPED_CELL = 11

from mscore import Board, check_params
board_world = None

app = Flask(__name__)
CORS(app)
@app.route('/')
@app.route('/mscore.aspx', methods=['GET', 'POST'])
def index():
    global board_world
    query = request.data.decode('utf-8')
    query = query.split(' ')
    if query:
        if len(query) == 4 and query[0] == 'new':
            (row, col, mines) = [int(x) for x in query[1:]]
            board_world = Board(row, col, mines)
            b = ' '.join([str(UNOPENED_CELL)] * (row * col))
            ret = f'cont {b}'
        elif len(query) == 3 and query[0] == 'move':
            (row, col) = [int(x) for x in query[1:]]
            ret = f'cont {update(board_world, row, col)}'
        else:
            ret = 'Failed'
            print(query)
    resp = (ret, 200, {'ContentType': 'text/plain'})
    return resp


def update(board, row, col):
    board.move((row, col))
    cells = list()
    for row in range(board.height):
        for col in range(board.width):
            if board.map[row][col] <= 9:
                cell_text = UNOPENED_CELL
            elif board.map[row][col] == 10:
                cell_text = 0
            elif board.map[row][col] == 19:
                cell_text = FLAGGED_CELL
            elif board.map[row][col] == 20:
                cell_text = STEPPED_CELL
            else:
                cell_text = board.map[row][col] - 10
            cells.append(cell_text)
    return ' '.join([str(x) for x in cells])


if __name__ == "__main__":
    app.run(host="0.0.0.0",debug=False, port=5000)
