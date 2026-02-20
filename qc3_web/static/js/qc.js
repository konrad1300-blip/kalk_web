// static/js/qc.js

$(document).ready(function() {
    // ---------- Formularz główny – aktualizacja obliczeń ----------
    $('#qcForm').on('input change', function() {
        var formData = {};
        $('#qcForm :input').each(function() {
            var name = $(this).attr('name');
            if (name) {
                formData[name] = $(this).val();
            }
        });
        $.ajax({
            url: '/qc/calculate',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(formData),
            success: function(response) {
                var html = '<h3>Wyniki obliczeń:</h3>';
                html += '<p>Waga pojedynczej palety: ' + response.single_pallet_weight + ' kg</p>';
                if (response.full_pallets > 0) {
                    html += '<p>Pełnych palet: ' + response.full_pallets + '</p>';
                }
                if (response.remainder > 0) {
                    html += '<p>Niepełna paleta: ' + response.remainder + ' kartonów, waga: ' + response.partial_pallet_weight + ' kg</p>';
                }
                html += '<p>Łączna waga: ' + response.total_weight_all + ' kg</p>';
                $('#calculations').html(html);
            },
            error: function(xhr) {
                $('#calculations').html('<p style="color:red;">Błąd obliczeń</p>');
            }
        });
    });

    // ---------- Obsługa strony historii ----------
    if ($('#historyTable').length) {
        loadHistoryFilters();   // wczytaj listy do filtrów
        loadHistoryData();      // wczytaj dane tabeli

        $('#applyFilters').click(function() {
            loadHistoryData();
        });

        $('#exportExcel').click(function() {
            exportHistory();
        });
    }

    // ---------- Obsługa strony statystyk ----------
    if ($('#statsTable').length) {
        $('#loadStats').click(function() {
            loadStatsData();
        });

        $('#exportStatsExcel').click(function() {
            exportStats();
        });

        // Załaduj dane przy starcie
        loadStatsData();
    }
});

// ----------------------------------------------------------------------
// Funkcje historii
// ----------------------------------------------------------------------
function loadHistoryFilters() {
    $.ajax({
        url: '/qc/history/filters',
        method: 'GET',
        success: function(data) {
            var controllerSelect = $('#controller_filter');
            var productSelect = $('#product_filter');
            controllerSelect.empty().append('<option value="Wszyscy">Wszyscy</option>');
            productSelect.empty().append('<option value="Wszystkie">Wszystkie</option>');
            data.controllers.forEach(function(c) {
                controllerSelect.append('<option value="' + c + '">' + c + '</option>');
            });
            data.products.forEach(function(p) {
                productSelect.append('<option value="' + p + '">' + p + '</option>');
            });
        },
        error: function() {
            alert('Nie udało się załadować filtrów.');
        }
    });
}

function loadHistoryData() {
    var filters = {
        start_date: $('#start_date').val(),
        end_date: $('#end_date').val(),
        controller: $('#controller_filter').val(),
        product: $('#product_filter').val()
    };
    $.ajax({
        url: '/qc/history/filter',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(filters),
        success: function(data) {
            var tbody = $('#historyTable tbody');
            tbody.empty();
            data.forEach(function(row) {
                var tr = $('<tr>');
                tr.append('<td>' + row.id + '</td>');
                tr.append('<td>' + row.product_number + '</td>');
                tr.append('<td>' + row.report_date + '</td>');
                tr.append('<td>' + row.reporter + '</td>');
                tr.append('<td>' + row.shipping_direction + '</td>');
                tr.append('<td>' + row.pallet_type + '</td>');
                tr.append('<td>' + row.certified + '</td>');
                tr.append('<td>' + row.unit_weight + '</td>');
                tr.append('<td>' + row.single_pallet_weight + '</td>');
                tr.append('<td>' + row.cartons + '</td>');
                tr.append('<td>' + row.full_pallets + '</td>');
                tr.append('<td>' + row.total_weight_all + '</td>');
                tr.append('<td><button class="delete-btn" data-id="' + row.id + '">Usuń</button></td>');
                tbody.append(tr);
            });
            // Obsługa przycisków usuwania
            $('.delete-btn').click(function() {
                var id = $(this).data('id');
                if (confirm('Czy na pewno usunąć raport?')) {
                    $.ajax({
                        url: '/qc/history/delete/' + id,
                        method: 'DELETE',
                        success: function() {
                            loadHistoryData();
                        },
                        error: function() {
                            alert('Nie udało się usunąć raportu.');
                        }
                    });
                }
            });
        },
        error: function() {
            alert('Nie udało się załadować historii.');
        }
    });
}

function exportHistory() {
    var filters = {
        start_date: $('#start_date').val(),
        end_date: $('#end_date').val(),
        controller: $('#controller_filter').val(),
        product: $('#product_filter').val()
    };
    $.ajax({
        url: '/qc/export/history',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(filters),
        xhrFields: { responseType: 'blob' },
        success: function(blob, status, xhr) {
            var filename = 'historia.xlsx';
            var disposition = xhr.getResponseHeader('Content-Disposition');
            if (disposition && disposition.indexOf('attachment') !== -1) {
                var match = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
                if (match != null && match[1]) {
                    filename = match[1].replace(/['"]/g, '');
                }
            }
            var link = document.createElement('a');
            link.href = window.URL.createObjectURL(blob);
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(link.href);
        },
        error: function() {
            alert('Nie udało się wyeksportować danych.');
        }
    });
}

// ----------------------------------------------------------------------
// Funkcje statystyk
// ----------------------------------------------------------------------
function loadStatsData() {
    var filters = {
        start_date: $('#start_date').val(),
        end_date: $('#end_date').val()
    };
    $.ajax({
        url: '/qc/statistics/filter',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(filters),
        success: function(data) {
            var tbody = $('#statsTable tbody');
            tbody.empty();
            var totalReports = 0, totalCartons = 0, totalPallets = 0, totalWeight = 0;
            data.forEach(function(row) {
                totalReports += row.total_reports;
                totalCartons += row.total_cartons;
                totalPallets += row.total_full_pallets;
                totalWeight += row.total_weight;
                var tr = $('<tr>');
                tr.append('<td>' + row.reporter + '</td>');
                tr.append('<td>' + row.product_number + '</td>');
                tr.append('<td>' + row.total_reports + '</td>');
                tr.append('<td>' + row.total_cartons + '</td>');
                tr.append('<td>' + row.total_full_pallets + '</td>');
                tr.append('<td>' + row.total_weight.toFixed(2) + '</td>');
                tbody.append(tr);
            });
            $('#totals').html('Łącznie: ' + totalReports + ' raportów, ' + totalCartons + ' kartonów, ' + totalPallets + ' pełnych palet, ' + totalWeight.toFixed(2) + ' kg');
        },
        error: function() {
            alert('Nie udało się załadować statystyk.');
        }
    });
}

function exportStats() {
    var filters = {
        start_date: $('#start_date').val(),
        end_date: $('#end_date').val()
    };
    $.ajax({
        url: '/qc/export/statistics',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(filters),
        xhrFields: { responseType: 'blob' },
        success: function(blob, status, xhr) {
            var filename = 'statystyki.xlsx';
            var disposition = xhr.getResponseHeader('Content-Disposition');
            if (disposition && disposition.indexOf('attachment') !== -1) {
                var match = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
                if (match != null && match[1]) {
                    filename = match[1].replace(/['"]/g, '');
                }
            }
            var link = document.createElement('a');
            link.href = window.URL.createObjectURL(blob);
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(link.href);
        },
        error: function() {
            alert('Nie udało się wyeksportować statystyk.');
        }
    });
}