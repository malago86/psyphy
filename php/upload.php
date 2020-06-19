<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

if(file_exists("../vendor/autoload.php"))
    require_once("../vendor/autoload.php");

use Kreait\Firebase\Factory;
use Kreait\Firebase\ServiceAccount;

$myFile = "results/";


if(isset($_POST['results'])){
    $arr_data = $_POST['results'];
    $jsondata = json_decode($arr_data);
    //print_r($jsondata);
    //touch($myFile);
    $myFile=$myFile.$jsondata->config->options->id."/";

    if(strpos($jsondata->name,".") == false){
    
        file_put_contents("../".$myFile.$jsondata->name.".pso", json_encode($jsondata));

        if(file_exists('../credentials/psychonline-firebase-adminsdk-12uxl-c8a23d2ad7.json'))
            $firebase = (new Factory)->withServiceAccount('../credentials/psychonline-firebase-adminsdk-12uxl-c8a23d2ad7.json');
        else
            $firebase = (new Factory)->withServiceAccount(getenv("firebase_secret"));
            
        $storage = $firebase->createStorage();
        $storageClient = $storage->getStorageClient();
        $defaultBucket = $storage->getBucket();

        $defaultBucket->upload(json_encode($jsondata),
        [
            'name' => $myFile.$jsondata->name.".pso"
        ]);
    }
}

?>