<?php
include 'db.php';

// Get selected month and year, or default to the latest month in the summary table
$latest_resumen_sql = "SELECT YEAR(fecha) as year, MONTH(fecha) as month FROM resumen_mensual ORDER BY fecha DESC LIMIT 1";
$latest_resumen_result = $conn->query($latest_resumen_sql);
$latest_resumen = $latest_resumen_result->fetch_assoc();

$year = isset($_GET['year']) ? intval($_GET['year']) : ($latest_resumen ? $latest_resumen['year'] : date('Y'));
$month = isset($_GET['month']) ? intval($_GET['month']) : ($latest_resumen ? $latest_resumen['month'] : date('m'));

$date = new DateTime("$year-$month-01");
$month_name = strftime('%B', $date->getTimestamp());
$last_day = $date->format('t');

$start_date = "$year-$month-01";
$end_date = "$year-$month-$last_day";

// Fetch monthly summary
$resumen_sql = "SELECT banco_saldo_anterior, caja_saldo_anterior FROM resumen_mensual WHERE fecha = '$start_date'";
$resumen_result = $conn->query($resumen_sql);
if ($resumen_result->num_rows == 0) {
    // If no summary for the month, create one
    echo "<div class='alert alert-warning'>No hay un resumen para este mes. <a href='crear_mes.php?month=$month&year=$year'>Puedes crearlo ahora</a>, usando los saldos del mes anterior.</div>";
    $saldo_anterior_banco = 0;
    $saldo_anterior_caja = 0;
} else {
    $resumen = $resumen_result->fetch_assoc();
    $saldo_anterior_banco = $resumen['banco_saldo_anterior'];
    $saldo_anterior_caja = $resumen['caja_saldo_anterior'];
}

?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Estado de Cuenta - Condominio Vista del Golf</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
</head>
<body>
    <div class="container">
        <h1 class="my-4 text-center">CONDOMINIO VISTA DEL GOLF - TORRE 4</h1>
        
        <!-- Month Selector -->
        <div class="row mb-4 justify-content-center">
            <div class="col-md-12">
                <?php
                    // Previous month
                    $prev_date = clone $date;
                    $prev_date->modify('-1 month');
                    $prev_month = $prev_date->format('m');
                    $prev_year = $prev_date->format('Y');

                    // Next month
                    $next_date = clone $date;
                    $next_date->modify('+1 month');
                    $next_month = $next_date->format('m');
                    $next_year = $next_date->format('Y');
                ?>
                <div class="d-flex justify-content-between align-items-center p-3 bg-light rounded shadow-sm flex-wrap gap-3">
                    <!-- Navigation Group -->
                    <div class="d-flex align-items-center gap-2">
                        <a href="index.php?month=<?php echo $prev_month; ?>&year=<?php echo $prev_year; ?>" class="btn btn-outline-secondary" title="Mes Anterior">&lt;</a>
                        <form method="GET" action="index.php" class="d-flex align-items-center gap-2 m-0">
                            <select name="month" id="month" class="form-select form-select-sm">
                                <?php 
                                setlocale(LC_TIME, 'es_ES.UTF-8', 'Spanish');
                                for ($i = 1; $i <= 12; $i++): ?>
                                    <option value="<?php echo $i; ?>" <?php if ($i == $month) echo 'selected'; ?>><?php echo ucfirst(strftime('%B', mktime(0, 0, 0, $i, 1))); ?></option>
                                <?php endfor; ?>
                            </select>
                            <input type="number" name="year" id="year" class="form-control form-control-sm" value="<?php echo $year; ?>" style="width: 80px;">
                            <button type="submit" class="btn btn-primary btn-sm">Ver</button>
                        </form>
                        <a href="index.php?month=<?php echo $next_month; ?>&year=<?php echo $next_year; ?>" class="btn btn-outline-secondary" title="Mes Siguiente">&gt;</a>
                    </div>

                    <!-- Actions Group -->
                    <div class="d-flex align-items-center gap-2">
                        <a href="graficos.php?month=<?php echo $month; ?>&year=<?php echo $year; ?>" class="btn btn-secondary btn-sm">Ver Gráficos</a>
                        <a href="crear_mes.php?month=<?php echo $month; ?>&year=<?php echo $year; ?>" class="btn btn-success btn-sm">Crear Próximo Mes</a>
                        <a href="exportar_csv.php?month=<?php echo $month; ?>&year=<?php echo $year; ?>" class="btn btn-outline-info btn-sm">Exportar</a>
                        <a href="eliminar_mes.php?month=<?php echo $month; ?>&year=<?php echo $year; ?>" class="btn btn-outline-danger btn-sm" onclick="return confirm('¡ATENCIÓN!\\n\\nEstás a punto de eliminar TODO el mes de <?php echo strtoupper($month_name) . ' ' . $year; ?>.\\n\\nSe borrarán todos los ingresos, gastos y movimientos asociados a este mes.\\n\\n¿Estás absolutamente seguro? Esta acción no se puede deshacer.');">Eliminar Mes</a>
                    </div>
                </div>
            </div>
        </div>

        <h2 class="my-3 text-center">ESTADO DE CUENTA AL: <?php echo "$last_day DE " . strtoupper($month_name) . " DE $year"; ?></h2>

        <!-- INGRESOS -->
        <div class="card">
            <div class="card-header d-flex justify-content-between align-items-center">
                <h3>Ingresos: Cuota Mantenimiento</h3>
                <button type="button" class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#addIngresoModal">Agregar Ingreso</button>
            </div>
            <div class="card-body">
                <table class="table table-striped table-bordered table-hover">
                    <thead class="table-dark">
                        <tr>
                            <th>AP.</th><th>NOMBRE</th><th>SALDO ANT.</th><th>MENS.</th><th>PAGOS</th><th>SALDO ACTUAL</th><th>OBSERVACIÓN</th><th>ACCIONES</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php
                        $sql = "SELECT id, apartamento, nombre, saldo_anterior, mensualidad, pago, observacion, fecha FROM ingresos WHERE MONTH(fecha) = $month AND YEAR(fecha) = $year ORDER BY CAST(apartamento AS UNSIGNED) ASC";
                        $result = $conn->query($sql);
                        $total_saldo_anterior = 0; $total_mensualidad = 0; $total_pagos = 0; $total_saldo_actual = 0;
                        if ($result->num_rows > 0) {
                            while($row = $result->fetch_assoc()) {
                                $saldo_actual = $row["saldo_anterior"] + $row["mensualidad"] - $row["pago"];
                                echo "<tr>";
                                echo "<td>" . htmlspecialchars($row["apartamento"]) . "</td>";
                                echo "<td>" . htmlspecialchars($row["nombre"]) . "</td>";
                                echo "<td>" . number_format($row["saldo_anterior"], 2) . "</td>";
                                echo "<td>" . number_format($row["mensualidad"], 2) . "</td>";
                                echo "<td>" . number_format($row["pago"], 2) . "</td>";
                                echo "<td>" . number_format($saldo_actual, 2) . "</td>";
                                echo "<td>" . htmlspecialchars($row["observacion"]) . "</td>";
                                echo '<td>
                                        <button type="button" class="btn btn-warning btn-sm edit-ingreso" data-bs-toggle="modal" data-bs-target="#editIngresoModal" data-id="'.$row['id'].'" data-apartamento="'.htmlspecialchars($row['apartamento']).'" data-nombre="'.htmlspecialchars($row['nombre']).'" data-saldo_anterior="'.$row['saldo_anterior'].'" data-mensualidad="'.$row['mensualidad'].'" data-pago="'.$row['pago'].'" data-observacion="'.htmlspecialchars($row['observacion']).'" data-fecha="'.$row['fecha'].'">E</button>
                                        <a href="eliminar_ingreso.php?id=' . $row['id'] . '&month='.$month.'&year='.$year.'" class="btn btn-danger btn-sm" onclick="return confirm(\'¿Estás seguro?\');">X</a>
                                      </td>';
                                echo "</tr>";
                                $total_saldo_anterior += $row["saldo_anterior"]; $total_mensualidad += $row["mensualidad"]; $total_pagos += $row["pago"]; $total_saldo_actual += $saldo_actual;
                            }
                        } else { echo "<tr><td colspan='8'>No hay registros de ingresos para este mes.</td></tr>"; }
                        ?>
                    </tbody>
                    <tfoot>
                        <tr class="table-secondary fw-bold">
                            <th colspan="2">TOTAL INGRESOS:</th><th><?php echo number_format($total_saldo_anterior, 2); ?></th><th><?php echo number_format($total_mensualidad, 2); ?></th><th><?php echo number_format($total_pagos, 2); ?></th><th><?php echo number_format($total_saldo_actual, 2); ?></th><th colspan="2"></th>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>

        <!-- GASTOS -->
        <div class="card mt-4">
            <div class="card-header d-flex justify-content-between align-items-center">
                <h3>Gastos</h3>
                <button type="button" class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#addGastoModal">Agregar Gasto</button>
            </div>
            <div class="card-body">
                <table class="table table-striped table-bordered table-hover">
                    <thead class="table-dark">
                        <tr><th>DESCRIPCIÓN</th><th>EFECT.</th><th>CHEQUES</th><th>DETALLE</th><th>ACCIONES</th></tr>
                    </thead>
                    <tbody>
                        <?php
                        $sql_gastos = "SELECT id, descripcion, efectivo, cheques, detalle_cheque, fecha FROM gastos WHERE MONTH(fecha) = $month AND YEAR(fecha) = $year";
                        $result_gastos = $conn->query($sql_gastos);
                        $total_efectivo = 0; $total_cheques = 0;
                        if ($result_gastos->num_rows > 0) {
                            while($row = $result_gastos->fetch_assoc()) {
                                echo "<tr>";
                                echo "<td>" . htmlspecialchars($row["descripcion"]) . "</td>";
                                echo "<td>" . number_format($row["efectivo"], 2) . "</td>";
                                echo "<td>" . number_format($row["cheques"], 2) . "</td>";
                                echo "<td>" . htmlspecialchars($row["detalle_cheque"]) . "</td>";
                                echo '<td>
                                        <button type="button" class="btn btn-warning btn-sm edit-gasto" data-bs-toggle="modal" data-bs-target="#editGastoModal" data-id="'.$row['id'].'" data-descripcion="'.htmlspecialchars($row['descripcion']).'" data-efectivo="'.$row['efectivo'].'" data-cheques="'.$row['cheques'].'" data-detalle_cheque="'.htmlspecialchars($row['detalle_cheque']).'" data-fecha="'.$row['fecha'].'">E</button>
                                        <a href="eliminar_gasto.php?id=' . $row['id'] . '&month='.$month.'&year='.$year.'" class="btn btn-danger btn-sm" onclick="return confirm(\'¿Estás seguro?\');">X</a>
                                      </td>';
                                echo "</tr>";
                                $total_efectivo += $row["efectivo"]; $total_cheques += $row["cheques"];
                            }
                        } else { echo "<tr><td colspan='5'>No hay registros de gastos para este mes.</td></tr>"; }
                        ?>
                    </tbody>
                    <tfoot class="table-secondary fw-bold">
                        <tr><th>TOTAL GASTOS:</th><th><?php echo number_format($total_efectivo, 2); ?></th><th><?php echo number_format($total_cheques, 2); ?></th><th colspan="2"></th></tr>
                    </tfoot>
                </table>
            </div>
        </div>

        <!-- BANCO Y CAJA -->
        <div class="row mt-4">
            <div class="col-md-6">
                <div class="card">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <h5>Banco General</h5>
                        <button type="button" class="btn btn-primary btn-sm" data-bs-toggle="modal" data-bs-target="#addBancoModal">Agregar Movimiento</button>
                    </div>
                    <div class="card-body">
                        <?php
                            // Fetch manual bank movements
                            $sql_banco = "SELECT id, descripcion, monto, fecha FROM banco_movimientos WHERE MONTH(fecha) = $month AND YEAR(fecha) = $year ORDER BY fecha ASC";
                            $result_banco = $conn->query($sql_banco);

                            $total_movimientos_banco = 0;
                            $cuotas_mantenimiento = $total_pagos;
                            $egresos_cheques = $total_cheques;
                            
                            // Calculate total from manual movements
                            if ($result_banco->num_rows > 0) {
                                while($row_banco = $result_banco->fetch_assoc()) {
                                    $total_movimientos_banco += $row_banco['monto'];
                                }
                            }

                            $saldo_actual_banco = $saldo_anterior_banco + $cuotas_mantenimiento - $egresos_cheques + $total_movimientos_banco;
                        ?>
                        <table class="table table-sm">
                            <thead>
                                <tr>
                                    <th>Fecha</th>
                                    <th>Descripción</th>
                                    <th class="text-end">Monto</th>
                                    <th class="text-end">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr><td></td><td><strong>SALDO ANTERIOR EN BANCO:</strong></td><td class="text-end"><strong><?php echo number_format($saldo_anterior_banco, 2); ?></strong></td><td></td></tr>
                                <tr class="table-light"><td colspan="4"><strong>INGRESOS:</strong></td></tr>
                                <tr><td></td><td>* Cuotas mantenimiento</td><td class="text-end"><?php echo number_format($cuotas_mantenimiento, 2); ?></td><td></td></tr>
                                <?php
                                // Rewind and loop again to display deposits
                                if ($result_banco->num_rows > 0) {
                                    $result_banco->data_seek(0); 
                                    while($row_banco = $result_banco->fetch_assoc()) {
                                        if ($row_banco['monto'] >= 0) {
                                            echo '<tr><td>'.date("d/m/y", strtotime($row_banco['fecha'])).'</td><td>* ' . htmlspecialchars($row_banco['descripcion']) . '</td><td class="text-end">' . number_format($row_banco['monto'], 2) . '</td><td class="text-end"><button type="button" class="btn btn-warning btn-sm edit-banco" data-bs-toggle="modal" data-bs-target="#editBancoModal" data-id="'.$row_banco['id'].'" data-descripcion="'.htmlspecialchars($row_banco['descripcion']).'" data-monto="'.$row_banco['monto'].'" data-fecha="'.$row_banco['fecha'].'">E</button> <a href="eliminar_movimiento_banco.php?id=' . $row_banco['id'] . '&month='.$month.'&year='.$year.'" class="btn btn-danger btn-sm" onclick="return confirm(\'¿Estás seguro?\');">X</a></td></tr>';
                                        }
                                    }
                                }
                                ?>
                                <tr class="table-light"><td colspan="4"><strong>EGRESOS:</strong></td></tr>
                                <tr><td></td><td>* Gastos (Cheques, Timbres, etc)</td><td class="text-end text-danger"><?php echo number_format(-$egresos_cheques, 2); ?></td><td></td></tr>
                                <?php
                                 // Rewind and loop again to display withdrawals
                                 if ($result_banco->num_rows > 0) {
                                    $result_banco->data_seek(0);
                                    while($row_banco = $result_banco->fetch_assoc()) {
                                        if ($row_banco['monto'] < 0) {
                                            echo '<tr><td>'.date("d/m/y", strtotime($row_banco['fecha'])).'</td><td>* ' . htmlspecialchars($row_banco['descripcion']) . '</td><td class="text-end text-danger">' . number_format($row_banco['monto'], 2) . '</td><td class="text-end"><button type="button" class="btn btn-warning btn-sm edit-banco" data-bs-toggle="modal" data-bs-target="#editBancoModal" data-id="'.$row_banco['id'].'" data-descripcion="'.htmlspecialchars($row_banco['descripcion']).'" data-monto="'.$row_banco['monto'].'" data-fecha="'.$row_banco['fecha'].'">E</button> <a href="eliminar_movimiento_banco.php?id=' . $row_banco['id'] . '&month='.$month.'&year='.$year.'" class="btn btn-danger btn-sm" onclick="return confirm(\'¿Estás seguro?\');">X</a></td></tr>';
                                        }
                                    }
                                }
                                ?>
                                <tr class="table-success fw-bold"><td colspan="2">SALDO ACTUAL BANCO</td><td class="text-end"><?php echo number_format($saldo_actual_banco, 2); ?></td><td></td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            <div class="col-md-6">
                <div class="card">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <h5>Caja Menuda</h5>
                        <button type="button" class="btn btn-primary btn-sm" data-bs-toggle="modal" data-bs-target="#addCajaModal">Agregar Movimiento</button>
                    </div>
                    <div class="card-body">
                        <?php
                            // Fetch manual caja movements
                            $sql_caja = "SELECT id, descripcion, monto, fecha FROM caja_movimientos WHERE MONTH(fecha) = $month AND YEAR(fecha) = $year ORDER BY fecha ASC";
                            $result_caja = $conn->query($sql_caja);
                            $total_movimientos_caja = 0;
                            if ($result_caja->num_rows > 0) {
                                while($row_caja = $result_caja->fetch_assoc()) {
                                    $total_movimientos_caja += $row_caja['monto'];
                                }
                            }

                            $egresos_caja = $total_efectivo; // from gastos table
                            $saldo_actual_caja = $saldo_anterior_caja + $total_movimientos_caja - $egresos_caja;
                        ?>
                        <table class="table table-sm">
                            <thead>
                                <tr>
                                    <th>Fecha</th>
                                    <th>Descripción</th>
                                    <th class="text-end">Monto</th>
                                    <th class="text-end">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr><td></td><td><strong>SALDO ANTERIOR CAJA:</strong></td><td class="text-end"><strong><?php echo number_format($saldo_anterior_caja, 2); ?></strong></td><td></td></tr>
                                <tr class="table-light"><td colspan="4"><strong>INGRESOS:</strong></td></tr>
                                <?php
                                if ($result_caja->num_rows > 0) {
                                    $result_caja->data_seek(0); 
                                    while($row_caja = $result_caja->fetch_assoc()) {
                                        if ($row_caja['monto'] >= 0) {
                                            echo '<tr><td>'.date("d/m/y", strtotime($row_caja['fecha'])).'</td><td>* ' . htmlspecialchars($row_caja['descripcion']) . '</td><td class="text-end">' . number_format($row_caja['monto'], 2) . '</td><td class="text-end"><button type="button" class="btn btn-warning btn-sm edit-caja" data-bs-toggle="modal" data-bs-target="#editCajaModal" data-id="'.$row_caja['id'].'" data-descripcion="'.htmlspecialchars($row_caja['descripcion']).'" data-monto="'.$row_caja['monto'].'" data-fecha="'.$row_caja['fecha'].'">E</button> <a href="eliminar_movimiento_caja.php?id=' . $row_caja['id'] . '&month='.$month.'&year='.$year.'" class="btn btn-danger btn-sm" onclick="return confirm(\'¿Estás seguro?\');">X</a></td></tr>';
                                        }
                                    }
                                }
                                ?>
                                <tr class="table-light"><td colspan="4"><strong>EGRESOS:</strong></td></tr>
                                <tr><td></td><td>* Gastos (Efectivo)</td><td class="text-end text-danger"><?php echo number_format(-$egresos_caja, 2); ?></td><td></td></tr>
                                <?php
                                 if ($result_caja->num_rows > 0) {
                                    $result_caja->data_seek(0);
                                    while($row_caja = $result_caja->fetch_assoc()) {
                                        if ($row_caja['monto'] < 0) {
                                            echo '<tr><td>'.date("d/m/y", strtotime($row_caja['fecha'])).'</td><td>* ' . htmlspecialchars($row_caja['descripcion']) . '</td><td class="text-end text-danger">' . number_format($row_caja['monto'], 2) . '</td><td class="text-end"><button type="button" class="btn btn-warning btn-sm edit-caja" data-bs-toggle="modal" data-bs-target="#editCajaModal" data-id="'.$row_caja['id'].'" data-descripcion="'.htmlspecialchars($row_caja['descripcion']).'" data-monto="'.$row_caja['monto'].'" data-fecha="'.$row_caja['fecha'].'">E</button> <a href="eliminar_movimiento_caja.php?id=' . $row_caja['id'] . '&month='.$month.'&year='.$year.'" class="btn btn-danger btn-sm" onclick="return confirm(\'¿Estás seguro?\');">X</a></td></tr>';
                                        }
                                    }
                                }
                                ?>
                                <tr class="table-warning fw-bold"><td colspan="2">SALDO ACTUAL CAJA</td><td class="text-end"><?php echo number_format($saldo_actual_caja, 2); ?></td><td></td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>
                 <div class="card mt-3">
                    <div class="card-body bg-light">
                        <?php $saldo_total_libros = $saldo_actual_banco + $saldo_actual_caja; ?>
                        <h4 class="text-end">SALDO TOTAL EN LIBROS: <span class="text-success"><?php echo number_format($saldo_total_libros, 2); ?></span></h4>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Modals -->
    <!-- Modal Agregar Ingreso -->
    <div class="modal fade" id="addIngresoModal" tabindex="-1" aria-labelledby="addIngresoModalLabel" aria-hidden="true">
      <div class="modal-dialog"><div class="modal-content"><div class="modal-header">
            <h5 class="modal-title" id="addIngresoModalLabel">Agregar Nuevo Ingreso</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button></div>
          <div class="modal-body">
            <form action="agregar_ingreso.php" method="POST">
              <input type="hidden" name="month" value="<?php echo $month; ?>">
              <input type="hidden" name="year" value="<?php echo $year; ?>">
              <div class="mb-3"><label for="fecha" class="form-label">Fecha</label><input type="date" class="form-control" id="fecha" name="fecha" value="<?php echo $end_date; ?>" required></div>
              <div class="mb-3"><label for="apartamento" class="form-label">Apartamento</label><input type="text" class="form-control" id="apartamento" name="apartamento" required></div>
              <div class="mb-3"><label for="nombre" class="form-label">Nombre</label><input type="text" class="form-control" id="nombre" name="nombre" required></div>
              <div class="mb-3"><label for="saldo_anterior" class="form-label">Saldo Anterior</label><input type="number" step="0.01" class="form-control" id="saldo_anterior" name="saldo_anterior" required></div>
              <div class="mb-3"><label for="mensualidad" class="form-label">Mensualidad</label><input type="number" step="0.01" class="form-control" id="mensualidad" name="mensualidad" required></div>
              <div class="mb-3"><label for="pago" class="form-label">Pago</label><input type="number" step="0.01" class="form-control" id="pago" name="pago"></div>
              <div class="mb-3"><label for="observacion" class="form-label">Observación</label><input type="text" class="form-control" id="observacion" name="observacion"></div>
              <button type="submit" class="btn btn-primary">Guardar</button>
            </form></div></div></div></div>

    <!-- Modal Editar Ingreso -->
    <div class="modal fade" id="editIngresoModal" tabindex="-1" aria-labelledby="editIngresoModalLabel" aria-hidden="true">
      <div class="modal-dialog"><div class="modal-content"><div class="modal-header">
            <h5 class="modal-title" id="editIngresoModalLabel">Editar Ingreso</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button></div>
          <div class="modal-body">
            <form action="editar_ingreso.php" method="POST">
              <input type="hidden" id="edit_ingreso_id" name="id">
              <input type="hidden" name="month" value="<?php echo $month; ?>">
              <input type="hidden" name="year" value="<?php echo $year; ?>">
              <div class="mb-3"><label for="edit_fecha" class="form-label">Fecha</label><input type="date" class="form-control" id="edit_fecha" name="fecha" required></div>
              <div class="mb-3"><label for="edit_apartamento" class="form-label">Apartamento</label><input type="text" class="form-control" id="edit_apartamento" name="apartamento" required></div>
              <div class="mb-3"><label for="edit_nombre" class="form-label">Nombre</label><input type="text" class="form-control" id="edit_nombre" name="nombre" required></div>
              <div class="mb-3"><label for="edit_saldo_anterior" class="form-label">Saldo Anterior</label><input type="number" step="0.01" class="form-control" id="edit_saldo_anterior" name="saldo_anterior" required></div>
              <div class="mb-3"><label for="edit_mensualidad" class="form-label">Mensualidad</label><input type="number" step="0.01" class="form-control" id="edit_mensualidad" name="mensualidad" required></div>
              <div class="mb-3"><label for="edit_pago" class="form-label">Pago</label><input type="number" step="0.01" class="form-control" id="edit_pago" name="pago"></div>
              <div class="mb-3"><label for="edit_observacion" class="form-label">Observación</label><input type="text" class="form-control" id="edit_observacion" name="observacion"></div>
              <button type="submit" class="btn btn-primary">Guardar Cambios</button>
            </form></div></div></div></div>

    <!-- Modal Agregar Gasto -->
    <div class="modal fade" id="addGastoModal" tabindex="-1" aria-labelledby="addGastoModalLabel" aria-hidden="true">
        <div class="modal-dialog"><div class="modal-content"><div class="modal-header">
            <h5 class="modal-title" id="addGastoModalLabel">Agregar Nuevo Gasto</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button></div>
            <div class="modal-body">
            <form action="agregar_gasto.php" method="POST">
                <input type="hidden" name="month" value="<?php echo $month; ?>">
                <input type="hidden" name="year" value="<?php echo $year; ?>">
                <div class="mb-3"><label for="gasto_fecha" class="form-label">Fecha</label><input type="date" class="form-control" id="gasto_fecha" name="fecha" value="<?php echo $end_date; ?>" required></div>
                <div class="mb-3"><label for="descripcion" class="form-label">Descripción</label><input type="text" class="form-control" id="descripcion" name="descripcion" required></div>
                <div class="mb-3"><label for="efectivo" class="form-label">Efectivo</label><input type="number" step="0.01" class="form-control" id="efectivo" name="efectivo"></div>
                <div class="mb-3"><label for="cheques" class="form-label">Cheques</label><input type="number" step="0.01" class="form-control" id="cheques" name="cheques"></div>
                <div class="mb-3"><label for="detalle_cheque" class="form-label">Detalle Cheque</label><input type="text" class="form-control" id="detalle_cheque" name="detalle_cheque"></div>
                <button type="submit" class="btn btn-primary">Guardar</button>
            </form></div></div></div></div>

    <!-- Modal Editar Gasto -->
    <div class="modal fade" id="editGastoModal" tabindex="-1" aria-labelledby="editGastoModalLabel" aria-hidden="true">
        <div class="modal-dialog"><div class="modal-content"><div class="modal-header">
            <h5 class="modal-title" id="editGastoModalLabel">Editar Gasto</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button></div>
            <div class="modal-body">
            <form action="editar_gasto.php" method="POST">
                <input type="hidden" id="edit_gasto_id" name="id">
                <input type="hidden" name="month" value="<?php echo $month; ?>">
                <input type="hidden" name="year" value="<?php echo $year; ?>">
                <div class="mb-3"><label for="edit_gasto_fecha" class="form-label">Fecha</label><input type="date" class="form-control" id="edit_gasto_fecha" name="fecha" required></div>
                <div class="mb-3"><label for="edit_descripcion" class="form-label">Descripción</label><input type="text" class="form-control" id="edit_descripcion" name="descripcion" required></div>
                <div class="mb-3"><label for="edit_efectivo" class="form-label">Efectivo</label><input type="number" step="0.01" class="form-control" id="edit_efectivo" name="efectivo"></div>
                <div class="mb-3"><label for="edit_cheques" class="form-label">Cheques</label><input type="number" step="0.01" class="form-control" id="edit_cheques" name="cheques"></div>
                <div class="mb-3"><label for="edit_detalle_cheque" class="form-label">Detalle Cheque</label><input type="text" class="form-control" id="edit_detalle_cheque" name="detalle_cheque"></div>
                <button type="submit" class="btn btn-primary">Guardar Cambios</button>
            </form></div></div></div></div>

    <!-- Modal Agregar Movimiento Banco -->
    <div class="modal fade" id="addBancoModal" tabindex="-1" aria-labelledby="addBancoModalLabel" aria-hidden="true">
        <div class="modal-dialog"><div class="modal-content"><div class="modal-header">
            <h5 class="modal-title" id="addBancoModalLabel">Agregar Movimiento de Banco</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button></div>
            <div class="modal-body">
            <form action="agregar_movimiento_banco.php" method="POST">
                <input type="hidden" name="month" value="<?php echo $month; ?>">
                <input type="hidden" name="year" value="<?php echo $year; ?>">
                <div class="mb-3"><label for="banco_fecha" class="form-label">Fecha</label><input type="date" class="form-control" id="banco_fecha" name="fecha" value="<?php echo $end_date; ?>" required></div>
                <div class="mb-3"><label for="banco_descripcion" class="form-label">Descripción</label><input type="text" class="form-control" id="banco_descripcion" name="descripcion" required></div>
                <div class="mb-3"><label for="banco_monto" class="form-label">Monto</label><input type="number" step="0.01" class="form-control" id="banco_monto" name="monto" placeholder="Positivo para ingreso, negativo para egreso" required></div>
                <button type="submit" class="btn btn-primary">Guardar</button>
            </form></div></div></div></div>

    <!-- Modal Editar Movimiento Banco -->
    <div class="modal fade" id="editBancoModal" tabindex="-1" aria-labelledby="editBancoModalLabel" aria-hidden="true">
        <div class="modal-dialog"><div class="modal-content"><div class="modal-header">
            <h5 class="modal-title" id="editBancoModalLabel">Editar Movimiento de Banco</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button></div>
            <div class="modal-body">
            <form action="editar_movimiento_banco.php" method="POST">
                <input type="hidden" id="edit_banco_id" name="id">
                <input type="hidden" name="month" value="<?php echo $month; ?>">
                <input type="hidden" name="year" value="<?php echo $year; ?>">
                <div class="mb-3"><label for="edit_banco_fecha" class="form-label">Fecha</label><input type="date" class="form-control" id="edit_banco_fecha" name="fecha" required></div>
                <div class="mb-3"><label for="edit_banco_descripcion" class="form-label">Descripción</label><input type="text" class="form-control" id="edit_banco_descripcion" name="descripcion" required></div>
                <div class="mb-3"><label for="edit_banco_monto" class="form-label">Monto</label><input type="number" step="0.01" class="form-control" id="edit_banco_monto" name="monto" placeholder="Positivo para ingreso, negativo para egreso" required></div>
                <button type="submit" class="btn btn-primary">Guardar Cambios</button>
            </form></div></div></div></div>

    <!-- Modal Agregar Movimiento Caja -->
    <div class="modal fade" id="addCajaModal" tabindex="-1" aria-labelledby="addCajaModalLabel" aria-hidden="true">
        <div class="modal-dialog"><div class="modal-content"><div class="modal-header">
            <h5 class="modal-title" id="addCajaModalLabel">Agregar Movimiento de Caja</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button></div>
            <div class="modal-body">
            <form action="agregar_movimiento_caja.php" method="POST">
                <input type="hidden" name="month" value="<?php echo $month; ?>">
                <input type="hidden" name="year" value="<?php echo $year; ?>">
                <div class="mb-3"><label for="caja_fecha" class="form-label">Fecha</label><input type="date" class="form-control" id="caja_fecha" name="fecha" value="<?php echo $end_date; ?>" required></div>
                <div class="mb-3"><label for="caja_descripcion" class="form-label">Descripción</label><input type="text" class="form-control" id="caja_descripcion" name="descripcion" required></div>
                <div class="mb-3"><label for="caja_monto" class="form-label">Monto</label><input type="number" step="0.01" class="form-control" id="caja_monto" name="monto" placeholder="Positivo para ingreso, negativo para egreso" required></div>
                <button type="submit" class="btn btn-primary">Guardar</button>
            </form></div></div></div></div>

    <!-- Modal Editar Movimiento Caja -->
    <div class="modal fade" id="editCajaModal" tabindex="-1" aria-labelledby="editCajaModalLabel" aria-hidden="true">
        <div class="modal-dialog"><div class="modal-content"><div class="modal-header">
            <h5 class="modal-title" id="editCajaModalLabel">Editar Movimiento de Caja</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button></div>
            <div class="modal-body">
            <form action="editar_movimiento_caja.php" method="POST">
                <input type="hidden" id="edit_caja_id" name="id">
                <input type="hidden" name="month" value="<?php echo $month; ?>">
                <input type="hidden" name="year" value="<?php echo $year; ?>">
                <div class="mb-3"><label for="edit_caja_fecha" class="form-label">Fecha</label><input type="date" class="form-control" id="edit_caja_fecha" name="fecha" required></div>
                <div class="mb-3"><label for="edit_caja_descripcion" class="form-label">Descripción</label><input type="text" class="form-control" id="edit_caja_descripcion" name="descripcion" required></div>
                <div class="mb-3"><label for="edit_caja_monto" class="form-label">Monto</label><input type="number" step="0.01" class="form-control" id="edit_caja_monto" name="monto" placeholder="Positivo para ingreso, negativo para egreso" required></div>
                <button type="submit" class="btn btn-primary">Guardar Cambios</button>
            </form></div></div></div></div>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
    <script>
        document.addEventListener('DOMContentLoaded', function () {
            var editIngresoModal = document.getElementById('editIngresoModal');
            editIngresoModal.addEventListener('show.bs.modal', function (event) {
                var button = event.relatedTarget;
                var id = button.getAttribute('data-id');
                var apartamento = button.getAttribute('data-apartamento');
                var nombre = button.getAttribute('data-nombre');
                var saldo_anterior = button.getAttribute('data-saldo_anterior');
                var mensualidad = button.getAttribute('data-mensualidad');
                var pago = button.getAttribute('data-pago');
                var observacion = button.getAttribute('data-observacion');
                var fecha = button.getAttribute('data-fecha');

                editIngresoModal.querySelector('#edit_ingreso_id').value = id;
                editIngresoModal.querySelector('#edit_apartamento').value = apartamento;
                editIngresoModal.querySelector('#edit_nombre').value = nombre;
                editIngresoModal.querySelector('#edit_saldo_anterior').value = saldo_anterior;
                editIngresoModal.querySelector('#edit_mensualidad').value = mensualidad;
                editIngresoModal.querySelector('#edit_pago').value = pago;
                editIngresoModal.querySelector('#edit_observacion').value = observacion;
                editIngresoModal.querySelector('#edit_fecha').value = fecha;
            });

            var editGastoModal = document.getElementById('editGastoModal');
            editGastoModal.addEventListener('show.bs.modal', function (event) {
                var button = event.relatedTarget;
                var id = button.getAttribute('data-id');
                var descripcion = button.getAttribute('data-descripcion');
                var efectivo = button.getAttribute('data-efectivo');
                var cheques = button.getAttribute('data-cheques');
                var detalle_cheque = button.getAttribute('data-detalle_cheque');
                var fecha = button.getAttribute('data-fecha');

                editGastoModal.querySelector('#edit_gasto_id').value = id;
                editGastoModal.querySelector('#edit_descripcion').value = descripcion;
                editGastoModal.querySelector('#edit_efectivo').value = efectivo;
                editGastoModal.querySelector('#edit_cheques').value = cheques;
                editGastoModal.querySelector('#edit_detalle_cheque').value = detalle_cheque;
                editGastoModal.querySelector('#edit_gasto_fecha').value = fecha;
            });

            var editBancoModal = document.getElementById('editBancoModal');
            editBancoModal.addEventListener('show.bs.modal', function (event) {
                var button = event.relatedTarget;
                var id = button.getAttribute('data-id');
                var descripcion = button.getAttribute('data-descripcion');
                var monto = button.getAttribute('data-monto');
                var fecha = button.getAttribute('data-fecha');

                editBancoModal.querySelector('#edit_banco_id').value = id;
                editBancoModal.querySelector('#edit_banco_descripcion').value = descripcion;
                editBancoModal.querySelector('#edit_banco_monto').value = monto;
                editBancoModal.querySelector('#edit_banco_fecha').value = fecha;
            });

            var editCajaModal = document.getElementById('editCajaModal');
            editCajaModal.addEventListener('show.bs.modal', function (event) {
                var button = event.relatedTarget;
                var id = button.getAttribute('data-id');
                var descripcion = button.getAttribute('data-descripcion');
                var monto = button.getAttribute('data-monto');
                var fecha = button.getAttribute('data-fecha');

                editCajaModal.querySelector('#edit_caja_id').value = id;
                editCajaModal.querySelector('#edit_caja_descripcion').value = descripcion;
                editCajaModal.querySelector('#edit_caja_monto').value = monto;
                editCajaModal.querySelector('#edit_caja_fecha').value = fecha;
            });
        });
    </script>
</body>
</html>
