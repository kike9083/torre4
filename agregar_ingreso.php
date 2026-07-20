<?php
include 'db.php';

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $month = $_POST['month'];
    $year = $_POST['year'];

    $apartamento = $_POST['apartamento'];
    $nombre = $_POST['nombre'];
    $saldo_anterior = $_POST['saldo_anterior'];
    $mensualidad = $_POST['mensualidad'];
    $pago = $_POST['pago'];
    $observacion = $_POST['observacion'];
    $fecha = $_POST['fecha'];

    $stmt = $conn->prepare("INSERT INTO ingresos (apartamento, nombre, saldo_anterior, mensualidad, pago, observacion, fecha) VALUES (?, ?, ?, ?, ?, ?, ?)");
    $stmt->bind_param("ssddsss", $apartamento, $nombre, $saldo_anterior, $mensualidad, $pago, $observacion, $fecha);

    if ($stmt->execute()) {
        header("Location: index.php?month=$month&year=$year&message=Ingreso agregado");
    } else {
        echo "Error: " . $stmt->error;
    }

    $stmt->close();
    $conn->close();
}
?>