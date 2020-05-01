<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

$myFile = "../results/";


if(isset($_POST['results'])){
    $arr_data = $_POST['results'];
    $jsondata = json_decode($arr_data);
    //print_r($jsondata);
    //touch($myFile);
    $myFile=$myFile.$jsondata->config->options->id."/";
    
    file_put_contents($myFile.$jsondata->name."-".date("U").".pso", json_encode($jsondata));
}

?>