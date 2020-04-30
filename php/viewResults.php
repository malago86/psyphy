<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
    if(isset($_GET['experiment-id'])){

        $folder="../results/".$_GET['experiment-id'];

        $files = array();
        foreach (glob($folder."/*.pso") as $file) {
            $files[] = $file;
        }

        if(isset($_GET['zip'])){
            $filename='./'.$folder.'/'.$_GET['experiment-id'].'.zip';
            //echo('cd '.$folder.'; zip -q '.$_GET['experiment-id'].'.zip *.pso');
            exec('cd "'.$folder.'"; zip -q '.$_GET['experiment-id'].'.zip *.pso');
            //echo('tar zcf '.$filename.' '.$folder.'/*.pso');
          
            if (file_exists($filename)) {
               header('Content-Type: application/zip');
               header('Content-Disposition: attachment; filename="'.basename($filename).'"');
               header('Content-Length: ' . filesize($filename));
          
               flush();
               readfile($filename);
               // delete file
               //unlink($filename);
           
             }
             exit();
        }

        $title=file_get_contents($folder."/title.txt");

?>
<head>
<title>PSY&#9898;PHY - <?php echo($title); ?></title>
<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.4.1/jquery.min.js"></script>
<link rel="stylesheet" href="https://ajax.googleapis.com/ajax/libs/jqueryui/1.12.1/themes/smoothness/jquery-ui.css">
<script src="https://ajax.googleapis.com/ajax/libs/jqueryui/1.12.1/jquery-ui.min.js"></script>
<script src="../../js/functions.js"></script>
<script src="../../js/main.js"></script>
<script src="../../js/google_drive.js"></script>
<link rel="stylesheet" type="text/css" href="../../css/style.css">
<link rel="icon" href="favicon.ico" type="image/x-icon" />
<link href="../../fontawesome/css/all.css" rel="stylesheet"> 
</head>
<body>
    <div class="background">
        <div id="form-data">
<?php


        echo("<h1>Showing experiment ".$title."</h1>");

        echo("<ul>");
        foreach($files as $f){
            $participant=json_decode(file_get_contents($f));
            //print_r($participant);
            //$f=end(explode("/",$f));
            echo("<li><span class='name'>".$participant->name."</span> <span class='date'>".date("Y/m/d H:m:s",intval($participant->stopTime)/1000)."</span></li>");
        }
        echo("</ul>");

        if(count($files)>0){
            echo("<a class='download-results' href='../".$_GET['experiment-id'].".zip'>download all results</a>");
        }
?>
        </div>
    </div>
</body>

<? } ?>