<?php

if(file_exists("../vendor/autoload.php"))
    require_once("../vendor/autoload.php");

use Kreait\Firebase\Factory;
use Kreait\Firebase\ServiceAccount;
    
//$serviceAccount = ServiceAccount::fromJsonFile('../credentials/psychonline-firebase-adminsdk-12uxl-c8a23d2ad7.json');
$firebase = (new Factory)->withServiceAccount('../credentials/psychonline-firebase-adminsdk-12uxl-c8a23d2ad7.json');
    
$storage = $firebase->createStorage();
$storageClient = $storage->getStorageClient();
$defaultBucket = $storage->getBucket();

if(isset($_POST['experiment-id']) && isset($_POST['title']) && isset($_POST['experiment-data'])){
    //echo($_POST['experiment-id']);
    $jsondata = json_decode($_POST['experiment-data']);
    $title=substr($_POST['title'],0,100);
    $id=substr($_POST['experiment-id'],0,100);
    $result=Array("experiment-id"=>$id);
    mkdir("../results/".$id);
    file_put_contents("../results/".$id."/title.txt", $_POST['title']);
    file_put_contents("../experiment/".$id.".json", json_encode($jsondata));

    $defaultBucket->upload(json_encode($jsondata),
    [
        'name' => "experiment/".$id.".json"
    ]);

    $defaultBucket->upload($_POST['title'],
    [
        'name' => "results/".$id."/title.txt"
    ]);

    echo json_encode($result);
}elseif(isset($_POST['load-id'])){
    $id=$_POST['load-id'];
    $object=$defaultBucket->object("experiment/".$id.".json");
    if($object->exists()){
        $object->downloadToFile("../experiment/".$id.".json");
        echo file_get_contents("../experiment/".$id.".json");
    }

}