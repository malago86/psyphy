<?php

function isFolder($file){
    return $file->getMimeType() == 'application/vnd.google-apps.folder';
}

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

require_once("functions.php");

if(file_exists("../vendor/autoload.php"))
    require_once("../vendor/autoload.php");
elseif(file_exists("google-api-php-client-2.4.1/vendor/autoload.php"))
    require_once("google-api-php-client-2.4.1/vendor/autoload.php");

function initializeClient() {
    $private_key = base64_decode( getenv('client_secret') );
    $private_key = str_replace('\n', "\n", $private_key);

    $client_parameters = array(
        'client_email'        => getenv('client_email'),
        'signing_algorithm'   => 'HS256',
        'signing_key'         => $private_key
    );

    $client = new Google_Client( $client_parameters );
    $client->useApplicationDefaultCredentials();
    $client->setClientId( getenv('client_id') ); 
    //$client->setScopes(['https://www.googleapis.com/auth/analytics.readonly']);
    return $client;
}

if(file_exists("../credentials/credentials.json")){
    $client = new Google_Client();
    $client->setAuthConfig('../credentials/credentials.json');
}else{
    $client = initializeClient();
}
$client->addScope('https://www.googleapis.com/auth/drive.readonly');

$service = new Google_Service_Drive($client);

if(isset($_GET['drive-folder-id'])){
    $driveFolderId=sanitize_participant($_GET['drive-folder-id']);
    $driveFolderId=explode("/",$driveFolderId);
    $driveFolderId=end($driveFolderId);
    $optParams = array(
        'pageSize' => 1000,
        'orderBy' => 'name_natural',
        'fields' => 'nextPageToken, files(id, name, mimeType)',
        'q' => "'".$driveFolderId."' in parents",
    );
    $results = $service->files->listFiles($optParams);

    //echo ("<h2>Select your present folder</h2>");
    //echo ("<ul class='folder-list'>");
    $result=Array();

    if (count($results->getFiles()) == 0) {
        print "No files found.\n";
    } else {
        foreach ($results->getFiles() as $file) {
            if(isFolder($file))
                array_push($result,Array("id"=>$file->getId(),"name"=>$file->getName()));
                //echo("<li class='folder-item' drive-id='".$file->getId()."'>".$file->getName()."</li>");
        }
    }

    echo json_encode($result);
}elseif(isset($_GET['drive-file-id'])){
    $driveFolderId=sanitize_participant($_GET['drive-file-id']);
    $driveFolderId=explode("/",$driveFolderId);
    $driveFolderId=end($driveFolderId);
    $optParams = array(
        'pageSize' => 1000,
        'orderBy' => 'name_natural',
        'fields' => 'nextPageToken, files(id, name, mimeType)',
        'q' => "'".$driveFolderId."' in parents",
    );
    $results = $service->files->listFiles($optParams);

    //echo ("<h2>Select your present folder</h2>");
    //echo ("<ul class='folder-list'>");
    $result=Array();

    if (count($results->getFiles()) == 0) {
        print "No files found.\n";
    } else {
        foreach ($results->getFiles() as $file) {
            if(!isFolder($file)){
                array_push($result,Array("id"=>$file->getId(),"name"=>$file->getName()));
            }
                //echo("<li class='folder-item' drive-id='".$file->getId()."'>".$file->getName()."</li>");
        }
    }

    echo json_encode($result);
}

?>