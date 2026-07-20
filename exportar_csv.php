<?php
include 'db.php';

$year = isset($_GET['year']) ? intval($_GET['year']) : date('Y');
$month = isset($_GET['month']) ? intval($_GET['month']) : date('m');

$date = new DateTime("$year-$month-01");
$month_name = $date->format('F');
$filename = "estado_de_cuenta_{$month}_{$year}.csv";

header('Content-Type: text/csv; charset=utf-8');
header("Content-Disposition: attachment; filename=$filename");

$output = fopen('php://output', 'w');

// Title
fputcsv($output, ["CONDOMINIO VISTA DEL GOLF - TORRE 4"]);
fputcsv($output, ["ESTADO DE CUENTA AL: " . strtoupper($month_name) . " DE $year"]);
fputcsv($output, []); // Empty line

// Ingresos
fputcsv($output, ["INGRESOS: CUOTA MANTENIMIENTO"]);
fputcsv($output, ['AP.', 'NOMBRE', 'SALDO ANT.', 'MENS.', 'PAGOS', 'SALDO ACTUAL', 'OBSERVACIÓN']);

$sql_ingresos = "SELECT apartamento, nombre, saldo_anterior, mensualidad, pago, observacion FROM ingresos WHERE MONTH(fecha) = $month AND YEAR(fecha) = $year ORDER BY apartamento ASC";
$result_ingresos = $conn->query($sql_ingresos);

$total_saldo_anterior = 0; $total_mensualidad = 0; $total_pagos = 0; $total_saldo_actual = 0;

if ($result_ingresos->num_rows > 0) {
    while ($row = $result_ingresos->fetch_assoc()) {
        $saldo_actual = $row['saldo_anterior'] + $row['mensualidad'] - $row['pago'];
        fputcsv($output, [
            $row['apartamento'], 
            $row['nombre'], 
            $row['saldo_anterior'], 
            $row['mensualidad'], 
            $row['pago'], 
            $saldo_actual, 
            $row['observacion']
        ]);
        $total_saldo_anterior += $row['saldo_anterior']; $total_mensualidad += $row['mensualidad']; $total_pagos += $row['pago']; $total_saldo_actual += $saldo_actual;
    }
}
fputcsv($output, ['TOTAL INGRESOS:', '', $total_saldo_anterior, $total_mensualidad, $total_pagos, $total_saldo_actual, '']);
fputcsv($output, []); // Empty line

// Gastos
fputcsv($output, ["GASTOS"]);
fputcsv($output, ['DESCRIPCIÓN', 'EFECT.', 'CHEQUES', 'DETALLE']);

$sql_gastos = "SELECT descripcion, efectivo, cheques, detalle_cheque FROM gastos WHERE MONTH(fecha) = $month AND YEAR(fecha) = $year";
$result_gastos = $conn->query($sql_gastos);

$total_efectivo = 0; $total_cheques = 0;

if ($result_gastos->num_rows > 0) {
    while ($row = $result_gastos->fetch_assoc()) {
        fputcsv($output, [$row['descripcion'], $row['efectivo'], $row['cheques'], $row['detalle_cheque']]);
        $total_efectivo += $row['efectivo']; $total_cheques += $row['cheques'];
    }
}
fputcsv($output, ['TOTAL GASTOS:', $total_efectivo, $total_cheques, '']);
fputcsv($output, []); // Empty line

// Summaries
$start_date = "$year-$month-01";
$resumen_sql = "SELECT banco_saldo_anterior, caja_saldo_anterior FROM resumen_mensual WHERE fecha = '$start_date'";
$resumen_result = $conn->query($resumen_sql);
$resumen = $resumen_result->fetch_assoc();
$saldo_anterior_banco = $resumen ? $resumen['banco_saldo_anterior'] : 0;
$saldo_anterior_caja = $resumen ? $resumen['caja_saldo_anterior'] : 0;

$saldo_actual_banco = $saldo_anterior_banco + $total_pagos - $total_cheques;
$saldo_actual_caja = $saldo_anterior_caja - $total_efectivo;
$saldo_total_libros = $saldo_actual_banco + $saldo_actual_caja;

fputcsv($output, ["BANCO GENERAL"]);
fputcsv($output, ["SALDO ANTERIOR EN BANCO:", $saldo_anterior_banco]);
fputcsv($output, ["Cuotas mantenimiento", $total_pagos]);
fputcsv($output, ["EGRESOS (CHEQUES, TIMBRES, ETC)", -$total_cheques]);
fputcsv($output, ["SALDO ACTUAL BANCO", $saldo_actual_banco]);
fputcsv($output, []); // Empty line

fputcsv($output, ["CAJA MENUDA"]);
fputcsv($output, ["SALDO ANTERIOR CAJA:", $saldo_anterior_caja]);
fputcsv($output, ["EGRESOS CAJA MENUDA:", -$total_efectivo]);
fputcsv($output, ["SALDO ACTUAL CAJA MENUDA:", $saldo_actual_caja]);
fputcsv($output, []); // Empty line

fputcsv($output, ["SALDO TOTAL EN LIBROS:", $saldo_total_libros]);

fclose($output);
$conn->close();
?>