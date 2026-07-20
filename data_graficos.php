<?php
header('Content-Type: application/json');
include 'db.php';

$report = $_GET['report'] ?? '';
$year = isset($_GET['year']) ? intval($_GET['year']) : date('Y');
$month = isset($_GET['month']) ? intval($_GET['month']) : date('m');

$data = [];

switch ($report) {
    case 'gastos_mensual':
        $sql = "SELECT descripcion, SUM(efectivo + cheques) as total FROM gastos WHERE MONTH(fecha) = ? AND YEAR(fecha) = ? GROUP BY descripcion HAVING total > 0";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("ii", $month, $year);
        $stmt->execute();
        $result = $stmt->get_result();
        
        $labels = [];
        $totals = [];
        while ($row = $result->fetch_assoc()) {
            $labels[] = $row['descripcion'];
            $totals[] = $row['total'];
        }
        $data = ['labels' => $labels, 'data' => $totals];
        break;

    case 'ingresos_egresos_mensual':
        // Ingresos
        $sql_ingresos = "SELECT SUM(pago) as total FROM ingresos WHERE MONTH(fecha) = ? AND YEAR(fecha) = ?";
        $stmt_ingresos = $conn->prepare($sql_ingresos);
        $stmt_ingresos->bind_param("ii", $month, $year);
        $stmt_ingresos->execute();
        $total_ingresos = $stmt_ingresos->get_result()->fetch_assoc()['total'] ?? 0;

        // Egresos
        $sql_egresos = "SELECT SUM(efectivo + cheques) as total FROM gastos WHERE MONTH(fecha) = ? AND YEAR(fecha) = ?";
        $stmt_egresos = $conn->prepare($sql_egresos);
        $stmt_egresos->bind_param("ii", $month, $year);
        $stmt_egresos->execute();
        $total_egresos = $stmt_egresos->get_result()->fetch_assoc()['total'] ?? 0;

        $data = ['ingresos' => $total_ingresos, 'egresos' => $total_egresos];
        break;

    case 'evolucion_anual':
        $ingresos_anual = array_fill(0, 12, 0);
        $egresos_anual = array_fill(0, 12, 0);

        // Ingresos
        $sql_ingresos = "SELECT MONTH(fecha) as mes, SUM(pago) as total FROM ingresos WHERE YEAR(fecha) = ? GROUP BY MONTH(fecha)";
        $stmt_ingresos = $conn->prepare($sql_ingresos);
        $stmt_ingresos->bind_param("i", $year);
        $stmt_ingresos->execute();
        $result_ingresos = $stmt_ingresos->get_result();
        while($row = $result_ingresos->fetch_assoc()) {
            $ingresos_anual[$row['mes'] - 1] = $row['total'];
        }

        // Egresos
        $sql_egresos = "SELECT MONTH(fecha) as mes, SUM(efectivo + cheques) as total FROM gastos WHERE YEAR(fecha) = ? GROUP BY MONTH(fecha)";
        $stmt_egresos = $conn->prepare($sql_egresos);
        $stmt_egresos->bind_param("i", $year);
        $stmt_egresos->execute();
        $result_egresos = $stmt_egresos->get_result();
        while($row = $result_egresos->fetch_assoc()) {
            $egresos_anual[$row['mes'] - 1] = $row['total'];
        }

        $data = ['ingresos' => $ingresos_anual, 'egresos' => $egresos_anual];
        break;
}

$conn->close();
echo json_encode($data);
?>