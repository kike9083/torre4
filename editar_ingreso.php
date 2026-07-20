<?php
include 'db.php';

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $id = $_POST['id'];
    $month = $_POST['month'];
    $year = $_POST['year'];

    $apartamento = $_POST['apartamento'];
    $nombre = $_POST['nombre'];
    $saldo_anterior = $_POST['saldo_anterior'];
    $mensualidad = $_POST['mensualidad'];
    $pago = $_POST['pago'];
    $observacion = $_POST['observacion'];
    $fecha = $_POST['fecha'];

    $stmt = $conn->prepare("UPDATE ingresos SET apartamento = ?, nombre = ?, saldo_anterior = ?, mensualidad = ?, pago = ?, observacion = ?, fecha = ? WHERE id = ?");
    $stmt->bind_param("ssddsssi", $apartamento, $nombre, $saldo_anterior, $mensualidad, $pago, $observacion, $fecha, $id);

    if ($stmt->execute()) {
        header("Location: index.php?month=$month&year=$year&message=Ingreso actualizado");
    } else {
        echo "Error: " . $stmt->error;
    }

    $stmt->close();
    $conn->close();
}
?>