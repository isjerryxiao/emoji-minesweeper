#!/usr/bin/env python3
# -*- coding: utf-8 -*-
from flask import Flask, request
from flask_cors import CORS
from numpy import array_equal
from time import time
from copy import deepcopy


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
            if board_world and board_world.state == 1:
                b = board_world
                ret = f'{b.height}x{b.width}_{b.mines}_0_0_1 '
                ret += update(board_world, -1, -1, False)
            else:
                (row, col, mines) = [int(x) for x in query[1:]]
                board_world = Board(row, col, mines)
                setattr(board_world, 'start_time', 0)
                ret = f'{row}x{col}_{mines}_0_0_1 '
                ret += ' '.join(['9'] * (row * col))
        elif len(query) == 1 and query[0] == 'refresh':
            if board_world is None:
                ret = 'NoGame'
            elif board_world.state == 0:
                b = board_world
                ret = f'{b.height}x{b.width}_{b.mines}_0_0_1 '
                ret += ' '.join(['9'] * (b.height * b.width))
            else:
                b = board_world
                cells = update(board_world, -1, -1, False)
                r = f'{b.height}x{b.width}_{b.mines}_{b.moves}_{b.start_time}_{b.state}'
                ret = f'{r} {cells}'
        elif len(query) == 3 and query[0] == 'move':
            if board_world is None:
                ret = 'NoGame'
            else:
                (row, col) = [int(x) for x in query[1:]]
                if board_world.state == 0:
                    setattr(board_world, 'start_time', int(time()))
                cells = update(board_world, row, col)
                b = board_world
                r = f'{b.height}x{b.width}_{b.mines}_{b.moves}_{b.start_time}_{b.state}'
                ret = f'{r} {cells}'
        else:
            ret = 'Failed'
            print(query)
    resp = (ret, 200, {'ContentType': 'text/plain'})
    return resp


def update(board, row, col, move=True):
    if move:
        board.move((row, col))
        if not array_equal(board.map, board.mmap):
            if not board.moves:
                board.moves = 1
            else:
                board.moves += 1
                board.mmap = deepcopy(board.map)
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
