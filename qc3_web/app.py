import os
from flask import Flask, render_template
from database.db_handler import DatabaseHandler
from calculators.qc.routes import qc_bp

app = Flask(__name__)
app.config.from_pyfile('config.py', silent=True)
app.config['SECRET_KEY'] = 'twoj-tajny-klucz-zmien-to-w-produkcji'
app.config['DATABASE'] = os.path.join(app.instance_path, 'reports.db')

# Upewnij się, że katalog instance istnieje
os.makedirs(app.instance_path, exist_ok=True)

# Inicjalizacja bazy danych przy starcie
with app.app_context():
    db = DatabaseHandler(app.config['DATABASE'])
    db.initialize_database()

# Rejestracja blueprintów
app.register_blueprint(qc_bp, url_prefix='/qc')

@app.route('/')
def index():
    return render_template('index.html')

if __name__ == '__main__':
    app.run(debug=True)