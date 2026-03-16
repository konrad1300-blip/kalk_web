from flask import Flask, render_template, request

app = Flask(__name__)

# Stałe na stałe wpisane do programu
STALA_MALARSKA = 1.333        # ml/m²
STALA_SPRZATANIA = 100        # ml

@app.route('/')
def index():
    return render_template('index.html', dane={})

@app.route('/oblicz', methods=['POST'])
def oblicz():
    try:
        # Pobranie danych z formularza
        metry = float(request.form['metry'])
        kolory = int(request.form['kolory'])
        ilosc_sztuk = int(request.form['ilosc_sztuk'])
        metoda = request.form['metoda']
        podloze = request.form['podloze']

        # Zachowanie danych do ponownego wyświetlenia w formularzu
        dane = {
            'metry': metry,
            'kolory': kolory,
            'ilosc_sztuk': ilosc_sztuk,
            'metoda': metoda,
            'podloze': podloze
        }

        # Obliczenie ilości farby bazowej wg wzoru
        if metoda == 'sit':
            farba_ml = (metry * STALA_MALARSKA + (STALA_SPRZATANIA / ilosc_sztuk)) * kolory
        else:  # szablon (mnożnik 3.5)
            farba_ml = (metry * STALA_MALARSKA * 3.5 + (STALA_SPRZATANIA / ilosc_sztuk)) * kolory

        # Przeliczenie na litry
        farba_l = farba_ml / 1000.0

        # Obliczenie rozpuszczalników w zależności od podłoża
        if podloze == 'PVC':
            rozcienczalnik_l = farba_l * 0.15
            opozniacz_l = farba_l * 0.05
            calkowita_l = farba_l + rozcienczalnik_l + opozniacz_l
            wynik = {
                'farba': farba_l,
                'rozcienczalnik_plv': rozcienczalnik_l,
                'opozniacz_sv1': opozniacz_l,
                'calkowita': calkowita_l,
                'podloze': 'PVC',
                'komunikat': ''
            }
        else:  # FRETARP
            rozcienczalnik_l = farba_l * 0.5
            calkowita_l = farba_l + rozcienczalnik_l
            wynik = {
                'farba': farba_l,
                'rozcienczalnik_qnv': rozcienczalnik_l,
                'calkowita': calkowita_l,
                'podloze': 'FRETARP',
                'komunikat': 'Pamiętaj o odtłuszczeniu powierzchni alkoholem IPA lub zmywaczem 628.'
            }

        return render_template('index.html', wynik=wynik, dane=dane)
    except Exception as e:
        return render_template('index.html', error=f"Błąd: {e}", dane=request.form)

@app.route('/pomoc')
def pomoc():
    return render_template('pomoc.html')

if __name__ == '__main__':
    app.run(debug=True)