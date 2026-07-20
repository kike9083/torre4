<?php
include 'db.php';

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $month = $_POST['month'];
    $year = $_POST['year'];

    $descripcion = $_POST['descripcion'];
    $monto = $_POST['monto'];
    $fecha = $_POST['fecha'];

    $stmt = $conn->prepare("INSERT INTO caja_movimientos (descripcion, monto, fecha) VALUES (?, ?, ?)");
    $stmt->bind_param("sds", $descripcion, $monto, $fecha);

    if ($stmt->execute()) {
        header("Location: index.php?month=$month&year=$year&message=Movimiento de caja agregado");
    } else {
        echo "Error: " . $stmt->error;
    }

    $stmt->close();
    $conn->close();
}
?>