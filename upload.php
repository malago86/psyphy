<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

$myFile = "results/";

//print_r($_POST);
if(isset($_POST['results']) && is_array($_POST['results'])){
    $arr_data = $_POST['results'];
    $jsondata = json_encode($arr_data, JSON_PRETTY_PRINT);
    //touch($myFile);
    //print_r($arr_data["config"]["name"]);
    file_put_contents($myFile.$arr_data["name"]."-".date("U").".json", $jsondata);
}

?>