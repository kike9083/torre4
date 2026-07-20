<?php
include 'db.php';

$year = isset($_GET['year']) ? intval($_GET['year']) : date('Y');
$month = isset($_GET['month']) ? intval($_GET['month']) : date('m');

$date = new DateTime("$year-$month-01");
$month_name = strftime('%B', $date->getTimestamp());

?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Gráficos - Condominio Vista del Golf</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body>
    <div class="container">
        <div class="d-flex justify-content-between align-items-center my-4">
            <h1 class="">Reportes Gráficos</h1>
            <a href="index.php?month=<?php echo $month; ?>&year=<?php echo $year; ?>" class="btn btn-outline-primary">Volver al Estado de Cuenta</a>
        </div>

        <!-- Monthly Report -->
        <div class="card mt-4">
            <div class="card-header">
                <h3>Reporte de <?php echo ucfirst($month_name) . " de $year"; ?></h3>
            </div>
            <div class="card-body">
                <div class="row">
                    <div class="col-md-6">
                        <h4>Gastos por Categoría</h4>
                        <canvas id="gastosMensualChart"></canvas>
                    </div>
                    <div class="col-md-6">
                        <h4>Ingresos vs. Egresos</h4>
                        <canvas id="ingresosEgresosMensualChart"></canvas>
                    </div>
                </div>
            </div>
        </div>

        <!-- Annual Report -->
        <div class="card mt-5">
            <div class="card-header">
                <h3>Reporte Anual de <?php echo $year; ?></h3>
            </div>
            <div class="card-body">
                <h4>Evolución de Ingresos y Egresos</h4>
                <canvas id="evolucionAnualChart"></canvas>
            </div>
        </div>

    </div>

    <script>
    document.addEventListener('DOMContentLoaded', function () {
        const year = <?php echo $year; ?>;
        const month = <?php echo $month; ?>;
        const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

        // Colors
        const COLORS = [
            '#4e73df', '#1cc88a', '#36b9cc', '#f6c23e', '#e74a3b', '#858796', '#5a5c69', 
            '#f8f9fc', '#dddfeb', '#4e73df', '#1cc88a', '#36b9cc'];

        // 1. Monthly Expenses Pie Chart
        fetch(`data_graficos.php?report=gastos_mensual&month=${month}&year=${year}`)
            .then(response => response.json())
            .then(data => {
                const ctx = document.getElementById('gastosMensualChart').getContext('2d');
                new Chart(ctx, {
                    type: 'pie',
                    data: {
                        labels: data.labels,
                        datasets: [{
                            data: data.data,
                            backgroundColor: COLORS,
                        }]
                    },
                    options: {
                        responsive: true,
                        plugins: {
                            legend: {
                                position: 'top',
                            },
                            title: {
                                display: false,
                            }
                        }
                    }
                });
            });

        // 2. Monthly Income vs Expenses Bar Chart
        fetch(`data_graficos.php?report=ingresos_egresos_mensual&month=${month}&year=${year}`)
            .then(response => response.json())
            .then(data => {
                const ctx = document.getElementById('ingresosEgresosMensualChart').getContext('2d');
                new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: ['Total del Mes'],
                        datasets: [
                            {
                                label: 'Ingresos',
                                data: [data.ingresos],
                                backgroundColor: '#1cc88a',
                            },
                            {
                                label: 'Egresos',
                                data: [data.egresos],
                                backgroundColor: '#e74a3b',
                            }
                        ]
                    },
                    options: {
                        responsive: true,
                        scales: {
                            y: {
                                beginAtZero: true
                            }
                        }
                    }
                });
            });

        // 3. Annual Evolution Line Chart
        fetch(`data_graficos.php?report=evolucion_anual&year=${year}`)
            .then(response => response.json())
            .then(data => {
                const ctx = document.getElementById('evolucionAnualChart').getContext('2d');
                new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: monthNames,
                        datasets: [
                            {
                                label: 'Ingresos',
                                data: data.ingresos,
                                borderColor: '#1cc88a',
                                backgroundColor: 'rgba(28, 200, 138, 0.1)',
                                fill: true,
                                tension: 0.1
                            },
                            {
                                label: 'Egresos',
                                data: data.egresos,
                                borderColor: '#e74a3b',
                                backgroundColor: 'rgba(231, 74, 59, 0.1)',
                                fill: true,
                                tension: 0.1
                            }
                        ]
                    },
                    options: {
                        responsive: true,
                        scales: {
                            y: {
                                beginAtZero: true
                            }
                        }
                    }
                });
            });
    });
    </script>
</body>
</html>
