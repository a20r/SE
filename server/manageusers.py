
from contextlib import closing
from flask import Flask, request, session, g, redirect, url_for
from flask import abort, render_template, flash, jsonify
import rethinkdb as r
import dbconfig as db
import uuid
from app import app

@app.route('/show_entries')
def show_entries():
    cur = g.db.execute('select name, password from entries order by id desc')
    entries = [dict(title=row[0], text=row[1]) for row in cur.fetchall()]
    return render_template('show_entries.html', entries=entries)

@app.route('/add', methods=['POST'])
def add_entry():
    if not session.get('logged_in'):
        abort(401)
    g.db.execute('insert into entries (name, password) values (?, ?)',
                 [request.form['title'], request.form['text']])
    g.db.commit()
    flash('New entry was successfully posted')
    return redirect(url_for('show_entries'))

@app.route('/login', methods=['GET', 'POST'])
def login():
    error = None
    if request.method == 'POST':
        if request.form['username'] != "wo":
            error = 'Invalid username'
        elif (
                request.form['password'] !=
                query_db(
                    'select password from entries where name= ?',
                    [request.form['username']],
                    one=True
                )
        ):
            error = 'Invalid password'
            test = query_db(
                'select * from users where username = ?',
                ["test"],
                one=True
            )
            print(test['password'])
        else:
            session['logged_in'] = True
            flash('You were logged in')
            return redirect(url_for('show_entries'))
    return render_template('login.html', error=error)

@app.route('/register', methods=["POST"])
def register():
    userData = r.table(db.USER_TABLE).get(
        request.form["username"]
    ).run(db.CONN)

    if userData == None:
        token = str(uuid.uuid1())
        r.table(db.USER_TABLE).insert({
            "username": request.form["username"],
            "password": request.form["password"],
            "email": request.form["email"],
            "token": token
        }).run(db.CONN)

        return jsonify(
            error = 0,
            message = "No error",
            token = token
        )
    else:
        return jsonify(
            error = 1,
            message = "User already exists",
            token = None
        )

@app.route('/logout')
def logout():
    session.pop('logged_in', None)
    flash('You were logged out')
    return redirect(url_for('show_entries'))


