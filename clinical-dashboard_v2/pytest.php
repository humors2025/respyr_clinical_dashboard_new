<?php
$pythonScriptPath = escapeshellarg("python3 model.py");  // Adjust path if needed
$num1 = 5;
$num2 = 10;

// Pass the arguments to the Python script
$command = "python3 model.py $num1 $num2";
$output = shell_exec($command);

echo "Output from Python: " . $output;
?>
