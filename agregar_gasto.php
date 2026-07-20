<?php
include 'db.php';

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $month = $_POST['month'];
    $year = $_POST['year'];

    $descripcion = $_POST['descripcion'];
    $efectivo = $_POST['efectivo'];
    $cheques = $_POST['cheques'];
    $detalle_cheque = $_POST['detalle_cheque'];
    $fecha = $_POST['fecha'];

    $stmt = $conn->prepare("INSERT INTO gastos (descripcion, efectivo, cheques, detalle_cheque, fecha) VALUES (?, ?, ?, ?, ?)");
    $stmt->bind_param("sddss", $descripcion, $efectivo, $cheques, $detalle_cheque, $fecha);

    if ($stmt->execute()) {
        header("Location: index.php?month=$month&year=$year&message=Gasto agregado");
    } else {
        echo "Error: " . $stmt->error;
    }

    $stmt->close();
    $conn->close();
}
?>