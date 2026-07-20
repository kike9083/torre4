<?php
include 'db.php';

$month = isset($_GET['month']) ? intval($_GET['month']) : date('m');
$year = isset($_GET['year']) ? intval($_GET['year']) : date('Y');

// Calculate next month
$current_date = new DateTime("$year-$month-01");
$current_date->modify('+1 month');
$next_month = $current_date->format('m');
$next_year = $current_date->format('Y');
$next_month_start = $current_date->format('Y-m-d');

// Check if summary for next month already exists
$check_sql = "SELECT id FROM resumen_mensual WHERE fecha = '$next_month_start'";
$check_result = $conn->query($check_sql);
if ($check_result->num_rows > 0) {
    header("Location: index.php?month=$next_month&year=$next_year&message=Mes ya existe");
    exit();
}

// Get previous month's starting balances
$prev_month_start = "$year-$month-01";
$resumen_sql = "SELECT banco_saldo_anterior, caja_saldo_anterior FROM resumen_mensual WHERE fecha = '$prev_month_start'";
$resumen_result = $conn->query($resumen_sql);
$resumen = $resumen_result->fetch_assoc();
$banco_saldo_anterior = $resumen ? $resumen['banco_saldo_anterior'] : 0;
$caja_saldo_anterior = $resumen ? $resumen['caja_saldo_anterior'] : 0;

// Calculate totals for the current month to get the closing balance
$total_pagos_sql = "SELECT SUM(pago) as total FROM ingresos WHERE MONTH(fecha) = $month AND YEAR(fecha) = $year";
$total_pagos_result = $conn->query($total_pagos_sql);
$total_pagos = $total_pagos_result->fetch_assoc()['total'] ?? 0;

$total_gastos_sql = "SELECT SUM(efectivo) as total_efectivo, SUM(cheques) as total_cheques FROM gastos WHERE MONTH(fecha) = $month AND YEAR(fecha) = $year";
$total_gastos_result = $conn->query($total_gastos_sql);
$total_gastos = $total_gastos_result->fetch_assoc();
$total_efectivo = $total_gastos['total_efectivo'] ?? 0;
$total_cheques = $total_gastos['total_cheques'] ?? 0;

$total_movimientos_banco_sql = "SELECT SUM(monto) as total FROM banco_movimientos WHERE MONTH(fecha) = $month AND YEAR(fecha) = $year";
$total_movimientos_banco_result = $conn->query($total_movimientos_banco_sql);
$total_movimientos_banco = $total_movimientos_banco_result->fetch_assoc()['total'] ?? 0;

$total_movimientos_caja_sql = "SELECT SUM(monto) as total FROM caja_movimientos WHERE MONTH(fecha) = $month AND YEAR(fecha) = $year";
$total_movimientos_caja_result = $conn->query($total_movimientos_caja_sql);
$total_movimientos_caja = $total_movimientos_caja_result->fetch_assoc()['total'] ?? 0;

// Calculate closing balances
$banco_saldo_final = $banco_saldo_anterior + $total_pagos - $total_cheques + $total_movimientos_banco;
$caja_saldo_final = $caja_saldo_anterior - $total_efectivo + $total_movimientos_caja;

// Insert new summary for the next month
$insert_sql = "INSERT INTO resumen_mensual (fecha, banco_saldo_anterior, caja_saldo_anterior) VALUES (?, ?, ?)";
$stmt = $conn->prepare($insert_sql);
$stmt->bind_param("sdd", $next_month_start, $banco_saldo_final, $caja_saldo_final);

if ($stmt->execute()) {
    // Also, carry over the balances for each apartment
    $apartamentos_sql = "SELECT apartamento, nombre, (saldo_anterior + mensualidad - pago) as saldo_final FROM ingresos WHERE MONTH(fecha) = $month AND YEAR(fecha) = $year";
    $apartamentos_result = $conn->query($apartamentos_sql);
    if ($apartamentos_result->num_rows > 0) {
        $insert_ingreso_stmt = $conn->prepare("INSERT INTO ingresos (apartamento, nombre, saldo_anterior, mensualidad, pago, observacion, fecha) VALUES (?, ?, ?, 40, 0, NULL, ?)");
        while ($apto = $apartamentos_result->fetch_assoc()) {
            $insert_ingreso_stmt->bind_param("ssds", $apto['nombre'], $apto['apartamento'], $apto['saldo_final'], $next_month_start);
            $insert_ingreso_stmt->execute();
        }
        $insert_ingreso_stmt->close();
    }

    header("Location: index.php?month=$next_month&year=$next_year&message=Mes creado exitosamente");
} else {
    echo "Error al crear el nuevo mes: " . $stmt->error;
}

$stmt->close();
$conn->close();
?>