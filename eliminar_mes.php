<?php
include 'db.php';

if (isset($_GET['month']) && isset($_GET['year'])) {
    $month = intval($_GET['month']);
    $year = intval($_GET['year']);

    // Start transaction
    $conn->begin_transaction();

    try {
        $date_to_delete = "$year-$month-01";

        // Delete from all related tables
        $conn->query("DELETE FROM ingresos WHERE MONTH(fecha) = $month AND YEAR(fecha) = $year");
        $conn->query("DELETE FROM gastos WHERE MONTH(fecha) = $month AND YEAR(fecha) = $year");
        $conn->query("DELETE FROM banco_movimientos WHERE MONTH(fecha) = $month AND YEAR(fecha) = $year");
        $conn->query("DELETE FROM caja_movimientos WHERE MONTH(fecha) = $month AND YEAR(fecha) = $year");
        
        // Finally, delete the monthly summary itself
        $stmt = $conn->prepare("DELETE FROM resumen_mensual WHERE fecha = ?");
        $stmt->bind_param("s", $date_to_delete);
        $stmt->execute();
        $stmt->close();

        // If all queries were successful, commit the transaction
        $conn->commit();

        header("Location: index.php?message=Mes eliminado exitosamente");

    } catch (mysqli_sql_exception $exception) {
        $conn->rollback();
        die("Error al eliminar el mes: " . $exception->getMessage());
    }

    $conn->close();
} else {
    header("Location: index.php?error=Mes no especificado");
}
?>